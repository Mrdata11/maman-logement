#!/usr/bin/env python3
"""Main orchestrator for the Cohabitat Europe scraper."""

import json
import os
import sys
from typing import Dict

# Add parent directory to path so we can import scraper package
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scraper.config import DATA_DIR, LISTINGS_FILE, EVALUATIONS_FILE, TAGS_FILE
from scraper.models import Listing, Evaluation, ListingTags
# Belgium
from scraper.scrapers.habitat_groupe import HabitatGroupeScraper
from scraper.scrapers.samenhuizen import SamenhuizenScraper
from scraper.scrapers.findacohouse import FindACoHouseScraper
# France
from scraper.scrapers.habitat_participatif_fr import HabitatParticipatifFRScraper
from scraper.scrapers.ecovillage_fr import EcovillageFRScraper
# Spain
from scraper.scrapers.cohousing_spain import CohousingSpainScraper
# Multi-country
from scraper.scrapers.ecovillage import EcovillageOrgScraper
from scraper.scrapers.ic_org import ICOrgScraper
# Pipeline
from scraper.evaluator import evaluate_all
from scraper.tag_extractor import extract_all_tags
from scraper.content_generator import generate_all_content
from scraper.quality_filter import pre_filter, post_filter_evaluations
from scraper.description_cleaner import clean_all_descriptions
from scraper.translator import translate_listings
from scraper.image_filter import filter_all_listings as filter_all_images


def load_existing_listings() -> Dict[str, Listing]:
    if os.path.exists(LISTINGS_FILE):
        with open(LISTINGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {item["id"]: Listing(**item) for item in data}
    return {}


def load_existing_evaluations() -> Dict[str, Evaluation]:
    if os.path.exists(EVALUATIONS_FILE):
        with open(EVALUATIONS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {item["listing_id"]: Evaluation(**item) for item in data}
    return {}


def save_listings(listings: Dict[str, Listing]):
    os.makedirs(DATA_DIR, exist_ok=True)
    data = [l.model_dump() for l in listings.values()]
    # Sort by date_scraped descending
    data.sort(key=lambda x: x.get("date_scraped", ""), reverse=True)
    with open(LISTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(data)} listings to {LISTINGS_FILE}")


def load_existing_tags() -> Dict[str, ListingTags]:
    if os.path.exists(TAGS_FILE):
        with open(TAGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {item["listing_id"]: ListingTags(**item) for item in data}
    return {}


def save_tags(tags: Dict[str, ListingTags]):
    os.makedirs(DATA_DIR, exist_ok=True)
    data = [t.model_dump() for t in tags.values()]
    data.sort(key=lambda x: x.get("date_extracted", ""), reverse=True)
    with open(TAGS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(data)} tags to {TAGS_FILE}")


def save_evaluations(evaluations: Dict[str, Evaluation]):
    os.makedirs(DATA_DIR, exist_ok=True)
    data = [e.model_dump() for e in evaluations.values()]
    # Sort by quality_score descending
    data.sort(key=lambda x: x.get("quality_score", 0), reverse=True)
    with open(EVALUATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(data)} evaluations to {EVALUATIONS_FILE}")


def main():
    print("=" * 60)
    print("Cohabitat Europe - Scraper & Evaluator")
    print("=" * 60)

    # Load existing data
    existing_listings = load_existing_listings()
    existing_evaluations = load_existing_evaluations()
    print(f"Existing: {len(existing_listings)} listings, {len(existing_evaluations)} evaluations")

    # Run scrapers
    scrapers = [
        # Belgium
        HabitatGroupeScraper(),
        SamenhuizenScraper(),
        FindACoHouseScraper(),
        # France
        HabitatParticipatifFRScraper(),
        EcovillageFRScraper(),
        # Spain
        CohousingSpainScraper(),
        # Multi-country (BE, FR, ES, PT, NL, CH, LU)
        EcovillageOrgScraper(),
        ICOrgScraper(),
    ]

    all_new_listings = []
    for scraper in scrapers:
        print(f"\n--- Scraping {scraper.name} ---")
        try:
            listings = scraper.scrape()
            new_count = sum(1 for l in listings if l.id not in existing_listings)
            all_new_listings.extend(listings)
            print(f"  Found {len(listings)} listings ({new_count} new)")
        except Exception as e:
            print(f"  ERROR: {e}")

    # Merge with existing
    for listing in all_new_listings:
        existing_listings[listing.id] = listing

    # Pre-filter: remove obviously irrelevant listings before evaluation
    print(f"\n--- Pre-filter Quality ---")
    all_listings_list = list(existing_listings.values())
    filtered_listings, rejection_log = pre_filter(all_listings_list)
    print(f"  Pre-filter: {len(all_listings_list)} -> {len(filtered_listings)} listings")
    print(f"  Rejected: {len(rejection_log)} listings")
    for r in rejection_log[:10]:
        print(f"    - {r['title'][:60]} | {r['reason']}")
    if len(rejection_log) > 10:
        print(f"    ... and {len(rejection_log) - 10} more")

    # Translate non-French listings (Spanish/English -> French)
    print(f"\n--- Translation ---")
    to_translate = [l for l in existing_listings.values()
                    if l.original_language and l.original_language != "fr"]
    translations = translate_listings(to_translate)
    for listing_id, content in translations.items():
        if listing_id in existing_listings:
            existing_listings[listing_id].title = content["title"]
            existing_listings[listing_id].description = content["description"]

    # Clean descriptions (remove web page garbage via LLM)
    print(f"\n--- Description Cleaning ---")
    all_to_clean = list(existing_listings.values())
    cleaned = clean_all_descriptions(all_to_clean)
    for listing_id, clean_desc in cleaned.items():
        if listing_id in existing_listings:
            existing_listings[listing_id].description = clean_desc

    # Filter images: remove avatars, banners, icons, non-photo content
    print(f"\n--- Image Filtering ---")
    image_updates = filter_all_images(list(existing_listings.values()))
    for lid, clean_images in image_updates.items():
        if lid in existing_listings:
            existing_listings[lid].images = clean_images

    # Save ALL listings (unfiltered) for reference
    save_listings(existing_listings)

    # Evaluate only filtered listings (saves API costs)
    print(f"\n--- AI Evaluation ---")
    new_evaluations = evaluate_all(filtered_listings, existing_evaluations)

    # Merge evaluations
    for evaluation in new_evaluations:
        existing_evaluations[evaluation.listing_id] = evaluation

    # Generate AI titles and descriptions
    print(f"\n--- AI Content Generation ---")
    ai_content = generate_all_content(filtered_listings, existing_evaluations)
    for listing_id, content in ai_content.items():
        if listing_id in existing_evaluations:
            existing_evaluations[listing_id].ai_title = content["ai_title"]
            existing_evaluations[listing_id].ai_description = content["ai_description"]

    save_evaluations(existing_evaluations)

    # Extract structured tags
    print(f"\n--- Tag Extraction ---")
    existing_tags = load_existing_tags()
    print(f"Existing: {len(existing_tags)} tags")
    new_tags = extract_all_tags(filtered_listings, existing_tags)
    for tag in new_tags:
        existing_tags[tag.listing_id] = tag
    save_tags(existing_tags)

    # Post-filter: remove low-scoring listings from display
    print(f"\n--- Post-filter Quality ---")
    quality_listings, removed_count = post_filter_evaluations(
        list(existing_listings.values()),
        list(existing_evaluations.values()),
    )
    print(f"  Post-filter: removed {removed_count} low-scoring listings")
    print(f"  Quality listings for display: {len(quality_listings)}")

    # Summary
    print(f"\n{'=' * 60}")
    print(f"SUMMARY:")
    print(f"  Total scraped: {len(existing_listings)}")
    print(f"  Pre-filtered out: {len(rejection_log)}")
    print(f"  Total evaluations: {len(existing_evaluations)}")
    print(f"  Post-filtered out: {removed_count}")
    print(f"  Quality listings: {len(quality_listings)}")
    print(f"  Total tags: {len(existing_tags)}")
    print(f"  New this run: {len(all_new_listings)} listings, {len(new_evaluations)} evaluations, {len(new_tags)} tags")

    # Show top matches
    if existing_evaluations:
        top = sorted(
            existing_evaluations.values(),
            key=lambda e: e.quality_score,
            reverse=True,
        )[:5]
        print(f"\n  Top 5 quality listings:")
        for e in top:
            listing = existing_listings.get(e.listing_id)
            title = listing.title[:50] if listing else "?"
            avail = f" [{e.availability_status}]" if hasattr(e, 'availability_status') else ""
            print(f"    {e.quality_score}/100 - {title}{avail}")

    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
