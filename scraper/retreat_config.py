"""Configuration pour le pipeline de scraping de lieux de retraite."""

import os

# === API Keys ===
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
GOOGLE_PLACES_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")

# === Scraping settings ===
REQUEST_DELAY = 2  # secondes entre les requêtes (même domaine)
GOOGLE_PLACES_DELAY = 2  # secondes entre les requêtes Google Places
USER_AGENT = "RetreatVenueFinder/1.0 (retreat venue directory project)"
REQUEST_TIMEOUT = 15  # secondes

# === Output paths ===
RETREAT_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "retreats")
RETREAT_VENUES_DIR = os.path.join(RETREAT_DATA_DIR, "venues")
RETREAT_INDEX_FILE = os.path.join(RETREAT_VENUES_DIR, "index.json")
RETREAT_EVALUATIONS_FILE = os.path.join(RETREAT_DATA_DIR, "evaluations.json")
RETREAT_TAGS_FILE = os.path.join(RETREAT_DATA_DIR, "tags.json")
OUTREACH_FILE = os.path.join(RETREAT_DATA_DIR, "outreach.json")

# Ancien format (pour backward compat)
RETREAT_VENUES_FILE = os.path.join(RETREAT_DATA_DIR, "venues.json")

# === Catégories de recherche Google Places ===
# Mots-clés multilingues pour trouver des lieux de retraite
SEARCH_CATEGORIES = {
    "fr": [
        "lieu de retraite yoga",
        "centre de retraite spirituelle",
        "lieu de séminaire bien-être",
        "gîte de groupe yoga",
        "domaine pour retraite",
        "mas pour retraite",
        "centre de méditation",
        "lieu de stage yoga",
        "hébergement groupe retraite",
        "centre holistique retraite",
    ],
    "en": [
        "yoga retreat center",
        "meditation retreat venue",
        "wellness retreat center",
        "spiritual retreat house",
        "group retreat accommodation",
        "retreat venue hire",
        "holistic retreat center",
        "mindfulness retreat venue",
    ],
    "es": [
        "centro de retiro yoga",
        "casa de retiro espiritual",
        "centro de meditación",
        "finca para retiros",
        "alojamiento retiro bienestar",
        "centro holístico retiro",
    ],
    "pt": [
        "centro de retiro yoga",
        "casa de retiro espiritual",
        "centro de meditação",
        "quinta para retiros",
        "alojamento retiro bem-estar",
    ],
}

# === Pays cibles avec niveaux de priorité et villes principales ===
TARGET_COUNTRIES = {
    # Priorité 1 — Marchés principaux (Europe du Sud + Maroc)
    "FR": {
        "priority": 1,
        "name": "France",
        "cities": [
            "Aix-en-Provence", "Avignon", "Biarritz", "Bordeaux", "Carcassonne",
            "Montpellier", "Nice", "Perpignan", "Toulouse", "Arles",
            "Annecy", "Chamonix", "Lourdes", "Pau", "Narbonne",
            "Draguignan", "Grasse", "Uzès", "Apt", "Gordes",
        ],
    },
    "ES": {
        "priority": 1,
        "name": "Espagne",
        "cities": [
            "Ibiza", "Málaga", "Granada", "Tarifa", "Valencia",
            "Barcelona", "Alicante", "Dénia", "Marbella", "Cádiz",
            "Mallorca", "Fuerteventura", "Lanzarote", "Tenerife",
            "Sitges", "Ronda", "Nerja", "Moraira",
        ],
    },
    "PT": {
        "priority": 1,
        "name": "Portugal",
        "cities": [
            "Algarve", "Sintra", "Cascais", "Ericeira", "Peniche",
            "Comporta", "Évora", "Lagos", "Tavira", "Sagres",
            "Aljezur", "Monchique", "Setúbal", "Coimbra",
        ],
    },
    "IT": {
        "priority": 1,
        "name": "Italie",
        "cities": [
            "Toscana", "Umbria", "Puglia", "Sicilia", "Sardegna",
            "Amalfi", "Assisi", "Orvieto", "Siena", "Cortona",
            "Lecce", "Ostuni", "Taormina", "Perugia",
        ],
    },
    "GR": {
        "priority": 1,
        "name": "Grèce",
        "cities": [
            "Crete", "Santorini", "Mykonos", "Naxos", "Paros",
            "Lefkada", "Corfu", "Zakynthos", "Pelion", "Rhodes",
            "Ikaria", "Skiathos", "Kalymnos",
        ],
    },
    "MA": {
        "priority": 1,
        "name": "Maroc",
        "cities": [
            "Marrakech", "Essaouira", "Agadir", "Taghazout",
            "Ouarzazate", "Fès", "Chefchaouen", "Merzouga",
            "Tamraght", "Imlil",
        ],
    },
    # Priorité 2 — Marchés secondaires
    "HR": {
        "priority": 2,
        "name": "Croatie",
        "cities": [
            "Hvar", "Dubrovnik", "Split", "Istria", "Korčula",
        ],
    },
    "ME": {
        "priority": 2,
        "name": "Monténégro",
        "cities": [
            "Kotor", "Budva", "Tivat", "Herceg Novi",
        ],
    },
    "TR": {
        "priority": 2,
        "name": "Turquie",
        "cities": [
            "Antalya", "Fethiye", "Bodrum", "Cappadoce", "Ölüdeniz",
        ],
    },
    "GB": {
        "priority": 2,
        "name": "Royaume-Uni",
        "cities": [
            "Cornwall", "Devon", "Cotswolds", "Lake District", "Somerset",
            "Glastonbury", "Totnes", "Findhorn",
        ],
    },
    "DE": {
        "priority": 2,
        "name": "Allemagne",
        "cities": [
            "Allgäu", "Schwarzwald", "Bayern", "Bodensee",
        ],
    },
    # Priorité 3 — Destinations lointaines populaires
    "TH": {
        "priority": 3,
        "name": "Thaïlande",
        "cities": [
            "Koh Phangan", "Koh Samui", "Chiang Mai", "Pai", "Koh Lanta",
        ],
    },
    "ID": {
        "priority": 3,
        "name": "Bali / Indonésie",
        "cities": [
            "Ubud", "Canggu", "Amed", "Munduk", "Sidemen",
        ],
    },
    "CR": {
        "priority": 3,
        "name": "Costa Rica",
        "cities": [
            "Nosara", "Santa Teresa", "Uvita", "Montezuma", "Dominical",
        ],
    },
    "LK": {
        "priority": 3,
        "name": "Sri Lanka",
        "cities": [
            "Unawatuna", "Ella", "Kandy", "Weligama", "Tangalle",
        ],
    },
    "IN": {
        "priority": 3,
        "name": "Inde",
        "cities": [
            "Rishikesh", "Goa", "Dharamsala", "Kerala", "Mysore",
        ],
    },
    "MX": {
        "priority": 3,
        "name": "Mexique",
        "cities": [
            "Tulum", "Sayulita", "Oaxaca", "San Cristóbal de las Casas",
        ],
    },
}

# === Rate limiting ===
RATE_LIMIT_SETTINGS = {
    "google_places": {
        "delay": GOOGLE_PLACES_DELAY,
        "max_per_minute": 20,
    },
    "retreat_guru": {
        "delay": 3,
        "max_per_minute": 15,
    },
    "bookyogaretreats": {
        "delay": 3,
        "max_per_minute": 15,
    },
}
