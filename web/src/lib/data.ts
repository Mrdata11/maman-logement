import fs from "fs";
import path from "path";
import {
  Listing, Evaluation, ListingTags, ListingWithEval, ListingStatus,
  ApartmentListing, ApartmentEvaluation, ApartmentWithEval,
} from "./types";
import { haversineDistance, IXELLES_CENTER } from "./coordinates";

// Module-level cache to avoid re-reading JSON files on every call
let _dataDirCache: string | null = null;
let _apartmentDirCache: string | null = null;
const _jsonCache = new Map<string, unknown[]>();

function findDataDir(): string {
  if (_dataDirCache) return _dataDirCache;
  const candidates = [
    path.join(process.cwd(), "..", "data"),
    path.join(process.cwd(), "data"),
    path.join(process.cwd(), "public", "data"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "listings.json"))) {
      _dataDirCache = dir;
      return dir;
    }
  }
  _dataDirCache = candidates[0];
  return candidates[0];
}

function readJSON<T>(filename: string, fallback: T[]): T[] {
  const cacheKey = `main:${filename}`;
  if (_jsonCache.has(cacheKey)) return _jsonCache.get(cacheKey) as T[];
  const dataDir = findDataDir();
  const filepath = path.join(dataDir, filename);
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    const parsed = JSON.parse(content) as T[];
    _jsonCache.set(cacheKey, parsed);
    return parsed;
  } catch {
    return fallback;
  }
}

export function getListings(): Listing[] {
  return readJSON<Listing>("listings.json", []);
}

export function getEvaluations(): Evaluation[] {
  // Normalize field names: data uses overall_score/match_summary,
  // but the app types expect quality_score/quality_summary
  const raw = readJSON<Record<string, unknown>>("evaluations.json", []);
  return raw.map((e) => ({
    ...e,
    quality_score: (e.quality_score ?? e.overall_score ?? 0) as number,
    quality_summary: (e.quality_summary ?? e.match_summary ?? "") as string,
  })) as unknown as Evaluation[];
}

export function getTags(): ListingTags[] {
  return readJSON<ListingTags>("tags.json", []);
}

export function getListingsWithEvals(): ListingWithEval[] {
  const listings = getListings();
  const evaluations = getEvaluations();
  const tags = getTags();
  const evalMap = new Map(evaluations.map((e) => [e.listing_id, e]));
  const tagsMap = new Map(tags.map((t) => [t.listing_id, t]));

  return listings.map((listing) => ({
    listing,
    evaluation: evalMap.get(listing.id) || null,
    tags: tagsMap.get(listing.id) || null,
    status: "new" as ListingStatus,
    notes: "",
  }));
}

export function getListingById(id: string): ListingWithEval | null {
  const all = getListingsWithEvals();
  return all.find((item) => item.listing.id === id) || null;
}

// === Apartment data loading ===

function findApartmentDataDir(): string {
  if (_apartmentDirCache) return _apartmentDirCache;
  const candidates = [
    path.join(process.cwd(), "..", "data", "apartments"),
    path.join(process.cwd(), "data", "apartments"),
    path.join(process.cwd(), "public", "data", "apartments"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "listings.json"))) {
      _apartmentDirCache = dir;
      return dir;
    }
  }
  _apartmentDirCache = candidates[0];
  return candidates[0];
}

function readApartmentJSON<T>(filename: string, fallback: T[]): T[] {
  const cacheKey = `apt:${filename}`;
  if (_jsonCache.has(cacheKey)) return _jsonCache.get(cacheKey) as T[];
  const dataDir = findApartmentDataDir();
  const filepath = path.join(dataDir, filename);
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    const parsed = JSON.parse(content) as T[];
    _jsonCache.set(cacheKey, parsed);
    return parsed;
  } catch {
    return fallback;
  }
}

function generateApartmentTags(listing: ApartmentListing): string[] {
  const tags: string[] = [];

  // Commune
  if (listing.commune) tags.push(listing.commune);

  // Price range
  if (listing.price_monthly !== null) {
    if (listing.price_monthly <= 1000) tags.push("< 1000€", "Petit budget");
    else if (listing.price_monthly <= 1300) tags.push("1000-1300€", "Budget moyen");
    else if (listing.price_monthly <= 1600) tags.push("1300-1600€");
    else if (listing.price_monthly <= 2000) tags.push("1600-2000€");
    else tags.push("> 2000€", "Haut de gamme");

    // Total cost (with charges)
    const total = listing.price_monthly + (listing.charges_monthly || 0);
    tags.push(`Total ~${Math.round(total / 50) * 50}€/mois`);
  }

  // Bedrooms
  if (listing.bedrooms !== null) {
    tags.push(`${listing.bedrooms} chambre${listing.bedrooms > 1 ? "s" : ""}`);
    if (listing.bedrooms >= 3) tags.push("Grand appartement");
  }

  // Surface
  if (listing.surface_m2 !== null) {
    if (listing.surface_m2 < 60) tags.push("Compact");
    else if (listing.surface_m2 < 80) tags.push("Surface correcte");
    else if (listing.surface_m2 < 100) tags.push("Spacieux");
    else tags.push("Très spacieux");
    tags.push(`${Math.round(listing.surface_m2)} m²`);
  }

  // Price per m²
  if (listing.price_monthly && listing.surface_m2 && listing.surface_m2 > 0) {
    const pricePerM2 = listing.price_monthly / listing.surface_m2;
    if (pricePerM2 <= 12) tags.push("Bon prix/m²");
    else if (pricePerM2 <= 16) tags.push("Prix/m² moyen");
    else tags.push("Prix/m² élevé");
  }

  // PEB
  if (listing.peb_rating) {
    tags.push(`PEB ${listing.peb_rating}`);
    if (["A", "B"].includes(listing.peb_rating)) tags.push("Bonne performance énergétique");
    if (["F", "G"].includes(listing.peb_rating)) tags.push("Énergivore");
  }

  // Distance from Ixelles
  if (listing.latitude && listing.longitude) {
    const dist = haversineDistance(IXELLES_CENTER, { lat: listing.latitude, lng: listing.longitude });
    if (dist <= 1) tags.push("Très proche d'Ixelles", "< 1 km");
    else if (dist <= 2) tags.push("Proche d'Ixelles", "1-2 km");
    else if (dist <= 4) tags.push("Accessible", "2-4 km");
    else tags.push("Excentré", "> 4 km");
  }

  // Amenities
  if (listing.has_terrace) tags.push("Terrasse");
  if (listing.has_garden) tags.push("Jardin");
  if (listing.has_parking) {
    tags.push("Parking");
    if (listing.parking_count && listing.parking_count > 1) tags.push(`${listing.parking_count} places`);
  }
  if (listing.has_elevator) tags.push("Ascenseur");
  if (listing.has_elevator === false) tags.push("Sans ascenseur");
  if (listing.has_cellar) tags.push("Cave");
  if (listing.furnished) tags.push("Meublé");
  if (listing.furnished === false) tags.push("Non meublé");
  if (listing.pets_allowed) tags.push("Animaux acceptés");

  // Floor
  if (listing.floor !== null) {
    if (listing.floor === 0) tags.push("Rez-de-chaussée");
    else if (listing.floor <= 2) tags.push("Étage bas");
    else if (listing.floor <= 5) tags.push("Étage moyen");
    else tags.push("Étage élevé");
  }

  // Charges
  if (listing.charges_monthly !== null) {
    if (listing.charges_monthly <= 100) tags.push("Charges faibles");
    else if (listing.charges_monthly <= 200) tags.push("Charges modérées");
    else tags.push("Charges élevées");
  }
  if (listing.charges_included === true) tags.push("Charges incluses");

  // Bathrooms
  if (listing.bathrooms !== null && listing.bathrooms >= 2) tags.push("2+ salles de bain");

  // Publication date freshness
  if (listing.date_published) {
    const published = new Date(listing.date_published);
    const now = new Date();
    const daysDiff = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff <= 3) tags.push("Très récent");
    else if (daysDiff <= 7) tags.push("Récent");
    else if (daysDiff <= 30) tags.push("Ce mois-ci");
  }

  return tags;
}

export function getApartments(): ApartmentListing[] {
  const listings = readApartmentJSON<ApartmentListing>("listings.json", []);
  // Generate tags for each listing
  return listings.map((l) => ({
    ...l,
    tags: l.tags && l.tags.length > 0 ? l.tags : generateApartmentTags(l),
  }));
}

export function getApartmentEvaluations(): ApartmentEvaluation[] {
  return readApartmentJSON<ApartmentEvaluation>("evaluations.json", []);
}

export function getApartmentsWithEvals(): ApartmentWithEval[] {
  const listings = getApartments();
  const evaluations = getApartmentEvaluations();
  const evalMap = new Map(evaluations.map((e) => [e.listing_id, e]));

  return listings.map((listing) => ({
    listing,
    evaluation: evalMap.get(listing.id) || null,
    status: "new" as ListingStatus,
    notes: "",
  }));
}

export function getApartmentById(id: string): ApartmentWithEval | null {
  const all = getApartmentsWithEvals();
  return all.find((item) => item.listing.id === id) || null;
}
