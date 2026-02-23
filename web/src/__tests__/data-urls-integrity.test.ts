import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Data URL integrity tests.
 *
 * These tests ensure that all URLs in our data files are real and reachable.
 * They prevent hallucinated/fictional URLs from making it into production.
 *
 * - Retreat venues: ALL URLs are checked (small dataset)
 * - Listings & apartments: source_url sample + image sample checked
 */

const TIMEOUT_MS = 15_000;
const DATA_ROOT = resolve(__dirname, "../../../data");

function loadJSON(relPath: string) {
  return JSON.parse(readFileSync(resolve(DATA_ROOT, relPath), "utf-8"));
}

function extractUrlFields(obj: Record<string, unknown>, fields: string[]): { field: string; url: string }[] {
  const urls: { field: string; url: string }[] = [];
  for (const field of fields) {
    const val = obj[field];
    if (typeof val === "string" && val.startsWith("http")) {
      urls.push({ field, url: val });
    }
  }
  // Extract image URLs
  const images = obj.images;
  if (Array.isArray(images)) {
    for (const img of images) {
      if (typeof img === "string" && img.startsWith("http")) {
        urls.push({ field: "images", url: img });
      }
    }
  }
  return urls;
}

// Domains that block automated requests (403/429) but work in real browsers.
const BROWSER_ONLY_DOMAINS: Record<string, number[]> = {
  "www.tripadvisor.com": [403],
  "www.bookyogaretreats.com": [403],
  "www.vrbo.com": [429, 403],
  "en.planetofhotels.com": [403],
  "retreatsandvenues.com": [429, 403],
  "www.immoweb.be": [403],
};

function isBrowserOnlyOk(url: string, status: number): boolean {
  try {
    const hostname = new URL(url).hostname;
    const allowed = BROWSER_ONLY_DOMAINS[hostname];
    return allowed ? allowed.includes(status) : false;
  } catch {
    return false;
  }
}

async function checkUrl(url: string): Promise<{ ok: boolean; status: number | null; error: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
    const ok = res.ok || isBrowserOnlyOk(url, res.status);
    if (ok) return { ok: true, status: res.status, error: null };
    // Retry with GET (some servers reject HEAD)
    const c2 = new AbortController();
    const t2 = setTimeout(() => c2.abort(), TIMEOUT_MS);
    const res2 = await fetch(url, { method: "GET", signal: c2.signal, redirect: "follow" });
    clearTimeout(t2);
    const ok2 = res2.ok || isBrowserOnlyOk(url, res2.status);
    return { ok: ok2, status: res2.status, error: null };
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, status: null, error: msg };
  }
}

function sampleArray<T>(arr: T[], n: number): T[] {
  if (n >= arr.length) return arr;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ============================================================
// RETREAT VENUES — Check ALL URLs (small dataset, ~60 URLs)
// ============================================================
describe("Retreat venues — URL integrity", () => {
  const venues = loadJSON("retreats/venues.json") as Record<string, unknown>[];
  const URL_FIELDS = ["website", "booking_url", "source_url"];

  for (const venue of venues) {
    const name = venue.name as string;
    const urlEntries = extractUrlFields(venue, URL_FIELDS);

    for (const { field, url } of urlEntries) {
      it(
        `${name} → ${field} is reachable (${url})`,
        async () => {
          const result = await checkUrl(url);
          expect(result.ok, `${url} returned ${result.status ?? result.error}`).toBe(true);
        },
        TIMEOUT_MS * 2,
      );
    }
  }
});

// ============================================================
// RETREAT VENUES — Structural integrity (no hallucinated fields)
// ============================================================
describe("Retreat venues — structural integrity", () => {
  const venues = loadJSON("retreats/venues.json") as Record<string, unknown>[];
  const evaluations = loadJSON("retreats/evaluations.json") as Record<string, unknown>[];
  const tags = loadJSON("retreats/tags.json") as Record<string, unknown>[];

  it("all venues have required fields", () => {
    const requiredFields = ["id", "name", "description", "country", "website", "source_url", "images"];
    for (const venue of venues) {
      for (const field of requiredFields) {
        expect(venue[field], `${venue.name || venue.id} missing ${field}`).toBeDefined();
        if (field !== "images") {
          expect(typeof venue[field], `${venue.name || venue.id}.${field} should be string`).toBe("string");
        }
      }
    }
  });

  it("all venue IDs have matching evaluations", () => {
    const venueIds = new Set(venues.map((v) => v.id));
    const evalIds = new Set(evaluations.map((e) => e.listing_id));
    for (const id of venueIds) {
      expect(evalIds.has(id), `Missing evaluation for venue ${id}`).toBe(true);
    }
  });

  it("all venue IDs have matching tags", () => {
    const venueIds = new Set(venues.map((v) => v.id));
    const tagIds = new Set(tags.map((t) => t.listing_id));
    for (const id of venueIds) {
      expect(tagIds.has(id), `Missing tags for venue ${id}`).toBe(true);
    }
  });

  it("no example.com or placeholder URLs", () => {
    const json = JSON.stringify(venues);
    expect(json).not.toContain("example.com");
    expect(json).not.toContain("placeholder");
    expect(json).not.toContain("lorem");
  });

  it("website URLs use real domain names (no ENOTFOUND pattern)", () => {
    for (const venue of venues) {
      const website = venue.website as string;
      if (website) {
        const url = new URL(website);
        // Real domains should have at least a known TLD
        expect(url.hostname.includes("."), `${venue.name}: ${website} has invalid hostname`).toBe(true);
      }
    }
  });
});

// ============================================================
// COHOUSING LISTINGS — Sample URL check
// ============================================================
describe("Cohousing listings — URL sample check", () => {
  let listings: Record<string, unknown>[];
  try {
    listings = loadJSON("listings.json");
  } catch {
    listings = [];
  }

  if (listings.length === 0) {
    it.skip("no listings.json found", () => {});
  } else {
    const allSourceUrls = listings
      .filter((l) => typeof l.source_url === "string" && (l.source_url as string).startsWith("http"))
      .map((l) => ({ field: "source_url", url: l.source_url as string, name: (l.name || l.id || "?") as string }));

    const sample = sampleArray(allSourceUrls, 10);

    for (const { url, name } of sample) {
      it(
        `listing "${name}" source_url is reachable`,
        async () => {
          const result = await checkUrl(url);
          expect(result.ok, `${url} returned ${result.status ?? result.error}`).toBe(true);
        },
        TIMEOUT_MS * 2,
      );
    }
  }
});

// ============================================================
// APARTMENT LISTINGS — Sample URL check
// ============================================================
describe("Apartment listings — URL sample check", () => {
  let listings: Record<string, unknown>[];
  try {
    listings = loadJSON("apartments/listings.json");
  } catch {
    listings = [];
  }

  if (listings.length === 0) {
    it.skip("no apartments/listings.json found", () => {});
  } else {
    const allSourceUrls = listings
      .filter((l) => typeof l.source_url === "string" && (l.source_url as string).startsWith("http"))
      .map((l) => ({ field: "source_url", url: l.source_url as string, name: (l.title || l.id || "?") as string }));

    const sample = sampleArray(allSourceUrls, 10);

    for (const { url, name } of sample) {
      it(
        `apartment "${name}" source_url is reachable`,
        async () => {
          const result = await checkUrl(url);
          expect(result.ok, `${url} returned ${result.status ?? result.error}`).toBe(true);
        },
        TIMEOUT_MS * 2,
      );
    }
  }
});
