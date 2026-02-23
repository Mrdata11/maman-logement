"""AI evaluator for Brussels apartment listings."""

import json
import time
from typing import Optional, Dict, List
from scraper.models import ApartmentListing, ApartmentEvaluation, ApartmentCriteriaScore
from scraper.config import ANTHROPIC_API_KEY, APARTMENT_CRITERIA_PROMPT

try:
    import anthropic
except ImportError:
    anthropic = None


APARTMENT_EVAL_TEMPLATE = """Évalue cette annonce d'appartement par rapport aux critères de recherche.

ANNONCE:
Titre: {title}
Commune: {commune}
Code postal: {postal_code}
Prix mensuel: {price}
Charges: {charges}
Chambres: {bedrooms}
Salles de bain: {bathrooms}
Surface: {surface}
Étage: {floor}
Ascenseur: {elevator}
PEB: {peb}
Meublé: {furnished}
Balcon: {balcony}
Terrasse: {terrace}
Jardin: {garden}
Parking: {parking}
Cave: {cellar}
Disponible: {available_from}
Agence: {agency}

Description:
{description}

URL: {source_url}

Réponds UNIQUEMENT en JSON valide (pas de texte avant ou après) avec cette structure exacte:
{{
    "overall_score": <nombre entier de 0 à 100>,
    "match_summary": "<résumé de 2-3 phrases en français expliquant la pertinence>",
    "criteria_scores": {{
        "price_budget": <0-10>,
        "bedroom_count": <0-10>,
        "proximity_ixelles": <0-10>,
        "surface_area": <0-10>,
        "condition_energy": <0-10>,
        "amenities": <0-10>,
        "transport_access": <0-10>,
        "value_for_money": <0-10>
    }},
    "highlights": ["<point fort 1 en français>", "<point fort 2>"],
    "concerns": ["<point négatif ou info manquante 1>", "<point négatif 2>"]
}}

RÈGLES D'ÉVALUATION:
- Si l'appartement a moins de 2 chambres, score global < 20 et bedroom_count = 0
- Prix idéal: 800-1300 EUR/mois → 8-10, 1300-1500 → 5-7, >1500 → 2-4, >1800 → 0-1
- Proximité Ixelles: Ixelles/Etterbeek → 9-10, Saint-Gilles/Auderghem/Forest → 7-8, autres Bruxelles → 4-6
- Surface: >80m² → 9-10, 70-80 → 7-8, 60-70 → 5-6, <60 → 2-4
- PEB A-B → 9-10, C → 7-8, D → 5-6, E → 3-4, F-G → 1-2
- Sois objectif: un score > 70 = très bon match, > 50 = correct, < 30 = peu adapté"""


def _fmt(val, suffix="") -> str:
    if val is None:
        return "Non spécifié"
    return f"{val}{suffix}"


def _fmt_bool(val) -> str:
    if val is None:
        return "Non spécifié"
    return "Oui" if val else "Non"


def evaluate_apartment(listing: ApartmentListing) -> Optional[ApartmentEvaluation]:
    if not anthropic or not ANTHROPIC_API_KEY:
        print("  [apt-evaluator] Anthropic API not available, skipping")
        return None

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    price_str = _fmt(listing.price_monthly, " EUR/mois")
    charges_str = _fmt(listing.charges_monthly, " EUR/mois")

    prompt = APARTMENT_EVAL_TEMPLATE.format(
        title=listing.title,
        commune=listing.commune or "Non spécifié",
        postal_code=listing.postal_code or "Non spécifié",
        price=price_str,
        charges=charges_str,
        bedrooms=_fmt(listing.bedrooms),
        bathrooms=_fmt(listing.bathrooms),
        surface=_fmt(listing.surface_m2, " m²"),
        floor=_fmt(listing.floor),
        elevator=_fmt_bool(listing.has_elevator),
        peb=listing.peb_rating or "Non spécifié",
        furnished=_fmt_bool(listing.furnished),
        balcony=_fmt_bool(listing.has_balcony),
        terrace=_fmt_bool(listing.has_terrace),
        garden=_fmt_bool(listing.has_garden),
        parking=_fmt_bool(listing.has_parking),
        cellar=_fmt_bool(listing.has_cellar),
        available_from=listing.available_from or "Non spécifié",
        agency=listing.agency_name or "Non spécifié",
        description=(listing.description[:3000] if listing.description else "Pas de description"),
        source_url=listing.source_url,
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=APARTMENT_CRITERIA_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()

        # Handle markdown code blocks
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        result = json.loads(text)

        return ApartmentEvaluation(
            listing_id=listing.id,
            overall_score=max(0, min(100, result["overall_score"])),
            match_summary=result["match_summary"],
            criteria_scores=ApartmentCriteriaScore(**result["criteria_scores"]),
            highlights=result.get("highlights", []),
            concerns=result.get("concerns", []),
        )

    except json.JSONDecodeError as e:
        print(f"  [apt-evaluator] JSON parse error for {listing.id}: {e}")
        return None
    except Exception as e:
        print(f"  [apt-evaluator] Error evaluating {listing.id}: {e}")
        return None


def evaluate_all_apartments(
    listings: List[ApartmentListing],
    existing_evaluations: Dict[str, ApartmentEvaluation],
) -> List[ApartmentEvaluation]:
    new_evaluations = []
    to_evaluate = [l for l in listings if l.id not in existing_evaluations]

    if not to_evaluate:
        print("  [apt-evaluator] No new listings to evaluate")
        return new_evaluations

    print(f"  [apt-evaluator] Evaluating {len(to_evaluate)} new apartments...")

    for i, listing in enumerate(to_evaluate):
        commune = listing.commune or "?"
        price = f"{listing.price_monthly}€" if listing.price_monthly else "?"
        print(f"  [apt-evaluator] {i+1}/{len(to_evaluate)}: {commune} - {listing.bedrooms}ch - {price}")

        evaluation = evaluate_apartment(listing)
        if evaluation:
            new_evaluations.append(evaluation)
            print(f"    Score: {evaluation.overall_score}/100 - {evaluation.match_summary[:80]}...")
        else:
            print(f"    Skipped (evaluation failed)")

        if i < len(to_evaluate) - 1:
            time.sleep(0.5)

    print(f"  [apt-evaluator] Completed: {len(new_evaluations)} evaluations")
    return new_evaluations
