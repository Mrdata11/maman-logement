"""Scraper for ecovillageglobal.fr - French eco-habitat classifieds.

SPIP-based site. Scrapes all of France (no geographic filter).
"""

import re
import hashlib
from datetime import datetime
from typing import List, Optional
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing
from scraper.config import ALL_DEPARTMENTS_FR


# Rubrique IDs for habitat-related listings on ecovillageglobal.fr
HABITAT_RUBRIQUES = [
    55,   # Habitat Participatif
    115,  # Habitat groupe / ecolieux cherchent habitants
]


class EcovillageFRScraper(BaseScraper):
    """Scrapes ecovillageglobal.fr for French eco-habitat listings."""

    name = "ecovillageglobal.fr"
    base_url = "https://ecovillageglobal.fr"

    def scrape(self) -> List[Listing]:
        listings = []
        seen_urls = set()

        for rubrique_id in HABITAT_RUBRIQUES:
            print(f"  [{self.name}] Scraping rubrique {rubrique_id}...")
            new = self._scrape_rubrique(rubrique_id, seen_urls)
            listings.extend(new)

        print(f"  [{self.name}] Total: {len(listings)} listings scraped")
        return listings

    def _scrape_rubrique(self, rubrique_id: int, seen_urls: set) -> List[Listing]:
        listings = []
        max_pages = 15

        for page in range(max_pages):
            debut = page * 5  # SPIP pagination uses debut=N (offset)
            url = f"{self.base_url}/spip.php?page=annonces&id_rubrique={rubrique_id}&debut={debut}"

            try:
                resp = self._rate_limited_get(url)
            except Exception as e:
                print(f"  [{self.name}] Error fetching page {page}: {e}")
                break

            soup = BeautifulSoup(resp.text, "lxml")

            # Find listing links (SPIP articles)
            article_links = []
            for link in soup.find_all("a", href=True):
                href = link["href"]
                # SPIP article URLs: /article123 or spip.php?article123
                if re.search(r"/\d+$", href) or "article" in href:
                    if href.startswith("http"):
                        full_url = href
                    elif href.startswith("/"):
                        full_url = self.base_url + href
                    else:
                        full_url = self.base_url + "/" + href
                    if full_url not in seen_urls and full_url not in article_links:
                        article_links.append(full_url)

            # Also look for "Lire la suite" links
            for link in soup.find_all("a", string=re.compile(r"[Ll]ire la suite")):
                href = link.get("href", "")
                if href:
                    if href.startswith("http"):
                        full_url = href
                    elif href.startswith("/"):
                        full_url = self.base_url + href
                    else:
                        full_url = self.base_url + "/" + href
                    if full_url not in seen_urls and full_url not in article_links:
                        article_links.append(full_url)

            if not article_links:
                break

            for article_url in article_links:
                seen_urls.add(article_url)
                listing = self._scrape_article(article_url)
                if listing:
                    listings.append(listing)

        return listings

    def _scrape_article(self, url: str) -> Optional[Listing]:
        try:
            resp = self._rate_limited_get(url)
        except Exception as e:
            print(f"  [{self.name}] Error fetching {url}: {e}")
            return None

        soup = BeautifulSoup(resp.text, "lxml")

        # Title
        title_el = soup.select_one("h1, .titre-article, .entry-title")
        title = title_el.get_text(strip=True) if title_el else ""
        if not title or title.lower() in ("bienvenue", "accueil"):
            return None

        # Content
        content_el = soup.select_one(".texte, .article-texte, .entry-content, article")
        description = ""
        if content_el:
            for tag in content_el.find_all(["script", "style"]):
                tag.decompose()
            description = content_el.get_text(separator="\n", strip=True)

        if len(description) < 50:
            return None

        # Try to extract department from content
        province = self._extract_department(description + " " + title)
        location = province  # Use department name as location if found

        # Images
        images = []
        if content_el:
            for img in content_el.find_all("img", src=True):
                src = img["src"]
                if not src.startswith("http"):
                    src = self.base_url + ("/" if not src.startswith("/") else "") + src
                if "logo" not in src.lower() and "icon" not in src.lower():
                    images.append(src)

        # Date
        date_el = soup.select_one(".date, time, .published")
        date_published = None
        if date_el:
            date_published = date_el.get("datetime", date_el.get_text(strip=True))

        # Contact info from text
        contact = None
        email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", description)
        phone_match = re.search(r"(?:0[1-9][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})", description)
        contact_parts = []
        if email_match:
            contact_parts.append(email_match.group())
        if phone_match:
            contact_parts.append(phone_match.group())
        if contact_parts:
            contact = " | ".join(contact_parts)

        return Listing(
            source=self.name,
            source_url=url,
            title=title,
            description=description[:5000],
            location=location,
            province=province,
            listing_type="creation-groupe",
            country="FR",
            original_language="fr",
            contact=contact,
            images=images[:5],
            date_published=date_published,
            date_scraped=datetime.utcnow().isoformat(),
        )

    def _extract_department(self, text: str) -> Optional[str]:
        """Try to extract a French department name from text."""
        text_lower = text.lower()

        # Check for department names (all 96 departments)
        for code, name in ALL_DEPARTMENTS_FR.items():
            if name.lower() in text_lower:
                return name

        # Check for department numbers (e.g., "dept 64", "(64)", "departement 33")
        dept_pattern = re.search(r"(?:d[ee]p(?:artement)?\.?\s*|[(\[])(\d{2})(?:[)\]]|\b)", text)
        if dept_pattern:
            code = dept_pattern.group(1)
            if code in ALL_DEPARTMENTS_FR:
                return ALL_DEPARTMENTS_FR[code]

        return None
