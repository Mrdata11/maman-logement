"""Extraction de contacts depuis les sites web des lieux de retraite.

Pour les venues qui ont un site web mais pas d'email :
- Fetch homepage, /contact, /about
- Extrait emails via regex + mailto:
- Extrait téléphones via regex international
- Extrait URLs Instagram/Facebook
- Fallback : génère des patterns génériques (info@, contact@)
- Fallback optionnel : Claude Haiku pour les pages complexes
"""

import re
import time
from typing import Optional
from urllib.parse import urljoin, urlparse

import requests

from scraper.retreat_scrapers.retreat_models import RetreatVenueListing
from scraper.retreat_config import ANTHROPIC_API_KEY, USER_AGENT, REQUEST_TIMEOUT

try:
    import anthropic
except ImportError:
    anthropic = None


# === Regex patterns ===

EMAIL_REGEX = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
    re.IGNORECASE,
)

# Patterns de téléphone internationaux (FR, ES, PT, IT, GR, MA, etc.)
PHONE_PATTERNS = [
    re.compile(r"\+?\d{1,3}[\s\-.]?\(?\d{1,4}\)?[\s\-.]?\d{2,4}[\s\-.]?\d{2,4}[\s\-.]?\d{0,4}"),
]

# Patterns de réseaux sociaux
INSTAGRAM_REGEX = re.compile(
    r"(?:https?://)?(?:www\.)?instagram\.com/([a-zA-Z0-9_.]+)",
    re.IGNORECASE,
)
FACEBOOK_REGEX = re.compile(
    r"(?:https?://)?(?:www\.)?facebook\.com/([a-zA-Z0-9.]+)",
    re.IGNORECASE,
)

# Emails à ignorer (génériques des plateformes, pas des venues)
IGNORE_EMAIL_DOMAINS = {
    "bookyogaretreats.com",
    "retreat.guru",
    "google.com",
    "facebook.com",
    "instagram.com",
    "tripadvisor.com",
    "booking.com",
    "airbnb.com",
    "sentry.io",
    "cloudflare.com",
    "wixpress.com",
    "squarespace.com",
    "wordpress.org",
}

# Pages à essayer sur le site web du lieu
CONTACT_PATHS = [
    "/",
    "/contact",
    "/contact-us",
    "/contactez-nous",
    "/kontakt",
    "/contacto",
    "/about",
    "/about-us",
    "/a-propos",
    "/qui-sommes-nous",
]


def _is_valid_email(email: str) -> bool:
    """Vérifie qu'un email est valide et n'est pas un email de plateforme."""
    if not email or "@" not in email:
        return False
    domain = email.split("@")[1].lower()
    if domain in IGNORE_EMAIL_DOMAINS:
        return False
    # Ignorer les emails avec des extensions de fichiers
    if any(email.endswith(ext) for ext in [".png", ".jpg", ".svg", ".gif", ".css", ".js"]):
        return False
    return True


def _is_valid_phone(phone: str) -> bool:
    """Vérifie qu'un numéro de téléphone est valide."""
    digits = re.sub(r"[^\d]", "", phone)
    return 8 <= len(digits) <= 15


def _fetch_page(url: str, session: requests.Session) -> Optional[str]:
    """Récupère le contenu HTML d'une page."""
    try:
        response = session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.text
    except Exception:
        return None


def _extract_emails_from_html(html: str) -> list[str]:
    """Extrait les emails depuis le HTML."""
    emails = set()

    # Mailto links
    from bs4 import BeautifulSoup
    try:
        soup = BeautifulSoup(html, "lxml")
        for a in soup.select("a[href^='mailto:']"):
            email = a["href"].replace("mailto:", "").split("?")[0].strip()
            if _is_valid_email(email):
                emails.add(email.lower())
    except Exception:
        pass

    # Regex dans le texte brut
    for match in EMAIL_REGEX.finditer(html):
        email = match.group(0)
        if _is_valid_email(email):
            emails.add(email.lower())

    return list(emails)


def _extract_phones_from_html(html: str) -> list[str]:
    """Extrait les téléphones depuis le HTML."""
    phones = set()

    # Tel: links
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")
        for a in soup.select("a[href^='tel:']"):
            phone = a["href"].replace("tel:", "").strip()
            if _is_valid_phone(phone):
                phones.add(phone)
    except Exception:
        pass

    # Regex dans le texte
    for pattern in PHONE_PATTERNS:
        for match in pattern.finditer(html):
            phone = match.group(0).strip()
            if _is_valid_phone(phone):
                phones.add(phone)

    return list(phones)


def _extract_social_from_html(html: str) -> dict[str, Optional[str]]:
    """Extrait les liens Instagram et Facebook."""
    social: dict[str, Optional[str]] = {
        "instagram": None,
        "facebook": None,
    }

    ig_match = INSTAGRAM_REGEX.search(html)
    if ig_match:
        handle = ig_match.group(1)
        if handle not in ("p", "reel", "stories", "explore"):
            social["instagram"] = f"https://instagram.com/{handle}"

    fb_match = FACEBOOK_REGEX.search(html)
    if fb_match:
        handle = fb_match.group(1)
        if handle not in ("sharer", "share", "dialog", "plugins"):
            social["facebook"] = f"https://facebook.com/{handle}"

    return social


def _extract_contact_person_from_html(html: str) -> dict[str, Optional[str]]:
    """Tente d'extraire le nom et le rôle d'une personne de contact."""
    result: dict[str, Optional[str]] = {"name": None, "role": None}

    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")

        # Chercher dans les sections "about", "team", "contact"
        for section in soup.select(".team, .about, .contact, [class*='team'], [class*='owner']"):
            # Chercher un nom (souvent dans un h2, h3, strong)
            name_el = section.select_one("h2, h3, h4, strong, .name, [class*='name']")
            if name_el:
                name = name_el.get_text(strip=True)
                # Vérifier que ça ressemble à un nom (2+ mots, pas trop long)
                if 2 <= len(name.split()) <= 4 and len(name) < 50:
                    result["name"] = name

            # Chercher un rôle
            role_el = section.select_one(".role, .title, .position, [class*='role'], [class*='position']")
            if role_el:
                result["role"] = role_el.get_text(strip=True)

            if result["name"]:
                break
    except Exception:
        pass

    return result


def _try_ai_extraction(html: str, venue_name: str) -> dict:
    """Utilise Claude Haiku pour extraire les contacts des pages complexes."""
    if not anthropic or not ANTHROPIC_API_KEY:
        return {}

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    # Tronquer le HTML à 4000 caractères
    from bs4 import BeautifulSoup
    try:
        soup = BeautifulSoup(html, "lxml")
        text = soup.get_text(separator=" ", strip=True)[:4000]
    except Exception:
        text = html[:4000]

    prompt = f"""Extrait les informations de contact de ce texte provenant du site web de "{venue_name}".

TEXTE:
{text}

Réponds UNIQUEMENT en JSON valide:
{{
    "email": "<email ou null>",
    "phone": "<téléphone ou null>",
    "contact_name": "<nom du contact ou null>",
    "contact_role": "<rôle du contact ou null>",
    "instagram": "<URL Instagram ou null>",
    "facebook": "<URL Facebook ou null>"
}}

Règles:
- Ne retourne que des informations explicitement présentes dans le texte
- Ignore les emails de plateformes (booking.com, airbnb, etc.)
- Pour le téléphone, inclus l'indicatif pays si disponible"""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )
        import json
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
        return json.loads(text)
    except Exception:
        return {}


def extract_contacts_for_venue(
    venue: RetreatVenueListing, use_ai: bool = False
) -> dict:
    """Extrait les contacts pour une venue donnée.

    Retourne un dict avec les champs à mettre à jour sur la venue.
    """
    result: dict = {
        "contact_extraction_status": "pending",
    }

    # Si on a déjà un email, pas besoin d'extraire
    if venue.contact_email and venue.website:
        result["contact_extraction_status"] = "not_needed"
        return result

    if not venue.website:
        result["contact_extraction_status"] = "failed"
        return result

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    base_url = venue.website.rstrip("/")
    all_emails: list[str] = []
    all_phones: list[str] = []
    all_social: dict[str, Optional[str]] = {"instagram": None, "facebook": None}
    contact_person: dict[str, Optional[str]] = {"name": None, "role": None}

    # Explorer les pages du site
    for path in CONTACT_PATHS:
        url = urljoin(base_url + "/", path.lstrip("/"))
        html = _fetch_page(url, session)
        if not html:
            continue

        emails = _extract_emails_from_html(html)
        all_emails.extend(e for e in emails if e not in all_emails)

        phones = _extract_phones_from_html(html)
        all_phones.extend(p for p in phones if p not in all_phones)

        social = _extract_social_from_html(html)
        if social["instagram"] and not all_social["instagram"]:
            all_social["instagram"] = social["instagram"]
        if social["facebook"] and not all_social["facebook"]:
            all_social["facebook"] = social["facebook"]

        person = _extract_contact_person_from_html(html)
        if person["name"] and not contact_person["name"]:
            contact_person = person

        # Si on a trouvé un email, pas besoin de continuer
        if all_emails:
            break

        time.sleep(0.5)

    # Fallback AI si pas d'email trouvé et AI activé
    if not all_emails and use_ai:
        html = _fetch_page(base_url, session)
        if html:
            ai_result = _try_ai_extraction(html, venue.name)
            if ai_result.get("email") and _is_valid_email(ai_result["email"]):
                all_emails.append(ai_result["email"])
            if ai_result.get("phone") and not all_phones:
                all_phones.append(ai_result["phone"])
            if ai_result.get("contact_name") and not contact_person["name"]:
                contact_person["name"] = ai_result["contact_name"]
                contact_person["role"] = ai_result.get("contact_role")
            if ai_result.get("instagram") and not all_social["instagram"]:
                all_social["instagram"] = ai_result["instagram"]
            if ai_result.get("facebook") and not all_social["facebook"]:
                all_social["facebook"] = ai_result["facebook"]

    # Fallback : générer des patterns génériques
    if not all_emails:
        domain = extract_domain_from_website(venue.website)
        if domain:
            # Générer des candidats probables
            result["_candidate_emails"] = [
                f"info@{domain}",
                f"contact@{domain}",
                f"hello@{domain}",
                f"booking@{domain}",
            ]

    # Construire le résultat
    if all_emails:
        result["contact_email"] = all_emails[0]
        result["contact_extraction_status"] = "extracted"
    else:
        result["contact_extraction_status"] = "failed"

    if all_phones and not venue.contact_phone:
        result["contact_phone"] = all_phones[0]

    if contact_person["name"]:
        result["contact_person_name"] = contact_person["name"]
        result["contact_person_role"] = contact_person["role"]

    if all_social["instagram"]:
        result["social_instagram"] = all_social["instagram"]
    if all_social["facebook"]:
        result["social_facebook"] = all_social["facebook"]

    return result


def extract_domain_from_website(website: Optional[str]) -> Optional[str]:
    """Extrait le domaine depuis l'URL du site web."""
    if not website:
        return None
    try:
        parsed = urlparse(website)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        return domain or None
    except Exception:
        return None


def extract_contacts(
    venues: list[RetreatVenueListing],
    use_ai: bool = False,
) -> dict[str, dict]:
    """Extrait les contacts pour toutes les venues qui en ont besoin.

    Args:
        venues: Liste des venues
        use_ai: Si True, utilise Claude Haiku comme fallback

    Returns:
        Dict mapping venue_id → champs à mettre à jour
    """
    results: dict[str, dict] = {}

    to_extract = [
        v for v in venues
        if v.website and not v.contact_email
        and v.contact_extraction_status not in ("extracted", "not_needed")
    ]

    if not to_extract:
        print("  [contact_extractor] Aucune venue à traiter")
        return results

    print(f"  [contact_extractor] Extraction de contacts pour {len(to_extract)} venues...")

    for i, venue in enumerate(to_extract):
        print(f"  [contact_extractor] {i+1}/{len(to_extract)}: {venue.name[:50]}...")
        try:
            contact_data = extract_contacts_for_venue(venue, use_ai=use_ai)
            results[venue.id] = contact_data
            status = contact_data.get("contact_extraction_status", "?")
            email = contact_data.get("contact_email", "-")
            print(f"    Status: {status}, Email: {email}")
        except Exception as e:
            print(f"    Erreur: {e}")
            results[venue.id] = {"contact_extraction_status": "failed"}

        # Rate limiting
        if i < len(to_extract) - 1:
            time.sleep(1)

    extracted = sum(1 for r in results.values() if r.get("contact_extraction_status") == "extracted")
    print(f"  [contact_extractor] Terminé: {extracted}/{len(to_extract)} contacts extraits")
    return results
