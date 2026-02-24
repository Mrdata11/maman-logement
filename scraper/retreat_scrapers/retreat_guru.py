"""Scraper pour retreat.guru — annuaire de centres de retraite.

URL de base : https://retreat.guru/search?type=retreat-center&country={country}
Parse les pages de listing puis les pages de détail de chaque lieu.
"""

import re
import time
from typing import Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from scraper.retreat_scrapers.base_retreat import BaseRetreatScraper
from scraper.retreat_scrapers.retreat_models import RetreatVenueListing, RetreatTestimonial
from scraper.retreat_config import TARGET_COUNTRIES, RATE_LIMIT_SETTINGS


class RetreatGuruScraper(BaseRetreatScraper):
    """Scraper pour retreat.guru."""

    name = "Retreat.guru"
    base_url = "https://retreat.guru"

    # Mapping des codes pays vers les slugs retreat.guru
    COUNTRY_SLUGS = {
        "FR": "france",
        "ES": "spain",
        "PT": "portugal",
        "IT": "italy",
        "GR": "greece",
        "MA": "morocco",
        "HR": "croatia",
        "ME": "montenegro",
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
        self._delay = RATE_LIMIT_SETTINGS["retreat_guru"]["delay"]

    def scrape(self) -> list[RetreatVenueListing]:
        """Scrape les centres de retraite depuis retreat.guru."""
        venues: list[RetreatVenueListing] = []
        countries_to_scrape = self._get_target_countries()

        for country_code, country_slug in countries_to_scrape:
            print(f"  [retreat.guru] Scraping {country_code} ({country_slug})...")
            try:
                country_venues = self._scrape_country(country_code, country_slug)
                venues.extend(country_venues)
                print(f"  [retreat.guru] {country_code}: {len(country_venues)} lieux trouvés")
            except Exception as e:
                print(f"  [retreat.guru] Erreur pour {country_code}: {e}")

        print(f"  [retreat.guru] Total: {len(venues)} lieux")
        return venues

    def _get_target_countries(self) -> list[tuple[str, str]]:
        """Retourne les paires (country_code, slug) à scraper selon la priorité."""
        result = []
        for code, info in TARGET_COUNTRIES.items():
            if info["priority"] <= self.priority_max:
                slug = self.COUNTRY_SLUGS.get(code)
                if slug:
                    result.append((code, slug))
        return result

    def _scrape_country(self, country_code: str, country_slug: str) -> list[RetreatVenueListing]:
        """Scrape toutes les pages de listing d'un pays."""
        venues: list[RetreatVenueListing] = []
        page = 1

        while True:
            url = f"{self.base_url}/search?type=retreat-center&country={country_slug}&page={page}"
            try:
                response = self._rate_limited_get(url)
                soup = BeautifulSoup(response.text, "lxml")

                # Trouver les cartes de lieux
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
                if not self._has_next_page(soup):
                    break
                page += 1

            except Exception as e:
                print(f"    Erreur page {page}: {e}")
                break

        return venues

    def _extract_listing_links(self, soup: BeautifulSoup) -> list[str]:
        """Extrait les liens vers les pages de détail depuis une page de listing."""
        links = []
        # retreat.guru utilise des cartes avec des liens vers /center/{slug}
        for card in soup.select("a[href*='/center/']"):
            href = card.get("href", "")
            if href and "/center/" in href and href not in links:
                links.append(href)
        return links

    def _has_next_page(self, soup: BeautifulSoup) -> bool:
        """Vérifie s'il y a une page suivante."""
        # Chercher un lien "Next" ou ">" dans la pagination
        pagination = soup.select(".pagination a, .pager a, nav[aria-label='pagination'] a")
        for link in pagination:
            text = link.get_text(strip=True).lower()
            if text in ("next", "›", "»", "suivant", ">"):
                return True
            # Aussi vérifier rel="next"
            if link.get("rel") and "next" in link.get("rel", []):
                return True
        return False

    def _scrape_detail_page(
        self, url: str, country_code: str
    ) -> Optional[RetreatVenueListing]:
        """Scrape une page de détail d'un lieu sur retreat.guru."""
        try:
            response = self._rate_limited_get(url)
            soup = BeautifulSoup(response.text, "lxml")
        except Exception as e:
            print(f"    Erreur détail {url}: {e}")
            return None

        # Nom
        name_tag = soup.select_one("h1")
        name = name_tag.get_text(strip=True) if name_tag else ""
        if not name:
            return None

        # Description
        description = ""
        desc_section = soup.select_one(
            ".description, .about-text, [class*='description'], .listing-description"
        )
        if desc_section:
            description = desc_section.get_text(separator=" ", strip=True)

        # Localisation
        city = None
        region = None
        location_tag = soup.select_one(
            ".location, .address, [class*='location']"
        )
        if location_tag:
            loc_text = location_tag.get_text(strip=True)
            parts = [p.strip() for p in loc_text.split(",")]
            if len(parts) >= 2:
                city = parts[0]
                region = parts[1]
            elif parts:
                city = parts[0]

        # Coordonnées GPS (souvent dans un data attribute ou script)
        latitude, longitude = self._extract_coordinates(soup)

        # Images
        images = []
        for img in soup.select("img[src*='retreat'], img[data-src*='retreat'], .gallery img"):
            src = img.get("data-src") or img.get("src", "")
            if src and not src.endswith(".svg") and "logo" not in src.lower():
                full_url = urljoin(self.base_url, src)
                if full_url not in images:
                    images.append(full_url)

        # Contact
        website = None
        website_link = soup.select_one("a[href*='http'][rel='nofollow'], a[class*='website']")
        if website_link:
            website = website_link.get("href")

        email = self._extract_email(soup)
        phone = self._extract_phone(soup)

        # Avis
        rating_average, rating_count = self._extract_ratings(soup)

        # Capacité
        capacity_min, capacity_max = self._extract_capacity(soup)

        # Prix
        price = self._extract_price(soup)

        # Types de retraites
        suitable_for = self._extract_suitable_for(soup)

        # Espaces
        activity_spaces = self._extract_activity_spaces(soup)

        # Style / cadre
        setting, style = self._extract_setting_style(soup)

        # Services
        services = self._extract_services(soup)

        venue_id = self._generate_venue_id(url)

        return RetreatVenueListing(
            id=venue_id,
            source="retreat.guru",
            source_url=url,
            name=name,
            description=description or f"Centre de retraite {name}",
            country=country_code,
            region=region,
            city=city,
            latitude=latitude,
            longitude=longitude,
            images=images[:15],
            website=website,
            contact_email=email,
            contact_phone=phone,
            rating_average=rating_average,
            rating_count=rating_count,
            capacity_min=capacity_min,
            capacity_max=capacity_max,
            price_per_person_per_night=price,
            currency="EUR" if country_code in ("FR", "ES", "PT", "IT", "GR", "DE", "HR", "ME") else None,
            suitable_for=suitable_for,
            activity_spaces=activity_spaces,
            setting=setting,
            style=style,
            services=services,
            original_language="en",
        )

    def _extract_coordinates(self, soup: BeautifulSoup) -> tuple[Optional[float], Optional[float]]:
        """Extrait les coordonnées GPS depuis la page."""
        # Chercher dans les data attributes
        map_el = soup.select_one("[data-lat][data-lng], [data-latitude][data-longitude]")
        if map_el:
            lat = map_el.get("data-lat") or map_el.get("data-latitude")
            lng = map_el.get("data-lng") or map_el.get("data-longitude")
            try:
                return float(lat), float(lng)
            except (TypeError, ValueError):
                pass

        # Chercher dans les scripts JSON
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

    def _extract_email(self, soup: BeautifulSoup) -> Optional[str]:
        """Extrait l'email depuis la page."""
        # Chercher mailto: links
        for a in soup.select("a[href^='mailto:']"):
            email = a["href"].replace("mailto:", "").split("?")[0]
            if "@" in email:
                return email
        # Chercher dans le texte
        text = soup.get_text()
        match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
        return match.group(0) if match else None

    def _extract_phone(self, soup: BeautifulSoup) -> Optional[str]:
        """Extrait le numéro de téléphone depuis la page."""
        for a in soup.select("a[href^='tel:']"):
            return a["href"].replace("tel:", "").strip()
        # Chercher dans le texte
        text = soup.get_text()
        match = re.search(r"\+?\d[\d\s\-().]{8,15}", text)
        return match.group(0).strip() if match else None

    def _extract_ratings(self, soup: BeautifulSoup) -> tuple[Optional[float], Optional[int]]:
        """Extrait la note moyenne et le nombre d'avis."""
        rating_el = soup.select_one("[class*='rating'], .stars, [itemprop='ratingValue']")
        count_el = soup.select_one("[class*='review-count'], [itemprop='reviewCount']")

        rating = None
        count = None

        if rating_el:
            text = rating_el.get("content") or rating_el.get_text(strip=True)
            match = re.search(r"(\d+\.?\d*)", text)
            if match:
                rating = float(match.group(1))

        if count_el:
            text = count_el.get("content") or count_el.get_text(strip=True)
            match = re.search(r"(\d+)", text)
            if match:
                count = int(match.group(1))

        return rating, count

    def _extract_capacity(self, soup: BeautifulSoup) -> tuple[Optional[int], Optional[int]]:
        """Extrait la capacité min/max."""
        text = soup.get_text()
        # Chercher des patterns comme "10-20 guests", "capacity: 30"
        match = re.search(r"(\d+)\s*[-–to]\s*(\d+)\s*(?:guests?|personnes?|people)", text, re.IGNORECASE)
        if match:
            return int(match.group(1)), int(match.group(2))
        match = re.search(r"(?:capacity|capacité|accommodates?)\s*:?\s*(\d+)", text, re.IGNORECASE)
        if match:
            return None, int(match.group(1))
        return None, None

    def _extract_price(self, soup: BeautifulSoup) -> Optional[float]:
        """Extrait le prix par personne par nuit."""
        text = soup.get_text()
        # Chercher patterns de prix
        match = re.search(r"(?:€|EUR)\s*(\d+)", text)
        if match:
            return float(match.group(1))
        match = re.search(r"(\d+)\s*(?:€|EUR)", text)
        if match:
            return float(match.group(1))
        return None

    def _extract_suitable_for(self, soup: BeautifulSoup) -> list[str]:
        """Extrait les types de retraites adaptés."""
        suitable = []
        text = soup.get_text().lower()
        keyword_map = {
            "yoga": "yoga",
            "meditation": "meditation",
            "mindfulness": "meditation",
            "silent": "silent_retreat",
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

    def _extract_activity_spaces(self, soup: BeautifulSoup) -> list[str]:
        """Extrait les espaces d'activité."""
        spaces = []
        text = soup.get_text().lower()
        space_map = {
            "yoga studio": "yoga_studio",
            "yoga shala": "yoga_studio",
            "meditation hall": "meditation_hall",
            "outdoor deck": "outdoor_deck",
            "workshop": "workshop_room",
            "ceremony": "ceremony_space",
            "healing room": "healing_room",
        }
        for keyword, tag in space_map.items():
            if keyword in text and tag not in spaces:
                spaces.append(tag)
        return spaces

    def _extract_setting_style(self, soup: BeautifulSoup) -> tuple[list[str], list[str]]:
        """Extrait le cadre et le style du lieu."""
        text = soup.get_text().lower()
        setting = []
        style = []

        setting_map = {
            "beach": "beach", "plage": "beach", "seaside": "beach",
            "mountain": "mountain", "montagne": "mountain",
            "forest": "forest", "forêt": "forest",
            "countryside": "countryside", "campagne": "countryside",
            "island": "island", "île": "island",
            "lake": "lake", "lac": "lake",
            "river": "riverside", "rivière": "riverside",
        }
        style_map = {
            "rustic": "rustic", "rustique": "rustic",
            "luxury": "luxury", "luxe": "luxury",
            "eco": "eco",
            "modern": "modern", "moderne": "modern",
            "bohemian": "bohemian", "boho": "bohemian",
            "spiritual": "spiritual", "spirituel": "spiritual",
            "boutique": "boutique",
            "minimalist": "minimalist",
            "traditional": "traditional", "traditionnel": "traditional",
        }

        for keyword, tag in setting_map.items():
            if keyword in text and tag not in setting:
                setting.append(tag)
        for keyword, tag in style_map.items():
            if keyword in text and tag not in style:
                style.append(tag)

        return setting, style

    def _extract_services(self, soup: BeautifulSoup) -> list[str]:
        """Extrait les services proposés."""
        services = []
        text = soup.get_text().lower()
        service_map = {
            "airport transfer": "airport_transfer",
            "navette": "airport_transfer",
            "yoga mat": "yoga_mats",
            "tapis de yoga": "yoga_mats",
            "cushion": "meditation_cushions",
            "sound system": "sound_system",
            "projector": "projector",
            "massage": "massage",
            "spa": "spa",
            "excursion": "excursions",
            "wi-fi": "wifi",
            "wifi": "wifi",
            "laundry": "laundry",
        }
        for keyword, tag in service_map.items():
            if keyword in text and tag not in services:
                services.append(tag)
        return services
