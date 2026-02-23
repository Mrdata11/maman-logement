#!/usr/bin/env python3
"""Main orchestrator for the Maman Logement scraper."""

import json
import os
import sys
from typing import Dict

# Add parent directory to path so we can import scraper package
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scraper.config import DATA_DIR, LISTINGS_FILE, EVALUATIONS_FILE
from scraper.models import Listing, Evaluation
from scraper.scrapers.habitat_groupe import HabitatGroupeScraper
from scraper.scrapers.ic_org import ICOrgScraper
from scraper.scrapers.ecovillage import EcovillageScraper
from scraper.scrapers.samenhuizen import SamenhuizenScraper
from scraper.evaluator import evaluate_all
from scraper.quality_filter import pre_filter, post_filter_evaluations


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


def save_evaluations(evaluations: Dict[str, Evaluation]):
    os.makedirs(DATA_DIR, exist_ok=True)
    data = [e.model_dump() for e in evaluations.values()]
    # Sort by overall_score descending
    data.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
    with open(EVALUATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(data)} evaluations to {EVALUATIONS_FILE}")


def main():
    print("=" * 60)
    print("Maman Logement - Scraper & Evaluator")
    print("=" * 60)

    # Load existing data
    existing_listings = load_existing_listings()
    existing_evaluations = load_existing_evaluations()
    print(f"Existing: {len(existing_listings)} listings, {len(existing_evaluations)} evaluations")

    # Run scrapers
    scrapers = [
        HabitatGroupeScraper(),
        SamenhuizenScraper(),
        ICOrgScraper(),
        EcovillageScraper(),
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

    # Save ALL listings (unfiltered) for reference
    save_listings(existing_listings)

    # Evaluate only filtered listings (saves API costs)
    print(f"\n--- AI Evaluation ---")
    new_evaluations = evaluate_all(filtered_listings, existing_evaluations)

    # Merge evaluations
    for evaluation in new_evaluations:
        existing_evaluations[evaluation.listing_id] = evaluation

    save_evaluations(existing_evaluations)

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
    print(f"  New this run: {len(all_new_listings)} listings, {len(new_evaluations)} evaluations")

    # Show top matches
    if existing_evaluations:
        top = sorted(
            existing_evaluations.values(),
            key=lambda e: e.overall_score,
            reverse=True,
        )[:5]
        print(f"\n  Top 5 matches:")
        for e in top:
            listing = existing_listings.get(e.listing_id)
            title = listing.title[:50] if listing else "?"
            avail = f" [{e.availability_status}]" if hasattr(e, 'availability_status') else ""
            print(f"    {e.overall_score}/100 - {title}{avail}")

    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
