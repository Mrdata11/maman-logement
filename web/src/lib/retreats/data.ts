import fs from "fs";
import path from "path";
import {
  RetreatVenue,
  RetreatVenueEvaluation,
  RetreatVenueTags,
  RetreatVenueWithEval,
  VenueStatus,
} from "./types";

function findRetreatDataDir(): string {
  const candidates = [
    path.join(process.cwd(), "..", "data", "retreats"),
    path.join(process.cwd(), "data", "retreats"),
    path.join(process.cwd(), "public", "data", "retreats"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "venues.json"))) {
      return dir;
    }
  }
  return candidates[0];
}

function readRetreatJSON<T>(filename: string, fallback: T[]): T[] {
  const dataDir = findRetreatDataDir();
  const filepath = path.join(dataDir, filename);
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

export function getRetreatVenues(): RetreatVenue[] {
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
  const all = getRetreatVenuesWithEvals();
  return all.find((item) => item.venue.id === id) || null;
}
