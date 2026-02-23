#!/usr/bin/env python3
"""One-time cleanup: filter existing listing images.

Usage:
    python -m scraper.cleanup_images                  # Layer 1 only (free, fast)
    python -m scraper.cleanup_images --dimensions     # Layer 1 + Layer 2
    python -m scraper.cleanup_images --vision         # All 3 layers
    python -m scraper.cleanup_images --dry-run        # Preview without saving
    python -m scraper.cleanup_images --community-only # Only community listings
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scraper.config import LISTINGS_FILE, APARTMENTS_LISTINGS_FILE
from scraper.models import Listing, ApartmentListing
from scraper.image_filter import (
    ImageFilterConfig,
    filter_all_listings,
    filter_with_vision,
)


def load_listings(filepath, model_class):
    if not os.path.exists(filepath):
        return {}
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {item["id"]: model_class(**item) for item in data}


def save_listings(filepath, listings):
    data = [l.model_dump() for l in listings.values()]
    data.sort(key=lambda x: x.get("date_scraped", ""), reverse=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(data)} listings to {filepath}")


def process_listings(listings, config, use_vision, dry_run, label):
    total_before = sum(len(l.images) for l in listings.values())
    print(f"Total images before: {total_before}")

    # Layer 1 + optionally Layer 2
    updates = filter_all_listings(list(listings.values()), config)
    for lid, clean_images in updates.items():
        listings[lid].images = clean_images

    # Layer 3 (if enabled)
    if use_vision:
        vision_updates = filter_with_vision(list(listings.values()), config)
        for lid, clean_images in vision_updates.items():
            listings[lid].images = clean_images

    total_after = sum(len(l.images) for l in listings.values())
    removed = total_before - total_after
    print(f"Total images after: {total_after}")
    print(f"Removed: {removed} images ({removed / total_before * 100:.1f}%)" if total_before > 0 else "No images to process")

    return listings


def main():
    parser = argparse.ArgumentParser(description="Clean up existing listing images")
    parser.add_argument("--dimensions", action="store_true",
                        help="Enable Layer 2: HTTP HEAD + Pillow dimension check")
    parser.add_argument("--vision", action="store_true",
                        help="Enable Layer 3: Claude Haiku vision classification")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview changes without saving")
    parser.add_argument("--apartments-only", action="store_true",
                        help="Only process apartment listings")
    parser.add_argument("--community-only", action="store_true",
                        help="Only process community listings")
    args = parser.parse_args()

    config = ImageFilterConfig(
        enable_url_heuristics=True,
        enable_dimension_check=args.dimensions or args.vision,
        enable_vision_check=args.vision,
    )

    layers = ["Layer 1 (URL heuristics)"]
    if config.enable_dimension_check:
        layers.append("Layer 2 (HTTP HEAD + Pillow)")
    if args.vision:
        layers.append("Layer 3 (Claude Haiku Vision)")

    print(f"Active layers: {', '.join(layers)}")
    if args.dry_run:
        print("[DRY RUN MODE - no changes will be saved]")
    print()

    # Process community listings
    if not args.apartments_only:
        print("=" * 60)
        print("Filtering community listing images")
        print("=" * 60)
        listings = load_listings(LISTINGS_FILE, Listing)
        print(f"Loaded {len(listings)} community listings")

        listings = process_listings(listings, config, args.vision, args.dry_run, "community")

        if not args.dry_run:
            save_listings(LISTINGS_FILE, listings)
        else:
            print("[DRY RUN] No changes saved")

    # Process apartment listings
    if not args.community_only:
        print(f"\n{'=' * 60}")
        print("Filtering apartment listing images")
        print("=" * 60)
        apartments = load_listings(APARTMENTS_LISTINGS_FILE, ApartmentListing)
        print(f"Loaded {len(apartments)} apartment listings")

        apartments = process_listings(apartments, config, args.vision, args.dry_run, "apartments")

        if not args.dry_run:
            save_listings(APARTMENTS_LISTINGS_FILE, apartments)
        else:
            print("[DRY RUN] No changes saved")


if __name__ == "__main__":
    main()
