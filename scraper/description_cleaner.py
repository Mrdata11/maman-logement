"""Clean listing descriptions using Claude LLM to remove web page garbage."""

import asyncio
import json
import time
from typing import Optional, List, Dict
from scraper.models import Listing
from scraper.config import ANTHROPIC_API_KEY

try:
    import anthropic
except ImportError:
    anthropic = None


CLEANING_SYSTEM = """Tu es un assistant spécialisé dans le nettoyage de textes d'annonces immobilières extraites de sites web.

Ton rôle est de nettoyer la description d'une annonce en SUPPRIMANT tous les éléments parasites issus de la page web, tout en PRÉSERVANT fidèlement le contenu réel de l'annonce.

ÉLÉMENTS À SUPPRIMER:
- Boutons de partage social (Facebook, Twitter, LinkedIn, WhatsApp, etc.)
- "Partager cette page sur vos réseaux"
- Section commentaires d'autres utilisateurs (noms, dates, messages de commentaires)
- "Réagir à cette annonce", "Un commentaire", "X commentaires"
- "Connectez-vous pour répondre"
- Invitations à se connecter ("Vous devez être connecté pour...")
- "Se connecter maintenant !"
- Boutons de signalement ("Signaler que cette annonce est inapproprié", "Signalement", etc.)
- "Aidez-nous à améliorer le site..."
- "Remarque : JavaScript est requis pour ce contenu"
- Messages système du site web (cookies, RGPD, etc.)
- Répétition du titre dans le pied de page ("Page : [titre]")
- Navigation du site (menus, fil d'Ariane, liens retour)
- Virgules parasites isolées sur une ligne
- Texte de formulaires web (champs de saisie, boutons submit)
- En-têtes ou pieds de page du site
- Compteurs de commentaires, vues, likes
- Texte lié aux catégories/tags du site ("Publié dans...", "Catégorie: ...")

ÉLÉMENTS À PRÉSERVER:
- Tout le texte de l'annonce elle-même (description du lieu, projet, personnes, etc.)
- Les informations de contact mentionnées DANS l'annonce (email, téléphone)
- Les prix, surfaces, localisations
- Les descriptions des habitants/membres du projet
- Les valeurs et philosophie du projet
- Les URLs mentionnées par l'auteur de l'annonce
- Les emojis utilisés par l'auteur de l'annonce

RÈGLES:
- Ne modifie PAS le fond du texte, seulement la forme
- Ne résume PAS, ne reformule PAS le contenu de l'annonce
- Corrige les sauts de ligne excessifs (max 2 lignes vides consécutives)
- Si le titre de l'annonce est répété en tout début de description, supprime la répétition
- Garde le texte en langue originale (français, néerlandais, anglais...)
- Retourne UNIQUEMENT le texte nettoyé, sans aucun commentaire ni explication"""

CLEANING_PROMPT = """Nettoie cette description d'annonce en supprimant tous les éléments parasites de la page web.

TITRE DE L'ANNONCE: {title}

DESCRIPTION BRUTE:
{description}

Retourne UNIQUEMENT le texte nettoyé, sans aucune explication ni commentaire."""


def clean_description(listing: Listing) -> Optional[str]:
    """Clean a single listing description using Claude (sync)."""
    if not anthropic or not ANTHROPIC_API_KEY:
        print("  [description_cleaner] Anthropic API not available, skipping")
        return None

    if not listing.description or len(listing.description.strip()) < 50:
        return listing.description

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompt = CLEANING_PROMPT.format(
        title=listing.title,
        description=listing.description,
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            system=CLEANING_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )

        cleaned = response.content[0].text.strip()

        if len(cleaned) < len(listing.description) * 0.2:
            print(f"  [description_cleaner] WARNING: cleaned text suspiciously short for {listing.id} "
                  f"({len(cleaned)} vs {len(listing.description)} chars), keeping original")
            return None

        return cleaned

    except Exception as e:
        print(f"  [description_cleaner] Error for {listing.id}: {e}")
        return None


async def _clean_one_async(client, listing: Listing) -> tuple:
    """Clean one listing asynchronously. Returns (listing_id, cleaned_text or None)."""
    if not listing.description or len(listing.description.strip()) < 50:
        return (listing.id, listing.description)

    prompt = CLEANING_PROMPT.format(
        title=listing.title,
        description=listing.description,
    )

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            system=CLEANING_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )

        cleaned = response.content[0].text.strip()

        if len(cleaned) < len(listing.description) * 0.2:
            print(f"  [description_cleaner] WARNING: suspiciously short for {listing.id}, keeping original")
            return (listing.id, None)

        removed = len(listing.description) - len(cleaned)
        pct = (removed / len(listing.description)) * 100
        print(f"    {listing.id}: removed {removed} chars ({pct:.0f}%)")
        return (listing.id, cleaned)

    except Exception as e:
        print(f"  [description_cleaner] Error for {listing.id}: {e}")
        return (listing.id, None)


async def _clean_batch_async(listings: List[Listing], batch_size: int = 10) -> Dict[str, str]:
    """Clean listings in concurrent batches using async API."""
    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    results = {}
    total = len(listings)

    for batch_start in range(0, total, batch_size):
        batch = listings[batch_start:batch_start + batch_size]
        batch_end = min(batch_start + batch_size, total)
        print(f"  [description_cleaner] Batch {batch_start+1}-{batch_end}/{total}...")

        tasks = [_clean_one_async(client, listing) for listing in batch]
        batch_results = await asyncio.gather(*tasks)

        for listing_id, cleaned in batch_results:
            if cleaned:
                results[listing_id] = cleaned

    return results


def clean_all_descriptions(
    listings: List[Listing],
    force: bool = False,
) -> Dict[str, str]:
    """Clean descriptions for listings.

    Args:
        listings: List of listings to clean
        force: If True, clean all listings. If False, only clean listings
               that appear to have web garbage (heuristic detection).

    Returns:
        Dict mapping listing_id -> cleaned_description
    """
    if not anthropic or not ANTHROPIC_API_KEY:
        print("  [description_cleaner] Anthropic API not available, skipping all")
        return {}

    to_clean = []
    for listing in listings:
        if force or _has_web_garbage(listing.description):
            to_clean.append(listing)

    if not to_clean:
        print("  [description_cleaner] No descriptions need cleaning")
        return {}

    print(f"  [description_cleaner] Cleaning {len(to_clean)} descriptions (async batches of 10)...")

    results = asyncio.run(_clean_batch_async(to_clean, batch_size=10))

    print(f"  [description_cleaner] Completed: {len(results)} descriptions cleaned")
    return results


def _has_web_garbage(description: str) -> bool:
    """Heuristic to detect if a description likely contains web page garbage."""
    if not description:
        return False

    garbage_markers = [
        "Partager cette page",
        "Réagir à cette annonce",
        "Connectez-vous pour répondre",
        "Se connecter maintenant",
        "Signaler que cette annonce",
        "JavaScript est requis",
        "Vous devez être connecté",
        "Signalement\nPage",
        "\nFacebook\nTwitter\n",
        "Share on Facebook",
        "Share on Twitter",
        "Cookie",
        "Privacy Policy",
        "Leave a Reply",
        "Log in to reply",
    ]

    text_lower = description.lower()
    return any(marker.lower() in text_lower for marker in garbage_markers)
