"""Translate non-French listing content to French using Claude API."""

import asyncio
from typing import List, Dict
from scraper.models import Listing
from scraper.config import ANTHROPIC_API_KEY

try:
    import anthropic
except ImportError:
    anthropic = None


TRANSLATION_SYSTEM = """Tu es un traducteur professionnel. Tu traduis des annonces d'habitat participatif/cohousing en français.

RÈGLES:
- Traduis fidèlement le contenu sans résumer ni reformuler
- Conserve les noms propres (villes, régions, noms de projets) dans la langue d'origine
- Les prix restent en euros, ne convertis rien
- Garde le même ton et style que l'original
- Retourne UNIQUEMENT un JSON avec deux clés: "title" et "description"
- Ne retourne aucun commentaire ni explication en dehors du JSON"""

TRANSLATION_PROMPT = """Traduis cette annonce de {source_lang} vers le français.

TITRE ORIGINAL:
{title}

DESCRIPTION ORIGINALE:
{description}

Retourne un JSON: {{"title": "titre traduit", "description": "description traduite"}}"""


async def _translate_one_async(client, listing: Listing) -> tuple:
    """Translate one listing asynchronously. Returns (listing_id, translated_title, translated_desc) or (listing_id, None, None)."""
    if not listing.description or len(listing.description.strip()) < 20:
        return (listing.id, None, None)

    lang_names = {"es": "l'espagnol", "en": "l'anglais", "nl": "le néerlandais"}
    source_lang = lang_names.get(listing.original_language, listing.original_language)

    prompt = TRANSLATION_PROMPT.format(
        source_lang=source_lang,
        title=listing.title,
        description=listing.description,
    )

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            system=TRANSLATION_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )

        import json
        text = response.content[0].text.strip()
        # Extract JSON from response (handle markdown code blocks)
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(text)

        translated_title = result.get("title", listing.title)
        translated_desc = result.get("description", "")

        if len(translated_desc) < len(listing.description) * 0.2:
            print(f"  [translator] WARNING: suspiciously short translation for {listing.id}, keeping original")
            return (listing.id, None, None)

        print(f"    {listing.id}: translated from {listing.original_language}")
        return (listing.id, translated_title, translated_desc)

    except Exception as e:
        print(f"  [translator] Error for {listing.id}: {e}")
        return (listing.id, None, None)


async def _translate_batch_async(listings: List[Listing], batch_size: int = 10) -> Dict[str, dict]:
    """Translate listings in concurrent batches using async API."""
    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    results = {}
    total = len(listings)

    for batch_start in range(0, total, batch_size):
        batch = listings[batch_start:batch_start + batch_size]
        batch_end = min(batch_start + batch_size, total)
        print(f"  [translator] Batch {batch_start+1}-{batch_end}/{total}...")

        tasks = [_translate_one_async(client, listing) for listing in batch]
        batch_results = await asyncio.gather(*tasks)

        for listing_id, title, desc in batch_results:
            if title and desc:
                results[listing_id] = {"title": title, "description": desc}

    return results


LANG_FLAGS = {"es": "🇪🇸", "en": "🇬🇧", "nl": "🇳🇱"}
LANG_NAMES = {"es": "l'espagnol", "en": "l'anglais", "nl": "le néerlandais"}


def translate_listings(listings: List[Listing]) -> Dict[str, dict]:
    """Translate non-French listings to French.

    Returns:
        Dict mapping listing_id -> {"title": str, "description": str}
        The description is prefixed with a flag + "Traduit de ..." indicator.
    """
    if not anthropic or not ANTHROPIC_API_KEY:
        print("  [translator] Anthropic API not available, skipping")
        return {}

    to_translate = [
        l for l in listings
        if l.original_language and l.original_language != "fr"
    ]

    if not to_translate:
        print("  [translator] No listings need translation")
        return {}

    print(f"  [translator] Translating {len(to_translate)} listings (async batches of 10)...")

    results = asyncio.run(_translate_batch_async(to_translate, batch_size=10))

    # Prefix descriptions with language indicator
    for listing_id, content in results.items():
        listing = next((l for l in to_translate if l.id == listing_id), None)
        if listing and listing.original_language:
            flag = LANG_FLAGS.get(listing.original_language, "🌐")
            lang = LANG_NAMES.get(listing.original_language, listing.original_language)
            content["description"] = f"{flag} Traduit de {lang}\n\n{content['description']}"

    print(f"  [translator] Completed: {len(results)} listings translated")
    return results
