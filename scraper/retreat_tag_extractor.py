"""Extraction de tags structurés pour les lieux de retraite.

La plupart des tags sont extraits directement depuis les champs structurés
de RetreatVenueListing, sans recourir à l'IA. L'IA est utilisée uniquement
pour les cas ambigus (lorsque les données structurées ne suffisent pas).
"""

import json
import time
from typing import Optional, Dict, List

from scraper.retreat_scrapers.retreat_models import (
    RetreatVenueListing,
    RetreatVenueTags,
)
from scraper.retreat_config import ANTHROPIC_API_KEY

try:
    import anthropic
except ImportError:
    anthropic = None


def _determine_capacity_range(venue: RetreatVenueListing) -> Optional[str]:
    """Détermine la catégorie de capacité."""
    cap = venue.capacity_max or venue.capacity_min
    if cap is None:
        return None
    if cap < 15:
        return "small"
    elif cap <= 30:
        return "medium"
    else:
        return "large"


def _determine_price_bracket(venue: RetreatVenueListing) -> Optional[str]:
    """Détermine la fourchette de prix."""
    price = venue.price_per_person_per_night
    if price is None:
        return None
    if price < 40:
        return "budget"
    elif price < 80:
        return "mid_range"
    elif price < 150:
        return "premium"
    else:
        return "luxury"


def _has_in_list(items: list[str], keywords: list[str]) -> bool:
    """Vérifie si un des mots-clés est présent dans la liste."""
    items_lower = [i.lower() for i in items]
    for kw in keywords:
        if any(kw.lower() in item for item in items_lower):
            return True
    return False


def extract_tags_from_venue(venue: RetreatVenueListing) -> RetreatVenueTags:
    """Extrait les tags directement depuis les données structurées d'une venue.

    Pas besoin d'IA pour la majorité des tags — c'est un mapping direct.
    """
    # Capacité
    capacity_range = _determine_capacity_range(venue)

    # Hébergement
    has_private = _has_in_list(venue.accommodation_types, ["private_room", "suite", "villa", "apartment"])
    has_shared = _has_in_list(venue.accommodation_types, ["shared_room", "dormitory"])

    # Espaces de pratique
    has_yoga_studio = _has_in_list(venue.activity_spaces, ["yoga_studio", "yoga_shala"])
    has_meditation_hall = _has_in_list(venue.activity_spaces, ["meditation_hall", "meditation_room"])
    has_outdoor_practice = _has_in_list(venue.activity_spaces, ["outdoor_deck", "outdoor_platform"])

    # Extérieur & bien-être
    has_pool = venue.pool_type is not None or _has_in_list(venue.outdoor_spaces, ["pool"])
    has_sauna_spa = _has_in_list(venue.outdoor_spaces, ["sauna", "spa", "hot_tub", "hammam"])
    has_beach = _has_in_list(venue.outdoor_spaces, ["beach_access"]) or (
        venue.nearest_beach_km is not None and venue.nearest_beach_km < 2
    )
    has_garden = _has_in_list(venue.outdoor_spaces, ["garden", "meditation_garden"])

    # Restauration
    is_vegetarian = _has_in_list(venue.cuisine_options, ["vegetarian"])
    is_vegan = _has_in_list(venue.cuisine_options, ["vegan"])
    is_organic = _has_in_list(venue.cuisine_options, ["organic", "bio"])

    # Services
    has_airport_transfer = _has_in_list(venue.services, ["airport_transfer"])
    has_wifi = _has_in_list(venue.services, ["wifi"]) or (
        venue.wifi_speed is not None and venue.wifi_speed != "none"
    )

    # Règles
    alcohol_free = venue.alcohol_policy == "not_allowed" if venue.alcohol_policy else None

    # Prix
    price_bracket = _determine_price_bracket(venue)

    # Cuisine professionnelle
    has_professional_kitchen = venue.kitchen_type == "professional" if venue.kitchen_type else None

    # Parking
    has_parking = (venue.parking_spaces is not None and venue.parking_spaces > 0) or (
        venue.parking_type is not None and venue.parking_type != "none"
    )

    # Non-fumeur
    smoking_not_allowed = venue.smoking_policy == "not_allowed" if venue.smoking_policy else None

    # Chauffage & climatisation
    has_heating = venue.heating_type is not None and venue.heating_type != "none"
    has_ac = venue.air_conditioning_type is not None and venue.air_conditioning_type != "none"

    # Éco-responsable
    eco_friendly = (
        len(venue.eco_certifications) > 0
        or len(venue.sustainability_features) > 0
        or _has_in_list(venue.style, ["eco"])
    ) or None

    # Activités à proximité
    has_nearby_activities = len(venue.nearby_activities) > 0 or None

    return RetreatVenueTags(
        listing_id=venue.id,
        capacity_range=capacity_range,
        accommodation_types=venue.accommodation_types,
        has_private_rooms=has_private or None,
        has_shared_rooms=has_shared or None,
        has_yoga_studio=has_yoga_studio or None,
        has_meditation_hall=has_meditation_hall or None,
        has_outdoor_practice_space=has_outdoor_practice or None,
        num_practice_spaces=venue.num_practice_spaces,
        has_pool=has_pool or None,
        has_sauna_spa=has_sauna_spa or None,
        has_beach_access=has_beach or None,
        has_garden=has_garden or None,
        meal_service=venue.meal_service,
        is_vegetarian=is_vegetarian or None,
        is_vegan_friendly=is_vegan or None,
        is_organic=is_organic or None,
        setting=venue.setting,
        style=venue.style,
        suitable_for=venue.suitable_for,
        has_airport_transfer=has_airport_transfer or None,
        has_wifi=has_wifi or None,
        is_accessible=venue.accessible,
        alcohol_free=alcohol_free,
        children_welcome=venue.children_welcome,
        price_bracket=price_bracket,
        has_professional_kitchen=has_professional_kitchen,
        bed_linen_provided=venue.bed_linen_provided,
        towels_provided=venue.towels_provided,
        cleaning_included=venue.cleaning_included,
        staff_on_site=venue.staff_on_site,
        has_parking=has_parking or None,
        smoking_not_allowed=smoking_not_allowed,
        pets_allowed=venue.pets_allowed,
        has_heating=has_heating or None,
        has_ac=has_ac or None,
        drinking_water_safe=venue.drinking_water_safe,
        first_aid_kit=venue.first_aid_kit,
        eco_friendly=eco_friendly,
        has_nearby_activities=has_nearby_activities,
        has_liability_insurance=venue.liability_insurance,
    )


# === Fallback IA pour les cas ambigus ===

TAG_AI_SYSTEM = """Tu es un extracteur de métadonnées pour des lieux de retraite bien-être.
Tu analyses la description et extrais des tags structurés.
Réponds TOUJOURS en JSON valide, sans aucun texte avant ou après."""

TAG_AI_PROMPT = """Analyse cette description de lieu de retraite et complète les tags manquants.

Nom: {name}
Description:
{description}

Tags déjà extraits (à compléter si nécessaire):
{existing_tags}

Réponds UNIQUEMENT en JSON valide avec les tags qui pourraient être déduits de la description mais qui sont actuellement null:
{{
    "has_yoga_studio": <true/false/null>,
    "has_meditation_hall": <true/false/null>,
    "has_pool": <true/false/null>,
    "has_sauna_spa": <true/false/null>,
    "is_vegetarian": <true/false/null>,
    "is_vegan_friendly": <true/false/null>,
    "eco_friendly": <true/false/null>,
    "setting": [<parmi: "beach", "mountain", "forest", "countryside", "island", "lake">],
    "style": [<parmi: "rustic", "luxury", "eco", "modern", "bohemian", "spiritual", "boutique", "minimalist", "traditional">]
}}

Règles:
- N'extrais QUE ce qui est explicitement mentionné ou très fortement impliqué
- Ne devine pas : si l'info n'est pas dans le texte, retourne null
- Pour les listes, ne retourne que les éléments clairement mentionnés"""


def _ai_complete_tags(
    venue: RetreatVenueListing, existing_tags: RetreatVenueTags
) -> RetreatVenueTags:
    """Utilise l'IA pour compléter les tags manquants depuis la description."""
    if not anthropic or not ANTHROPIC_API_KEY:
        return existing_tags

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    # Ne soumettre que si on a des lacunes significatives
    tags_data = existing_tags.model_dump()
    null_count = sum(1 for v in tags_data.values() if v is None)
    if null_count < 5:
        return existing_tags

    prompt = TAG_AI_PROMPT.format(
        name=venue.name,
        description=venue.description[:3000],
        existing_tags=json.dumps(
            {k: v for k, v in tags_data.items() if k != "listing_id" and k != "date_extracted"},
            ensure_ascii=False,
            indent=2,
        ),
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=TAG_AI_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        ai_result = json.loads(text)

        # Compléter seulement les champs nuls
        if existing_tags.has_yoga_studio is None and ai_result.get("has_yoga_studio") is not None:
            existing_tags.has_yoga_studio = ai_result["has_yoga_studio"]
        if existing_tags.has_meditation_hall is None and ai_result.get("has_meditation_hall") is not None:
            existing_tags.has_meditation_hall = ai_result["has_meditation_hall"]
        if existing_tags.has_pool is None and ai_result.get("has_pool") is not None:
            existing_tags.has_pool = ai_result["has_pool"]
        if existing_tags.has_sauna_spa is None and ai_result.get("has_sauna_spa") is not None:
            existing_tags.has_sauna_spa = ai_result["has_sauna_spa"]
        if existing_tags.is_vegetarian is None and ai_result.get("is_vegetarian") is not None:
            existing_tags.is_vegetarian = ai_result["is_vegetarian"]
        if existing_tags.is_vegan_friendly is None and ai_result.get("is_vegan_friendly") is not None:
            existing_tags.is_vegan_friendly = ai_result["is_vegan_friendly"]
        if existing_tags.eco_friendly is None and ai_result.get("eco_friendly") is not None:
            existing_tags.eco_friendly = ai_result["eco_friendly"]

        # Compléter les listes vides
        if not existing_tags.setting and ai_result.get("setting"):
            existing_tags.setting = ai_result["setting"]
        if not existing_tags.style and ai_result.get("style"):
            existing_tags.style = ai_result["style"]

    except Exception as e:
        print(f"  [retreat_tag_extractor] Erreur IA pour {venue.id}: {e}")

    return existing_tags


def extract_all_retreat_tags(
    venues: List[RetreatVenueListing],
    existing_tags: Dict[str, RetreatVenueTags],
    use_ai: bool = False,
) -> List[RetreatVenueTags]:
    """Extrait les tags pour toutes les venues qui n'en ont pas encore.

    Args:
        venues: Liste des venues
        existing_tags: Tags déjà extraits (par listing_id)
        use_ai: Si True, utilise l'IA pour compléter les tags ambigus

    Returns:
        Liste des nouveaux tags
    """
    new_tags = []
    to_extract = [v for v in venues if v.id not in existing_tags]

    if not to_extract:
        print("  [retreat_tag_extractor] Aucune venue à traiter")
        return new_tags

    print(f"  [retreat_tag_extractor] Extraction de tags pour {len(to_extract)} venues...")

    for i, venue in enumerate(to_extract):
        print(f"  [retreat_tag_extractor] {i+1}/{len(to_extract)}: {venue.name[:60]}...")

        # Extraction directe depuis les données structurées
        tags = extract_tags_from_venue(venue)

        # Complétion IA optionnelle pour les cas ambigus
        if use_ai:
            tags = _ai_complete_tags(venue, tags)
            time.sleep(0.5)

        new_tags.append(tags)

    print(f"  [retreat_tag_extractor] Terminé: {len(new_tags)} tags extraits")
    return new_tags
