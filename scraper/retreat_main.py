#!/usr/bin/env python3
"""Orchestrateur principal du pipeline de scraping de lieux de retraite.

Suit le même pattern que main.py (cohabitat) :
1. Charger les données existantes
2. Exécuter les scrapers
3. Dédupliquer
4. Extraire les contacts
5. Évaluer via IA
6. Générer le contenu IA
7. Extraire les tags
8. Sauvegarder en structure split-file (venues/index.json + venues/{id}.json)

Usage:
    python -m scraper.retreat_main            # Pipeline complet
    python -m scraper.retreat_main --test      # Mode test (3 venues max)
    python -m scraper.retreat_main --no-ai     # Sans évaluation/contenu IA
    python -m scraper.retreat_main --scrape-only  # Scraping + dedup seulement
"""

import argparse
import json
import os
import sys
from typing import Dict

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scraper.retreat_config import (
    RETREAT_DATA_DIR,
    RETREAT_VENUES_DIR,
    RETREAT_INDEX_FILE,
    RETREAT_EVALUATIONS_FILE,
    RETREAT_TAGS_FILE,
    OUTREACH_FILE,
    RETREAT_VENUES_FILE,
)
from scraper.retreat_scrapers.retreat_models import (
    RetreatVenueListing,
    RetreatVenueEvaluation,
    RetreatVenueTags,
)
from scraper.retreat_scrapers.google_places import GooglePlacesScraper
from scraper.retreat_scrapers.retreat_guru import RetreatGuruScraper
from scraper.retreat_scrapers.bookyogaretreats import BookYogaRetreatsScraper
from scraper.deduplicator import deduplicate
from scraper.contact_extractor import extract_contacts
from scraper.retreat_evaluator import evaluate_all_retreat_venues
from scraper.retreat_content_gen import generate_all_retreat_content
from scraper.retreat_tag_extractor import extract_all_retreat_tags


# === Chargement des données existantes ===

def load_existing_venues() -> Dict[str, RetreatVenueListing]:
    """Charge les venues existantes depuis la structure split-file ou le fichier monolithique."""
    venues: Dict[str, RetreatVenueListing] = {}

    # Priorité 1 : structure split-file (venues/{id}.json)
    if os.path.exists(RETREAT_INDEX_FILE):
        try:
            with open(RETREAT_INDEX_FILE, "r", encoding="utf-8") as f:
                index = json.load(f)
            for entry in index:
                venue_id = entry["id"]
                venue_path = os.path.join(RETREAT_VENUES_DIR, f"{venue_id}.json")
                if os.path.exists(venue_path):
                    with open(venue_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    venues[venue_id] = RetreatVenueListing(**data)
            print(f"  Chargé {len(venues)} venues depuis la structure split-file")
            return venues
        except Exception as e:
            print(f"  Erreur lecture split-file: {e}")

    # Priorité 2 : fichier monolithique (venues.json)
    if os.path.exists(RETREAT_VENUES_FILE):
        try:
            with open(RETREAT_VENUES_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            for item in data:
                venue = RetreatVenueListing(**item)
                venues[venue.id] = venue
            print(f"  Chargé {len(venues)} venues depuis venues.json")
        except Exception as e:
            print(f"  Erreur lecture venues.json: {e}")

    return venues


def load_existing_evaluations() -> Dict[str, RetreatVenueEvaluation]:
    """Charge les évaluations existantes."""
    if not os.path.exists(RETREAT_EVALUATIONS_FILE):
        return {}
    try:
        with open(RETREAT_EVALUATIONS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {item["listing_id"]: RetreatVenueEvaluation(**item) for item in data}
    except Exception as e:
        print(f"  Erreur lecture évaluations: {e}")
        return {}


def load_existing_tags() -> Dict[str, RetreatVenueTags]:
    """Charge les tags existants."""
    if not os.path.exists(RETREAT_TAGS_FILE):
        return {}
    try:
        with open(RETREAT_TAGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {item["listing_id"]: RetreatVenueTags(**item) for item in data}
    except Exception as e:
        print(f"  Erreur lecture tags: {e}")
        return {}


# === Sauvegarde ===

def save_venues_split(venues: Dict[str, RetreatVenueListing]):
    """Sauvegarde les venues en structure split-file.

    - venues/{id}.json : données complètes de chaque venue
    - venues/index.json : index léger (id, name, country, region, city, score, thumbnail)
    """
    os.makedirs(RETREAT_VENUES_DIR, exist_ok=True)

    index_entries = []
    for venue_id, venue in venues.items():
        # Écrire le fichier individuel
        venue_path = os.path.join(RETREAT_VENUES_DIR, f"{venue_id}.json")
        with open(venue_path, "w", encoding="utf-8") as f:
            json.dump(venue.model_dump(), f, ensure_ascii=False, indent=2)

        # Entrée d'index
        thumbnail = venue.images[0] if venue.images else None
        index_entries.append({
            "id": venue_id,
            "name": venue.name,
            "country": venue.country,
            "region": venue.region,
            "city": venue.city,
            "score": None,  # Sera rempli après évaluation
            "thumbnail": thumbnail,
        })

    # Trier l'index par nom
    index_entries.sort(key=lambda x: x.get("name", ""))

    # Écrire l'index
    with open(RETREAT_INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(index_entries, f, ensure_ascii=False, indent=2)

    # Aussi sauvegarder en format monolithique pour backward compat
    all_data = [v.model_dump() for v in venues.values()]
    all_data.sort(key=lambda x: x.get("date_scraped", ""), reverse=True)
    with open(RETREAT_VENUES_FILE, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"  Sauvegardé {len(venues)} venues (split-file + monolithique)")


def save_evaluations(evaluations: Dict[str, RetreatVenueEvaluation]):
    """Sauvegarde les évaluations."""
    os.makedirs(RETREAT_DATA_DIR, exist_ok=True)
    data = [e.model_dump() for e in evaluations.values()]
    data.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
    with open(RETREAT_EVALUATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Sauvegardé {len(data)} évaluations")


def save_tags(tags: Dict[str, RetreatVenueTags]):
    """Sauvegarde les tags."""
    os.makedirs(RETREAT_DATA_DIR, exist_ok=True)
    data = [t.model_dump() for t in tags.values()]
    data.sort(key=lambda x: x.get("date_extracted", ""), reverse=True)
    with open(RETREAT_TAGS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Sauvegardé {len(data)} tags")


def update_index_scores(
    evaluations: Dict[str, RetreatVenueEvaluation],
):
    """Met à jour les scores dans l'index léger."""
    if not os.path.exists(RETREAT_INDEX_FILE):
        return
    try:
        with open(RETREAT_INDEX_FILE, "r", encoding="utf-8") as f:
            index = json.load(f)
        for entry in index:
            eval_data = evaluations.get(entry["id"])
            if eval_data:
                entry["score"] = eval_data.overall_score
        with open(RETREAT_INDEX_FILE, "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"  Erreur mise à jour index scores: {e}")


# === Pipeline principal ===

def main():
    parser = argparse.ArgumentParser(description="Pipeline de scraping de lieux de retraite")
    parser.add_argument("--test", action="store_true", help="Mode test (3 venues max)")
    parser.add_argument("--no-ai", action="store_true", help="Désactiver les étapes IA")
    parser.add_argument("--scrape-only", action="store_true", help="Scraping + dédup uniquement")
    parser.add_argument("--priority", type=int, default=1, help="Niveau de priorité max des pays (1-3)")
    parser.add_argument("--ai-contacts", action="store_true", help="Utiliser l'IA pour l'extraction de contacts")
    parser.add_argument("--ai-tags", action="store_true", help="Utiliser l'IA pour compléter les tags")
    args = parser.parse_args()

    print("=" * 60)
    print("Pipeline Lieux de Retraite — Scraper & Évaluateur")
    if args.test:
        print("  MODE TEST (3 venues max)")
    print("=" * 60)

    # 1. Charger les données existantes
    print("\n--- Chargement des données existantes ---")
    existing_venues = load_existing_venues()
    existing_evaluations = load_existing_evaluations()
    existing_tags = load_existing_tags()
    print(f"  Existant: {len(existing_venues)} venues, "
          f"{len(existing_evaluations)} évaluations, "
          f"{len(existing_tags)} tags")

    # 2. Exécuter les scrapers
    print("\n--- Scraping ---")
    scrapers = [
        GooglePlacesScraper(priority_max=args.priority),
        RetreatGuruScraper(priority_max=args.priority),
        BookYogaRetreatsScraper(priority_max=args.priority),
    ]

    all_new_venues: list[RetreatVenueListing] = []
    for scraper in scrapers:
        print(f"\n  --- {scraper.name} ---")
        try:
            venues = scraper.scrape()
            new_count = sum(1 for v in venues if v.id not in existing_venues)
            all_new_venues.extend(venues)
            print(f"  Trouvé {len(venues)} venues ({new_count} nouvelles)")
        except Exception as e:
            print(f"  ERREUR: {e}")

    # En mode test, limiter à 3 venues
    if args.test and len(all_new_venues) > 3:
        all_new_venues = all_new_venues[:3]
        print(f"\n  [TEST] Limité à {len(all_new_venues)} venues")

    # 3. Fusionner avec les existantes
    print("\n--- Fusion ---")
    for venue in all_new_venues:
        existing_venues[venue.id] = venue
    print(f"  Total après fusion: {len(existing_venues)} venues")

    # 4. Déduplication
    print("\n--- Déduplication ---")
    all_venues_list = list(existing_venues.values())
    deduped = deduplicate(all_venues_list)
    existing_venues = {v.id: v for v in deduped}
    print(f"  Après déduplication: {len(existing_venues)} venues")

    # 5. Sauvegarder les venues (étape intermédiaire)
    print("\n--- Sauvegarde intermédiaire ---")
    save_venues_split(existing_venues)

    if args.scrape_only:
        print("\n  [scrape-only] Pipeline arrêté après le scraping.")
        _print_summary(existing_venues, existing_evaluations, existing_tags, all_new_venues)
        return

    # 6. Extraction de contacts
    print("\n--- Extraction de contacts ---")
    contact_updates = extract_contacts(
        list(existing_venues.values()),
        use_ai=args.ai_contacts,
    )
    for venue_id, updates in contact_updates.items():
        if venue_id in existing_venues:
            venue = existing_venues[venue_id]
            if "contact_email" in updates:
                venue.contact_email = updates["contact_email"]
            if "contact_phone" in updates:
                venue.contact_phone = updates["contact_phone"]
            if "contact_person_name" in updates:
                venue.contact_person_name = updates["contact_person_name"]
            if "contact_person_role" in updates:
                venue.contact_person_role = updates["contact_person_role"]
            if "social_instagram" in updates:
                venue.social_instagram = updates["social_instagram"]
            if "social_facebook" in updates:
                venue.social_facebook = updates["social_facebook"]
            if "contact_extraction_status" in updates:
                venue.contact_extraction_status = updates["contact_extraction_status"]

    # Re-sauvegarder avec les contacts mis à jour
    save_venues_split(existing_venues)

    if args.no_ai:
        print("\n  [no-ai] Étapes IA désactivées.")
        _print_summary(existing_venues, existing_evaluations, existing_tags, all_new_venues)
        return

    # 7. Évaluation IA
    print("\n--- Évaluation IA ---")
    new_evaluations = evaluate_all_retreat_venues(
        list(existing_venues.values()),
        existing_evaluations,
    )
    for evaluation in new_evaluations:
        existing_evaluations[evaluation.listing_id] = evaluation

    # 8. Génération de contenu IA
    print("\n--- Génération de contenu IA ---")
    ai_content = generate_all_retreat_content(
        list(existing_venues.values()),
        existing_evaluations,
    )
    for venue_id, content in ai_content.items():
        if venue_id in existing_evaluations:
            existing_evaluations[venue_id].ai_title = content["ai_title"]
            existing_evaluations[venue_id].ai_description = content["ai_description"]

    save_evaluations(existing_evaluations)

    # 9. Extraction de tags
    print("\n--- Extraction de tags ---")
    new_tags = extract_all_retreat_tags(
        list(existing_venues.values()),
        existing_tags,
        use_ai=args.ai_tags,
    )
    for tag in new_tags:
        existing_tags[tag.listing_id] = tag
    save_tags(existing_tags)

    # 10. Mettre à jour les scores dans l'index
    update_index_scores(existing_evaluations)

    # Résumé
    _print_summary(existing_venues, existing_evaluations, existing_tags, all_new_venues)


def _print_summary(
    venues: Dict[str, RetreatVenueListing],
    evaluations: Dict[str, RetreatVenueEvaluation],
    tags: Dict[str, RetreatVenueTags],
    new_venues: list[RetreatVenueListing],
):
    """Affiche un résumé du pipeline."""
    print(f"\n{'=' * 60}")
    print("RÉSUMÉ:")
    print(f"  Total venues: {len(venues)}")
    print(f"  Total évaluations: {len(evaluations)}")
    print(f"  Total tags: {len(tags)}")
    print(f"  Nouvelles cette exécution: {len(new_venues)}")

    # Répartition par pays
    country_counts: Dict[str, int] = {}
    for v in venues.values():
        country = v.country or "?"
        country_counts[country] = country_counts.get(country, 0) + 1
    print(f"\n  Répartition par pays:")
    for country, count in sorted(country_counts.items(), key=lambda x: -x[1]):
        print(f"    {country}: {count}")

    # Répartition par source
    source_counts: Dict[str, int] = {}
    for v in venues.values():
        source_counts[v.source] = source_counts.get(v.source, 0) + 1
    print(f"\n  Répartition par source:")
    for source, count in sorted(source_counts.items(), key=lambda x: -x[1]):
        print(f"    {source}: {count}")

    # Top 5 par score
    if evaluations:
        top = sorted(
            evaluations.values(),
            key=lambda e: e.overall_score,
            reverse=True,
        )[:5]
        print(f"\n  Top 5 par score:")
        for e in top:
            venue = venues.get(e.listing_id)
            name = venue.name[:50] if venue else "?"
            print(f"    {e.overall_score}/100 - {name}")

    # Venues avec contact
    with_email = sum(1 for v in venues.values() if v.contact_email)
    with_website = sum(1 for v in venues.values() if v.website)
    print(f"\n  Contacts:")
    print(f"    Avec email: {with_email}/{len(venues)}")
    print(f"    Avec site web: {with_website}/{len(venues)}")

    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
