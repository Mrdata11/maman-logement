"""Extract structured tags from listing descriptions using Claude API."""

import json
import time
from typing import Optional, Dict, List
from scraper.models import Listing, ListingTags
from scraper.config import ANTHROPIC_API_KEY

try:
    import anthropic
except ImportError:
    anthropic = None


TAG_EXTRACTION_SYSTEM = """Tu es un extracteur de métadonnées pour des annonces d'habitat groupé en Belgique.
Tu analyses les descriptions (en français) et extrais des informations structurées.
Réponds TOUJOURS en JSON valide, sans aucun texte avant ou après."""


TAG_EXTRACTION_PROMPT = """Analyse cette annonce d'habitat groupé/communautaire et extrais les informations structurées.

ANNONCE:
Titre: {title}
Lieu: {location}
Province: {province}
Prix: {price}
Type: {listing_type}
Description:
{description}

Réponds UNIQUEMENT en JSON valide avec cette structure exacte.
Pour chaque champ, utilise null si l'information n'est pas mentionnée.
Pour les listes, utilise une liste vide [] si rien ne correspond.

{{
    "group_size": <nombre de personnes/ménages dans le groupe ou null>,
    "age_range": [<parmi: "intergenerational", "seniors", "families", "young_adults">],
    "has_children": <true/false/null>,
    "family_types": [<parmi: "singles", "couples", "families", "retirees">],
    "project_types": [<parmi: "habitat_groupe", "ecolieu", "cooperative", "habitat_leger", "colocation", "intergenerational", "community_creation">],
    "pets_allowed": <true/false/null>,
    "pet_details": [<parmi: "dogs", "cats", "poultry", "horses", "farm_animals">],
    "surface_m2": <nombre ou null>,
    "num_bedrooms": <nombre ou null>,
    "unit_type": <"studio"|"apartment"|"house"|"room"|"tiny_house"|"other"|null>,
    "furnished": <true/false/null>,
    "accessible_pmr": <true/false/null>,
    "shared_spaces": [<parmi: "garden", "vegetable_garden", "kitchen", "common_room", "laundry", "workshop", "parking", "coworking", "play_area">],
    "values": [<parmi: "ecological", "permaculture", "spiritual", "solidarity", "artistic", "self_sufficiency", "biodanza", "meditation", "organic">],
    "shared_meals": <"daily"|"weekly"|"occasional"|null>,
    "has_charter": <true/false/null>,
    "governance": <"consensus"|"sociocracy"|"association"|null>,
    "environment": <"rural"|"urban"|"suburban"|null>,
    "near_nature": <true/false/null>,
    "near_transport": <true/false/null>
}}

RÈGLES:
- Extrais UNIQUEMENT ce qui est explicitement mentionné ou très fortement impliqué
- Ne devine pas: si l'information n'est pas dans le texte, utilise null ou []
- Pour project_types, déduis du contexte (ex: "nous sommes 12 familles" => "habitat_groupe")
- Pour pets: "animaux bienvenus" => true; "pas d'animaux" => false; rien = null
- Pour environment: village/campagne => "rural"; centre-ville => "urban"; périphérie => "suburban"
- "potager" => shared_spaces inclut "vegetable_garden"
- "jardin" sans précision => "garden"
- Repas communautaires mentionnés => shared_meals selon fréquence décrite"""


def extract_tags(listing: Listing) -> Optional[ListingTags]:
    """Extract structured tags from a single listing."""
    if not anthropic or not ANTHROPIC_API_KEY:
        print("  [tag_extractor] Anthropic API not available, skipping")
        return None

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    prompt = TAG_EXTRACTION_PROMPT.format(
        title=listing.title,
        location=listing.location or "Non spécifié",
        province=listing.province or "Non spécifié",
        price=listing.price or "Non spécifié",
        listing_type=listing.listing_type or "Non spécifié",
        description=listing.description[:3000],
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=TAG_EXTRACTION_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()

        # Handle potential markdown code blocks
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        result = json.loads(text)
        return ListingTags(listing_id=listing.id, **result)

    except json.JSONDecodeError as e:
        print(f"  [tag_extractor] JSON parse error for {listing.id}: {e}")
        return None
    except Exception as e:
        print(f"  [tag_extractor] Error for {listing.id}: {e}")
        return None


def extract_all_tags(
    listings: List[Listing],
    existing_tags: Dict[str, ListingTags],
) -> List[ListingTags]:
    """Extract tags for listings that don't have them yet."""
    new_tags = []
    to_extract = [l for l in listings if l.id not in existing_tags]

    if not to_extract:
        print("  [tag_extractor] No new listings to extract tags for")
        return new_tags

    print(f"  [tag_extractor] Extracting tags for {len(to_extract)} listings...")

    for i, listing in enumerate(to_extract):
        print(f"  [tag_extractor] {i+1}/{len(to_extract)}: {listing.title[:60]}...")
        tags = extract_tags(listing)
        if tags:
            new_tags.append(tags)
        else:
            print(f"    Skipped (extraction failed)")

        # Rate limiting
        if i < len(to_extract) - 1:
            time.sleep(1)

    print(f"  [tag_extractor] Completed: {len(new_tags)} tag extractions")
    return new_tags
