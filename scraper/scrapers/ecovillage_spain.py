"""Scraper for ecovillage.org Spanish ecovillages.

Reuses the same pattern as ecovillage.py (Belgium) but for Spain.
"""

import re
import hashlib
from datetime import datetime
from typing import List, Optional
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing
from scraper.config import CAMINO_PROVINCES_ES


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

        # If no individual listings, create from overview page
        if not listings:
            content = soup.get_text(separator="\n", strip=True)
            if len(content) > 200:
                listings.append(Listing(
                    source=self.name,
                    source_url=self.spain_url,
                    title="Ecovillages in Spain - GEN Overview",
                    description=content[:5000],
                    location="Spain",
                    listing_type="directory",
                    country="ES",
                    original_language="en",
                    date_scraped=datetime.utcnow().isoformat(),
                ))

        print(f"  [{self.name}] Total: {len(listings)} entries scraped")
        return listings

    def _scrape_ecovillage(self, url: str) -> Optional[Listing]:
        try:
            resp = self._rate_limited_get(url)
        except Exception as e:
            print(f"  [{self.name}] Error fetching {url}: {e}")
            return None

        soup = BeautifulSoup(resp.text, "lxml")

        title_el = soup.select_one("h1, .entry-title")
        title = title_el.get_text(strip=True) if title_el else "Unknown"

        content_el = soup.select_one(".entry-content, article, main")
        description = ""
        if content_el:
            for tag in content_el.find_all(["script", "style"]):
                tag.decompose()
            description = content_el.get_text(separator="\n", strip=True)

        if len(description) < 50:
            return None

        # Try to extract location
        location = self._extract_location(description, title)

        # Determine language (ecovillage.org is in English but projects may describe in Spanish)
        original_language = "en"
        # Simple heuristic: if lots of Spanish words, it's Spanish
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
        """Try to extract location from text."""
        combined = f"{title} {text}"

        # Look for known Camino regions/cities
        camino_locations = {
            "Pamplona": "Navarra", "Burgos": "Burgos", "León": "León",
            "Santiago": "Galicia", "Salamanca": "Salamanca",
            "Navarra": "Navarra", "Galicia": "Galicia",
            "Asturias": "Asturias", "Cantabria": "Cantabria",
            "La Rioja": "La Rioja", "Basque": "País Vasco",
            "Tenerife": "Canarias", "Barcelona": "Barcelona",
            "Southern Spain": "Andalucía", "Salobreña": "Granada",
        }

        for city, region in camino_locations.items():
            if city.lower() in combined.lower():
                return f"{city}, {region}"

        # Generic "Spain" fallback
        return "Spain"
