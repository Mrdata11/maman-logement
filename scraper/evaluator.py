import json
import time
from typing import Optional, Dict, List
from scraper.models import Listing, Evaluation, CriteriaScore
from scraper.config import ANTHROPIC_API_KEY, CRITERIA_PROMPT

try:
    import anthropic
except ImportError:
    anthropic = None


EVALUATION_PROMPT_TEMPLATE = """Évalue cette annonce par rapport aux critères de recherche.

ANNONCE:
Titre: {title}
Source: {source}
Lieu: {location}
Province: {province}
Prix: {price}
Type: {listing_type}
Date de publication: {date_published}
Description:
{description}

URL: {source_url}

Réponds UNIQUEMENT en JSON valide (pas de texte avant ou après) avec cette structure exacte:
{{
    "overall_score": <nombre entier de 0 à 100>,
    "match_summary": "<résumé de 2-3 phrases en français expliquant la pertinence>",
    "criteria_scores": {{
        "community_size_and_maturity": <0-10>,
        "values_alignment": <0-10>,
        "common_projects": <0-10>,
        "large_hall_biodanza": <0-10>,
        "rental_price": <0-10>,
        "unit_type": <0-10>,
        "parking": <0-10>,
        "spiritual_alignment": <0-10>,
        "charter_openness": <0-10>,
        "community_meals": <0-10>,
        "location_brussels": <0-10>,
        "near_hospital": <0-10>
    }},
    "highlights": ["<point fort 1 en français>", "<point fort 2>"],
    "concerns": ["<point négatif ou info manquante 1>", "<point négatif 2>"],
    "availability_status": "<likely_available | possibly_expired | unknown>",
    "data_quality_score": <0-10>
}}

RÈGLES D'ÉVALUATION:
- Si l'annonce ne concerne PAS un habitat groupé/communautaire (simple colocation, appartement classique), score global < 20
- Si c'est une VENTE (pas location), score "rental_price" = 0 sauf si location aussi mentionnée
- Si des informations manquent pour un critère, score neutre (5/10) et mentionner dans concerns
- Le score global doit refléter la moyenne pondérée: critères primaires (poids 3x), secondaires (2x), tertiaires (1x)
- Sois exigeant: un score > 70 = très bon match, > 50 = potentiel intéressant, < 30 = peu pertinent

ÉVALUATION DE DISPONIBILITÉ (availability_status):
- "likely_available": annonce récente (< 6 mois), langage actif ("nous cherchons", "disponible"), contact fourni
- "possibly_expired": annonce ancienne (> 12 mois), langage passé ("nous avons cherché"), projet semble terminé ou complet
- "unknown": impossible à déterminer

SCORE QUALITÉ DES DONNÉES (data_quality_score, 0-10):
- 0-3: description vague, pas de prix, pas de contact, pas de détails concrets
- 4-6: description correcte mais manque des infos importantes (prix OU contact OU localisation précise)
- 7-10: description détaillée, prix indiqué, contact disponible, localisation précise, photos"""


def evaluate_listing(listing: Listing) -> Optional[Evaluation]:
    if not anthropic or not ANTHROPIC_API_KEY:
        print("  [evaluator] Anthropic API not available, skipping evaluation")
        return None

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompt = EVALUATION_PROMPT_TEMPLATE.format(
        title=listing.title,
        source=listing.source,
        location=listing.location or "Non spécifié",
        province=listing.province or "Non spécifié",
        price=listing.price or "Non spécifié",
        listing_type=listing.listing_type or "Non spécifié",
        date_published=listing.date_published or "Non spécifié",
        description=listing.description[:3000],
        source_url=listing.source_url,
    )

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=CRITERIA_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()

        # Handle potential markdown code blocks
        if text.startswith("```"):
            text = text.split("\n", 1)[1]  # Remove first line
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        result = json.loads(text)

        return Evaluation(
            listing_id=listing.id,
            overall_score=max(0, min(100, result["overall_score"])),
            match_summary=result["match_summary"],
            criteria_scores=CriteriaScore(**result["criteria_scores"]),
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
            print(f"    Score: {evaluation.overall_score}/100 - {evaluation.match_summary[:80]}...")
        else:
            print(f"    Skipped (evaluation failed)")

        # Rate limiting
        if i < len(to_evaluate) - 1:
            time.sleep(1)

    print(f"  [evaluator] Completed: {len(new_evaluations)} evaluations")
    return new_evaluations
