import re
import hashlib
from datetime import datetime
from typing import Optional, Tuple, List
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing


class SamenhuizenScraper(BaseScraper):
    """Scraper for samenhuizen.be - Flemish cohousing classifieds."""

    name = "samenhuizen.be"
    base_url = "https://www.samenhuizen.be"
    listings_url = "https://www.samenhuizen.be/nl/zoekertjes"

    def __init__(self):
        super().__init__()
        # Override User-Agent: Drupal sites often block non-browser UAs
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "nl-BE,nl;q=0.9,fr;q=0.8,en;q=0.7",
        })

    # Categories to skip (roommate search, not cohousing)
    SKIP_CATEGORIES = {"medebewoner"}

    # Flemish region to province mapping
    REGION_TO_PROVINCE = {
        "antwerpen": "Flandre",
        "oost-vlaanderen": "Flandre",
        "west-vlaanderen": "Flandre",
        "limburg": "Flandre",
        "vlaams brabant": "Flandre",
        "vlaams-brabant": "Flandre",
        "brussel": "Bruxelles",
        "brussels": "Bruxelles",
        "brabant wallon": "Brabant Wallon",
        "hainaut": "Hainaut",
        "liège": "Liège",
        "luik": "Liège",
        "luxembourg": "Luxembourg",
        "namur": "Namur",
        "namen": "Namur",
    }

    def scrape(self) -> list[Listing]:
        listings = []
        seen_urls = set()
        max_pages = 20

        for page in range(0, max_pages):
            url = self.listings_url if page == 0 else f"{self.listings_url}?page={page}"
            print(f"  [{self.name}] Scraping page {page + 1}: {url}")

            try:
                resp = self._rate_limited_get(url)
            except Exception as e:
                print(f"  [{self.name}] Error fetching page {page + 1}: {e}")
                break

            soup = BeautifulSoup(resp.text, "lxml")

            # Find all listing links
            detail_urls = self._extract_listing_urls(soup)

            if not detail_urls:
                print(f"  [{self.name}] No listings found on page {page + 1}, stopping.")
                break

            new_urls = [u for u in detail_urls if u not in seen_urls]
            if not new_urls:
                print(f"  [{self.name}] No new URLs on page {page + 1}, stopping.")
                break

            seen_urls.update(new_urls)
            print(f"  [{self.name}] Found {len(new_urls)} listing URLs on page {page + 1}")

            for detail_url in new_urls:
                listing = self._scrape_detail(detail_url)
                if listing:
                    listings.append(listing)

        print(f"  [{self.name}] Total: {len(listings)} listings scraped")
        return listings

    def _extract_listing_urls(self, soup: BeautifulSoup) -> list[str]:
        """Extract listing detail page URLs from the listings page."""
        urls = []
        for link in soup.find_all("a", href=True):
            href = link["href"]
            # Match /nl/zoekertjes/some-slug but not /nl/zoekertjes itself or pagination
            if "/nl/zoekertjes/" in href and href != "/nl/zoekertjes" and href != "/nl/zoekertjes/":
                # Skip if it's a pagination or filter link
                if "?page=" in href or "field_location" in href:
                    continue
                slug = href.rstrip("/").split("/nl/zoekertjes/")[-1]
                if slug and "/" not in slug:  # Single slug, not sub-path
                    full_url = href if href.startswith("http") else self.base_url + href
                    if full_url not in urls:
                        urls.append(full_url)
        return urls

    def _scrape_detail(self, url: str) -> Optional[Listing]:
        """Scrape a single listing detail page."""
        try:
            resp = self._rate_limited_get(url)
        except Exception as e:
            print(f"  [{self.name}] Error fetching detail {url}: {e}")
            return None

        soup = BeautifulSoup(resp.text, "lxml")

        # Parse all structured fields from classified labels
        fields = self._extract_classified_fields(soup)

        # Extract title from classified-full-title (NOT generic h2 which hits breadcrumb)
        title_el = soup.select_one("h2.classified-full-title")
        if not title_el:
            title_el = soup.select_one("h1")
        title = title_el.get_text(strip=True) if title_el else "Sans titre"

        # Skip "medebewoner" category (roommate ads)
        category = self._extract_category(soup)
        if category and category.lower() in self.SKIP_CATEGORIES:
            print(f"  [{self.name}] Skipping medebewoner: {title[:50]}")
            return None

        # Extract main content/description
        description = self._extract_description(soup)
        if not description:
            return None

        # Extract structured fields using parsed classified labels
        location, region = self._extract_location_from_fields(fields)
        province = self._map_province(region)
        price, price_amount = self._extract_price_from_fields(fields, description)
        date_published = self._extract_date(soup)
        contact = self._extract_contact(soup, description)
        images = self._extract_images(soup)
        listing_type = self._determine_type_from_fields(fields, description)

        return Listing(
            id=hashlib.md5(url.encode()).hexdigest()[:12],
            source=self.name,
            source_url=url,
            title=title,
            description=description[:5000],
            location=location,
            province=province,
            price=price,
            price_amount=price_amount,
            listing_type=listing_type,
            contact=contact,
            images=images[:5],
            date_published=date_published,
            date_scraped=datetime.utcnow().isoformat(),
        )

    def _extract_classified_fields(self, soup: BeautifulSoup) -> dict:
        """Extract all structured fields from classified detail labels."""
        fields = {}
        for label in soup.select(".classified-full-detail-label"):
            key = label.get_text(strip=True).rstrip(":").lower()
            value_parts = []
            for sibling in label.next_siblings:
                if hasattr(sibling, "name") and sibling.name == "br":
                    continue
                if hasattr(sibling, "name") and sibling.name in ("span", "div", "a"):
                    value_parts.append(sibling.get_text(strip=True))
                elif isinstance(sibling, str) and sibling.strip():
                    value_parts.append(sibling.strip())
            if value_parts:
                fields[key] = " ".join(value_parts).strip()
        return fields

    def _extract_category(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract listing category from the classified-full-type element."""
        cat_el = soup.select_one(".classified-full-type")
        if cat_el:
            return cat_el.get_text(strip=True)
        return None

    def _extract_description(self, soup: BeautifulSoup) -> str:
        """Extract the main body text."""
        # Try article or main content area
        content_el = soup.select_one(
            "article .field--name-body, "
            ".node__content .field--name-body, "
            ".field--name-body, "
            "article .content, "
            ".node__content, "
            "article"
        )
        if content_el:
            for tag in content_el.find_all(["script", "style", "nav", "form"]):
                tag.decompose()
            return content_el.get_text(separator="\n", strip=True)

        # Fallback: collect all paragraph text
        paragraphs = soup.find_all("p")
        text = "\n".join(p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 20)
        return text

    def _extract_location_from_fields(self, fields: dict) -> Tuple[Optional[str], Optional[str]]:
        """Extract municipality and region from classified fields."""
        municipality = fields.get("gemeente of stad") or fields.get("gemeente") or fields.get("stad")
        region = fields.get("regio")
        # Clean up municipality (remove postal codes, semicolons, numbers prefix)
        if municipality:
            municipality = re.sub(r"^\d+[;,.]?\s*", "", municipality).strip()
        location = municipality or region
        return location, region

    def _map_province(self, region: Optional[str]) -> Optional[str]:
        """Map Flemish region name to province."""
        if not region:
            return None
        return self.REGION_TO_PROVINCE.get(region.lower(), "Flandre")

    def _extract_price_from_fields(self, fields: dict, description: str) -> Tuple[Optional[str], Optional[float]]:
        """Extract price from classified fields or description."""
        huur_koop = (fields.get("huur of koop") or "").lower()
        is_sale = "te koop" in huur_koop

        price_text = fields.get("bedrag") or fields.get("huurprijs") or fields.get("prijs")
        if price_text:
            amount = self._parse_price_amount(price_text)
            if amount:
                if is_sale or amount > 10000:
                    return f"{int(amount)}\u20ac", amount
                return f"{int(amount)}\u20ac/mois", amount

        # Fallback: search description for price patterns
        patterns = [
            r"€\s*(\d{2,4})",
            r"(\d{2,4})\s*€",
            r"(\d{2,4})\s*euro",
            r"huurprijs[:\s]*€?\s*(\d{2,4})",
            r"huur[:\s]*€?\s*(\d{2,4})",
        ]
        for pattern in patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                amount = float(match.group(1))
                if 100 <= amount <= 5000:
                    return f"{int(amount)}\u20ac/mois", amount

        return None, None

    def _parse_price_amount(self, text: str) -> Optional[float]:
        """Parse a numeric price from text like '€510' or '510 euro'."""
        match = re.search(r"(\d[\d\s.,]*)", text)
        if match:
            raw = match.group(1).replace(" ", "").replace(",", ".")
            try:
                amount = float(raw)
                if 50 <= amount <= 500000:
                    return amount
            except ValueError:
                pass
        return None

    def _extract_date(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract publication date. Returns YYYY-MM-DD."""
        # Look for "Geplaatst op DD/MM/YYYY"
        page_text = soup.get_text()
        match = re.search(r"[Gg]eplaatst\s+op\s+(\d{1,2})/(\d{1,2})/(\d{4})", page_text)
        if match:
            day, month, year = match.groups()
            return f"{year}-{int(month):02d}-{int(day):02d}"

        # Try meta tag
        meta_date = soup.find("meta", property="datePublished")
        if meta_date and meta_date.get("content"):
            return meta_date["content"][:10]

        # Try time element
        time_el = soup.select_one("time[datetime]")
        if time_el and time_el.get("datetime"):
            return time_el["datetime"][:10]

        return None

    def _extract_contact(self, soup: BeautifulSoup, description: str) -> Optional[str]:
        """Extract contact email or phone."""
        full_text = soup.get_text() + " " + description

        # Email
        email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", full_text)
        if email_match:
            return email_match.group(0)

        # Belgian phone
        phone_match = re.search(r"0\d[\s./]?\d{2,3}[\s./]?\d{2}[\s./]?\d{2}[\s./]?\d{2}", full_text)
        if phone_match:
            return phone_match.group(0)

        return None

    def _extract_images(self, soup: BeautifulSoup) -> List[str]:
        """Extract image URLs from listing content."""
        images = []
        # Skip partner logos and theme assets
        skip_patterns = ["logo", "icon", "themes/custom", "vdk250", "verbeelding"]
        for img in soup.find_all("img", src=True):
            src = img["src"]
            if src.startswith("/"):
                src = self.base_url + src
            if not src.startswith("http"):
                continue
            if any(p in src.lower() for p in skip_patterns):
                continue
            width = img.get("width", "")
            if width and width.isdigit() and int(width) < 50:
                continue
            if src not in images:
                images.append(src)
        return images

    def _determine_type_from_fields(self, fields: dict, description: str) -> str:
        """Determine listing type from classified fields and description."""
        huur_koop = (fields.get("huur of koop") or "").lower()
        if "te huur" in huur_koop:
            return "offre-location"
        if "te koop" in huur_koop:
            return "offre-vente"

        desc_lower = description.lower()
        if "te huur" in desc_lower or "huurprijs" in desc_lower:
            return "offre-location"
        if "te koop" in desc_lower or "verkoopprijs" in desc_lower:
            return "offre-vente"
        if "woongemeenschap" in desc_lower or "cohousing" in desc_lower:
            return "creation-groupe"
        if "grond" in desc_lower or "pand" in desc_lower:
            return "creation-groupe"
        return "cohousing"
