"""Quality filter for apartment listings."""

import hashlib
from typing import List, Optional, Tuple

from scraper.models import ApartmentListing

MIN_SCORE_THRESHOLD = 10


def pre_filter(listings: List[ApartmentListing]) -> Tuple[List[ApartmentListing], List[dict]]:
    """Filter out obviously irrelevant apartment listings before AI evaluation."""
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
    """Remove listings with very low evaluation scores."""
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


def _should_skip(listing: ApartmentListing, seen_hashes: set) -> Optional[str]:
    """Returns rejection reason string, or None if listing should be kept."""

    # Skip listings without price
    if listing.price_monthly is None:
        return "Pas de prix mensuel"

    # Skip listings with less than 2 bedrooms (if info available)
    if listing.bedrooms is not None and listing.bedrooms < 2:
        return f"Seulement {listing.bedrooms} chambre(s)"

    # Skip very short descriptions
    desc = listing.description or ""
    if len(desc.strip()) < 20:
        return f"Description trop courte ({len(desc.strip())} caractères)"

    # Near-duplicate detection
    content_hash = _content_hash(listing)
    if content_hash in seen_hashes:
        return "Quasi-doublon"

    return None


def _content_hash(listing: ApartmentListing) -> str:
    """Hash based on key fields for deduplication."""
    key = f"{listing.commune}|{listing.price_monthly}|{listing.bedrooms}|{listing.surface_m2}"
    normalized = listing.description.lower().strip()[:300] if listing.description else key
    return hashlib.md5(normalized.encode()).hexdigest()
