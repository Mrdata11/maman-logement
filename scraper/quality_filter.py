"""Pre-evaluation quality filter.

Removes obviously irrelevant listings before expensive AI evaluation.
This saves API costs and reduces noise in the final output.
"""

import hashlib
import re
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from scraper.models import Listing

# Only these listing types are relevant: collaborative housing offering a spot
RELEVANT_TYPES = {"offre-location", "creation-groupe", "habitat-leger", "ecovillage", "community-profile", "cohousing", "existing-project"}

# Pure sale listings (unless they also mention rental)
SALE_TYPES = {"offre-vente"}

RENTAL_KEYWORDS = ["location", "louer", "locataire", "locat", "bail", "mensuel", "mois"]

# Minimum quality threshold for post-evaluation filtering
MIN_SCORE_THRESHOLD = 15


def pre_filter(listings: List[Listing]) -> Tuple[List[Listing], List[dict]]:
    """Filter out obviously irrelevant listings before AI evaluation.

    Returns:
        (kept_listings, rejection_log) where rejection_log entries are
        {"id": str, "title": str, "reason": str}
    """
    kept = []
    rejected = []
    seen_hashes = set()

    for listing in listings:
        reason = _should_skip(listing, seen_hashes)
        if reason:
            rejected.append({
                "id": listing.id,
                "title": listing.title[:80],
                "reason": reason,
            })
        else:
            kept.append(listing)
            content_hash = _content_hash(listing)
            seen_hashes.add(content_hash)

    return kept, rejected


def post_filter_evaluations(listings, evaluations):
    """Remove listings with very low evaluation scores from final output.

    Keeps:
    - Listings with score >= MIN_SCORE_THRESHOLD
    - Listings without evaluations (not yet evaluated)
    """
    eval_map = {e.listing_id: e for e in evaluations}
    kept_listings = []
    removed_count = 0

    for listing in listings:
        evaluation = eval_map.get(listing.id)
        if evaluation is None or evaluation.quality_score >= MIN_SCORE_THRESHOLD:
            kept_listings.append(listing)
        else:
            removed_count += 1

    return kept_listings, removed_count


def _should_skip(listing: Listing, seen_hashes: set) -> Optional[str]:
    """Returns rejection reason string, or None if listing should be kept."""

    # 1. Skip listing types that are not relevant (divers, autre, demande-*, etc.)
    if listing.listing_type not in RELEVANT_TYPES and listing.listing_type not in SALE_TYPES:
        return f"Type '{listing.listing_type}' non pertinent (pas une offre de logement collaboratif)"

    # 2. Skip pure sale listings that don't mention rental
    if listing.listing_type in SALE_TYPES:
        desc_lower = listing.description.lower()
        if not any(kw in desc_lower for kw in RENTAL_KEYWORDS):
            return "Vente pure sans mention de location"

    # 3. Skip listings with very short descriptions
    if len(listing.description.strip()) < 50:
        return f"Description trop courte ({len(listing.description.strip())} caracteres)"

    # 4. Skip listings older than 18 months
    if listing.date_published:
        pub_date = _parse_date(listing.date_published)
        if pub_date and (datetime.utcnow() - pub_date) > timedelta(days=548):
            return f"Trop ancien (publie le {listing.date_published})"

    # 5. Near-duplicate detection
    content_hash = _content_hash(listing)
    if content_hash in seen_hashes:
        return "Quasi-doublon (contenu similaire)"

    return None


def _content_hash(listing: Listing) -> str:
    """Hash based on first 500 chars of normalized description."""
    normalized = listing.description.lower().strip()[:500]
    return hashlib.md5(normalized.encode()).hexdigest()


_FRENCH_MONTHS = {
    "janvier": 1, "février": 2, "fevrier": 2, "mars": 3, "avril": 4,
    "mai": 5, "juin": 6, "juillet": 7, "août": 8, "aout": 8,
    "septembre": 9, "octobre": 10, "novembre": 11, "décembre": 12, "decembre": 12,
}


def _parse_date(date_str: str) -> Optional[datetime]:
    """Try common date formats including French month names."""
    for fmt in ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%d/%m/%Y"]:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    # Try French date: "22 février 2026"
    match = re.search(
        r"(\d{1,2})\s+"
        r"(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)"
        r"\s+(\d{4})",
        date_str,
        re.IGNORECASE,
    )
    if match:
        day, month_fr, year = match.groups()
        month = _FRENCH_MONTHS.get(month_fr.lower())
        if month:
            return datetime(int(year), month, int(day))
    return None
