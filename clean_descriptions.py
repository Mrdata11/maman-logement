#!/usr/bin/env python3
"""Standalone script to clean all existing listing descriptions using LLM."""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from scraper.config import LISTINGS_FILE
from scraper.models import Listing
from scraper.description_cleaner import clean_all_descriptions


def main():
    print("=" * 60)
    print("Description Cleaner - Clean all existing listings")
    print("=" * 60)

    # Load existing listings
    if not os.path.exists(LISTINGS_FILE):
        print(f"No listings file found at {LISTINGS_FILE}")
        return

    with open(LISTINGS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    listings = [Listing(**item) for item in data]
    print(f"Loaded {len(listings)} listings")

    # Clean all descriptions (force=True to clean everything)
    cleaned = clean_all_descriptions(listings, force=True)

    if not cleaned:
        print("No descriptions were cleaned.")
        return

    # Apply cleaned descriptions back to data
    listings_by_id = {item["id"]: item for item in data}
    for listing_id, clean_desc in cleaned.items():
        if listing_id in listings_by_id:
            listings_by_id[listing_id]["description"] = clean_desc

    # Save back
    updated_data = list(listings_by_id.values())
    with open(LISTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(updated_data, f, ensure_ascii=False, indent=2)

    print(f"\nDone! Cleaned {len(cleaned)}/{len(listings)} descriptions")
    print(f"Saved to {LISTINGS_FILE}")


if __name__ == "__main__":
    main()
