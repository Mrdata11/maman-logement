export interface Coordinates {
  lat: number;
  lng: number;
}

// Centroïdes des provinces belges utilisées dans les données
export const LOCATION_COORDINATES: Record<string, Coordinates> = {
  "Brabant Wallon": { lat: 50.6694, lng: 4.6154 },
  "Bruxelles": { lat: 50.8503, lng: 4.3517 },
  "Namur": { lat: 50.4674, lng: 4.872 },
  "Hainaut": { lat: 50.4542, lng: 3.9566 },
  "Liege": { lat: 50.6326, lng: 5.5797 },
  "Luxembourg": { lat: 49.9307, lng: 5.3625 },
  "Flandre": { lat: 51.05, lng: 3.7303 },
};

export const BELGIUM_CENTER: Coordinates = { lat: 50.5039, lng: 4.4699 };
export const DEFAULT_ZOOM = 8;

// Jitter déterministe pour disperser les pins qui partagent la même province.
// Utilise un hash simple de l'ID pour un offset dans un rayon de ~15km.
export function getJitteredCoordinates(
  baseCoords: Coordinates,
  listingId: string,
): Coordinates {
  let hash = 0;
  for (let i = 0; i < listingId.length; i++) {
    hash = (hash << 5) - hash + listingId.charCodeAt(i);
    hash |= 0;
  }

  const jitterRange = 0.15; // ~15km aux latitudes belges
  const latOffset = (((hash & 0xff) / 255) - 0.5) * jitterRange;
  const lngOffset = ((((hash >> 8) & 0xff) / 255) - 0.5) * jitterRange;

  return {
    lat: baseCoords.lat + latOffset,
    lng: baseCoords.lng + lngOffset,
  };
}
