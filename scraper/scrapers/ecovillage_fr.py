"""Scraper for ecovillageglobal.fr - French eco-habitat classifieds.

SPIP-based site with department-level filtering.
Scrapes the "Habitat Participatif" rubrique (id=55) with department filters.
"""

import re
import hashlib
from datetime import datetime
from typing import List, Optional
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing
from scraper.config import CAMINO_DEPARTMENTS_FR


# Map department codes to names
DEPARTMENT_NAMES = {
    "11": "Aude", "12": "Aveyron", "16": "Charente",
    "23": "Creuse", "24": "Dordogne", "31": "Haute-Garonne",
    "32": "Gers", "33": "Gironde", "34": "Hérault",
    "37": "Indre-et-Loire", "40": "Landes", "43": "Haute-Loire",
    "46": "Lot", "48": "Lozère", "64": "Pyrénées-Atlantiques",
    "65": "Hautes-Pyrénées", "86": "Vienne", "87": "Haute-Vienne",
}

# Rubrique IDs for habitat-related listings on ecovillageglobal.fr
HABITAT_RUBRIQUES = [
    55,   # Habitat Participatif
    115,  # Habitat groupé / écolieux cherchent habitants
]


class EcovillageFRScraper(BaseScraper):
    """Scrapes ecovillageglobal.fr for French eco-habitat listings in Camino departments."""

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
                    full_url = href if href.startswith("http") else self.base_url + href
                    if full_url not in seen_urls and full_url not in article_links:
                        article_links.append(full_url)

            # Also look for "Lire la suite" links
            for link in soup.find_all("a", string=re.compile(r"[Ll]ire la suite")):
                href = link.get("href", "")
                if href:
                    full_url = href if href.startswith("http") else self.base_url + href
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
        if not title:
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
        location = None
        province = None
        dept_match = self._extract_department(description + " " + title)
        if dept_match:
            province = dept_match
            location = dept_match

        # Filter: only keep listings in Camino departments
        camino_dept_names = set(DEPARTMENT_NAMES.values())
        if province and province not in camino_dept_names:
            # Check if it's a Camino region by loose matching
            if not any(d.lower() in (description + " " + title).lower() for d in camino_dept_names):
                return None

        # Images
        images = []
        if content_el:
            for img in content_el.find_all("img", src=True):
                src = img["src"]
                if not src.startswith("http"):
                    src = self.base_url + src
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

        # Check for department names
        for code, name in DEPARTMENT_NAMES.items():
            if name.lower() in text_lower:
                return name

        # Check for department numbers (e.g., "dept 64", "(64)", "département 33")
        dept_pattern = re.search(r"(?:d[ée]p(?:artement)?\.?\s*|[(\[])(\d{2})(?:[)\]]|\b)", text)
        if dept_pattern:
            code = dept_pattern.group(1)
            if code in DEPARTMENT_NAMES:
                return DEPARTMENT_NAMES[code]

        return None
