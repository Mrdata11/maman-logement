import fs from "fs";
import path from "path";
import { Listing, Evaluation, ListingTags, ListingWithEval, ListingStatus } from "./types";

function findDataDir(): string {
  const candidates = [
    path.join(process.cwd(), "..", "data"),        // Local dev (cwd = web/)
    path.join(process.cwd(), "data"),               // Vercel (cwd = root)
    path.join(process.cwd(), "public", "data"),     // Copied to public/data/
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "listings.json"))) {
      return dir;
    }
  }
  return candidates[0]; // Fallback
}

function readJSON<T>(filename: string, fallback: T[]): T[] {
  const dataDir = findDataDir();
  const filepath = path.join(dataDir, filename);
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

export function getListings(): Listing[] {
  return readJSON<Listing>("listings.json", []);
}

export function getEvaluations(): Evaluation[] {
  return readJSON<Evaluation>("evaluations.json", []);
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
