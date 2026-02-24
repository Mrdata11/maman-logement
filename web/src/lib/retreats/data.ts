import fs from "fs";
import path from "path";
import {
  RetreatVenue,
  RetreatVenueEvaluation,
  RetreatVenueTags,
  RetreatVenueWithEval,
  VenueStatus,
} from "./types";

let _retreatDirCache: string | null = null;
let _useSplitFiles: boolean | null = null;
const _retreatJsonCache = new Map<string, unknown[]>();
const _retreatVenueCache = new Map<string, RetreatVenue>();

/**
 * Trouve le répertoire de données des retraites.
 * Vérifie d'abord la présence de venues/index.json (nouveau format split-file),
 * puis tombe en arrière sur venues.json (ancien format monolithique).
 */
function findRetreatDataDir(): string {
  if (_retreatDirCache) return _retreatDirCache;
  const candidates = [
    path.join(process.cwd(), "..", "data", "retreats"),
    path.join(process.cwd(), "data", "retreats"),
    path.join(process.cwd(), "public", "data", "retreats"),
  ];

  // Priorité 1 : nouveau format split-file (venues/index.json)
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "venues", "index.json"))) {
      _retreatDirCache = dir;
      _useSplitFiles = true;
      return dir;
    }
  }

  // Priorité 2 : ancien format monolithique (venues.json)
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "venues.json"))) {
      _retreatDirCache = dir;
      _useSplitFiles = false;
      return dir;
    }
  }

  _retreatDirCache = candidates[0];
  _useSplitFiles = false;
  return candidates[0];
}

function readRetreatJSON<T>(filename: string, fallback: T[]): T[] {
  if (_retreatJsonCache.has(filename)) return _retreatJsonCache.get(filename) as T[];
  const dataDir = findRetreatDataDir();
  const filepath = path.join(dataDir, filename);
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    const parsed = JSON.parse(content) as T[];
    _retreatJsonCache.set(filename, parsed);
    return parsed;
  } catch {
    return fallback;
  }
}

/**
 * Lit un fichier venue individuel depuis venues/{id}.json
 */
function readVenueFile(id: string): RetreatVenue | null {
  if (_retreatVenueCache.has(id)) return _retreatVenueCache.get(id)!;
  const dataDir = findRetreatDataDir();
  const filepath = path.join(dataDir, "venues", `${id}.json`);
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    const venue = JSON.parse(content) as RetreatVenue;
    _retreatVenueCache.set(id, venue);
    return venue;
  } catch {
    return null;
  }
}

/**
 * Charge toutes les venues.
 * - Si le répertoire venues/ existe avec index.json : lit chaque fichier individuel
 * - Sinon : lit venues.json (ancien format)
 */
export function getRetreatVenues(): RetreatVenue[] {
  const cacheKey = "__all_venues__";
  if (_retreatJsonCache.has(cacheKey)) return _retreatJsonCache.get(cacheKey) as RetreatVenue[];

  const dataDir = findRetreatDataDir();

  if (_useSplitFiles) {
    // Nouveau format : lire l'index puis charger chaque fichier individuel
    const indexPath = path.join(dataDir, "venues", "index.json");
    try {
      const indexContent = fs.readFileSync(indexPath, "utf-8");
      const indexEntries = JSON.parse(indexContent) as Array<{ id: string }>;
      const venues: RetreatVenue[] = [];
      for (const entry of indexEntries) {
        const venue = readVenueFile(entry.id);
        if (venue) {
          venues.push(venue);
        }
      }
      _retreatJsonCache.set(cacheKey, venues);
      return venues;
    } catch {
      // Fallback sur venues.json si l'index est illisible
      return readRetreatJSON<RetreatVenue>("venues.json", []);
    }
  }

  // Ancien format monolithique
  return readRetreatJSON<RetreatVenue>("venues.json", []);
}

export function getRetreatEvaluations(): RetreatVenueEvaluation[] {
  return readRetreatJSON<RetreatVenueEvaluation>("evaluations.json", []);
}

export function getRetreatTags(): RetreatVenueTags[] {
  return readRetreatJSON<RetreatVenueTags>("tags.json", []);
}

export function getRetreatVenuesWithEvals(): RetreatVenueWithEval[] {
  const venues = getRetreatVenues();
  const evaluations = getRetreatEvaluations();
  const tags = getRetreatTags();
  const evalMap = new Map(evaluations.map((e) => [e.listing_id, e]));
  const tagsMap = new Map(tags.map((t) => [t.listing_id, t]));

  return venues.map((venue) => ({
    venue,
    evaluation: evalMap.get(venue.id) || null,
    tags: tagsMap.get(venue.id) || null,
    status: "new" as VenueStatus,
    notes: "",
  }));
}

export function getRetreatVenueById(id: string): RetreatVenueWithEval | null {
  const dataDir = findRetreatDataDir();

  // Optimisation : en mode split-file, lire directement le fichier individuel
  // au lieu de charger toutes les venues
  if (_useSplitFiles) {
    const venue = readVenueFile(id);
    if (!venue) return null;

    const evaluations = getRetreatEvaluations();
    const tags = getRetreatTags();
    const evaluation = evaluations.find((e) => e.listing_id === id) || null;
    const venueTag = tags.find((t) => t.listing_id === id) || null;

    return {
      venue,
      evaluation,
      tags: venueTag,
      status: "new" as VenueStatus,
      notes: "",
    };
  }

  // Ancien format : parcourir toutes les venues
  const all = getRetreatVenuesWithEvals();
  return all.find((item) => item.venue.id === id) || null;
}
