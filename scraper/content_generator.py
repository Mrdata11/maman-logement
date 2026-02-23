"""Generate personalized AI titles and descriptions for listings using Claude API."""

import json
import time
from typing import Optional, Dict, List
from scraper.models import Listing, Evaluation
from scraper.config import ANTHROPIC_API_KEY

try:
    import anthropic
except ImportError:
    anthropic = None


CONTENT_GENERATION_SYSTEM = """Tu es un rédacteur expert qui aide une personne à trouver son habitat groupé idéal en Belgique.
Tu rédiges des titres et descriptions personnalisés pour des annonces de logement communautaire.

Le contexte: une femme cherche un habitat groupé en Belgique avec une communauté mature, des valeurs de partage et de bienveillance, des projets communs (potager, cuisine, activités), et idéalement proche de Bruxelles. Elle pratique la biodanza et cherche un lieu de vie communautaire chaleureux.

Ton style:
- Direct et informatif, pas de marketing excessif
- Tu parles à la personne qui cherche: qu'est-ce qui est pertinent pour ELLE dans cette offre?
- Tu mets en avant les aspects concrets: taille du groupe, type de vie communautaire, localisation, prix, type de logement
- Tu mentionnes honnêtement les limites ou informations manquantes
- Le titre doit être court (max 80 caractères), clair et distinctif
- La description doit faire 2-3 phrases maximum, aller à l'essentiel

Réponds TOUJOURS en JSON valide, sans aucun texte avant ou après."""


CONTENT_GENERATION_PROMPT = """Génère un titre personnalisé et une description courte et percutante pour cette annonce.

ANNONCE ORIGINALE:
Titre original: {title}
Source: {source}
Lieu: {location}
Province: {province}
Prix: {price}
Type: {listing_type}
Date de publication: {date_published}
Description:
{description}

{evaluation_context}

Réponds UNIQUEMENT en JSON valide:
{{
    "ai_title": "<titre personnalisé, max 80 caractères, qui décrit clairement l'offre>",
    "ai_description": "<description de 2-3 phrases qui parle directement à la personne. Qu'est-ce qui rend ce lieu unique? Quels sont les points forts et limites essentiels?>"
}}

RÈGLES POUR LE TITRE:
- Court et descriptif (max 80 caractères)
- Inclure le lieu si connu
- Inclure la taille du groupe ou le type de communauté si mentionné
- Style cohérent: "[Type de lieu] à [Lieu] - [caractéristique clé]"
- Si le titre original est déjà bon et informatif, garde-le ou adapte-le légèrement
- Pas de majuscules excessives, pas d'emojis

RÈGLES POUR LA DESCRIPTION:
- 2-3 phrases maximum
- Parler directement à la personne ("Tu trouveras ici...", "Ce lieu propose...")
- Mentionner les aspects concrets: nombre de personnes, activités, espaces partagés, prix
- Être honnête sur les limites (info manquante, communauté en création, etc.)
- Ne pas répéter le titre"""


def generate_content(listing: Listing, evaluation: Optional[Evaluation] = None) -> Optional[dict]:
    """Generate AI title and description for a single listing."""
    if not anthropic or not ANTHROPIC_API_KEY:
        print("  [content_generator] Anthropic API not available, skipping")
        return None

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    evaluation_context = ""
    if evaluation:
        evaluation_context = f"""ÉVALUATION IA EXISTANTE:
Score: {evaluation.overall_score}/100
Résumé: {evaluation.match_summary}
Points forts: {', '.join(evaluation.highlights)}
Points négatifs: {', '.join(evaluation.concerns)}"""

    prompt = CONTENT_GENERATION_PROMPT.format(
        title=listing.title,
        source=listing.source,
        location=listing.location or "Non spécifié",
        province=listing.province or "Non spécifié",
        price=listing.price or "Non spécifié",
        listing_type=listing.listing_type or "Non spécifié",
        date_published=listing.date_published or "Non spécifié",
        description=listing.description[:3000],
        evaluation_context=evaluation_context,
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=CONTENT_GENERATION_SYSTEM,
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
        return {
            "ai_title": result.get("ai_title", ""),
            "ai_description": result.get("ai_description", ""),
        }

    except json.JSONDecodeError as e:
        print(f"  [content_generator] JSON parse error for {listing.id}: {e}")
        return None
    except Exception as e:
        print(f"  [content_generator] Error for {listing.id}: {e}")
        return None


def generate_all_content(
    listings: List[Listing],
    evaluations: Dict[str, Evaluation],
) -> Dict[str, dict]:
    """Generate AI content for listings that don't have it yet.

    Returns a dict mapping listing_id -> {"ai_title": ..., "ai_description": ...}
    """
    results = {}
    to_generate = [
        l for l in listings
        if l.id in evaluations and not evaluations[l.id].ai_title
    ]

    if not to_generate:
        print("  [content_generator] No new listings to generate content for")
        return results

    print(f"  [content_generator] Generating content for {len(to_generate)} listings...")

    for i, listing in enumerate(to_generate):
        print(f"  [content_generator] {i+1}/{len(to_generate)}: {listing.title[:60]}...")
        evaluation = evaluations.get(listing.id)
        content = generate_content(listing, evaluation)
        if content:
            results[listing.id] = content
            print(f"    Title: {content['ai_title'][:60]}...")
        else:
            print(f"    Skipped (generation failed)")

        # Rate limiting
        if i < len(to_generate) - 1:
            time.sleep(0.5)

    print(f"  [content_generator] Completed: {len(results)} content generations")
    return results
