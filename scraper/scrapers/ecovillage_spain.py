"""Scraper for ecovillage.org Spanish ecovillages.

Reuses the same pattern as ecovillage.py (Belgium) but for Spain.
Only keeps ecovillages located near the Camino de Santiago routes.
"""

import re
import hashlib
from datetime import datetime
from typing import List, Optional
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing
from scraper.config import CAMINO_PROVINCES_ES


# Locations on/near the Camino de Santiago (used for filtering)
CAMINO_LOCATIONS = {
    "Pamplona": "Navarra", "Burgos": "Burgos", "León": "León",
    "Santiago": "Galicia", "Salamanca": "Salamanca",
    "Navarra": "Navarra", "Galicia": "Galicia",
    "Asturias": "Asturias", "Cantabria": "Cantabria",
    "La Rioja": "La Rioja", "Basque": "País Vasco",
    "Lugo": "Galicia", "Ponferrada": "León",
    "Oviedo": "Asturias", "Santander": "Cantabria",
    "Bilbao": "País Vasco", "San Sebastián": "País Vasco",
    "Huesca": "Aragón", "Jaca": "Aragón",
    "Zamora": "Castilla y León",
}

# Locations NOT on the Camino - reject these
NON_CAMINO = {
    "tenerife", "canarias", "canary", "barcelona", "cataluña", "catalonia",
    "andalucía", "andalusia", "málaga", "malaga", "granada", "sevilla",
    "seville", "cádiz", "cadiz", "almería", "almeria", "murcia",
    "valencia", "alicante", "southern spain", "salobreña",
}


class EcovillageSpainScraper(BaseScraper):
    """Scrapes ecovillage.org for Spanish ecovillages near Camino de Santiago."""

    name = "ecovillage.org/spain"
    base_url = "https://ecovillage.org"
    spain_url = "https://ecovillage.org/gen_country/spain/"

    def scrape(self) -> List[Listing]:
        listings = []

        print(f"  [{self.name}] Fetching Spanish ecovillages...")

        try:
            resp = self._rate_limited_get(self.spain_url)
        except Exception as e:
            print(f"  [{self.name}] Error: {e}")
            return listings

        soup = BeautifulSoup(resp.text, "lxml")

        # Find ecovillage links on the Spain page
        ecovillage_links = []
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if "ecovillage.org" in href and "/ecovillage/" in href:
                if href not in ecovillage_links:
                    ecovillage_links.append(href)

        # Also check article/entry links
        for article in soup.select("article a[href], .entry a[href], .post a[href]"):
            href = article.get("href", "")
            if href and href.startswith("http") and href not in ecovillage_links:
                if "ecovillage.org" in href and href != self.spain_url:
                    ecovillage_links.append(href)

        print(f"  [{self.name}] Found {len(ecovillage_links)} ecovillage links")

        for url in ecovillage_links[:30]:
            listing = self._scrape_ecovillage(url)
            if listing:
                listings.append(listing)

        print(f"  [{self.name}] Total: {len(listings)} entries scraped")
        return listings

    def _scrape_ecovillage(self, url: str) -> Optional[Listing]:
        try:
            resp = self._rate_limited_get(url)
        except Exception as e:
            print(f"  [{self.name}] Error fetching {url}: {e}")
            return None

        soup = BeautifulSoup(resp.text, "lxml")

        # Title: use only the h1 text content, not children
        title_el = soup.select_one("h1.entry-title, h1")
        title = ""
        if title_el:
            # Get only the direct text of h1, not nested elements
            title = title_el.find(string=True, recursive=False)
            if not title:
                title = title_el.get_text(strip=True)
            title = title.strip()
        if not title or title == "Unknown":
            return None

        # Content: skip breadcrumbs and navigation
        content_el = soup.select_one(".entry-content, article, main")
        description = ""
        if content_el:
            for tag in content_el.find_all(["script", "style", "nav"]):
                tag.decompose()
            # Remove breadcrumb text
            for bc in content_el.select(".breadcrumb, .breadcrumbs, [class*='crumb']"):
                bc.decompose()
            description = content_el.get_text(separator="\n", strip=True)

        # Clean breadcrumb remnants from beginning
        if description.startswith("You are here"):
            lines = description.split("\n")
            # Skip lines until we find actual content (after breadcrumb)
            start_idx = 0
            for i, line in enumerate(lines):
                stripped = line.strip()
                if stripped and stripped not in ("You are here:", "Home", "/", "Ecovillages", title) and len(stripped) > 20:
                    start_idx = i
                    break
            description = "\n".join(lines[start_idx:])

        if len(description) < 50:
            return None

        # Extract location and filter by Camino proximity
        location = self._extract_location(description, title)
        if not location:
            return None  # Not on the Camino, skip

        # Determine language
        original_language = "en"
        spanish_words = ["proyecto", "comunidad", "vivienda", "huerta", "sostenible", "convivencia"]
        if sum(1 for w in spanish_words if w in description.lower()) >= 2:
            original_language = "es"

        images = []
        if content_el:
            for img in content_el.find_all("img", src=True):
                src = img["src"]
                if src.startswith("http") and "logo" not in src.lower():
                    images.append(src)

        return Listing(
            source=self.name,
            source_url=url,
            title=title,
            description=description[:5000],
            location=location,
            listing_type="ecovillage",
            country="ES",
            original_language=original_language,
            images=images[:5],
            date_scraped=datetime.utcnow().isoformat(),
        )

    def _extract_location(self, text: str, title: str) -> Optional[str]:
        """Extract location from text. Returns None if not on the Camino."""
        combined = f"{title} {text}".lower()

        # First check: reject if clearly NOT on the Camino
        for non_camino in NON_CAMINO:
            if non_camino in combined:
                return None

        # Then check: accept if on the Camino
        for city, region in CAMINO_LOCATIONS.items():
            if city.lower() in combined:
                return f"{city}, {region}"

        # No Camino match found - skip this listing
        return None
