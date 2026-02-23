import re
import hashlib
from datetime import datetime
from typing import Optional, List
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing


class ICOrgScraper(BaseScraper):
    name = "ic.org"
    base_url = "https://www.ic.org"
    search_url = "https://www.ic.org/directory/"

    def scrape(self) -> List[Listing]:
        listings = []

        # Search for Belgian communities
        params = {
            "search": "1",
            "property_country[]": "Belgium",
            "lang": "en",
        }
        print(f"  [{self.name}] Searching for Belgian communities...")

        try:
            resp = self._rate_limited_get(self.search_url, params=params)
        except Exception as e:
            print(f"  [{self.name}] Error searching: {e}")
            return listings

        soup = BeautifulSoup(resp.text, "lxml")

        # Find community links - they link to /directory/community-name/
        community_links = []
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if "/directory/" in href and href != self.search_url:
                # Filter out non-community links
                path = href.rstrip("/").split("/directory/")[-1]
                if path and "/" not in path and path not in ("search", "map", "submit"):
                    full_url = href if href.startswith("http") else self.base_url + href
                    if full_url not in community_links:
                        community_links.append(full_url)

        print(f"  [{self.name}] Found {len(community_links)} community pages")

        for url in community_links:
            listing = self._scrape_community(url)
            if listing:
                listings.append(listing)

        print(f"  [{self.name}] Total: {len(listings)} communities scraped")
        return listings

    def _scrape_community(self, url: str) -> Optional[Listing]:
        try:
            resp = self._rate_limited_get(url)
        except Exception as e:
            print(f"  [{self.name}] Error fetching {url}: {e}")
            return None

        soup = BeautifulSoup(resp.text, "lxml")

        title_el = soup.select_one("h1, .entry-title")
        title = title_el.get_text(strip=True) if title_el else "Unknown Community"

        # Get the main content
        content_el = soup.select_one(".entry-content, article, main")
        if content_el:
            for tag in content_el.find_all(["script", "style", "nav"]):
                tag.decompose()
            description = content_el.get_text(separator="\n", strip=True)
        else:
            description = ""

        # Extract location
        location = None
        address_el = soup.find(string=re.compile(r"Belgium", re.IGNORECASE))
        if address_el:
            parent = address_el.parent
            if parent:
                location = parent.get_text(strip=True)

        # Extract images
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
            province=None,
            listing_type="community-profile",
            images=images[:5],
            date_scraped=datetime.utcnow().isoformat(),
        )
