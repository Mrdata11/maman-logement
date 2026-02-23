import re
import hashlib
from datetime import datetime
from typing import Optional, Tuple, List
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing


class HabitatGroupeScraper(BaseScraper):
    name = "habitat-groupe.be"
    base_url = "https://www.habitat-groupe.be"
    listings_url = "https://www.habitat-groupe.be/les-petites-annonces/"

    def scrape(self) -> list[Listing]:
        listings = []
        seen_urls = set()

        # The site uses ?p-page=N for pagination (~270 listings across 9 pages)
        max_pages = 10
        for page in range(1, max_pages + 1):
            url = self.listings_url if page == 1 else f"{self.listings_url}?p-page={page}"
            print(f"  [{self.name}] Scraping page {page}: {url}")

            try:
                resp = self._rate_limited_get(url)
            except Exception as e:
                # 404 means we've gone past the last page
                if hasattr(e, 'response') and getattr(e.response, 'status_code', 0) == 404:
                    print(f"  [{self.name}] Page {page} not found, stopping.")
                else:
                    print(f"  [{self.name}] Error fetching page {page}: {e}")
                break

            soup = BeautifulSoup(resp.text, "lxml")

            # Find all listing links on the page
            detail_urls = self._extract_listing_urls(soup)

            if not detail_urls:
                print(f"  [{self.name}] No listings found on page {page}, stopping.")
                break

            new_urls = [u for u in detail_urls if u not in seen_urls]
            if not new_urls:
                print(f"  [{self.name}] No new URLs on page {page}, stopping.")
                break

            seen_urls.update(new_urls)
            print(f"  [{self.name}] Found {len(new_urls)} listing URLs on page {page}")

            for detail_url in new_urls:
                listing = self._scrape_detail(detail_url)
                if listing:
                    listings.append(listing)

        print(f"  [{self.name}] Total: {len(listings)} listings scraped")
        return listings

    def _extract_listing_urls(self, soup: BeautifulSoup) -> list[str]:
        urls = []
        # Look for links pointing to /petites-annonces/ detail pages
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if "/petites-annonces/" in href and href != self.listings_url:
                # Ensure it's a detail page (has more path segments)
                path = href.rstrip("/").split("/petites-annonces/")[-1]
                segments = [s for s in path.split("/") if s]
                if len(segments) >= 2:  # type/region/slug or type/slug
                    full_url = href if href.startswith("http") else self.base_url + href
                    if full_url not in urls:
                        urls.append(full_url)
        return urls

    def _scrape_detail(self, url: str) -> Optional[Listing]:
        try:
            resp = self._rate_limited_get(url)
        except Exception as e:
            print(f"  [{self.name}] Error fetching detail {url}: {e}")
            return None

        soup = BeautifulSoup(resp.text, "lxml")

        # Extract title
        title_el = soup.select_one("h1.entry-title, h1.wp-block-post-title, h1")
        title = title_el.get_text(strip=True) if title_el else "Sans titre"

        # Extract main content
        content_el = soup.select_one(".entry-content, .wp-block-post-content, article")
        if content_el:
            # Remove script/style/nav tags and navigation elements
            for tag in content_el.find_all(["script", "style", "nav"]):
                tag.decompose()
            # Remove "Retour à votre recherche" links
            for tag in content_el.find_all("a", string=re.compile(r"Retour", re.IGNORECASE)):
                tag.decompose()
            description = content_el.get_text(separator="\n", strip=True)
            # Clean up noise from the description
            noise_patterns = [
                r"^Retour à votre recherche\s*\n?",
                r"^\d+ commentaires?\s*\n?",
                r"^0 commentaire\s*\n?",
                r"^Offres?\s*[-–]\s*(Location|Vente)\s*\n?",
                r"^Demandes?\s*[-–]\s*(Location|Vente)\s*\n?",
                r"^Création de groupe\s*\n?",
                r"^(Brabant Wallon|Bruxelles|Hainaut|Li[eè]ge|Luxembourg|Namur|Flandre|Autres pays/régions)\s*\n?",
                r"^Le \d{1,2} \w+ \d{4}\s*\n?",
            ]
            for pattern in noise_patterns:
                description = re.sub(pattern, "", description, flags=re.MULTILINE | re.IGNORECASE)
            # Remove leading/trailing whitespace and excessive newlines
            description = re.sub(r"\n{3,}", "\n\n", description).strip()
        else:
            description = ""

        # Extract images
        images = []
        if content_el:
            for img in content_el.find_all("img", src=True):
                src = img["src"]
                if src.startswith("http") and "logo" not in src.lower() and "icon" not in src.lower():
                    images.append(src)

        # Extract date - try multiple sources
        date_published = None

        # 1. Try meta tag (most reliable)
        meta_date = soup.find("meta", property="datePublished")
        if meta_date and meta_date.get("content"):
            # Format: "2026-02-22T14:43:21+00:00"
            date_published = meta_date["content"][:10]  # Keep YYYY-MM-DD

        # 2. Try Stackable post-date block
        if not date_published:
            date_block = soup.select_one(".stk-block-post-date")
            if date_block:
                date_published = self._parse_french_date(date_block.get_text(strip=True))

        # 3. Try WordPress time element
        if not date_published:
            time_el = soup.select_one("time[datetime]")
            if time_el and time_el.get("datetime"):
                date_published = time_el["datetime"][:10]

        # 4. Try French date in content (before noise cleanup)
        if not date_published and content_el:
            raw_text = content_el.get_text()
            date_published = self._parse_french_date(raw_text)

        # Extract listing type and location from URL
        listing_type = self._extract_type(url)
        location = self._extract_location_from_url(url)

        # Try to extract price from description
        price, price_amount = self._extract_price(description)

        # Try to extract contact from description
        contact = self._extract_contact(description)

        # Extract location from content if not in URL
        if not location or location == "autres-pays-regions":
            location = self._extract_location_from_text(description) or location

        return Listing(
            id=hashlib.md5(url.encode()).hexdigest()[:12],
            source=self.name,
            source_url=url,
            title=title,
            description=description[:5000],  # Limit description length
            location=location,
            province=self._extract_province(url),
            price=price,
            price_amount=price_amount,
            listing_type=listing_type,
            contact=contact,
            images=images[:5],  # Limit images
            date_published=date_published,
            date_scraped=datetime.utcnow().isoformat(),
        )

    def _extract_type(self, url: str) -> str:
        if "offres-location" in url:
            return "offre-location"
        elif "offres-vente" in url:
            return "offre-vente"
        elif "demandes-location" in url:
            return "demande-location"
        elif "demandes-vente" in url:
            return "demande-vente"
        elif "creation-groupe" in url:
            return "creation-groupe"
        elif "habitats-legers" in url:
            return "habitat-leger"
        elif "divers" in url:
            return "divers"
        return "autre"

    def _extract_location_from_url(self, url: str) -> Optional[str]:
        parts = url.rstrip("/").split("/")
        # URL pattern: /petites-annonces/type/region/slug/
        for i, part in enumerate(parts):
            if part == "petites-annonces" and i + 2 < len(parts):
                region = parts[i + 2]
                if region not in ("page",):
                    return region.replace("-", " ").title()
        return None

    def _extract_province(self, url: str) -> Optional[str]:
        provinces = {
            "brabant-wallon": "Brabant Wallon",
            "bruxelles": "Bruxelles",
            "hainaut": "Hainaut",
            "liege": "Liège",
            "luxembourg": "Luxembourg",
            "namur": "Namur",
            "flandre": "Flandre",
        }
        for key, value in provinces.items():
            if key in url:
                return value
        return None

    def _extract_price(self, text: str) -> Tuple[Optional[str], Optional[float]]:
        # Look for price patterns like "500€", "500 €", "500 euros"
        patterns = [
            r"(\d{2,4})\s*€(?:\s*/\s*mois)?",
            r"(\d{2,4})\s*euros?(?:\s*/\s*mois)?",
            r"loyer\s*(?:de\s*)?(\d{2,4})",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount = float(match.group(1))
                if 100 <= amount <= 5000:  # Reasonable price range
                    return f"{int(amount)}€/mois", amount
        return None, None

    def _extract_contact(self, text: str) -> Optional[str]:
        # Look for email
        email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
        if email_match:
            return email_match.group(0)
        # Look for phone
        phone_match = re.search(r"0\d[\s./]?\d{2,3}[\s./]?\d{2}[\s./]?\d{2}[\s./]?\d{2}", text)
        if phone_match:
            return phone_match.group(0)
        return None

    def _parse_french_date(self, text: str) -> Optional[str]:
        """Parse French date like 'Le 22 février 2026' and return YYYY-MM-DD."""
        month_map = {
            "janvier": 1, "février": 2, "fevrier": 2, "mars": 3, "avril": 4,
            "mai": 5, "juin": 6, "juillet": 7, "août": 8, "aout": 8,
            "septembre": 9, "octobre": 10, "novembre": 11, "décembre": 12, "decembre": 12,
        }
        match = re.search(
            r"(?:Le\s+)?(\d{1,2})\s+"
            r"(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)"
            r"\s+(\d{4})",
            text,
            re.IGNORECASE,
        )
        if match:
            day, month_fr, year = match.groups()
            month = month_map.get(month_fr.lower())
            if month:
                return f"{year}-{month:02d}-{int(day):02d}"
        return None

    def _extract_location_from_text(self, text: str) -> Optional[str]:
        # Try to find Belgian city/region mentions
        belgian_cities = [
            "Bruxelles", "Schaerbeek", "Ixelles", "Uccle", "Forest", "Anderlecht",
            "Louvain-la-Neuve", "Namur", "Liège", "Charleroi", "Mons", "Tournai",
            "Wavre", "Nivelles", "Ottignies", "Gembloux", "Marche-en-Famenne",
            "Arlon", "Bastogne", "Dinant", "Ciney", "Rochefort", "Durbuy",
            "Waterloo", "Braine-le-Comte", "Enghien", "Soignies",
        ]
        text_lower = text.lower()
        for city in belgian_cities:
            if city.lower() in text_lower:
                return city
        return None
