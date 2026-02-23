import json
import time
from typing import Optional, Dict, List
from scraper.models import Listing, Evaluation
from scraper.config import ANTHROPIC_API_KEY

try:
    import anthropic
except ImportError:
    anthropic = None


QUALITY_SYSTEM_PROMPT = """Tu es un évaluateur expert en habitat collaboratif en Europe (cohousing, écovillages, habitat participatif, coopératives d'habitation).
Tu évalues la qualité et la complétude des annonces de manière objective et neutre — sans biais vers un profil d'utilisateur spécifique.
Réponds TOUJOURS en français."""

QUALITY_EVALUATION_PROMPT = """Évalue la qualité et la complétude de cette annonce d'habitat collaboratif.

ANNONCE:
Titre: {title}
Source: {source}
Lieu: {location}
Pays: {country}
Province/Région: {province}
Prix: {price}
Type: {listing_type}
Date de publication: {date_published}
Description:
{description}

URL: {source_url}

Réponds UNIQUEMENT en JSON valide (pas de texte avant ou après):
{{
    "quality_score": <nombre entier de 0 à 100>,
    "quality_summary": "<résumé objectif de 2-3 phrases décrivant ce que propose ce projet>",
    "highlights": ["<point fort objectif 1>", "<point fort 2>"],
    "concerns": ["<faiblesse ou info manquante 1>", "<faiblesse 2>"],
    "availability_status": "<likely_available | possibly_expired | unknown>",
    "data_quality_score": <0-10>
}}

BARÈME DE QUALITÉ (quality_score):
- 80-100: Description détaillée, localisation précise, prix indiqué, contact disponible, projet actif et bien documenté
- 60-79: Bonne qualité mais manque un élément clé (prix OU contact OU localisation précise)
- 40-59: Information modérée, on comprend le projet mais il manque des détails importants
- 20-39: Description vague ou très minimale
- 0-19: Quasi pas d'information utile

RÈGLES:
- Évalue de manière objective la richesse informationnelle de l'annonce
- Un bon score = annonce complète et utile pour TOUT chercheur d'habitat collaboratif
- Pénalise les annonces vagues, incomplètes, ou manifestement obsolètes
- Valorise: description détaillée du projet, vie communautaire décrite, espaces partagés, gouvernance, valeurs, prix clair, contact
- Le quality_summary doit être factuel et neutre (pas de "match pour vous" ou "correspond à vos critères")

DISPONIBILITÉ (availability_status):
- "likely_available": annonce récente (< 6 mois), langage actif, contact fourni
- "possibly_expired": annonce ancienne (> 12 mois), langage passé, projet semble complet
- "unknown": impossible à déterminer

QUALITÉ DES DONNÉES (data_quality_score, 0-10):
- 0-3: description vague, pas de prix, pas de contact, pas de détails concrets
- 4-6: description correcte mais manque des infos importantes
- 7-10: description détaillée, prix indiqué, contact disponible, localisation précise"""


def evaluate_listing(listing: Listing) -> Optional[Evaluation]:
    if not anthropic or not ANTHROPIC_API_KEY:
        print("  [evaluator] Anthropic API not available, skipping evaluation")
        return None

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompt = QUALITY_EVALUATION_PROMPT.format(
        title=listing.title,
        source=listing.source,
        location=listing.location or "Non spécifié",
        country=listing.country or "Non spécifié",
        province=listing.province or "Non spécifié",
        price=listing.price or "Non spécifié",
        listing_type=listing.listing_type or "Non spécifié",
        date_published=listing.date_published or "Non spécifié",
        description=listing.description[:3000],
        source_url=listing.source_url,
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=QUALITY_SYSTEM_PROMPT,
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

        return Evaluation(
            listing_id=listing.id,
            quality_score=max(0, min(100, result["quality_score"])),
            quality_summary=result["quality_summary"],
            highlights=result.get("highlights", []),
            concerns=result.get("concerns", []),
            availability_status=result.get("availability_status", "unknown"),
            data_quality_score=max(0, min(10, result.get("data_quality_score", 5))),
        )

    except json.JSONDecodeError as e:
        print(f"  [evaluator] JSON parse error for {listing.id}: {e}")
        print(f"  [evaluator] Raw response: {text[:200]}")
        return None
    except Exception as e:
        print(f"  [evaluator] Error evaluating {listing.id}: {e}")
        return None


def evaluate_all(
    listings: List[Listing],
    existing_evaluations: Dict[str, Evaluation],
) -> List[Evaluation]:
    new_evaluations = []
    to_evaluate = [l for l in listings if l.id not in existing_evaluations]

    if not to_evaluate:
        print("  [evaluator] No new listings to evaluate")
        return new_evaluations

    print(f"  [evaluator] Evaluating {len(to_evaluate)} new listings...")

    for i, listing in enumerate(to_evaluate):
        print(f"  [evaluator] {i+1}/{len(to_evaluate)}: {listing.title[:60]}...")
        evaluation = evaluate_listing(listing)
        if evaluation:
            new_evaluations.append(evaluation)
            print(f"    Score: {evaluation.quality_score}/100 - {evaluation.quality_summary[:80]}...")
        else:
            print(f"    Skipped (evaluation failed)")

        # Rate limiting
        if i < len(to_evaluate) - 1:
            time.sleep(1)

    print(f"  [evaluator] Completed: {len(new_evaluations)} evaluations")
    return new_evaluations
