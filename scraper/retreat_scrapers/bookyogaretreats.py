"""Scraper pour bookyogaretreats.com — annuaire de lieux de retraite yoga.

URL de base : https://www.bookyogaretreats.com/all/d/europe/venues
Parse les pages de listing et de détail pour extraire les données des venues.
"""

import re
import time
from typing import Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from scraper.retreat_scrapers.base_retreat import BaseRetreatScraper
from scraper.retreat_scrapers.retreat_models import RetreatVenueListing
from scraper.retreat_config import TARGET_COUNTRIES, RATE_LIMIT_SETTINGS


class BookYogaRetreatsScraper(BaseRetreatScraper):
    """Scraper pour bookyogaretreats.com."""

    name = "BookYogaRetreats"
    base_url = "https://www.bookyogaretreats.com"

    # Mapping codes pays → slugs URL
    COUNTRY_SLUGS = {
        "FR": "france",
        "ES": "spain",
        "PT": "portugal",
        "IT": "italy",
        "GR": "greece",
        "MA": "morocco",
        "HR": "croatia",
        "TR": "turkey",
        "GB": "united-kingdom",
        "DE": "germany",
        "TH": "thailand",
        "ID": "indonesia",
        "CR": "costa-rica",
        "LK": "sri-lanka",
        "IN": "india",
        "MX": "mexico",
    }

    def __init__(self, priority_max: int = 3):
        super().__init__()
        self.priority_max = priority_max
        self._delay = RATE_LIMIT_SETTINGS["bookyogaretreats"]["delay"]

    def scrape(self) -> list[RetreatVenueListing]:
        """Scrape les venues depuis bookyogaretreats.com."""
        venues: list[RetreatVenueListing] = []
        countries = self._get_target_countries()

        for country_code, country_slug in countries:
            print(f"  [bookyogaretreats] Scraping {country_code} ({country_slug})...")
            try:
                country_venues = self._scrape_country(country_code, country_slug)
                venues.extend(country_venues)
                print(f"  [bookyogaretreats] {country_code}: {len(country_venues)} venues")
            except Exception as e:
                print(f"  [bookyogaretreats] Erreur pour {country_code}: {e}")

        print(f"  [bookyogaretreats] Total: {len(venues)} venues")
        return venues

    def _get_target_countries(self) -> list[tuple[str, str]]:
        """Retourne les pays à scraper."""
        result = []
        for code, info in TARGET_COUNTRIES.items():
            if info["priority"] <= self.priority_max:
                slug = self.COUNTRY_SLUGS.get(code)
                if slug:
                    result.append((code, slug))
        return result

    def _scrape_country(self, country_code: str, country_slug: str) -> list[RetreatVenueListing]:
        """Scrape les pages de listing d'un pays."""
        venues: list[RetreatVenueListing] = []
        page = 1

        while True:
            url = f"{self.base_url}/all/d/{country_slug}/venues?page={page}"
            try:
                response = self._rate_limited_get(url)
                soup = BeautifulSoup(response.text, "lxml")

                listing_links = self._extract_listing_links(soup)
                if not listing_links:
                    break

                print(f"    Page {page}: {len(listing_links)} liens")

                for link in listing_links:
                    detail_url = urljoin(self.base_url, link)
                    venue = self._scrape_detail_page(detail_url, country_code)
                    if venue:
                        venues.append(venue)
                    time.sleep(self._delay)

                # Vérifier la pagination
                if not self._has_next_page(soup, page):
                    break
                page += 1

            except Exception as e:
                print(f"    Erreur page {page}: {e}")
                break

        return venues

    def _extract_listing_links(self, soup: BeautifulSoup) -> list[str]:
        """Extrait les liens vers les pages de détail."""
        links = []
        # BookYogaRetreats utilise des cartes avec des liens vers les venues
        for card in soup.select("a[href*='/venues/'], a[href*='/retreat-center/']"):
            href = card.get("href", "")
            if href and href not in links:
                links.append(href)

        # Aussi chercher les liens dans des divs de résultats
        for card in soup.select(".listing-card a, .result-card a, .venue-card a"):
            href = card.get("href", "")
            if href and href not in links:
                links.append(href)

        return links

    def _has_next_page(self, soup: BeautifulSoup, current_page: int) -> bool:
        """Vérifie s'il y a une page suivante."""
        # Chercher un lien vers la page suivante
        next_page = current_page + 1
        for a in soup.select("a[href]"):
            href = a.get("href", "")
            if f"page={next_page}" in href:
                return True
        # Chercher les boutons "next"
        for a in soup.select(".pagination a, nav a"):
            text = a.get_text(strip=True).lower()
            if text in ("next", "›", "»", "suivant"):
                return True
        return False

    def _scrape_detail_page(
        self, url: str, country_code: str
    ) -> Optional[RetreatVenueListing]:
        """Scrape une page de détail sur bookyogaretreats.com."""
        try:
            response = self._rate_limited_get(url)
            soup = BeautifulSoup(response.text, "lxml")
        except Exception as e:
            print(f"    Erreur détail {url}: {e}")
            return None

        # Nom
        name_tag = soup.select_one("h1, .venue-name, .listing-title")
        name = name_tag.get_text(strip=True) if name_tag else ""
        if not name:
            return None

        # Description
        description = ""
        for sel in [".venue-description", ".description", ".about", "[class*='description']"]:
            desc_el = soup.select_one(sel)
            if desc_el:
                description = desc_el.get_text(separator=" ", strip=True)
                break

        if not description:
            # Chercher dans les paragraphes principaux
            main_content = soup.select_one("main, .content, article")
            if main_content:
                paragraphs = main_content.select("p")
                description = " ".join(p.get_text(strip=True) for p in paragraphs[:3])

        # Localisation
        city = None
        region = None
        for sel in [".location", ".address", "[class*='location']", ".venue-location"]:
            loc_el = soup.select_one(sel)
            if loc_el:
                loc_text = loc_el.get_text(strip=True)
                parts = [p.strip() for p in loc_text.split(",")]
                if len(parts) >= 2:
                    city = parts[0]
                    region = parts[1]
                elif parts:
                    city = parts[0]
                break

        # Coordonnées
        latitude, longitude = self._extract_coordinates(soup)

        # Images
        images = self._extract_images(soup)

        # Contact
        website = self._extract_website(soup)
        email = self._extract_email_from_page(soup)
        phone = self._extract_phone_from_page(soup)

        # Avis
        rating, rating_count = self._extract_ratings(soup)

        # Capacité
        capacity_min, capacity_max = self._extract_capacity(soup)

        # Repas
        meal_service = self._extract_meal_service(soup)
        cuisine_options = self._extract_cuisine(soup)

        # Espaces
        activity_spaces = self._extract_activity_spaces(soup)
        outdoor_spaces = self._extract_outdoor_spaces(soup)

        # Hébergement
        accommodation_types = self._extract_accommodation(soup)

        # Types de retraites
        suitable_for = self._extract_suitable_for(soup)

        venue_id = self._generate_venue_id(url)

        return RetreatVenueListing(
            id=venue_id,
            source="bookyogaretreats.com",
            source_url=url,
            name=name,
            description=description or f"Lieu de retraite {name}",
            country=country_code,
            region=region,
            city=city,
            latitude=latitude,
            longitude=longitude,
            images=images[:15],
            website=website,
            contact_email=email,
            contact_phone=phone,
            rating_average=rating,
            rating_count=rating_count,
            capacity_min=capacity_min,
            capacity_max=capacity_max,
            meal_service=meal_service,
            cuisine_options=cuisine_options,
            activity_spaces=activity_spaces,
            outdoor_spaces=outdoor_spaces,
            accommodation_types=accommodation_types,
            suitable_for=suitable_for,
            currency="EUR" if country_code in ("FR", "ES", "PT", "IT", "GR", "DE", "HR") else None,
            original_language="en",
        )

    def _extract_coordinates(self, soup: BeautifulSoup) -> tuple[Optional[float], Optional[float]]:
        """Extrait les coordonnées GPS."""
        # Data attributes sur les éléments de carte
        for sel in ["[data-lat]", "[data-latitude]", ".map"]:
            el = soup.select_one(sel)
            if el:
                lat = el.get("data-lat") or el.get("data-latitude")
                lng = el.get("data-lng") or el.get("data-longitude") or el.get("data-lon")
                if lat and lng:
                    try:
                        return float(lat), float(lng)
                    except (TypeError, ValueError):
                        pass

        # Chercher dans les scripts
        for script in soup.select("script"):
            text = script.string or ""
            lat_match = re.search(r'"lat(?:itude)?"\s*:\s*(-?\d+\.?\d*)', text)
            lng_match = re.search(r'"lng|lon(?:gitude)?"\s*:\s*(-?\d+\.?\d*)', text)
            if lat_match and lng_match:
                try:
                    return float(lat_match.group(1)), float(lng_match.group(1))
                except ValueError:
                    pass

        return None, None

    def _extract_images(self, soup: BeautifulSoup) -> list[str]:
        """Extrait les images de la page."""
        images = []
        # Galerie d'images
        for img in soup.select(
            ".gallery img, .photos img, .venue-photos img, "
            ".carousel img, [class*='gallery'] img, [class*='photo'] img"
        ):
            src = img.get("data-src") or img.get("data-lazy-src") or img.get("src", "")
            if src and not src.endswith(".svg") and "logo" not in src.lower() and "icon" not in src.lower():
                full_url = urljoin(self.base_url, src)
                if full_url not in images:
                    images.append(full_url)

        # Fallback : toutes les grandes images
        if not images:
            for img in soup.select("img"):
                src = img.get("data-src") or img.get("src", "")
                width = img.get("width", "0")
                try:
                    if int(width) >= 300:
                        full_url = urljoin(self.base_url, src)
                        if full_url not in images:
                            images.append(full_url)
                except (ValueError, TypeError):
                    pass

        return images

    def _extract_website(self, soup: BeautifulSoup) -> Optional[str]:
        """Extrait le site web du lieu."""
        for a in soup.select("a[href]"):
            text = a.get_text(strip=True).lower()
            href = a.get("href", "")
            if any(kw in text for kw in ["website", "site web", "visit site", "official site"]):
                if href.startswith("http") and "bookyogaretreats" not in href:
                    return href
        return None

    def _extract_email_from_page(self, soup: BeautifulSoup) -> Optional[str]:
        """Extrait l'email."""
        for a in soup.select("a[href^='mailto:']"):
            email = a["href"].replace("mailto:", "").split("?")[0]
            if "@" in email:
                return email
        text = soup.get_text()
        match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
        return match.group(0) if match else None

    def _extract_phone_from_page(self, soup: BeautifulSoup) -> Optional[str]:
        """Extrait le téléphone."""
        for a in soup.select("a[href^='tel:']"):
            return a["href"].replace("tel:", "").strip()
        return None

    def _extract_ratings(self, soup: BeautifulSoup) -> tuple[Optional[float], Optional[int]]:
        """Extrait la note et le nombre d'avis."""
        rating = None
        count = None

        for el in soup.select("[class*='rating'], [itemprop='ratingValue']"):
            text = el.get("content") or el.get_text(strip=True)
            match = re.search(r"(\d+\.?\d*)", text)
            if match:
                val = float(match.group(1))
                if val <= 5:
                    rating = val
                break

        for el in soup.select("[class*='review-count'], [itemprop='reviewCount']"):
            text = el.get("content") or el.get_text(strip=True)
            match = re.search(r"(\d+)", text)
            if match:
                count = int(match.group(1))
                break

        return rating, count

    def _extract_capacity(self, soup: BeautifulSoup) -> tuple[Optional[int], Optional[int]]:
        """Extrait la capacité."""
        text = soup.get_text()
        match = re.search(r"(\d+)\s*[-–to]\s*(\d+)\s*(?:guests?|personnes?|people|participants?)", text, re.IGNORECASE)
        if match:
            return int(match.group(1)), int(match.group(2))
        match = re.search(r"(?:capacity|up to|accommodates?|max)\s*:?\s*(\d+)", text, re.IGNORECASE)
        if match:
            return None, int(match.group(1))
        return None, None

    def _extract_meal_service(self, soup: BeautifulSoup) -> Optional[str]:
        """Extrait le type de service repas."""
        text = soup.get_text().lower()
        if "full board" in text or "pension complète" in text or "3 meals" in text:
            return "full_board"
        if "half board" in text or "demi-pension" in text:
            return "half_board"
        if "breakfast" in text or "petit-déjeuner" in text:
            return "breakfast_only"
        if "self-catering" in text or "self catering" in text or "kitchen" in text:
            return "self_catering"
        return None

    def _extract_cuisine(self, soup: BeautifulSoup) -> list[str]:
        """Extrait les options de cuisine."""
        options = []
        text = soup.get_text().lower()
        cuisine_map = {
            "vegetarian": "vegetarian", "végétarien": "vegetarian",
            "vegan": "vegan", "végan": "vegan",
            "organic": "organic", "bio": "organic",
            "gluten-free": "gluten_free", "gluten free": "gluten_free",
            "ayurvedic": "ayurvedic", "ayurvédique": "ayurvedic",
            "raw": "raw", "cru": "raw",
            "local": "local_seasonal",
        }
        for keyword, tag in cuisine_map.items():
            if keyword in text and tag not in options:
                options.append(tag)
        return options

    def _extract_activity_spaces(self, soup: BeautifulSoup) -> list[str]:
        """Extrait les espaces d'activité."""
        spaces = []
        text = soup.get_text().lower()
        space_map = {
            "yoga studio": "yoga_studio", "yoga shala": "yoga_studio",
            "meditation hall": "meditation_hall", "meditation room": "meditation_hall",
            "outdoor deck": "outdoor_deck", "outdoor platform": "outdoor_deck",
            "workshop room": "workshop_room", "workshop space": "workshop_room",
            "ceremony space": "ceremony_space",
            "healing room": "healing_room", "treatment room": "healing_room",
        }
        for keyword, tag in space_map.items():
            if keyword in text and tag not in spaces:
                spaces.append(tag)
        return spaces

    def _extract_outdoor_spaces(self, soup: BeautifulSoup) -> list[str]:
        """Extrait les espaces extérieurs."""
        spaces = []
        text = soup.get_text().lower()
        outdoor_map = {
            "pool": "pool", "piscine": "pool",
            "garden": "garden", "jardin": "garden",
            "hot tub": "hot_tub", "jacuzzi": "hot_tub",
            "sauna": "sauna",
            "beach": "beach_access", "plage": "beach_access",
            "terrace": "terrace", "terrasse": "terrace",
            "fire pit": "fire_pit",
            "hiking": "hiking_trails", "randonnée": "hiking_trails",
        }
        for keyword, tag in outdoor_map.items():
            if keyword in text and tag not in spaces:
                spaces.append(tag)
        return spaces

    def _extract_accommodation(self, soup: BeautifulSoup) -> list[str]:
        """Extrait les types d'hébergement."""
        types = []
        text = soup.get_text().lower()
        accom_map = {
            "private room": "private_room", "chambre privée": "private_room",
            "shared room": "shared_room", "chambre partagée": "shared_room",
            "dormitory": "dormitory", "dortoir": "dormitory",
            "bungalow": "bungalow",
            "tent": "tent", "tente": "tent",
            "glamping": "glamping",
            "cabin": "cabin", "cabane": "cabin",
            "suite": "suite",
            "apartment": "apartment",
            "villa": "villa",
        }
        for keyword, tag in accom_map.items():
            if keyword in text and tag not in types:
                types.append(tag)
        return types

    def _extract_suitable_for(self, soup: BeautifulSoup) -> list[str]:
        """Extrait les types de retraites adaptés."""
        suitable = []
        text = soup.get_text().lower()
        keyword_map = {
            "yoga": "yoga",
            "meditation": "meditation",
            "mindfulness": "meditation",
            "silent retreat": "silent_retreat",
            "detox": "detox",
            "fasting": "fasting",
            "breathwork": "breathwork",
            "pranayama": "breathwork",
            "dance": "dance",
            "writing": "writing",
            "art": "art",
            "pilates": "pilates",
            "teacher training": "teacher_training",
            "sound healing": "sound_healing",
            "tantra": "tantra",
        }
        for keyword, tag in keyword_map.items():
            if keyword in text and tag not in suitable:
                suitable.append(tag)
        return suitable
