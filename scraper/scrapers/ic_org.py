import re
import hashlib
from datetime import datetime
from typing import Optional, List
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing


# Country names in various languages for text matching
TARGET_COUNTRIES = {
    "Belgium": "BE", "Belgique": "BE", "Belgie": "BE",
    "France": "FR",
    "Spain": "ES", "Espana": "ES", "Espagne": "ES",
    "Portugal": "PT",
    "Netherlands": "NL", "Nederland": "NL", "Pays-Bas": "NL",
    "Switzerland": "CH", "Suisse": "CH", "Schweiz": "CH",
    "Luxembourg": "LU",
}

COUNTRY_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in TARGET_COUNTRIES.keys()) + r")\b",
    re.IGNORECASE,
)

COUNTRY_LANGUAGES = {
    "BE": "fr", "FR": "fr", "ES": "es", "PT": "pt",
    "NL": "nl", "CH": "fr", "LU": "fr",
}


class ICOrgScraper(BaseScraper):
    name = "ic.org"
    base_url = "https://www.ic.org"
    search_url = "https://www.ic.org/directory/"

    def scrape(self) -> List[Listing]:
        listings = []

        print(f"  [{self.name}] Fetching directory page...")

        try:
            resp = self._rate_limited_get(self.search_url)
        except Exception as e:
            print(f"  [{self.name}] Error: {e}")
            return listings

        soup = BeautifulSoup(resp.text, "lxml")

        # Find all community links - /directory/community-name/
        community_links = []
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if "/directory/" in href and href != self.search_url:
                path = href.rstrip("/").split("/directory/")[-1]
                skip = {"search", "map", "submit", "intentional-communities-by-country",
                        "new-communities", "forming-communities", "established-communities"}
                if path and "/" not in path and path not in skip:
                    full_url = href if href.startswith("http") else self.base_url + href
                    if full_url not in community_links:
                        community_links.append(full_url)

        print(f"  [{self.name}] Found {len(community_links)} community pages, checking for European ones...")

        # Visit each page and check if it's in a target country
        for url in community_links:
            listing = self._scrape_community(url)
            if listing:
                listings.append(listing)

        print(f"  [{self.name}] Total: {len(listings)} European communities found")
        return listings

    def _scrape_community(self, url: str) -> Optional[Listing]:
        try:
            resp = self._rate_limited_get(url)
        except Exception as e:
            print(f"  [{self.name}] Error fetching {url}: {e}")
            return None

        soup = BeautifulSoup(resp.text, "lxml")
        page_text = soup.get_text()

        # Check if any target country is mentioned
        match = COUNTRY_PATTERN.search(page_text)
        if not match:
            return None

        country_name = match.group(1)
        # Find the matching country code (case-insensitive)
        country_code = None
        for name, code in TARGET_COUNTRIES.items():
            if name.lower() == country_name.lower():
                country_code = code
                break
        if not country_code:
            return None

        title_el = soup.select_one("h1, .entry-title")
        title = title_el.get_text(strip=True) if title_el else "Unknown Community"

        content_el = soup.select_one(".entry-content, article, main")
        if content_el:
            for tag in content_el.find_all(["script", "style", "nav"]):
                tag.decompose()
            description = content_el.get_text(separator="\n", strip=True)
        else:
            description = ""

        # Extract location from address mentioning the country
        location = None
        for el in soup.find_all(string=COUNTRY_PATTERN):
            parent = el.parent
            if parent:
                addr_text = parent.get_text(strip=True)
                if len(addr_text) < 200:
                    location = addr_text
                    break

        images = []
        if content_el:
            for img in content_el.find_all("img", src=True):
                src = img["src"]
                if src.startswith("http") and "logo" not in src.lower():
                    images.append(src)

        print(f"  [{self.name}] Found {country_code} community: {title[:50]}")

        return Listing(
            id=hashlib.md5(url.encode()).hexdigest()[:12],
            source=self.name,
            source_url=url,
            title=title,
            description=description[:5000],
            location=location,
            province=None,
            listing_type="community-profile",
            country=country_code,
            original_language=COUNTRY_LANGUAGES.get(country_code, "en"),
            images=images[:5],
            date_scraped=datetime.utcnow().isoformat(),
        )
