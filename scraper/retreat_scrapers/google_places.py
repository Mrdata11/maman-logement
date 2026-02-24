"""Scraper Google Places API (New) pour les lieux de retraite.

Utilise l'API Text Search pour trouver des lieux par catégorie × ville,
puis Place Details pour les informations de contact.
"""

import time
from typing import Optional

import requests

from scraper.retreat_scrapers.base_retreat import BaseRetreatScraper
from scraper.retreat_scrapers.retreat_models import RetreatVenueListing
from scraper.retreat_config import (
    GOOGLE_PLACES_API_KEY,
    GOOGLE_PLACES_DELAY,
    SEARCH_CATEGORIES,
    TARGET_COUNTRIES,
)


class GooglePlacesScraper(BaseRetreatScraper):
    """Scraper utilisant Google Places API (New) Text Search."""

    name = "Google Places API"
    base_url = "https://places.googleapis.com/v1"

    def __init__(self, priority_max: int = 3):
        """
        Args:
            priority_max: Niveau de priorité maximum des pays à scraper (1, 2, ou 3).
        """
        super().__init__()
        self.priority_max = priority_max
        self._seen_place_ids: set[str] = set()

    def scrape(self) -> list[RetreatVenueListing]:
        """Scrape les lieux de retraite via Google Places API."""
        if not GOOGLE_PLACES_API_KEY:
            print("  [google_places] GOOGLE_PLACES_API_KEY non définie, scraping ignoré.")
            return []

        venues: list[RetreatVenueListing] = []

        # Construire la matrice catégorie × ville
        search_pairs = self._build_search_pairs()
        total = len(search_pairs)
        print(f"  [google_places] {total} combinaisons catégorie × ville à explorer")

        for i, (query, city, country_code) in enumerate(search_pairs):
            print(f"  [google_places] {i+1}/{total}: '{query}' près de {city} ({country_code})")
            try:
                results = self._text_search(query, city, country_code)
                for place in results:
                    place_id = place.get("id", "")
                    if place_id in self._seen_place_ids:
                        continue
                    self._seen_place_ids.add(place_id)

                    venue = self._place_to_venue(place, country_code)
                    if venue:
                        venues.append(venue)
            except Exception as e:
                print(f"  [google_places] Erreur pour '{query}' ({city}): {e}")

            time.sleep(GOOGLE_PLACES_DELAY)

        print(f"  [google_places] Total: {len(venues)} lieux trouvés")
        return venues

    def _build_search_pairs(self) -> list[tuple[str, str, str]]:
        """Construit la liste de paires (query, city, country_code) à explorer."""
        pairs = []
        for country_code, country_info in TARGET_COUNTRIES.items():
            if country_info["priority"] > self.priority_max:
                continue
            cities = country_info["cities"]
            # Utiliser les catégories dans la langue appropriée
            lang = self._country_to_language(country_code)
            categories = SEARCH_CATEGORIES.get(lang, SEARCH_CATEGORIES["en"])
            for category in categories:
                for city in cities:
                    pairs.append((category, city, country_code))
        return pairs

    @staticmethod
    def _country_to_language(country_code: str) -> str:
        """Retourne la langue de recherche pour un pays donné."""
        lang_map = {
            "FR": "fr", "MA": "fr",
            "ES": "es", "MX": "es", "CR": "es",
            "PT": "pt",
        }
        return lang_map.get(country_code, "en")

    def _text_search(
        self, query: str, city: str, country_code: str
    ) -> list[dict]:
        """Effectue une recherche textuelle via Google Places API (New).

        Gère la pagination via next_page_token.
        """
        all_results: list[dict] = []
        full_query = f"{query} {city}"

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": (
                "places.id,places.displayName,places.formattedAddress,"
                "places.location,places.websiteUri,places.internationalPhoneNumber,"
                "places.rating,places.userRatingCount,places.photos,"
                "places.types,places.editorialSummary,places.addressComponents,"
                "places.googleMapsUri"
            ),
        }

        payload = {
            "textQuery": full_query,
            "maxResultCount": 20,
        }

        try:
            response = requests.post(
                f"{self.base_url}/places:searchText",
                json=payload,
                headers=headers,
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            places = data.get("places", [])
            all_results.extend(places)

        except requests.exceptions.HTTPError as e:
            print(f"  [google_places] Erreur HTTP: {e}")
        except Exception as e:
            print(f"  [google_places] Erreur: {e}")

        return all_results

    def _get_place_details(self, place_id: str) -> Optional[dict]:
        """Récupère les détails d'un lieu via Place Details (New)."""
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": (
                "id,displayName,formattedAddress,location,websiteUri,"
                "internationalPhoneNumber,rating,userRatingCount,"
                "editorialSummary,addressComponents,photos,types,"
                "currentOpeningHours,googleMapsUri,reviews"
            ),
        }

        try:
            time.sleep(GOOGLE_PLACES_DELAY)
            response = requests.get(
                f"{self.base_url}/places/{place_id}",
                headers=headers,
                timeout=15,
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"  [google_places] Erreur détails pour {place_id}: {e}")
            return None

    def _place_to_venue(
        self, place: dict, default_country: str
    ) -> Optional[RetreatVenueListing]:
        """Convertit un résultat Google Places en RetreatVenueListing."""
        display_name = place.get("displayName", {})
        name = display_name.get("text", "")
        if not name:
            return None

        # URL source = Google Maps URI ou construite depuis place_id
        google_maps_uri = place.get("googleMapsUri", "")
        source_url = google_maps_uri or f"https://www.google.com/maps/place/?q=place_id:{place.get('id', '')}"

        # Localisation
        location = place.get("location", {})
        latitude = location.get("latitude")
        longitude = location.get("longitude")

        # Adresse
        formatted_address = place.get("formattedAddress", "")
        address_components = place.get("addressComponents", [])

        # Extraire pays, région, ville
        country = default_country
        region = None
        city = None
        for comp in address_components:
            types = comp.get("types", [])
            if "country" in types:
                country_name = comp.get("longText", "")
                mapped = self._extract_country_from_address(
                    [{"types": ["country"], "long_name": country_name}]
                )
                if mapped:
                    country = mapped
            if "administrative_area_level_1" in types:
                region = comp.get("longText")
            if "locality" in types:
                city = comp.get("longText")

        # Description
        editorial = place.get("editorialSummary", {})
        description = editorial.get("text", "")
        if not description:
            description = f"Lieu de retraite à {city or formatted_address}"

        # Contact
        website = place.get("websiteUri")
        phone = place.get("internationalPhoneNumber")

        # Avis
        rating = place.get("rating")
        rating_count = place.get("userRatingCount")

        # Photos (extraire les URIs des photos)
        photos = place.get("photos", [])
        image_urls = []
        for photo in photos[:10]:
            photo_name = photo.get("name", "")
            if photo_name:
                # Construire l'URL de la photo via l'API
                photo_url = (
                    f"{self.base_url}/{photo_name}/media"
                    f"?key={GOOGLE_PLACES_API_KEY}&maxWidthPx=800"
                )
                image_urls.append(photo_url)

        venue_id = self._generate_venue_id(source_url)

        return RetreatVenueListing(
            id=venue_id,
            source="google_places",
            source_url=source_url,
            name=name,
            description=description,
            country=country,
            region=region,
            city=city,
            latitude=latitude,
            longitude=longitude,
            website=website,
            contact_phone=phone,
            rating_average=rating,
            rating_count=rating_count,
            images=image_urls,
            original_language=self._country_to_language(country) if country else "en",
        )
