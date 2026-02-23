import re
import hashlib
from datetime import datetime
from typing import Optional, Tuple, List
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing


class FindACoHouseScraper(BaseScraper):
    """Scraper for findacohouse.be - Belgian cohousing/coliving platform."""

    name = "findacohouse.be"
    base_url = "https://www.findacohouse.be"
    listings_url = "https://www.findacohouse.be/en/cohousing"

    # Belgian postal code to province mapping (first 1-2 digits)
    POSTAL_PROVINCE = {
        "10": "Bruxelles", "11": "Bruxelles", "12": "Bruxelles",
        "13": "Brabant Wallon", "14": "Brabant Wallon",
        "15": "Flandre",  # Vlaams-Brabant
        "16": "Flandre", "17": "Flandre", "18": "Flandre", "19": "Flandre",
        "20": "Flandre",  # Antwerpen
        "21": "Flandre", "22": "Flandre", "23": "Flandre", "24": "Flandre",
        "25": "Flandre", "26": "Flandre", "27": "Flandre", "28": "Flandre", "29": "Flandre",
        "30": "Flandre",  # Vlaams-Brabant / Leuven
        "31": "Flandre", "32": "Flandre", "33": "Flandre", "34": "Flandre",
        "35": "Flandre",  # Limburg
        "36": "Flandre", "37": "Flandre", "38": "Flandre", "39": "Flandre",
        "40": "Liège",
        "41": "Liège", "42": "Liège", "43": "Liège", "44": "Liège", "45": "Liège",
        "46": "Liège", "47": "Liège", "48": "Liège", "49": "Liège",
        "50": "Namur",
        "51": "Namur", "52": "Namur", "53": "Hainaut", "54": "Namur", "55": "Namur",
        "56": "Hainaut",
        "60": "Hainaut",
        "61": "Luxembourg", "63": "Luxembourg", "64": "Luxembourg",
        "65": "Luxembourg", "66": "Luxembourg", "67": "Luxembourg", "68": "Luxembourg", "69": "Luxembourg",
        "70": "Hainaut",
        "71": "Hainaut", "72": "Hainaut", "73": "Hainaut", "74": "Hainaut", "75": "Hainaut",
        "76": "Hainaut", "77": "Hainaut", "78": "Flandre",  # West-Vlaanderen
        "79": "Flandre",
        "80": "Flandre",  # West-Vlaanderen
        "81": "Flandre", "82": "Flandre", "83": "Flandre", "84": "Flandre",
        "85": "Flandre", "86": "Flandre", "87": "Flandre", "88": "Flandre", "89": "Flandre",
        "90": "Flandre",  # Oost-Vlaanderen
        "91": "Flandre", "92": "Flandre", "93": "Flandre", "94": "Flandre",
        "95": "Flandre", "96": "Flandre", "97": "Flandre", "98": "Flandre", "99": "Flandre",
    }

    def __init__(self):
        super().__init__()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en,nl;q=0.9,fr;q=0.8",
        })

    def scrape(self) -> List[Listing]:
        listings = []
        seen_urls = set()
        max_pages = 30

        for page in range(0, max_pages):
            url = self.listings_url if page == 0 else f"{self.listings_url}?page={page}"
            print(f"  [{self.name}] Scraping page {page + 1}: {url}")

            try:
                resp = self._rate_limited_get(url)
            except Exception as e:
                print(f"  [{self.name}] Error fetching page {page + 1}: {e}")
                break

            soup = BeautifulSoup(resp.text, "lxml")
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

    def _extract_listing_urls(self, soup: BeautifulSoup) -> List[str]:
        """Extract listing URLs from the overview page."""
        urls = []
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if "/cohousing/cohousing-" in href:
                full_url = href if href.startswith("http") else self.base_url + href
                if full_url not in urls:
                    urls.append(full_url)
        return urls

    def _scrape_detail(self, url: str) -> Optional[Listing]:
        """Scrape a single cohouse detail page."""
        try:
            resp = self._rate_limited_get(url)
        except Exception as e:
            print(f"  [{self.name}] Error fetching {url}: {e}")
            return None

        soup = BeautifulSoup(resp.text, "lxml")

        # Title
        title_el = soup.select_one("h1")
        title = title_el.get_text(strip=True) if title_el else "Sans titre"

        # Info bar: price, location, surface, availability
        price, price_amount = self._extract_price(soup)
        location, postal_code = self._extract_location(soup)
        province = self._postal_to_province(postal_code)
        surface = self._extract_surface(soup)

        # Description: collect all paragraphs from tab content
        description = self._extract_description(soup, surface)

        # Images
        images = self._extract_images(soup)

        # Listing type from description content
        listing_type = self._determine_type(description)

        # Availability date as proxy for date_published
        date_published = self._extract_availability_date(soup)

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
            country="BE",
            original_language="en",
            images=images[:5],
            date_published=date_published,
            date_scraped=datetime.utcnow().isoformat(),
        )

    def _extract_price(self, soup: BeautifulSoup) -> Tuple[Optional[str], Optional[float]]:
        """Extract price from the info bar."""
        info_bar = soup.select_one(".info-bar")
        if info_bar:
            text = info_bar.get_text()
            match = re.search(r"€\s*(\d[\d\s.,]*)", text)
            if match:
                raw = match.group(1).replace(" ", "").replace(",", ".")
                try:
                    amount = float(raw)
                    if 50 <= amount <= 5000:
                        return f"{int(amount)}€/mois", amount
                except ValueError:
                    pass
        return None, None

    def _extract_location(self, soup: BeautifulSoup) -> Tuple[Optional[str], Optional[str]]:
        """Extract city and postal code."""
        postal_code = None
        city = None

        # Try location tab first (most precise)
        loc_tab = soup.select_one(".house-tabs__content--location")
        if loc_tab:
            text = loc_tab.get_text()
            # Look for "Town:CityName"
            town_match = re.search(r"Town:\s*(.+?)(?:Street|Province|$)", text)
            if town_match:
                city = town_match.group(1).strip()
            prov_match = re.search(r"Province:\s*(.+?)(?:Town|Street|$)", text)
            if prov_match:
                # Province field often contains the city name on findacohouse
                pass

        # Also try info bar for postal code + city
        info_bar = soup.select_one(".info-bar")
        if info_bar:
            text = info_bar.get_text()
            match = re.search(r"(\d{4})\s+([A-Za-zÀ-ÿ\s-]+?)(?:Starting|Available|\d|$)", text)
            if match:
                postal_code = match.group(1)
                if not city:
                    city = match.group(2).strip()

        # Fallback: extract from URL
        if not city:
            match = re.search(r"/cohousing-([a-z-]+)-\d+", soup.find("link", rel="canonical", href=True)["href"] if soup.find("link", rel="canonical", href=True) else "")
            if not match:
                # Try from the URL in the page
                for link in soup.find_all("link", rel="canonical", href=True):
                    url_match = re.search(r"/cohousing-([a-z-]+)-\d+", link["href"])
                    if url_match:
                        city = url_match.group(1).replace("-", " ").title()
                        break

        return city, postal_code

    def _postal_to_province(self, postal_code: Optional[str]) -> Optional[str]:
        """Map Belgian postal code to province."""
        if not postal_code or len(postal_code) < 2:
            return None
        prefix = postal_code[:2]
        return self.POSTAL_PROVINCE.get(prefix)

    def _extract_surface(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract surface area from info bar."""
        info_bar = soup.select_one(".info-bar")
        if info_bar:
            text = info_bar.get_text()
            match = re.search(r"(\d+)\s*m[²2]", text)
            if match:
                return f"{match.group(1)}m²"
        return None

    def _extract_description(self, soup: BeautifulSoup, surface: Optional[str]) -> str:
        """Extract description from all tab contents."""
        parts = []

        # Get all visible tab content
        for tab in soup.select(".house-tabs__content"):
            # Skip login/register forms
            text = tab.get_text(separator="\n", strip=True)
            if "Log in" in text[:50] or "Register" in text[:50]:
                continue
            # Remove the title (repeated in each tab)
            lines = text.split("\n")
            # Remove first line if it matches the title
            if lines and lines[0] == (soup.select_one("h1").get_text(strip=True) if soup.select_one("h1") else ""):
                lines = lines[1:]
            clean = "\n".join(lines).strip()
            if clean and len(clean) > 20:
                parts.append(clean)

        description = "\n\n".join(parts)

        # Add surface to description if available
        if surface and surface not in description:
            description = f"Surface: {surface}\n\n{description}"

        return description

    def _extract_images(self, soup: BeautifulSoup) -> List[str]:
        """Extract image URLs from the page."""
        images = []

        # Background images in glide slides
        for div in soup.select(".background-cover"):
            # Try style attribute
            style = div.get("style", "")
            match = re.search(r"url\(['\"]?(/uploads/[^'\")\s]+)", style)
            if match:
                images.append(self.base_url + match.group(1))
                continue
            # Try data-bgset (lazy loaded)
            bgset = div.get("data-bgset", "")
            if bgset.startswith("/uploads/"):
                images.append(self.base_url + bgset)

        # Regular img tags
        for img in soup.find_all("img", src=True):
            src = img["src"]
            if "/uploads/" in src:
                full = src if src.startswith("http") else self.base_url + src
                if full not in images:
                    images.append(full)

        return images

    def _determine_type(self, description: str) -> str:
        """Determine listing type from description content."""
        desc_lower = description.lower()
        if any(kw in desc_lower for kw in ["cohousing", "co-housing", "samenhuizen", "cohouse"]):
            return "cohousing"
        if any(kw in desc_lower for kw in ["coliving", "co-living", "shared home", "shared house"]):
            return "cohousing"
        if any(kw in desc_lower for kw in ["community", "communautaire", "gemeenschap"]):
            return "creation-groupe"
        return "offre-location"

    def _extract_availability_date(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract availability/starting date as proxy for listing date."""
        info_bar = soup.select_one(".info-bar")
        if info_bar:
            text = info_bar.get_text()
            # "Starting from: 15 April 2026" or "Available from: ..."
            match = re.search(
                r"(?:Starting|Available)\s+from:\s*(\d{1,2})\s+"
                r"(January|February|March|April|May|June|July|August|September|October|November|December)"
                r"\s+(\d{4})",
                text, re.IGNORECASE,
            )
            if match:
                day, month_str, year = match.groups()
                months = {
                    "january": 1, "february": 2, "march": 3, "april": 4,
                    "may": 5, "june": 6, "july": 7, "august": 8,
                    "september": 9, "october": 10, "november": 11, "december": 12,
                }
                month = months.get(month_str.lower())
                if month:
                    return f"{year}-{month:02d}-{int(day):02d}"
        return None
