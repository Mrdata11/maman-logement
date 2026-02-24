import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  Listing, Evaluation, ListingTags, ListingWithEval, ListingStatus,
} from "./types";
// Module-level cache to avoid re-reading JSON files on every call
let _dataDirCache: string | null = null;
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

// ── Supabase projects → ListingWithEval ──

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Fetches published projects from Supabase and converts to ListingWithEval[] */
export async function getProjectsAsListings(): Promise<ListingWithEval[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !projects) return [];

  return projects.map((p) => {
    const answers = (p.answers || {}) as Record<string, unknown>;
    const listing: Listing = {
      id: p.id,
      source: p.source || "cohabitat",
      source_url: p.source_url || "",
      title: p.name || "Habitat sans nom",
      description: p.description || p.vision || "",
      location: p.location || null,
      province: p.province || null,
      price: p.price || (answers.price_range as string) || null,
      price_amount: p.price_amount || null,
      listing_type: p.listing_type || "creation-groupe",
      country: p.country || null,
      original_language: "fr",
      contact: p.contact || (answers.contact_email as string) || null,
      images: p.images || [],
      latitude: p.latitude || null,
      longitude: p.longitude || null,
      date_published: p.created_at,
      date_scraped: p.created_at,
    };

    const evaluation: Evaluation | null = p.evaluation || null;
    const tags: ListingTags | null = p.tags || null;

    return {
      listing,
      evaluation,
      tags,
      status: "new" as ListingStatus,
      notes: "",
      project_id: p.id,
    };
  });
}

/** Combines JSON listings + Supabase projects into one list */
export async function getAllListingsWithEvals(): Promise<ListingWithEval[]> {
  const [jsonListings, supabaseProjects] = await Promise.all([
    Promise.resolve(getListingsWithEvals()),
    getProjectsAsListings(),
  ]);
  return [...jsonListings, ...supabaseProjects];
}

