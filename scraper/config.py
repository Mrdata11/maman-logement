import os

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Scraping settings
REQUEST_DELAY = 2  # seconds between requests to same domain
USER_AGENT = "MamanLogement/1.0 (personal housing search project)"
REQUEST_TIMEOUT = 15  # seconds

# Output paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
LISTINGS_FILE = os.path.join(DATA_DIR, "listings.json")
EVALUATIONS_FILE = os.path.join(DATA_DIR, "evaluations.json")
TAGS_FILE = os.path.join(DATA_DIR, "tags.json")

CRITERIA_PROMPT = """Tu es un assistant spécialisé dans l'habitat groupé en Belgique.
Tu dois évaluer si une annonce de logement correspond aux critères d'une personne
qui cherche un habitat groupé. Réponds TOUJOURS en français.

Les critères de recherche sont les suivants (par ordre de priorité):

CRITÈRES PRIMAIRES (les plus importants):
1. Habitat groupé d'environ 50 personnes, communauté mature et bien fonctionnelle (pas à ses débuts)
2. Valeurs communes: respect, bienveillance, solidarité, partage de paroles et d'idées
3. Projets communs: potager, poulailler, four à pain, création, fromage, poterie, épicerie, centre de bien-être, stages de clowns, lieu d'accueil et d'écoute
4. Grande salle de 180-250m² avec parquet, baie vitrée face nature, rideaux, pour accueillir 30 biodanseurs
5. Location entre 500€ et 750€ charges comprises
6. Studio, grande pièce scindable en deux avec coin cuisine, OU deux pièces (chambre + séjour/cuisine), OU petit appartement une chambre
7. Parking pour voiture ET moto
8. Esprit biodanseur (biocentrique = la vie au centre), spirituel mais ancré, respect du vivant et de la nature
9. Charte existante, accueil capital, ouverture au monde extérieur ET autonomie possible
10. Activités communautaires: manger ensemble 1-2x/semaine minimum, jardiner ensemble, FAIRE DES CHOSES ENSEMBLE

CRITÈRES SECONDAIRES:
11. Proche de Bruxelles (30-45 minutes)
12. Proche d'un centre hospitalier en soins palliatifs pédiatriques (max 30 min en voiture)
13. Équilibre hommes/femmes, mélange travailleurs/pensionnés/célibataires/couples/enfants
14. Possibilité d'emploi: épicerie, administratif, gestion des réservations de la salle
15. Habitats légers possibles: tiny house, caravane, cabane dans les arbres
16. Proche d'un bois et d'une rivière, sans risque d'inondation
17. Machine à laver le linge commune

CRITÈRES TERTIAIRES:
18. Sur le chemin de Compostelle
19. À Bruxelles ou n'importe où en Belgique

À ÉVITER:
- Lieux où les animaux (chiens/chats) ne sont pas limités en termes d'hygiène"""

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
