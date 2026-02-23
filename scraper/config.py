import os

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Scraping settings
REQUEST_DELAY = 2  # seconds between requests to same domain
USER_AGENT = "CohabitatEurope/1.0 (collaborative housing search project)"
REQUEST_TIMEOUT = 15  # seconds

# Output paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
LISTINGS_FILE = os.path.join(DATA_DIR, "listings.json")
EVALUATIONS_FILE = os.path.join(DATA_DIR, "evaluations.json")
TAGS_FILE = os.path.join(DATA_DIR, "tags.json")

# Target countries for scraping
TARGET_COUNTRIES = ["BE", "FR", "ES", "PT", "NL", "CH", "LU"]

# All French departments (metropolitan + Corsica)
ALL_DEPARTMENTS_FR = {
    "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence",
    "05": "Hautes-Alpes", "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes",
    "09": "Ariège", "10": "Aube", "11": "Aude", "12": "Aveyron",
    "13": "Bouches-du-Rhône", "14": "Calvados", "15": "Cantal", "16": "Charente",
    "17": "Charente-Maritime", "18": "Cher", "19": "Corrèze", "21": "Côte-d'Or",
    "22": "Côtes-d'Armor", "23": "Creuse", "24": "Dordogne", "25": "Doubs",
    "26": "Drôme", "27": "Eure", "28": "Eure-et-Loir", "29": "Finistère",
    "2A": "Corse-du-Sud", "2B": "Haute-Corse",
    "30": "Gard", "31": "Haute-Garonne", "32": "Gers", "33": "Gironde",
    "34": "Hérault", "35": "Ille-et-Vilaine", "36": "Indre", "37": "Indre-et-Loire",
    "38": "Isère", "39": "Jura", "40": "Landes", "41": "Loir-et-Cher",
    "42": "Loire", "43": "Haute-Loire", "44": "Loire-Atlantique", "45": "Loiret",
    "46": "Lot", "47": "Lot-et-Garonne", "48": "Lozère", "49": "Maine-et-Loire",
    "50": "Manche", "51": "Marne", "52": "Haute-Marne", "53": "Mayenne",
    "54": "Meurthe-et-Moselle", "55": "Meuse", "56": "Morbihan", "57": "Moselle",
    "58": "Nièvre", "59": "Nord", "60": "Oise", "61": "Orne",
    "62": "Pas-de-Calais", "63": "Puy-de-Dôme", "64": "Pyrénées-Atlantiques",
    "65": "Hautes-Pyrénées", "66": "Pyrénées-Orientales", "67": "Bas-Rhin",
    "68": "Haut-Rhin", "69": "Rhône", "70": "Haute-Saône", "71": "Saône-et-Loire",
    "72": "Sarthe", "73": "Savoie", "74": "Haute-Savoie", "75": "Paris",
    "76": "Seine-Maritime", "77": "Seine-et-Marne", "78": "Yvelines",
    "79": "Deux-Sèvres", "80": "Somme", "81": "Tarn", "82": "Tarn-et-Garonne",
    "83": "Var", "84": "Vaucluse", "85": "Vendée", "86": "Vienne",
    "87": "Haute-Vienne", "88": "Vosges", "89": "Yonne", "90": "Territoire de Belfort",
    "91": "Essonne", "92": "Hauts-de-Seine", "93": "Seine-Saint-Denis",
    "94": "Val-de-Marne", "95": "Val-d'Oise",
}

# Spanish autonomous communities
SPAIN_COMMUNITIES = {
    "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias",
    "Cantabria", "Castilla-La Mancha", "Castilla y León", "Cataluña",
    "Extremadura", "Galicia", "La Rioja", "Madrid", "Murcia",
    "Navarra", "País Vasco", "Valencia",
}

# === Apartment search configuration ===

APARTMENTS_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "apartments")
APARTMENTS_LISTINGS_FILE = os.path.join(APARTMENTS_DATA_DIR, "listings.json")
APARTMENTS_EVALUATIONS_FILE = os.path.join(APARTMENTS_DATA_DIR, "evaluations.json")

APARTMENT_REQUEST_DELAY = 3  # seconds between requests (more respectful for Immoweb)

APARTMENT_CRITERIA_PROMPT = """Tu es un assistant spécialisé dans la recherche d'appartements à louer à Bruxelles.
Tu dois évaluer si une annonce d'appartement correspond aux critères d'une personne
qui cherche un appartement à louer. Réponds TOUJOURS en français.

Les critères de recherche sont les suivants:

CRITÈRES PRIMAIRES (les plus importants):
1. Budget: loyer mensuel idéal entre 800 et 1300 EUR (charges comprises si possible)
2. Chambres: minimum 2 chambres (obligatoire)
3. Proximité d'Ixelles (XL): idéalement dans Ixelles ou communes adjacentes
   (Saint-Gilles, Etterbeek, Watermael-Boitsfort, Auderghem, Woluwe-Saint-Pierre, Forest)
4. Surface: minimum 60m², idéalement 70-90m²

CRITÈRES SECONDAIRES:
5. Bon état / PEB décent (A, B, C idéalement)
6. Équipements: balcon ou terrasse, parking
7. Bien desservi en transports en commun (métro, tram, bus)
8. Bon rapport qualité-prix global

À ÉVITER:
- Appartements avec moins de 2 chambres
- Prix > 1800 EUR/mois
- Communes très éloignées d'Ixelles (Ganshoren, Berchem-Sainte-Agathe, Molenbeek)"""
