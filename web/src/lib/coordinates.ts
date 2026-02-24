export interface Coordinates {
  lat: number;
  lng: number;
}

// Coordonnees des villes et provinces belges
export const LOCATION_COORDINATES: Record<string, Coordinates> = {
  // Provinces (centroides)
  "Brabant Wallon": { lat: 50.6694, lng: 4.6154 },
  "Bruxelles": { lat: 50.8503, lng: 4.3517 },
  "Namur": { lat: 50.4674, lng: 4.872 },
  "Hainaut": { lat: 50.4542, lng: 3.9566 },
  "Liege": { lat: 50.6326, lng: 5.5797 },
  "Liège": { lat: 50.6326, lng: 5.5797 },
  "Luxembourg": { lat: 49.9307, lng: 5.3625 },
  "Flandre": { lat: 51.05, lng: 3.7303 },

  // Villes wallonnes
  "Louvain La Neuve": { lat: 50.6681, lng: 4.6118 },
  "Louvain-la-Neuve": { lat: 50.6681, lng: 4.6118 },
  "Wavre": { lat: 50.7167, lng: 4.6 },
  "Nivelles": { lat: 50.5988, lng: 4.3288 },
  "Ottignies": { lat: 50.6656, lng: 4.5672 },
  "Waterloo": { lat: 50.7148, lng: 4.3997 },
  "Braine-le-Comte": { lat: 50.6094, lng: 4.1381 },
  "Charleroi": { lat: 50.4108, lng: 4.4446 },
  "Mons": { lat: 50.4542, lng: 3.9566 },
  "Tournai": { lat: 50.607, lng: 3.3886 },
  "Soignies": { lat: 50.58, lng: 4.07 },
  "Enghien": { lat: 50.6914, lng: 4.0397 },
  "Gembloux": { lat: 50.5608, lng: 4.6989 },
  "Dinant": { lat: 50.2611, lng: 4.9122 },
  "Ciney": { lat: 50.2947, lng: 5.0989 },
  "Rochefort": { lat: 50.1603, lng: 5.2222 },
  "Marche-en-Famenne": { lat: 50.2264, lng: 5.3444 },
  "Arlon": { lat: 49.6833, lng: 5.8167 },
  "Bastogne": { lat: 50.0, lng: 5.7167 },
  "Durbuy": { lat: 50.3528, lng: 5.4561 },
  "Spa": { lat: 50.4833, lng: 5.8667 },
  "Verviers": { lat: 50.5894, lng: 5.8628 },
  "Eupen": { lat: 50.6333, lng: 6.0333 },
  "Malmedy": { lat: 50.4253, lng: 6.0286 },
  "Couvin": { lat: 50.0536, lng: 4.4939 },
  "Philippeville": { lat: 50.1956, lng: 4.5431 },
  "Andenne": { lat: 50.4894, lng: 5.1 },
  "Jodoigne": { lat: 50.7167, lng: 4.8667 },
  "Perwez": { lat: 50.6333, lng: 4.8 },
  "Tubize": { lat: 50.6917, lng: 4.2028 },
  "La Louvière": { lat: 50.4833, lng: 4.1833 },
  "Binche": { lat: 50.4108, lng: 4.1667 },
  "Thuin": { lat: 50.3394, lng: 4.2869 },
  "Ath": { lat: 50.6297, lng: 3.78 },
  "Lessines": { lat: 50.7133, lng: 3.8322 },
  "Mouscron": { lat: 50.7442, lng: 3.2167 },
  "Comines": { lat: 50.7667, lng: 3.0 },
  "Hannut": { lat: 50.6714, lng: 5.0786 },
  "Huy": { lat: 50.5186, lng: 5.2394 },
  "Waremme": { lat: 50.6958, lng: 5.2542 },
  "Visé": { lat: 50.7333, lng: 5.7 },
  "Ohey": { lat: 50.4342, lng: 5.1283 },
  "Gesves": { lat: 50.4047, lng: 5.0772 },
  "Fosses-la-Ville": { lat: 50.395, lng: 4.6958 },
  "Sambreville": { lat: 50.4353, lng: 4.6111 },
  "Hoeilaart": { lat: 50.7667, lng: 4.4667 },
  "Forrières": { lat: 50.1439, lng: 5.3114 },

  // Bruxelles communes
  "Schaerbeek": { lat: 50.8667, lng: 4.3833 },
  "Ixelles": { lat: 50.8306, lng: 4.3722 },
  "Uccle": { lat: 50.8, lng: 4.3333 },
  "Forest": { lat: 50.8103, lng: 4.3181 },
  "Anderlecht": { lat: 50.8333, lng: 4.3 },
  "Molenbeek": { lat: 50.855, lng: 4.3333 },
  "Etterbeek": { lat: 50.8333, lng: 4.3833 },
  "Woluwe-Saint-Lambert": { lat: 50.8417, lng: 4.4333 },
  "Woluwe-Saint-Pierre": { lat: 50.83, lng: 4.4333 },
  "Auderghem": { lat: 50.8167, lng: 4.4333 },
  "Watermael-Boitsfort": { lat: 50.7992, lng: 4.4083 },
  "Jette": { lat: 50.8764, lng: 4.325 },
  "Ganshoren": { lat: 50.8667, lng: 4.3167 },
  "Berchem-Sainte-Agathe": { lat: 50.8667, lng: 4.2833 },
  "Evere": { lat: 50.8667, lng: 4.4 },
  "Saint-Gilles": { lat: 50.8264, lng: 4.345 },

  // Villes flamandes principales
  "Gent": { lat: 51.0543, lng: 3.7174 },
  "Antwerpen": { lat: 51.2194, lng: 4.4025 },
  "Leuven": { lat: 50.8798, lng: 4.7005 },
  "Brugge": { lat: 51.2093, lng: 3.2247 },
  "Mechelen": { lat: 51.0259, lng: 4.4776 },
  "Hasselt": { lat: 50.9307, lng: 5.3375 },
  "Kortrijk": { lat: 50.8283, lng: 3.265 },
  "Aalst": { lat: 50.9378, lng: 4.0367 },
  "Sint-Niklaas": { lat: 51.1564, lng: 4.1439 },
  "Turnhout": { lat: 51.3225, lng: 4.9444 },

  // Localisations extraites des URLs (format URL: tirets, title case)
  "Brabant wallon": { lat: 50.6694, lng: 4.6154 },
  "Autres Pays Regions": { lat: 50.5039, lng: 4.4699 },

  // France - Departements du Camino de Santiago
  "Haute-Loire": { lat: 45.0427, lng: 3.8848 },
  "Lozère": { lat: 44.5176, lng: 3.5003 },
  "Aveyron": { lat: 44.2778, lng: 2.5736 },
  "Lot": { lat: 44.6225, lng: 1.6800 },
  "Gers": { lat: 43.6464, lng: 0.5861 },
  "Pyrénées-Atlantiques": { lat: 43.2951, lng: -0.3708 },
  "Indre-et-Loire": { lat: 47.2500, lng: 0.6833 },
  "Vienne": { lat: 46.5806, lng: 0.3408 },
  "Charente": { lat: 45.6500, lng: 0.1500 },
  "Gironde": { lat: 44.8378, lng: -0.5792 },
  "Landes": { lat: 43.8928, lng: -0.5017 },
  "Creuse": { lat: 46.0833, lng: 2.0000 },
  "Haute-Vienne": { lat: 45.8353, lng: 1.2622 },
  "Dordogne": { lat: 45.1833, lng: 0.7167 },
  "Hérault": { lat: 43.6000, lng: 3.8833 },
  "Aude": { lat: 43.0667, lng: 2.4333 },
  "Haute-Garonne": { lat: 43.6047, lng: 1.4442 },
  "Hautes-Pyrénées": { lat: 43.0667, lng: 0.1500 },

  // France - Villes du Camino
  "Le Puy-en-Velay": { lat: 45.0427, lng: 3.8848 },
  "Conques": { lat: 44.5989, lng: 2.3997 },
  "Cahors": { lat: 44.4486, lng: 1.4406 },
  "Moissac": { lat: 44.1047, lng: 1.0858 },
  "Toulouse": { lat: 43.6047, lng: 1.4442 },
  "Pau": { lat: 43.2951, lng: -0.3708 },
  "Saint-Jean-Pied-de-Port": { lat: 43.1631, lng: -1.2369 },
  "Bordeaux": { lat: 44.8378, lng: -0.5792 },
  "Limoges": { lat: 45.8315, lng: 1.2578 },
  "Tours": { lat: 47.3941, lng: 0.6848 },
  "Poitiers": { lat: 46.5802, lng: 0.3404 },
  "Montpellier": { lat: 43.6108, lng: 3.8767 },
  "Arles": { lat: 43.6767, lng: 4.6278 },
  "Périgueux": { lat: 45.1847, lng: 0.7214 },

  // Espagne - Regions du Camino
  "Navarra": { lat: 42.8125, lng: -1.6458 },
  "La Rioja": { lat: 42.2871, lng: -2.5396 },
  "Galicia": { lat: 42.8782, lng: -8.5448 },
  "Asturias": { lat: 43.3614, lng: -5.8593 },
  "Cantabria": { lat: 43.1828, lng: -3.9878 },
  "País Vasco": { lat: 43.2630, lng: -2.9350 },

  // Espagne - Villes du Camino
  "Pamplona": { lat: 42.8125, lng: -1.6458 },
  "Logroño": { lat: 42.4650, lng: -2.4500 },
  "Burgos": { lat: 42.3439, lng: -3.6969 },
  "León": { lat: 42.5987, lng: -5.5671 },
  "Ponferrada": { lat: 42.5499, lng: -6.5897 },
  "Sarria": { lat: 42.7811, lng: -7.4147 },
  "Santiago de Compostela": { lat: 42.8782, lng: -8.5448 },
  "Bilbao": { lat: 43.2630, lng: -2.9350 },
  "San Sebastián": { lat: 43.3183, lng: -1.9812 },
  "Santander": { lat: 43.4623, lng: -3.8100 },
  "Oviedo": { lat: 43.3614, lng: -5.8593 },
  "Salamanca": { lat: 40.9701, lng: -5.6635 },
  "Jaca": { lat: 42.5697, lng: -0.5496 },
  "Spain": { lat: 40.4168, lng: -3.7038 },
};

export const EUROPE_CENTER: Coordinates = { lat: 47.5, lng: 3.0 };
export const DEFAULT_ZOOM = 5;

// Cle localStorage pour la ville de reference
export const REFERENCE_LOCATION_KEY = "reference_location";

export interface ReferenceLocation {
  name: string;
  coords: Coordinates;
}

/**
 * Resout les coordonnees d'un string de localisation (ex: "Ixelles, Bruxelles").
 * Essaie chaque partie separee par une virgule, puis le string complet.
 * Retourne le nom match et les coordonnees, ou null si rien ne correspond.
 */
export function resolveLocationCoordinates(
  locationStr: string | null
): ReferenceLocation | null {
  if (!locationStr || !locationStr.trim()) return null;

  // Essayer le string complet d'abord
  const trimmed = locationStr.trim();
  if (LOCATION_COORDINATES[trimmed]) {
    return { name: trimmed, coords: LOCATION_COORDINATES[trimmed] };
  }

  // Decouper par virgule et essayer chaque partie
  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    if (LOCATION_COORDINATES[part]) {
      return { name: part, coords: LOCATION_COORDINATES[part] };
    }
  }

  // Essayer un match case-insensitive
  const lower = trimmed.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (key.toLowerCase() === lower) {
      return { name: key, coords };
    }
  }
  for (const part of parts) {
    const partLower = part.toLowerCase();
    for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
      if (key.toLowerCase() === partLower) {
        return { name: key, coords };
      }
    }
  }

  return null;
}

/**
 * Charge la ville de reference depuis localStorage.
 * Retourne null si non definie ou invalide.
 */
export function loadReferenceLocation(): ReferenceLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(REFERENCE_LOCATION_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (
      parsed &&
      typeof parsed.name === "string" &&
      parsed.coords &&
      typeof parsed.coords.lat === "number" &&
      typeof parsed.coords.lng === "number"
    ) {
      return parsed as ReferenceLocation;
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Sauvegarde la ville de reference dans localStorage.
 */
export function saveReferenceLocation(ref: ReferenceLocation): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFERENCE_LOCATION_KEY, JSON.stringify(ref));
}

/**
 * Retourne la liste des noms de villes disponibles pour l'autocomplete.
 */
export function getAvailableLocationNames(): string[] {
  return Object.keys(LOCATION_COORDINATES).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

// Calcul de distance Haversine en km
export function haversineDistance(
  a: Coordinates,
  b: Coordinates
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Obtenir les coordonnees d'un listing (location ou province)
export function getListingCoordinates(
  location: string | null,
  province: string | null
): Coordinates | null {
  if (location && LOCATION_COORDINATES[location]) {
    return LOCATION_COORDINATES[location];
  }
  if (province && LOCATION_COORDINATES[province]) {
    return LOCATION_COORDINATES[province];
  }
  return null;
}

// Jitter deterministe pour disperser les pins qui partagent la meme province.
export function getJitteredCoordinates(
  baseCoords: Coordinates,
  listingId: string,
): Coordinates {
  let hash = 0;
  for (let i = 0; i < listingId.length; i++) {
    hash = (hash << 5) - hash + listingId.charCodeAt(i);
    hash |= 0;
  }

  const jitterRange = 0.15;
  const latOffset = (((hash & 0xff) / 255) - 0.5) * jitterRange;
  const lngOffset = ((((hash >> 8) & 0xff) / 255) - 0.5) * jitterRange;

  return {
    lat: baseCoords.lat + latOffset,
    lng: baseCoords.lng + lngOffset,
  };
}
