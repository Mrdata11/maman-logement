"""Scraper for Spanish cohousing projects via ecohousing.es CARTO map.

The CARTO public visualization exposes a SQL API for querying map data.
Falls back to scraping ecohousing.es listing pages if the API is unavailable.
"""

import json
import hashlib
import re
from datetime import datetime
from typing import List, Optional
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing
from scraper.config import CAMINO_PROVINCES_ES


# CARTO visualization ID for the ecohousing.es cohousing map
CARTO_VIZ_ID = "b301eacc-5ba8-11e3-82ec-ddf340c64fb2"
CARTO_SQL_API = "https://ecohousing.carto.com/api/v2/sql"


class CohousingSpainScraper(BaseScraper):
    """Scrapes Spanish cohousing projects from ecohousing.es CARTO map."""

    name = "ecohousing.es"
    base_url = "http://ecohousing.es"

    def scrape(self) -> List[Listing]:
        listings = []

        # Try CARTO SQL API first
        print(f"  [{self.name}] Trying CARTO SQL API...")
        listings = self._scrape_carto_api()

        if not listings:
            print(f"  [{self.name}] CARTO API failed, trying website scraping...")
            listings = self._scrape_website()

        print(f"  [{self.name}] Total: {len(listings)} listings scraped")
        return listings

    def _scrape_carto_api(self) -> List[Listing]:
        """Query the CARTO SQL API for all cohousing projects."""
        listings = []

        # Try to discover the table name and get data
        # Common CARTO table names
        table_names = [
            "cohousing_espana",
            "cohousing_spain",
            "vivienda_colaborativa",
            "cohousing",
            "mapa_cohousing",
        ]

        for table in table_names:
            query = f"SELECT * FROM {table} LIMIT 200"
            url = f"{CARTO_SQL_API}?q={query}&format=json"

            try:
                resp = self._rate_limited_get(url)
                data = resp.json()
                if "rows" in data and len(data["rows"]) > 0:
                    print(f"  [{self.name}] Found CARTO table '{table}' with {len(data['rows'])} rows")
                    for row in data["rows"]:
                        listing = self._parse_carto_row(row)
                        if listing:
                            listings.append(listing)
                    return listings
            except Exception:
                continue

        # Try querying the visualization directly
        try:
            viz_url = f"https://ecohousing.carto.com/api/v1/viz/{CARTO_VIZ_ID}/viz.json"
            resp = self._rate_limited_get(viz_url)
            viz_data = resp.json()
            # Extract layer data source
            if "layers" in viz_data:
                for layer in viz_data.get("layers", []):
                    options = layer.get("options", {})
                    table = options.get("table_name", "")
                    if table:
                        query = f"SELECT * FROM {table} LIMIT 200"
                        sql_url = f"{CARTO_SQL_API}?q={query}&format=json"
                        resp2 = self._rate_limited_get(sql_url)
                        data = resp2.json()
                        if "rows" in data:
                            for row in data["rows"]:
                                listing = self._parse_carto_row(row)
                                if listing:
                                    listings.append(listing)
                            return listings
        except Exception as e:
            print(f"  [{self.name}] CARTO viz API error: {e}")

        return listings

    def _parse_carto_row(self, row: dict) -> Optional[Listing]:
        """Parse a CARTO row into a Listing."""
        name = row.get("name", row.get("nombre", row.get("titulo", "")))
        if not name:
            return None

        # Build description from available fields
        desc_parts = []
        for field in ("description", "descripcion", "detalles", "info", "observaciones"):
            val = row.get(field, "")
            if val:
                desc_parts.append(str(val))

        description = "\n".join(desc_parts) if desc_parts else name

        # Location
        location = row.get("location", row.get("ubicacion", row.get("ciudad", row.get("localidad", ""))))
        province = row.get("province", row.get("provincia", row.get("comunidad", "")))

        # Filter by Camino provinces
        camino = set(p.lower() for p in CAMINO_PROVINCES_ES)
        loc_text = f"{location} {province}".lower()
        if not any(p in loc_text for p in camino):
            return None

        # Coordinates
        lat = row.get("the_geom_lat", row.get("lat", row.get("latitude")))
        lng = row.get("the_geom_lng", row.get("lng", row.get("longitude")))

        # URL
        url = row.get("url", row.get("web", row.get("enlace", "")))
        if not url:
            url = f"http://ecohousing.es/cohousing/{hashlib.md5(name.encode()).hexdigest()[:8]}"

        # Contact
        contact = row.get("contacto", row.get("email", row.get("telefono", "")))

        return Listing(
            source=self.name,
            source_url=url,
            title=name,
            description=description[:5000],
            location=str(location) if location else None,
            province=str(province) if province else None,
            listing_type="cohousing",
            country="ES",
            original_language="es",
            contact=str(contact) if contact else None,
            date_scraped=datetime.utcnow().isoformat(),
        )

    def _scrape_website(self) -> List[Listing]:
        """Fallback: scrape the ecohousing.es website directly."""
        listings = []
        map_url = "http://ecohousing.es/en/red-cohousing/mapa-cohousing-vivienda-colaborativa-en-espana/"

        try:
            resp = self._rate_limited_get(map_url)
        except Exception as e:
            print(f"  [{self.name}] Error fetching website: {e}")
            return listings

        soup = BeautifulSoup(resp.text, "lxml")

        # Look for project links or embedded data
        for link in soup.find_all("a", href=True):
            href = link["href"]
            text = link.get_text(strip=True)
            if text and len(text) > 3 and ("cohousing" in href.lower() or "vivienda" in href.lower()):
                full_url = href if href.startswith("http") else self.base_url + href
                listing = self._scrape_project_page(full_url, text)
                if listing:
                    listings.append(listing)

        # Also extract any JSON data embedded in the page
        for script in soup.find_all("script"):
            text = script.string or ""
            if "locations" in text or "markers" in text or "points" in text:
                try:
                    # Try to find JSON arrays in the script
                    json_match = re.search(r"\[{.*?}\]", text, re.DOTALL)
                    if json_match:
                        data = json.loads(json_match.group())
                        for item in data:
                            listing = self._parse_carto_row(item)
                            if listing:
                                listings.append(listing)
                except (json.JSONDecodeError, AttributeError):
                    pass

        return listings

    def _scrape_project_page(self, url: str, title: str) -> Optional[Listing]:
        """Scrape an individual project page."""
        try:
            resp = self._rate_limited_get(url)
        except Exception:
            return None

        soup = BeautifulSoup(resp.text, "lxml")

        content_el = soup.select_one(".entry-content, article, main, .content")
        description = ""
        if content_el:
            for tag in content_el.find_all(["script", "style"]):
                tag.decompose()
            description = content_el.get_text(separator="\n", strip=True)

        if len(description) < 50:
            return None

        # Filter by Camino regions
        camino = set(p.lower() for p in CAMINO_PROVINCES_ES)
        text_lower = description.lower()
        if not any(p in text_lower for p in camino):
            return None

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
            listing_type="cohousing",
            country="ES",
            original_language="es",
            images=images[:5],
            date_scraped=datetime.utcnow().isoformat(),
        )
