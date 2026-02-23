import re
import hashlib
from datetime import datetime
from typing import Optional, List
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing


class EcovillageScraper(BaseScraper):
    """Scrapes ecovillage.org for Belgian ecovillages."""

    name = "ecovillage.org"
    base_url = "https://ecovillage.org"
    belgium_url = "https://ecovillage.org/gen_country/belgium/"

    def scrape(self) -> List[Listing]:
        listings = []

        print(f"  [{self.name}] Fetching Belgian ecovillages...")

        try:
            resp = self._rate_limited_get(self.belgium_url)
        except Exception as e:
            print(f"  [{self.name}] Error: {e}")
            return listings

        soup = BeautifulSoup(resp.text, "lxml")

        # Find ecovillage links on the Belgium page
        ecovillage_links = []
        for link in soup.find_all("a", href=True):
            href = link["href"]
            # Look for links to individual ecovillage pages
            if "ecovillage.org" in href and "/project/" in href:
                if href not in ecovillage_links:
                    ecovillage_links.append(href)

        # Also look for any article/entry links
        for article in soup.select("article a[href], .entry a[href], .post a[href]"):
            href = article.get("href", "")
            if href and href.startswith("http") and href not in ecovillage_links:
                if "ecovillage.org" in href and href != self.belgium_url:
                    ecovillage_links.append(href)

        print(f"  [{self.name}] Found {len(ecovillage_links)} ecovillage links")

        for url in ecovillage_links[:20]:  # Limit to avoid too many requests
            listing = self._scrape_ecovillage(url)
            if listing:
                listings.append(listing)

        # Also try to scrape the Belgium page content directly
        # as it may contain inline community descriptions
        content = soup.get_text(separator="\n", strip=True)
        if len(listings) == 0 and len(content) > 200:
            # Create a single listing from the Belgium overview page
            listings.append(Listing(
                id=hashlib.md5(self.belgium_url.encode()).hexdigest()[:12],
                source=self.name,
                source_url=self.belgium_url,
                title="Ecovillages in Belgium - GEN Overview",
                description=content[:5000],
                location="Belgium",
                listing_type="directory",
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
            location="Belgium",
            listing_type="ecovillage",
            images=images[:5],
            date_scraped=datetime.utcnow().isoformat(),
        )
