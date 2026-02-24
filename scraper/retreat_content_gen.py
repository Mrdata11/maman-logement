"""Génération de contenu IA pour les lieux de retraite via Claude Haiku.

Produit un titre et une description en français, optimisés pour les
organisateurs de retraites qui cherchent un lieu.
"""

import json
import time
from typing import Optional, Dict, List

from scraper.retreat_scrapers.retreat_models import (
    RetreatVenueListing,
    RetreatVenueEvaluation,
)
from scraper.retreat_config import ANTHROPIC_API_KEY

try:
    import anthropic
except ImportError:
    anthropic = None


RETREAT_CONTENT_SYSTEM = """Tu es un rédacteur spécialisé dans les lieux de retraite bien-être en Europe et dans le monde.
Tu rédiges des titres et descriptions en français, clairs et informatifs, destinés à des organisateurs de stages (yoga, méditation, etc.) qui cherchent un lieu.

Ton style:
- Direct et informatif, pas de marketing excessif
- Factuel et neutre — pas de "vous" ni d'adresse directe
- Mettre en avant les aspects concrets: capacité, espaces de pratique, cadre, services, prix
- Mentionner honnêtement les limites ou informations manquantes
- Le titre doit être court (max 80 caractères), clair et distinctif
- La description doit faire 2-3 phrases maximum

Réponds TOUJOURS en JSON valide, sans aucun texte avant ou après."""


RETREAT_CONTENT_PROMPT = """Génère un titre et une description en français pour ce lieu de retraite.

LIEU:
Nom original: {name}
Source: {source}
Pays: {country} | Région: {region} | Ville: {city}
Capacité: {capacity_min}-{capacity_max} personnes
Espaces de pratique: {activity_spaces}
Restauration: {meal_service}
Prix: {price} {currency}/nuit/pers
Cadre: {setting} | Style: {style}
Services: {services}
Adapté pour: {suitable_for}

Description originale:
{description}

{evaluation_context}

Réponds UNIQUEMENT en JSON valide:
{{
    "ai_title": "<titre en français, max 80 caractères>",
    "ai_description": "<description en français, 2-3 phrases, factuelle>"
}}

RÈGLES POUR LE TITRE:
- Court et descriptif (max 80 caractères)
- Inclure le lieu si connu (ville ou région)
- Inclure la capacité ou le type de lieu si pertinent
- Style: "[Type/Style] à [Lieu] — [caractéristique clé]"
- Pas de majuscules excessives

RÈGLES POUR LA DESCRIPTION:
- 2-3 phrases maximum
- Style factuel: "Ce lieu propose...", "Situé en..."
- Mentionner: capacité, espaces de pratique, cadre, restauration, prix si dispo
- Être honnête sur les limites (info manquante, etc.)
- Ne pas répéter le titre"""


def generate_retreat_content(
    venue: RetreatVenueListing,
    evaluation: Optional[RetreatVenueEvaluation] = None,
) -> Optional[dict]:
    """Génère un titre et une description IA pour un lieu de retraite."""
    if not anthropic or not ANTHROPIC_API_KEY:
        print("  [retreat_content_gen] API Anthropic non disponible, génération ignorée")
        return None

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    evaluation_context = ""
    if evaluation:
        evaluation_context = f"""ÉVALUATION EXISTANTE:
Score: {evaluation.overall_score}/100
Résumé: {evaluation.match_summary}
Points forts: {', '.join(evaluation.highlights)}
Préoccupations: {', '.join(evaluation.concerns)}
Idéal pour: {', '.join(evaluation.best_for)}"""

    prompt = RETREAT_CONTENT_PROMPT.format(
        name=venue.name,
        source=venue.source,
        country=venue.country or "?",
        region=venue.region or "?",
        city=venue.city or "?",
        capacity_min=venue.capacity_min or "?",
        capacity_max=venue.capacity_max or "?",
        activity_spaces=", ".join(venue.activity_spaces) or "Non spécifié",
        meal_service=venue.meal_service or "Non spécifié",
        price=venue.price_per_person_per_night or "?",
        currency=venue.currency or "EUR",
        setting=", ".join(venue.setting) or "Non spécifié",
        style=", ".join(venue.style) or "Non spécifié",
        services=", ".join(venue.services) or "Non spécifié",
        suitable_for=", ".join(venue.suitable_for) or "Non spécifié",
        description=venue.description[:3000],
        evaluation_context=evaluation_context,
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=RETREAT_CONTENT_SYSTEM,
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
        return {
            "ai_title": result.get("ai_title", ""),
            "ai_description": result.get("ai_description", ""),
        }

    except json.JSONDecodeError as e:
        print(f"  [retreat_content_gen] Erreur JSON pour {venue.id}: {e}")
        return None
    except Exception as e:
        print(f"  [retreat_content_gen] Erreur pour {venue.id}: {e}")
        return None


def generate_all_retreat_content(
    venues: List[RetreatVenueListing],
    evaluations: Dict[str, RetreatVenueEvaluation],
) -> Dict[str, dict]:
    """Génère le contenu IA pour les venues qui n'en ont pas encore.

    Returns:
        Dict mapping venue_id → {"ai_title": ..., "ai_description": ...}
    """
    results: Dict[str, dict] = {}
    to_generate = [
        v for v in venues
        if v.id in evaluations and not evaluations[v.id].ai_title
    ]

    if not to_generate:
        print("  [retreat_content_gen] Aucune venue à traiter")
        return results

    print(f"  [retreat_content_gen] Génération de contenu pour {len(to_generate)} venues...")

    for i, venue in enumerate(to_generate):
        print(f"  [retreat_content_gen] {i+1}/{len(to_generate)}: {venue.name[:60]}...")
        evaluation = evaluations.get(venue.id)
        content = generate_retreat_content(venue, evaluation)
        if content:
            results[venue.id] = content
            print(f"    Titre: {content['ai_title'][:60]}...")
        else:
            print(f"    Ignoré (génération échouée)")

        # Rate limiting
        if i < len(to_generate) - 1:
            time.sleep(0.5)

    print(f"  [retreat_content_gen] Terminé: {len(results)} contenus générés")
    return results
