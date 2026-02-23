#!/usr/bin/env python3
"""Main orchestrator for the Brussels apartment scraper."""

import json
import os
import sys
from typing import Dict

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scraper.config import APARTMENTS_DATA_DIR, APARTMENTS_LISTINGS_FILE, APARTMENTS_EVALUATIONS_FILE
from scraper.models import ApartmentListing, ApartmentEvaluation
from scraper.scrapers.immoweb import ImmowebScraper
from scraper.apartment_evaluator import evaluate_all_apartments
from scraper.apartment_quality_filter import pre_filter, post_filter_evaluations


def load_existing_listings() -> Dict[str, ApartmentListing]:
    if os.path.exists(APARTMENTS_LISTINGS_FILE):
        with open(APARTMENTS_LISTINGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {item["id"]: ApartmentListing(**item) for item in data}
    return {}


def load_existing_evaluations() -> Dict[str, ApartmentEvaluation]:
    if os.path.exists(APARTMENTS_EVALUATIONS_FILE):
        with open(APARTMENTS_EVALUATIONS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {item["listing_id"]: ApartmentEvaluation(**item) for item in data}
    return {}


def save_listings(listings: Dict[str, ApartmentListing]):
    os.makedirs(APARTMENTS_DATA_DIR, exist_ok=True)
    data = [l.model_dump() for l in listings.values()]
    data.sort(key=lambda x: x.get("date_scraped", ""), reverse=True)
    with open(APARTMENTS_LISTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(data)} apartment listings to {APARTMENTS_LISTINGS_FILE}")


def save_evaluations(evaluations: Dict[str, ApartmentEvaluation]):
    os.makedirs(APARTMENTS_DATA_DIR, exist_ok=True)
    data = [e.model_dump() for e in evaluations.values()]
    data.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
    with open(APARTMENTS_EVALUATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(data)} apartment evaluations to {APARTMENTS_EVALUATIONS_FILE}")


def main():
    print("=" * 60)
    print("Appartements Bruxelles - Scraper & Evaluator")
    print("=" * 60)

    # Load existing data
    existing_listings = load_existing_listings()
    existing_evaluations = load_existing_evaluations()
    print(f"Existing: {len(existing_listings)} listings, {len(existing_evaluations)} evaluations")

    # Run scraper
    scraper = ImmowebScraper()
    print(f"\n--- Scraping {scraper.name} ---")
    try:
        new_listings = scraper.scrape()
        new_count = sum(1 for l in new_listings if l.id not in existing_listings)
        print(f"  Found {len(new_listings)} listings ({new_count} new)")
    except Exception as e:
        print(f"  ERROR: {e}")
        new_listings = []

    # Merge with existing
    for listing in new_listings:
        existing_listings[listing.id] = listing

    # Pre-filter
    print(f"\n--- Pre-filter Quality ---")
    all_listings_list = list(existing_listings.values())
    filtered_listings, rejection_log = pre_filter(all_listings_list)
    print(f"  Pre-filter: {len(all_listings_list)} -> {len(filtered_listings)} listings")
    print(f"  Rejected: {len(rejection_log)} listings")
    for r in rejection_log[:10]:
        print(f"    - {r['title'][:60]} | {r['reason']}")
    if len(rejection_log) > 10:
        print(f"    ... and {len(rejection_log) - 10} more")

    # Save all listings (unfiltered)
    save_listings(existing_listings)

    # AI Evaluation
    print(f"\n--- AI Evaluation ---")
    new_evaluations = evaluate_all_apartments(filtered_listings, existing_evaluations)

    for evaluation in new_evaluations:
        existing_evaluations[evaluation.listing_id] = evaluation

    save_evaluations(existing_evaluations)

    # Post-filter
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
    print(f"  New this run: {len(new_listings)} listings, {len(new_evaluations)} evaluations")

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
            print(f"    {e.overall_score}/100 - {title}")

    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
