"""Évaluation IA des lieux de retraite via Claude Haiku.

Évalue chaque lieu sur 10 critères spécifiques aux besoins des organisateurs
de retraites, et produit un score global, un résumé, des points forts et des
points de vigilance.
"""

import json
import time
from typing import Optional, Dict, List

from scraper.retreat_scrapers.retreat_models import (
    RetreatVenueListing,
    RetreatVenueEvaluation,
    RetreatCriteriaScores,
)
from scraper.retreat_config import ANTHROPIC_API_KEY

try:
    import anthropic
except ImportError:
    anthropic = None


RETREAT_EVAL_SYSTEM = """Tu es un évaluateur expert de lieux de retraite pour organisateurs de stages (yoga, méditation, bien-être, développement personnel).
Tu évalues la qualité et l'adéquation des lieux de manière objective, du point de vue d'un organisateur qui cherche un lieu pour accueillir un groupe.
Réponds TOUJOURS en français et UNIQUEMENT en JSON valide."""


RETREAT_EVAL_PROMPT = """Évalue ce lieu de retraite pour des organisateurs de stages bien-être.

LIEU:
Nom: {name}
Source: {source}
Pays: {country} | Région: {region} | Ville: {city}
Capacité: {capacity_min}-{capacity_max} personnes
Chambres: {num_rooms} | Lits: {num_beds}
Hébergement: {accommodation_types}
Espaces de pratique: {activity_spaces} ({num_practice_spaces} espaces, {main_practice_space_m2}m²)
Espaces extérieurs: {outdoor_spaces}
Restauration: {meal_service} | Cuisine: {cuisine_options}
Prix/nuit/pers: {price_ppn} {currency} | Location exclusive/jour: {price_full}
Services: {services}
Adapté pour: {suitable_for}
Cadre: {setting} | Style: {style}
Note: {rating}/5 ({rating_count} avis)
Site web: {website}
Email: {email}

Description:
{description}

Réponds UNIQUEMENT en JSON valide:
{{
    "overall_score": <0-100>,
    "match_summary": "<résumé factuel de 2-3 phrases sur ce que ce lieu offre aux organisateurs>",
    "criteria_scores": {{
        "practice_spaces_quality": <0-10>,
        "accommodation_quality": <0-10>,
        "capacity_flexibility": <0-10>,
        "dining_quality": <0-10>,
        "natural_setting": <0-10>,
        "value_for_money": <0-10>,
        "accessibility_transport": <0-10>,
        "organizer_services": <0-10>,
        "atmosphere_vibe": <0-10>,
        "data_completeness": <0-10>
    }},
    "highlights": ["<point fort 1>", "<point fort 2>", "<point fort 3>"],
    "concerns": ["<point de vigilance 1>", "<point de vigilance 2>"],
    "best_for": ["<type de retraite idéal 1>", "<type 2>"]
}}

BARÈME DES CRITÈRES (0-10 chacun):

1. practice_spaces_quality: Qualité et diversité des espaces de pratique
   - 8-10: Plusieurs espaces dédiés, bonne taille, sol adapté, lumière naturelle
   - 5-7: Un espace de pratique correct
   - 0-4: Pas d'espace dédié ou info manquante

2. accommodation_quality: Qualité de l'hébergement
   - 8-10: Chambres privées, SDB privées, literie de qualité
   - 5-7: Mix privé/partagé, confort correct
   - 0-4: Basique, dortoirs, sanitaires partagés limités

3. capacity_flexibility: Flexibilité de capacité
   - 8-10: Large gamme (10-30+), location exclusive possible, adaptable
   - 5-7: Capacité moyenne, quelques options
   - 0-4: Très limité ou info manquante

4. dining_quality: Qualité de la restauration
   - 8-10: Pension complète, options diététiques, cuisine pro
   - 5-7: Demi-pension ou cuisine à disposition
   - 0-4: Pas de service repas

5. natural_setting: Cadre naturel et environnement
   - 8-10: Lieu exceptionnel, nature préservée, vue, calme
   - 5-7: Cadre agréable, quelques espaces verts
   - 0-4: Urbain ou cadre quelconque

6. value_for_money: Rapport qualité-prix
   - 8-10: Excellent rapport (< 60€/nuit/pers avec repas)
   - 5-7: Correct (60-100€/nuit/pers)
   - 0-4: Cher (> 100€/nuit/pers) ou prix non communiqué

7. accessibility_transport: Accessibilité et transport
   - 8-10: Aéroport < 1h, navette proposée, bon réseau
   - 5-7: Aéroport < 2h, accès en voiture
   - 0-4: Difficile d'accès

8. organizer_services: Services pour organisateurs
   - 8-10: Aide logistique complète, équipements fournis, staff dédié
   - 5-7: Quelques services
   - 0-4: Autonomie totale requise

9. atmosphere_vibe: Ambiance et atmosphère
   - 8-10: Lieu inspirant, témoignages positifs, expérience unique
   - 5-7: Ambiance agréable
   - 0-4: Ambiance non décrite ou neutre

10. data_completeness: Complétude des informations
    - 8-10: Presque tous les champs remplis, photos, contact, prix clairs
    - 5-7: Informations correctes mais lacunes
    - 0-4: Très peu d'informations"""


def evaluate_retreat_venue(venue: RetreatVenueListing) -> Optional[RetreatVenueEvaluation]:
    """Évalue un lieu de retraite via Claude Haiku."""
    if not anthropic or not ANTHROPIC_API_KEY:
        print("  [retreat_evaluator] API Anthropic non disponible, évaluation ignorée")
        return None

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompt = RETREAT_EVAL_PROMPT.format(
        name=venue.name,
        source=venue.source,
        country=venue.country or "Non spécifié",
        region=venue.region or "Non spécifié",
        city=venue.city or "Non spécifié",
        capacity_min=venue.capacity_min or "?",
        capacity_max=venue.capacity_max or "?",
        num_rooms=venue.num_rooms or "?",
        num_beds=venue.num_beds or "?",
        accommodation_types=", ".join(venue.accommodation_types) or "Non spécifié",
        activity_spaces=", ".join(venue.activity_spaces) or "Non spécifié",
        num_practice_spaces=venue.num_practice_spaces or "?",
        main_practice_space_m2=venue.main_practice_space_m2 or "?",
        outdoor_spaces=", ".join(venue.outdoor_spaces) or "Non spécifié",
        meal_service=venue.meal_service or "Non spécifié",
        cuisine_options=", ".join(venue.cuisine_options) or "Non spécifié",
        price_ppn=venue.price_per_person_per_night or "?",
        currency=venue.currency or "",
        price_full=venue.price_full_venue_per_day or "?",
        services=", ".join(venue.services) or "Non spécifié",
        suitable_for=", ".join(venue.suitable_for) or "Non spécifié",
        setting=", ".join(venue.setting) or "Non spécifié",
        style=", ".join(venue.style) or "Non spécifié",
        rating=venue.rating_average or "?",
        rating_count=venue.rating_count or 0,
        website=venue.website or "Non disponible",
        email=venue.contact_email or "Non disponible",
        description=venue.description[:3000],
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=RETREAT_EVAL_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()

        # Gérer les blocs markdown
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        result = json.loads(text)

        criteria = result.get("criteria_scores", {})

        return RetreatVenueEvaluation(
            listing_id=venue.id,
            overall_score=max(0, min(100, result["overall_score"])),
            match_summary=result["match_summary"],
            criteria_scores=RetreatCriteriaScores(
                practice_spaces_quality=max(0, min(10, criteria.get("practice_spaces_quality", 0))),
                accommodation_quality=max(0, min(10, criteria.get("accommodation_quality", 0))),
                capacity_flexibility=max(0, min(10, criteria.get("capacity_flexibility", 0))),
                dining_quality=max(0, min(10, criteria.get("dining_quality", 0))),
                natural_setting=max(0, min(10, criteria.get("natural_setting", 0))),
                value_for_money=max(0, min(10, criteria.get("value_for_money", 0))),
                accessibility_transport=max(0, min(10, criteria.get("accessibility_transport", 0))),
                organizer_services=max(0, min(10, criteria.get("organizer_services", 0))),
                atmosphere_vibe=max(0, min(10, criteria.get("atmosphere_vibe", 0))),
                data_completeness=max(0, min(10, criteria.get("data_completeness", 0))),
            ),
            highlights=result.get("highlights", []),
            concerns=result.get("concerns", []),
            best_for=result.get("best_for", []),
        )

    except json.JSONDecodeError as e:
        print(f"  [retreat_evaluator] Erreur JSON pour {venue.id}: {e}")
        return None
    except Exception as e:
        print(f"  [retreat_evaluator] Erreur pour {venue.id}: {e}")
        return None


def evaluate_all_retreat_venues(
    venues: List[RetreatVenueListing],
    existing_evaluations: Dict[str, RetreatVenueEvaluation],
) -> List[RetreatVenueEvaluation]:
    """Évalue toutes les venues qui n'ont pas encore d'évaluation.

    Returns:
        Liste des nouvelles évaluations
    """
    new_evaluations = []
    to_evaluate = [v for v in venues if v.id not in existing_evaluations]

    if not to_evaluate:
        print("  [retreat_evaluator] Aucune nouvelle venue à évaluer")
        return new_evaluations

    print(f"  [retreat_evaluator] Évaluation de {len(to_evaluate)} venues...")

    for i, venue in enumerate(to_evaluate):
        print(f"  [retreat_evaluator] {i+1}/{len(to_evaluate)}: {venue.name[:60]}...")
        evaluation = evaluate_retreat_venue(venue)
        if evaluation:
            new_evaluations.append(evaluation)
            print(f"    Score: {evaluation.overall_score}/100 - {evaluation.match_summary[:80]}...")
        else:
            print(f"    Ignoré (évaluation échouée)")

        # Rate limiting
        if i < len(to_evaluate) - 1:
            time.sleep(1)

    print(f"  [retreat_evaluator] Terminé: {len(new_evaluations)} évaluations")
    return new_evaluations
