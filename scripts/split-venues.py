#!/usr/bin/env python3
"""Split venues.json into individual files per venue + lightweight index.

Usage:
    python scripts/split-venues.py

Reads data/retreats/venues.json (array of venues) and produces:
  - data/retreats/venues/{id}.json  (one file per venue, full data)
  - data/retreats/venues/index.json (lightweight array for listing pages)
"""

import json
import os
import sys


def main():
    # Resolve paths relative to project root (parent of scripts/)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    venues_json_path = os.path.join(project_root, "data", "retreats", "venues.json")
    venues_dir = os.path.join(project_root, "data", "retreats", "venues")
    index_path = os.path.join(venues_dir, "index.json")

    # Read source file
    if not os.path.exists(venues_json_path):
        print(f"ERREUR: {venues_json_path} introuvable.")
        sys.exit(1)

    with open(venues_json_path, "r", encoding="utf-8") as f:
        venues = json.load(f)

    if not isinstance(venues, list):
        print("ERREUR: venues.json doit contenir un tableau JSON.")
        sys.exit(1)

    print(f"Lecture de {len(venues)} venues depuis {venues_json_path}")

    # Create venues/ directory
    os.makedirs(venues_dir, exist_ok=True)

    # Write individual venue files
    index_entries = []
    for venue in venues:
        venue_id = venue.get("id")
        if not venue_id:
            print(f"  ATTENTION: venue sans id, ignorée: {venue.get('name', '???')}")
            continue

        # Write full venue data to venues/{id}.json
        venue_file = os.path.join(venues_dir, f"{venue_id}.json")
        with open(venue_file, "w", encoding="utf-8") as f:
            json.dump(venue, f, ensure_ascii=False, indent=2)
        print(f"  Écrit: venues/{venue_id}.json")

        # Build lightweight index entry
        index_entries.append({
            "id": venue_id,
            "name": venue.get("name", ""),
            "country": venue.get("country", None),
            "region": venue.get("region", None),
            "city": venue.get("city", None),
            "score": None,
            "thumbnail": None,
        })

    # Write index.json
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index_entries, f, ensure_ascii=False, indent=2)
    print(f"  Écrit: venues/index.json ({len(index_entries)} entrées)")

    print(f"\nTerminé: {len(index_entries)} venues éclatées dans {venues_dir}")


if __name__ == "__main__":
    main()
