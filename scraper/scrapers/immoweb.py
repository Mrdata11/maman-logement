"""Scraper for immoweb.be - Brussels apartment rentals."""

import json
import re
import time
from typing import Optional

from scraper.models import ApartmentListing
from scraper.config import APARTMENT_REQUEST_DELAY, REQUEST_TIMEOUT

import requests


class ImmowebScraper:
    name = "immoweb.be"
    base_url = "https://www.immoweb.be"

    # Search for 2+ bedroom apartments for rent in Brussels region
    search_url_template = (
        "https://www.immoweb.be/en/search/apartment/for-rent"
        "/brussels/province"
        "?minBedroomCount=2&orderBy=relevance&page={page}"
    )

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5,fr;q=0.3",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Referer": "https://www.immoweb.be/en/search/apartment/for-rent/brussels/province",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
        })
        self._last_request_time = 0.0

    def _rate_limited_get(self, url: str, **kwargs) -> requests.Response:
        elapsed = time.time() - self._last_request_time
        if elapsed < APARTMENT_REQUEST_DELAY:
            time.sleep(APARTMENT_REQUEST_DELAY - elapsed)
        self._last_request_time = time.time()
        kwargs.setdefault("timeout", REQUEST_TIMEOUT)
        response = self.session.get(url, **kwargs)
        response.raise_for_status()
        return response

    def scrape(self) -> list[ApartmentListing]:
        listings = []
        seen_ids = set()

        for page in range(1, 11):  # Max 10 pages
            print(f"  [immoweb] Page {page}...")
            try:
                url = self.search_url_template.format(page=page)
                resp = self._rate_limited_get(url)
            except requests.HTTPError as e:
                print(f"  [immoweb] HTTP error on page {page}: {e}")
                break
            except Exception as e:
                print(f"  [immoweb] Error on page {page}: {e}")
                break

            listing_urls = self._extract_listing_urls(resp.text)
            if not listing_urls:
                print(f"  [immoweb] No listings found on page {page}, stopping")
                break

            print(f"  [immoweb] Found {len(listing_urls)} listing URLs on page {page}")

            for listing_url in listing_urls:
                # Extract immoweb ID from URL to deduplicate
                immoweb_id = self._extract_id_from_url(listing_url)
                if immoweb_id and immoweb_id in seen_ids:
                    continue
                if immoweb_id:
                    seen_ids.add(immoweb_id)

                try:
                    listing = self._scrape_detail(listing_url)
                    if listing:
                        listings.append(listing)
                except Exception as e:
                    print(f"  [immoweb] Error scraping {listing_url}: {e}")
                    continue

        print(f"  [immoweb] Total: {len(listings)} apartments scraped")
        return listings

    def _extract_listing_urls(self, html: str) -> list[str]:
        """Extract listing URLs from search results page HTML."""
        urls = []
        # Immoweb search results contain links matching this pattern
        pattern = r'href="(https://www\.immoweb\.be/en/classified/apartment/for-rent/[^"]+)"'
        matches = re.findall(pattern, html)
        seen = set()
        for url in matches:
            if url not in seen:
                seen.add(url)
                urls.append(url)
        return urls

    def _extract_id_from_url(self, url: str) -> Optional[str]:
        """Extract the Immoweb classified ID from URL."""
        match = re.search(r'/(\d{6,})$', url)
        if match:
            return match.group(1)
        return None

    def _scrape_detail(self, url: str) -> Optional[ApartmentListing]:
        """Scrape individual listing page, extract window.classified JSON."""
        try:
            resp = self._rate_limited_get(url)
        except requests.HTTPError as e:
            print(f"  [immoweb] HTTP error on detail: {e}")
            return None

        # Find the window.classified JSON blob using brace counting (more reliable)
        classified_data = None
        text = resp.text
        idx = text.find("window.classified = ")
        if idx == -1:
            idx = text.find("window.classified=")
        if idx >= 0:
            try:
                start = text.index("{", idx)
                depth = 0
                end = start
                for i in range(start, min(start + 60000, len(text))):
                    if text[i] == "{":
                        depth += 1
                    elif text[i] == "}":
                        depth -= 1
                        if depth == 0:
                            end = i + 1
                            break
                classified_data = json.loads(text[start:end])
            except (json.JSONDecodeError, ValueError):
                pass

        if not classified_data:
            print(f"  [immoweb] Could not extract classified data from {url}")
            return None

        return self._parse_classified(url, classified_data)

    # Map of known Immoweb commune name variants → canonical French name
    COMMUNE_NORMALIZE = {
        # Dutch names → French
        "elsene": "Ixelles",
        "etterbeek": "Etterbeek",
        "schaarbeek": "Schaerbeek",
        "sint-gillis": "Saint-Gilles",
        "sint-jans-molenbeek": "Molenbeek-Saint-Jean",
        "sint-joost-ten-node": "Saint-Josse-ten-Noode",
        "sint-lambrechts-woluwe": "Woluwe-Saint-Lambert",
        "sint-pieters-woluwe": "Woluwe-Saint-Pierre",
        "oudergem": "Auderghem",
        "watermaal-bosvoorde": "Watermael-Boitsfort",
        "sint-agatha-berchem": "Berchem-Sainte-Agathe",
        "vorst": "Forest",
        "ukkel": "Uccle",
        "brussel": "Bruxelles",
        "brussels": "Bruxelles",
        "anderlecht": "Anderlecht",
        "evere": "Evere",
        "ganshoren": "Ganshoren",
        "jette": "Jette",
        "koekelberg": "Koekelberg",
        # Uppercase French → Proper case
        "bruxelles": "Bruxelles",
        "ixelles": "Ixelles",
        "schaerbeek": "Schaerbeek",
        "saint-gilles": "Saint-Gilles",
        "saint-josse-ten-noode": "Saint-Josse-ten-Noode",
        "molenbeek-saint-jean": "Molenbeek-Saint-Jean",
        "woluwe-saint-lambert": "Woluwe-Saint-Lambert",
        "woluwe-saint-pierre": "Woluwe-Saint-Pierre",
        "woluwé-saint-lambert": "Woluwe-Saint-Lambert",
        "woluwé-saint-pierre": "Woluwe-Saint-Pierre",
        "auderghem": "Auderghem",
        "watermael-boitsfort": "Watermael-Boitsfort",
        "berchem-sainte-agathe": "Berchem-Sainte-Agathe",
        "forest": "Forest",
        "uccle": "Uccle",
    }

    # Brussels-Capital Region postal codes: 1000-1210
    BRUSSELS_POSTAL_CODES = set(range(1000, 1211))

    def _normalize_commune(self, raw: Optional[str]) -> Optional[str]:
        """Normalize commune name to canonical French form."""
        if not raw:
            return raw
        lookup = raw.strip().lower()
        return self.COMMUNE_NORMALIZE.get(lookup, raw.strip().title())

    def _is_brussels(self, postal_code: Optional[str], commune: Optional[str]) -> bool:
        """Check if listing is in Brussels-Capital Region."""
        if postal_code:
            try:
                code = int(postal_code)
                return code in self.BRUSSELS_POSTAL_CODES
            except ValueError:
                pass
        # Fallback: check commune name
        if commune:
            normalized = self._normalize_commune(commune)
            known_communes = set(self.COMMUNE_NORMALIZE.values())
            return normalized in known_communes
        return False

    def _parse_classified(self, url: str, data: dict) -> Optional[ApartmentListing]:
        """Parse the window.classified JSON into an ApartmentListing."""
        prop = data.get("property", {})
        trans = data.get("transaction", {})
        rental = trans.get("rental", {})
        location = prop.get("location", {})
        energy = prop.get("energy", {})
        media = data.get("media", {})
        building = prop.get("building", {})
        # PEB/EPC certificates are under transaction.certificates (NOT property.energy)
        certificates = trans.get("certificates", {}) or {}
        flags = data.get("flags", {})

        # Extract and normalize commune
        raw_commune = location.get("locality")
        commune = self._normalize_commune(raw_commune)
        postal_code = str(location.get("postalCode", "")) if location.get("postalCode") else None

        # Filter out non-Brussels listings immediately
        if not self._is_brussels(postal_code, commune):
            return None

        # Extract price
        price_monthly = rental.get("monthlyRentalPrice") or rental.get("price")
        charges_monthly = rental.get("monthlyRentalCosts")

        # Infer charges_included
        charges_included = None
        if charges_monthly is not None and charges_monthly > 0:
            charges_included = False
        elif charges_monthly == 0:
            charges_included = True

        # Filter < 2 bedrooms
        bedrooms = prop.get("bedroomCount")
        if bedrooms is not None and bedrooms < 2:
            return None

        # Extract images
        images = []
        for pic in media.get("pictures", []):
            img_url = pic.get("largeUrl") or pic.get("mediumUrl") or pic.get("smallUrl")
            if img_url:
                images.append(img_url)

        # Extract parking count
        parking_indoor = prop.get("parkingCountIndoor") or 0
        parking_outdoor = prop.get("parkingCountOutdoor") or 0
        parking_shared = 1 if prop.get("hasSharedParking") else 0
        parking_total = parking_indoor + parking_outdoor + parking_shared

        # Extract description — try multiple paths
        description = ""
        raw_desc = data.get("description")
        if raw_desc:
            if isinstance(raw_desc, dict):
                description = raw_desc.get("fr") or raw_desc.get("en") or raw_desc.get("nl") or ""
            elif isinstance(raw_desc, str):
                description = raw_desc

        # Extract title
        title = data.get("title") or ""
        if not title:
            bedrooms_label = bedrooms if bedrooms else "?"
            title = f"Appartement {bedrooms_label} ch. - {commune or raw_commune or 'Bruxelles'}"

        # Agency info
        customers = data.get("customers", [])
        agency_name = None
        agency_phone = None
        if customers:
            agency_name = customers[0].get("name")
            agency_phone = customers[0].get("phoneNumber")

        # Immoweb ID
        immoweb_id = data.get("id")

        # Floor — it's under location.floor, NOT property.floor
        floor_raw = location.get("floor")

        # Surface
        surface = prop.get("netHabitableSurface")

        # Terrace surface (useful as tag)
        terrace_surface = prop.get("terraceSurface")
        garden_surface = prop.get("gardenSurface")

        # Furnished — can be under transaction.sale.isFurnished OR transaction.rental
        furnished = rental.get("isFurnished")
        if furnished is None:
            furnished = prop.get("isFurnished")
        if furnished is None:
            furnished = flags.get("isFurnished")

        # Building condition
        building_condition = building.get("condition")

        # Kitchen type
        kitchen_type = prop.get("kitchen", {}).get("type") if isinstance(prop.get("kitchen"), dict) else None

        # Extract PEB from transaction.certificates (correct Immoweb path)
        peb_rating = self._extract_peb_rating(certificates, energy)
        peb_value = self._extract_peb_value(certificates, energy)

        return ApartmentListing(
            source=self.name,
            source_url=url,
            title=title,
            description=description[:5000] if description else "",
            commune=commune,
            postal_code=postal_code,
            address=location.get("street"),
            latitude=location.get("latitude"),
            longitude=location.get("longitude"),
            price_monthly=float(price_monthly) if price_monthly else None,
            charges_monthly=float(charges_monthly) if charges_monthly else None,
            charges_included=charges_included,
            bedrooms=bedrooms,
            bathrooms=prop.get("bathroomCount"),
            surface_m2=float(surface) if surface else None,
            floor=self._extract_floor_value(floor_raw),
            total_floors=building.get("floorCount"),
            has_elevator=prop.get("hasLift"),
            peb_rating=peb_rating,
            peb_value=peb_value,
            furnished=furnished,
            has_balcony=None,  # Immoweb doesn't have a hasBalcony field
            has_terrace=prop.get("hasTerrace"),
            has_garden=prop.get("hasGarden"),
            has_parking=parking_total > 0 if parking_total else None,
            parking_count=parking_total if parking_total > 0 else None,
            has_cellar=prop.get("hasCellar"),
            pets_allowed=None,
            available_from=rental.get("availabilityDate"),
            date_published=data.get("publication", {}).get("creationDate") or data.get("creationDate"),
            images=images[:15],
            agency_name=agency_name,
            agency_phone=agency_phone,
            immoweb_id=immoweb_id,
        )

    @staticmethod
    def _extract_peb_rating(certificates: dict, energy: dict) -> Optional[str]:
        """Extract PEB/EPC rating from transaction.certificates (primary) or property.energy (fallback)."""
        # Primary: transaction.certificates.epcScore
        for source in [certificates, energy]:
            if not isinstance(source, dict):
                continue
            for key in ["epcScore", "primaryEnergyConsumptionLevel", "epbLevel", "energyClass"]:
                val = source.get(key)
                if val and isinstance(val, str) and len(val) <= 3:
                    return val.upper()
        return None

    @staticmethod
    def _extract_peb_value(certificates: dict, energy: dict) -> Optional[float]:
        """Extract PEB/EPC kWh/m2 from transaction.certificates or property.energy."""
        for source in [certificates, energy]:
            if not isinstance(source, dict):
                continue
            for key in ["primaryEnergyConsumptionPerSqm", "primaryEnergyConsumptionYearly"]:
                val = source.get(key)
                if val is not None:
                    try:
                        return float(val)
                    except (ValueError, TypeError):
                        pass
        return None

    @staticmethod
    def _extract_floor_value(floor_raw) -> Optional[int]:
        """Extract floor from various formats (int, str, dict)."""
        if floor_raw is None:
            return None
        if isinstance(floor_raw, int):
            return floor_raw
        if isinstance(floor_raw, dict):
            return floor_raw.get("value")
        if isinstance(floor_raw, str):
            if floor_raw.isdigit():
                return int(floor_raw)
            # Handle "0" etc
            try:
                return int(floor_raw)
            except ValueError:
                pass
        return None
