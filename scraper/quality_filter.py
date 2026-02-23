"""Pre-evaluation quality filter.

Removes obviously irrelevant listings before expensive AI evaluation.
This saves API costs and reduces noise in the final output.
"""

import hashlib
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from scraper.models import Listing

# Listings of these types are people SEARCHING, not offering housing
SKIP_TYPES = {"demande-location", "demande-vente"}

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
        if evaluation is None or evaluation.overall_score >= MIN_SCORE_THRESHOLD:
            kept_listings.append(listing)
        else:
            removed_count += 1

    return kept_listings, removed_count


def _should_skip(listing: Listing, seen_hashes: set) -> Optional[str]:
    """Returns rejection reason string, or None if listing should be kept."""

    # 1. Skip "demande" listings (people looking, not offering)
    if listing.listing_type in SKIP_TYPES:
        return f"Type '{listing.listing_type}' = demande, pas une offre"

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


def _parse_date(date_str: str) -> Optional[datetime]:
    """Try common date formats."""
    for fmt in ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%d/%m/%Y", "%d %B %Y"]:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return None
