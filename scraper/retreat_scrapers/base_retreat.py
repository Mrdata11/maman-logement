"""Classe de base pour les scrapers de lieux de retraite.

Étend BaseScraper avec des helpers spécifiques aux venues :
géocodage, génération d'ID, mapping vers RetreatVenueListing.
"""

import hashlib
import time
from abc import abstractmethod
from typing import Optional, Tuple

import requests

from scraper.scrapers.base import BaseScraper
from scraper.retreat_scrapers.retreat_models import RetreatVenueListing
from scraper.retreat_config import REQUEST_DELAY, USER_AGENT, REQUEST_TIMEOUT


class BaseRetreatScraper(BaseScraper):
    """Classe de base pour tous les scrapers de lieux de retraite."""

    name: str = ""
    base_url: str = ""

    def __init__(self):
        super().__init__()
        self._geocode_cache: dict[str, Optional[Tuple[float, float]]] = {}

    @abstractmethod
    def scrape(self) -> list[RetreatVenueListing]:
        """Scrape les lieux de retraite et retourne une liste de RetreatVenueListing."""
        pass

    @staticmethod
    def _generate_venue_id(source_url: str) -> str:
        """Génère un ID unique et stable à partir de l'URL source via MD5."""
        return hashlib.md5(source_url.encode()).hexdigest()[:12]

    def _geocode(self, address: str) -> Optional[Tuple[float, float]]:
        """Géocode une adresse via Nominatim (gratuit, sans clé API).

        Retourne (latitude, longitude) ou None si non trouvé.
        Utilise un cache en mémoire pour éviter les requêtes dupliquées.
        Respecte la politique Nominatim : max 1 requête/seconde.
        """
        if address in self._geocode_cache:
            return self._geocode_cache[address]

        try:
            time.sleep(1.1)  # Respect Nominatim rate limit (1 req/s)
            response = requests.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": address,
                    "format": "json",
                    "limit": 1,
                    "addressdetails": 1,
                },
                headers={"User-Agent": USER_AGENT},
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            results = response.json()

            if results:
                lat = float(results[0]["lat"])
                lon = float(results[0]["lon"])
                self._geocode_cache[address] = (lat, lon)
                return (lat, lon)
        except Exception as e:
            print(f"  [geocode] Erreur pour '{address}': {e}")

        self._geocode_cache[address] = None
        return None

    def _extract_country_from_address(self, address_components: dict) -> Optional[str]:
        """Extrait le code pays ISO 2 lettres depuis des composants d'adresse Google."""
        country_map = {
            "France": "FR",
            "Spain": "ES",
            "Portugal": "PT",
            "Italy": "IT",
            "Greece": "GR",
            "Morocco": "MA",
            "Croatia": "HR",
            "Montenegro": "ME",
            "Turkey": "TR",
            "United Kingdom": "GB",
            "Germany": "DE",
            "Thailand": "TH",
            "Indonesia": "ID",
            "Costa Rica": "CR",
            "Sri Lanka": "LK",
            "India": "IN",
            "Mexico": "MX",
        }
        for component in address_components:
            if "country" in component.get("types", []):
                long_name = component.get("long_name", "")
                return country_map.get(long_name, long_name[:2].upper())
        return None

    def _normalize_price(self, price_str: Optional[str]) -> Optional[float]:
        """Normalise une chaîne de prix en nombre flottant (EUR)."""
        if not price_str:
            return None
        import re
        # Retirer les symboles de devise et espaces
        cleaned = re.sub(r"[€$£\s,]", "", price_str)
        # Remplacer la virgule décimale par un point
        cleaned = cleaned.replace(",", ".")
        try:
            return float(cleaned)
        except ValueError:
            return None
