"""Filter irrelevant images from listing image lists.

Three-layer approach:
  Layer 1: URL heuristics (free, instant)
  Layer 2: HTTP HEAD + Pillow dimension check (cheap, ~1s per image)
  Layer 3: Claude Haiku vision classification (affordable for batch)
"""

import asyncio
import io
import json
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urlparse

import requests

from scraper.config import ANTHROPIC_API_KEY, REQUEST_TIMEOUT, USER_AGENT

try:
    from PIL import Image
except ImportError:
    Image = None

try:
    import anthropic
except ImportError:
    anthropic = None


# ─── Configuration ────────────────────────────────────────────────────


@dataclass
class ImageFilterConfig:
    """Configuration for the image filtering pipeline."""

    # Which layers to enable
    enable_url_heuristics: bool = True
    enable_dimension_check: bool = False  # Requires network calls
    enable_vision_check: bool = False  # Costs money (Claude API)

    # Layer 1: URL heuristics
    blacklisted_domains: Set[str] = field(default_factory=lambda: {
        "secure.gravatar.com",
        "gravatar.com",
        "www.gravatar.com",
        "s.gravatar.com",
        "0.gravatar.com",
        "1.gravatar.com",
        "2.gravatar.com",
    })

    blacklisted_url_keywords: Set[str] = field(default_factory=lambda: {
        "logo", "icon", "banner", "favicon", "sprite",
        "avatar", "placeholder", "widget", "badge",
        "social", "share", "tracking", "pixel",
        "advertisement", "adsense",
        "button", "arrow", "spacer", "blank",
    })

    blacklisted_filename_patterns: Set[str] = field(default_factory=lambda: {
        "atelierhl",  # habitat-groupe.be site banner
    })

    non_photo_filename_keywords: Set[str] = field(default_factory=lambda: {
        "plan", "pdf", "schema", "diagram", "blueprint",
        "floorplan", "floor-plan", "grundriss",
    })

    rejected_extensions: Set[str] = field(default_factory=lambda: {
        ".svg", ".gif", ".ico", ".bmp",
    })

    max_url_aspect_ratio: float = 4.0

    # Layer 2: Dimension thresholds
    min_width: int = 100
    min_height: int = 100
    min_pixel_area: int = 10000
    max_aspect_ratio: float = 4.0
    min_content_length_bytes: int = 3000  # 3KB

    # Layer 3: Vision settings
    vision_model: str = "claude-haiku-4-5-20251001"
    vision_batch_size: int = 10

    trusted_sources: Set[str] = field(default_factory=lambda: {
        "immoweb.be",
    })


# ─── Layer 1: URL Heuristics ─────────────────────────────────────────


def filter_url_heuristics(url: str, config: ImageFilterConfig) -> Optional[str]:
    """Check URL against heuristics. Returns rejection reason or None if OK."""
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    path_lower = parsed.path.lower()
    filename = path_lower.rsplit("/", 1)[-1] if "/" in path_lower else path_lower

    # Blacklisted domains
    for bd in config.blacklisted_domains:
        if domain == bd or domain.endswith("." + bd):
            return f"blacklisted_domain:{bd}"

    # Blacklisted URL keywords (in full path)
    for kw in config.blacklisted_url_keywords:
        if kw in path_lower:
            return f"blacklisted_keyword:{kw}"

    # Blacklisted filename patterns
    for pat in config.blacklisted_filename_patterns:
        if pat in filename:
            return f"blacklisted_filename:{pat}"

    # Rejected file extensions
    for ext in config.rejected_extensions:
        if filename.endswith(ext):
            return f"rejected_extension:{ext}"

    # Non-photo filename keywords
    for kw in config.non_photo_filename_keywords:
        if kw in filename:
            return f"non_photo_filename:{kw}"

    # Dimension hints in URL (e.g., "900x184" in filename)
    dim_match = re.search(r"(\d{2,4})x(\d{2,4})", filename)
    if dim_match:
        w, h = int(dim_match.group(1)), int(dim_match.group(2))
        if w > 0 and h > 0:
            ratio = w / h
            if ratio > config.max_url_aspect_ratio:
                return f"url_aspect_ratio:{ratio:.1f}"
            if ratio < (1 / config.max_url_aspect_ratio):
                return f"url_aspect_ratio_inv:{ratio:.2f}"
            if w < config.min_width or h < config.min_height:
                return f"url_dimensions_small:{w}x{h}"

    return None


# ─── Layer 2: HTTP HEAD + Pillow Dimension Check ─────────────────────


def filter_by_dimensions(
    url: str,
    config: ImageFilterConfig,
    session: Optional[requests.Session] = None,
) -> Optional[str]:
    """HEAD request + partial download to check dimensions.
    Returns rejection reason or None if OK.
    """
    if not Image:
        return None  # Pillow not installed, skip

    sess = session or requests.Session()
    sess.headers.setdefault("User-Agent", USER_AGENT)

    try:
        head = sess.head(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)

        # Check Content-Type
        content_type = head.headers.get("Content-Type", "").lower()
        if content_type and not content_type.startswith("image/"):
            return f"not_image_content_type:{content_type}"

        # Check Content-Length
        content_length = head.headers.get("Content-Length")
        if content_length:
            size = int(content_length)
            if size < config.min_content_length_bytes:
                return f"too_small_file:{size}B"

        # Download first 64KB to get dimensions via Pillow
        resp = sess.get(
            url,
            timeout=REQUEST_TIMEOUT,
            headers={"Range": "bytes=0-65535"},
            stream=True,
        )
        data = resp.content
        img = Image.open(io.BytesIO(data))
        w, h = img.size

        if w < config.min_width or h < config.min_height:
            return f"too_small_dimensions:{w}x{h}"
        if w * h < config.min_pixel_area:
            return f"too_small_area:{w*h}px"
        ratio = w / h
        if ratio > config.max_aspect_ratio:
            return f"bad_aspect_ratio:{ratio:.1f}"
        if ratio < (1 / config.max_aspect_ratio):
            return f"bad_aspect_ratio_inv:{ratio:.2f}"

    except Exception:
        # Network errors, invalid images — keep the image (safe default)
        return None

    return None


# ─── Layer 3: Claude Haiku Vision ─────────────────────────────────────


VISION_SYSTEM = """Tu es un classificateur d'images pour un site d'annonces immobilières.
Pour chaque image, tu dois déterminer si c'est une photo pertinente d'un logement/lieu de vie
ou une image non pertinente (avatar, logo, bannière, icône, plan/schéma, image stock, image décorative).

Réponds UNIQUEMENT en JSON valide."""

VISION_PROMPT = """Classifie chaque image. Pour chaque image numérotée, réponds:
- "keep" si c'est une photo pertinente (maison, appartement, jardin, pièce, quartier, vue extérieure, bâtiment)
- "remove" si c'est non pertinent (avatar, logo, bannière, icône, schéma/plan, image stock, image décorative, social media icon)

Réponds UNIQUEMENT en JSON: {"1": "keep", "2": "remove", ...}"""


async def _classify_batch_vision(
    client,
    urls: List[str],
    config: ImageFilterConfig,
) -> Dict[str, str]:
    """Classify a batch of image URLs using Claude vision.
    Returns dict mapping URL -> "keep" or "remove".
    """
    content = []
    for i, url in enumerate(urls, 1):
        content.append({"type": "text", "text": f"Image {i}:"})
        content.append({
            "type": "image",
            "source": {"type": "url", "url": url},
        })

    content.append({"type": "text", "text": VISION_PROMPT})

    try:
        response = await client.messages.create(
            model=config.vision_model,
            max_tokens=256,
            system=VISION_SYSTEM,
            messages=[{"role": "user", "content": content}],
        )
        text = response.content[0].text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(text)

        mapping = {}
        for i, url in enumerate(urls, 1):
            mapping[url] = result.get(str(i), "keep")
        return mapping

    except Exception as e:
        print(f"  [image_filter] Vision batch error: {e}")
        return {url: "keep" for url in urls}


async def _filter_vision_async(
    urls: List[str],
    config: ImageFilterConfig,
) -> Dict[str, Optional[str]]:
    """Filter images using Claude vision in batches.
    Returns dict mapping URL -> rejection reason or None.
    """
    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    results = {}
    total = len(urls)

    for batch_start in range(0, total, config.vision_batch_size):
        batch = urls[batch_start:batch_start + config.vision_batch_size]
        batch_end = min(batch_start + config.vision_batch_size, total)
        print(f"  [image_filter] Vision batch {batch_start + 1}-{batch_end}/{total}...")

        classifications = await _classify_batch_vision(client, batch, config)
        for url, verdict in classifications.items():
            if verdict == "remove":
                results[url] = "vision_classified_irrelevant"
            else:
                results[url] = None

    return results


# ─── Main Filtering API ──────────────────────────────────────────────


@dataclass
class FilterResult:
    """Result of filtering images for a single listing."""
    listing_id: str
    original_count: int
    kept_urls: List[str]
    removed: List[Tuple[str, str]]  # (url, reason)


def filter_images_for_listing(
    listing_id: str,
    image_urls: List[str],
    source: str = "",
    config: Optional[ImageFilterConfig] = None,
    session: Optional[requests.Session] = None,
) -> FilterResult:
    """Filter images for a single listing through Layer 1 and Layer 2."""
    if config is None:
        config = ImageFilterConfig()

    kept = []
    removed = []

    for url in image_urls:
        reason = None

        # Layer 1: URL heuristics
        if config.enable_url_heuristics:
            reason = filter_url_heuristics(url, config)

        # Layer 2: Dimension check (skip for trusted sources)
        if reason is None and config.enable_dimension_check:
            if source not in config.trusted_sources:
                reason = filter_by_dimensions(url, config, session)

        if reason:
            removed.append((url, reason))
        else:
            kept.append(url)

    return FilterResult(
        listing_id=listing_id,
        original_count=len(image_urls),
        kept_urls=kept,
        removed=removed,
    )


def filter_all_listings(
    listings: list,
    config: Optional[ImageFilterConfig] = None,
) -> Dict[str, List[str]]:
    """Filter images for all listings (Layer 1 + optionally Layer 2).

    Works with both Listing and ApartmentListing models.

    Returns:
        Dict mapping listing_id -> filtered image list (only for changed listings).
    """
    if config is None:
        config = ImageFilterConfig()

    session = None
    if config.enable_dimension_check:
        session = requests.Session()
        session.headers["User-Agent"] = USER_AGENT

    results = {}
    total_removed = 0
    total_images = 0

    for listing in listings:
        if not listing.images:
            continue

        total_images += len(listing.images)
        result = filter_images_for_listing(
            listing_id=listing.id,
            image_urls=listing.images,
            source=listing.source,
            config=config,
            session=session,
        )

        if result.removed:
            total_removed += len(result.removed)
            results[listing.id] = result.kept_urls
            for url, reason in result.removed:
                print(f"    {listing.id}: removed {reason}")

    print(f"  [image_filter] {total_removed}/{total_images} images removed across {len(results)} listings")
    return results


def filter_with_vision(
    listings: list,
    config: Optional[ImageFilterConfig] = None,
) -> Dict[str, List[str]]:
    """Run Layer 3 (vision) on listings that still have images.

    Returns:
        Dict mapping listing_id -> filtered image list (only for changed listings).
    """
    if not anthropic or not ANTHROPIC_API_KEY:
        print("  [image_filter] Anthropic API not available, skipping vision")
        return {}

    if config is None:
        config = ImageFilterConfig(enable_vision_check=True)

    # Collect non-trusted images
    url_to_listings: Dict[str, List[str]] = {}
    for listing in listings:
        if listing.source in config.trusted_sources:
            continue
        for url in listing.images:
            url_to_listings.setdefault(url, []).append(listing.id)

    all_urls = list(url_to_listings.keys())
    if not all_urls:
        print("  [image_filter] No images need vision check")
        return {}

    print(f"  [image_filter] Running vision check on {len(all_urls)} unique images...")

    vision_results = asyncio.run(_filter_vision_async(all_urls, config))

    # Build per-listing results
    listing_images = {listing.id: list(listing.images) for listing in listings}
    results = {}
    removed_count = 0

    for url, reason in vision_results.items():
        if reason:
            removed_count += 1
            for lid in url_to_listings.get(url, []):
                if lid in listing_images and url in listing_images[lid]:
                    listing_images[lid].remove(url)
                    results[lid] = listing_images[lid]

    print(f"  [image_filter] Vision removed {removed_count}/{len(all_urls)} images")
    return results
