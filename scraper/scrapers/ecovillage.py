"""Scraper for ecovillage.org - Global Ecovillage Network directory.

Scrapes ecovillage pages for all target countries in Europe.
"""

import re
import hashlib
from datetime import datetime
from typing import Optional, List
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing


# Country pages on ecovillage.org and their metadata
COUNTRY_PAGES = {
    "belgium": {"country": "BE", "default_lang": "fr"},
    "france": {"country": "FR", "default_lang": "fr"},
    "spain": {"country": "ES", "default_lang": "es"},
    "portugal": {"country": "PT", "default_lang": "pt"},
    "netherlands": {"country": "NL", "default_lang": "nl"},
    "switzerland": {"country": "CH", "default_lang": "fr"},
    "luxembourg": {"country": "LU", "default_lang": "fr"},
}

# Language detection keywords
LANG_KEYWORDS = {
    "es": ["proyecto", "comunidad", "vivienda", "huerta", "sostenible", "convivencia", "aldea"],
    "pt": ["projeto", "comunidade", "habitacao", "sustentavel", "aldeia", "convivencia"],
    "nl": ["project", "gemeenschap", "woongemeenschap", "duurzaam", "samenhuizen"],
    "fr": ["projet", "communaute", "habitat", "ecologique", "ecovillage", "collectif"],
}


class EcovillageOrgScraper(BaseScraper):
    """Scrapes ecovillage.org for ecovillages across European target countries."""

    name = "ecovillage.org"
    base_url = "https://ecovillage.org"

    def scrape(self) -> List[Listing]:
        listings = []

        for country_slug, meta in COUNTRY_PAGES.items():
            print(f"  [{self.name}] Fetching {country_slug} ecovillages...")
            country_listings = self._scrape_country(country_slug, meta)
            listings.extend(country_listings)
            print(f"  [{self.name}] {country_slug}: {len(country_listings)} entries")

        print(f"  [{self.name}] Total: {len(listings)} entries scraped")
        return listings

    def _scrape_country(self, country_slug: str, meta: dict) -> List[Listing]:
        listings = []
        country_url = f"{self.base_url}/gen_country/{country_slug}/"

        try:
            resp = self._rate_limited_get(country_url)
        except Exception as e:
            print(f"  [{self.name}] Error fetching {country_slug}: {e}")
            return listings

        soup = BeautifulSoup(resp.text, "lxml")

        # Find ecovillage links on the country page
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
                if "ecovillage.org" in href and href != country_url:
                    ecovillage_links.append(href)

        for url in ecovillage_links[:30]:
            listing = self._scrape_ecovillage(url, meta)
            if listing:
                listings.append(listing)

        return listings

    def _scrape_ecovillage(self, url: str, meta: dict) -> Optional[Listing]:
        try:
            resp = self._rate_limited_get(url)
        except Exception as e:
            print(f"  [{self.name}] Error fetching {url}: {e}")
            return None

        soup = BeautifulSoup(resp.text, "lxml")

        # Title
        title_el = soup.select_one("h1.entry-title, h1")
        title = ""
        if title_el:
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
            for bc in content_el.select(".breadcrumb, .breadcrumbs, [class*='crumb']"):
                bc.decompose()
            description = content_el.get_text(separator="\n", strip=True)

        # Clean breadcrumb remnants from beginning
        if description.startswith("You are here"):
            lines = description.split("\n")
            start_idx = 0
            for i, line in enumerate(lines):
                stripped = line.strip()
                if stripped and stripped not in ("You are here:", "Home", "/", "Ecovillages", title) and len(stripped) > 20:
                    start_idx = i
                    break
            description = "\n".join(lines[start_idx:])

        if len(description) < 50:
            return None

        # Determine language
        original_language = self._detect_language(description, meta["default_lang"])

        # Try to extract location from description
        location = self._extract_location(description, title)

        images = []
        if content_el:
            for img in content_el.find_all("img", src=True):
                src = img["src"]
                if src.startswith("http") and "logo" not in src.lower():
                    images.append(src)

        return Listing(
            id=hashlib.md5(url.encode()).hexdigest()[:12],
            source=self.name,
            source_url=url,
            title=title,
            description=description[:5000],
            location=location,
            listing_type="ecovillage",
            country=meta["country"],
            original_language=original_language,
            images=images[:5],
            date_scraped=datetime.utcnow().isoformat(),
        )

    def _detect_language(self, text: str, default: str) -> str:
        """Detect language from text content."""
        text_lower = text.lower()
        scores = {}
        for lang, keywords in LANG_KEYWORDS.items():
            scores[lang] = sum(1 for w in keywords if w in text_lower)
        best = max(scores, key=scores.get)
        if scores[best] >= 2:
            return best
        return default

    def _extract_location(self, text: str, title: str) -> Optional[str]:
        """Try to extract a location from text."""
        combined = f"{title} {text[:500]}"
        # Look for common location patterns
        loc_match = re.search(
            r"(?:located?\s+in|situated?\s+in|based?\s+in|village\s+of|near|proche\s+de|situe\s+a|ubicad[oa]\s+en)\s+([A-Z][a-zA-Z\s-]{2,30})",
            combined
        )
        if loc_match:
            return loc_match.group(1).strip()
        return None
