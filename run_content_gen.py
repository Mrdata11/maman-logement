#!/usr/bin/env python3
"""Standalone script to generate AI titles and descriptions for existing listings."""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from scraper.config import LISTINGS_FILE, EVALUATIONS_FILE
from scraper.models import Listing, Evaluation
from scraper.content_generator import generate_all_content


def main():
    # Load listings
    with open(LISTINGS_FILE, "r", encoding="utf-8") as f:
        listings_data = json.load(f)
    listings = {item["id"]: Listing(**item) for item in listings_data}
    print(f"Loaded {len(listings)} listings")

    # Load evaluations
    with open(EVALUATIONS_FILE, "r", encoding="utf-8") as f:
        evals_data = json.load(f)
    evaluations = {item["listing_id"]: Evaluation(**item) for item in evals_data}
    print(f"Loaded {len(evaluations)} evaluations")

    # Count how many need generation
    need_gen = sum(1 for e in evaluations.values() if not e.ai_title)
    print(f"Listings needing AI content: {need_gen}")

    if need_gen == 0:
        print("All listings already have AI content. Nothing to do.")
        return

    # Generate content
    listings_list = [l for l in listings.values() if l.id in evaluations]
    ai_content = generate_all_content(listings_list, evaluations)

    # Apply to evaluations
    for listing_id, content in ai_content.items():
        if listing_id in evaluations:
            evaluations[listing_id].ai_title = content["ai_title"]
            evaluations[listing_id].ai_description = content["ai_description"]

    # Save evaluations
    data = [e.model_dump() for e in evaluations.values()]
    data.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
    with open(EVALUATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\nSaved {len(data)} evaluations to {EVALUATIONS_FILE}")
    print(f"Generated AI content for {len(ai_content)} listings")


if __name__ == "__main__":
    main()
