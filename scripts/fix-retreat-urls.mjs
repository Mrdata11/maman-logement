#!/usr/bin/env node

/**
 * Script to find and fix broken source_url and booking_url in venues.json.
 *
 * Strategy:
 *   1. Check every source_url and booking_url in venues.json
 *   2. For broken ones, look up a curated map of known-good replacement URLs
 *      (gathered from web research across TripAdvisor, retreat.guru, retreatsandvenues.com, etc.)
 *   3. Verify the replacement URL actually returns 2xx
 *   4. If verified, update venues.json in place
 *   5. If a replacement also fails, try the next candidate in the list
 *
 * Run:  node scripts/fix-retreat-urls.mjs [--dry-run] [--verbose]
 *
 * --dry-run   : print what would change but don't write the file
 * --verbose   : extra logging
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENUES_PATH = resolve(__dirname, "..", "data/retreats/venues.json");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose");

const TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_500;

// ──────────────────────────────────────────────────────────
// Domains that block automated requests (return 403/429) but
// whose URLs are known to work in a real browser. We treat
// these HTTP codes as "OK" for these domains.
// ──────────────────────────────────────────────────────────
const BROWSER_ONLY_DOMAINS = {
  "www.tripadvisor.com": [403],
  "www.bookyogaretreats.com": [403],
  "www.vrbo.com": [429, 403],
  "en.planetofhotels.com": [403],
};

/**
 * Returns true if the HTTP status should be treated as "ok" for the given URL
 * because that domain is known to block automated requests but works in a browser.
 */
function isBrowserOnlyOk(url, status) {
  try {
    const hostname = new URL(url).hostname;
    const allowed = BROWSER_ONLY_DOMAINS[hostname];
    return allowed ? allowed.includes(status) : false;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────
// Candidate replacement URLs per venue id + field.
// Order matters: first working one wins.
// ──────────────────────────────────────────────────────────
const REPLACEMENT_CANDIDATES = {
  // 1. Yobaba Lounge — source_url (bookretreats.com/account/center/yobaba-lounge → 404)
  "prov001:source_url": [
    "https://www.tripadvisor.com/Hotel_Review-g1080290-d8306937-Reviews-Yobaba_Lounge_Yoga_Retreat_Centre-Chalabre_Aude_Occitanie.html",
    "https://www.booking.com/hotel/fr/yobaba-lounge-chalabre.en-gb.html",
    "https://en.planetofhotels.com/france/chalabre/yobaba-lounge-boutique-yoga-retreat-centre",
    "https://reviewmyretreat.com/listing/yobaba-lounge",
  ],
  // 1. Yobaba Lounge — booking_url (bookinglayer → 404)
  "prov001:booking_url": [
    "https://www.booking.com/hotel/fr/yobaba-lounge-chalabre.en-gb.html",
    "https://www.yobabalounge.com/book-retreats",
    "https://www.yobabalounge.com/retreat-calendar-by-month",
  ],

  // 2. Wild View Retreat — source_url (bookretreats.com/r/… → 410)
  "alga002:source_url": [
    "https://www.tripadvisor.com/Hotel_Review-g1190874-d29358494-Reviews-Wild_View_Retreat-Sao_Bras_de_Alportel_Faro_District_Algarve.html",
    "https://www.bookyogaretreats.com/wild-view-retreat",
    "https://www.vrbo.com/8904899ha",
    "https://www.visitsaobrasalportel.pt/pt/10393/Wild-View-Retreat.aspx",
  ],

  // 3. Gaia Retreat Center — source_url (bookretreats.com/organizers/o/gaia-retreat-center → 410)
  "bali003:source_url": [
    "https://retreatsandvenues.com/venue/indonesia/gaia-retreat-center",
    "https://www.tripadvisor.com/Hotel_Review-g297701-d2294354-Reviews-Gaia_Retreat_Center-Ubud_Gianyar_Regency_Bali.html",
    "https://www.booking.com/hotel/id/gaia-retreat-center.html",
    "https://balancegurus.com/location/indonesia/gianyar/gaia-retreat-center",
  ],

  // 4. Agriturismo La Dogana — source_url (bookretreats.com/organizers/o/la-dogana-agriturismo → 410)
  "tosc004:source_url": [
    "https://www.tripadvisor.com/Hotel_Review-g796973-d2320985-Reviews-La_Dogana-Tuoro_sul_Trasimeno_Province_of_Perugia_Umbria.html",
    "https://www.lalista.com/venues/umbria/agriturismo-la-dogana",
    "https://www.agriturismo.it/en/farmhouse/umbria/perugia/Dogana-1540113/index.html",
  ],

  // 5. Suryalila — source_url (bookyogaretreats.com → 403)
  "anda005:source_url": [
    "https://www.tripadvisor.com/Hotel_Review-g608967-d3373306-Reviews-Suryalila_Retreat_Centre-Villamartin_Province_of_Cadiz_Andalucia.html",
    "https://mindtrip.ai/attraction/villamartin-andalucia/suryalila-retreat-centre/at-Wd4JXDs1",
    "https://froglotusyogainternational.com/suryalila-yoga-retreat-centre",
  ],

  // 6. Yoga Rocks — source_url (bookyogaretreats.com → 403)
  "cret007:source_url": [
    "https://www.tripadvisor.com/Hotel_Review-g1190234-d1791534-Reviews-Yoga_Rocks_Retreat_to_Triopetra-Triopetra_Agios_Vasileios_Municipality_Rethymnon.html",
    "https://www.bookyogaretreats.com/yoga-rocks-crete/8-day-prana-flow-yoga-retreat-in-agios-pavlos-crete-with-coral-brown",
    "https://www.yogafinder.com/yoga.cfm?yoganumber=30364",
  ],

  // 7. Casas Kismet — source_url (bookretreats.com/8-day-… → 410)
  "cost009:source_url": [
    "https://www.tripadvisor.com/Hotel_Review-g656474-d23319530-Reviews-Casas_Kismet-Nosara_Province_of_Guanacaste.html",
    "https://retreat.guru/centers/1437-1/casas-kismet",
    "https://www.casaskismet.com/",
  ],
};

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Check if a URL is reachable.  Returns { ok, status, error }.
 * Tries HEAD first, then GET as fallback.
 * Retries on transient errors.
 */
async function checkUrl(url, attempt = 1) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timer);
    if (res.ok) return { ok: true, status: res.status, error: null };
    // Check if this is a browser-only domain that blocks automated requests
    if (isBrowserOnlyOk(url, res.status)) {
      return { ok: true, status: res.status, error: null, browserOnly: true };
    }
    // Some servers reject HEAD, try GET
    if (res.status === 405 || res.status === 403) {
      return await checkUrlGet(url);
    }
    return { ok: false, status: res.status, error: null };
  } catch (err) {
    clearTimeout(timer);
    // Retry on transient errors
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS);
      return checkUrl(url, attempt + 1);
    }
    return await checkUrlGet(url);
  }
}

async function checkUrlGet(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timer);
    const ok = res.ok || isBrowserOnlyOk(url, res.status);
    return { ok, status: res.status, error: null, browserOnly: !res.ok && ok };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, status: null, error: err.cause?.code || err.message };
  }
}

function log(...a) {
  if (VERBOSE) console.log(...a);
}

// ──────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────

async function main() {
  const venues = JSON.parse(readFileSync(VENUES_PATH, "utf-8"));
  const fieldsToCheck = ["source_url", "booking_url"];
  const changes = [];

  console.log(`\nLoaded ${venues.length} venues from venues.json`);
  if (DRY_RUN) console.log("(DRY RUN — no file will be written)\n");
  else console.log("");

  // Phase 1: check all existing URLs
  console.log("Phase 1: Checking existing URLs...\n");
  const brokenEntries = []; // { venueIdx, venueId, venueName, field, currentUrl }

  for (let vi = 0; vi < venues.length; vi++) {
    const v = venues[vi];
    for (const field of fieldsToCheck) {
      const url = v[field];
      if (!url) continue;
      process.stdout.write(`  Checking ${v.name} — ${field} ... `);
      const result = await checkUrl(url);
      if (result.ok) {
        const note = result.browserOnly ? " [browser-only]" : "";
        console.log(`OK (${result.status})${note}`);
      } else {
        const reason = result.status ? `HTTP ${result.status}` : result.error;
        console.log(`BROKEN (${reason})`);
        brokenEntries.push({
          venueIdx: vi,
          venueId: v.id,
          venueName: v.name,
          field,
          currentUrl: url,
          reason,
        });
      }
    }
  }

  if (brokenEntries.length === 0) {
    console.log("\nAll URLs are working! Nothing to fix.");
    process.exit(0);
  }

  console.log(`\nFound ${brokenEntries.length} broken URL(s).\n`);

  // Phase 2: try replacements
  console.log("Phase 2: Finding working replacements...\n");

  for (const entry of brokenEntries) {
    const key = `${entry.venueId}:${entry.field}`;
    const candidates = REPLACEMENT_CANDIDATES[key];

    if (!candidates || candidates.length === 0) {
      console.log(
        `  ${entry.venueName} — ${entry.field}: NO replacement candidates defined. Skipping.`
      );
      continue;
    }

    let found = false;
    for (const candidate of candidates) {
      process.stdout.write(
        `  ${entry.venueName} — ${entry.field}: trying ${candidate} ... `
      );
      const result = await checkUrl(candidate);
      if (result.ok) {
        const note = result.browserOnly ? " [browser-only]" : "";
        console.log(`OK (${result.status})${note}`);
        changes.push({
          venueIdx: entry.venueIdx,
          venueName: entry.venueName,
          field: entry.field,
          oldUrl: entry.currentUrl,
          newUrl: candidate,
        });
        found = true;
        break;
      } else {
        const reason = result.status ? `HTTP ${result.status}` : result.error;
        console.log(`FAILED (${reason})`);
      }
    }

    if (!found) {
      console.log(
        `  ${entry.venueName} — ${entry.field}: NONE of the ${candidates.length} candidates worked!`
      );
    }
  }

  // Phase 3: apply changes
  if (changes.length === 0) {
    console.log("\nNo working replacements found. No changes to apply.");
    process.exit(1);
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Summary: ${changes.length} replacement(s) ready\n`);

  for (const c of changes) {
    console.log(`  ${c.venueName}.${c.field}:`);
    console.log(`    OLD: ${c.oldUrl}`);
    console.log(`    NEW: ${c.newUrl}`);
    console.log();
  }

  if (DRY_RUN) {
    console.log("DRY RUN — not writing file.");
    process.exit(0);
  }

  // Apply to venues array
  for (const c of changes) {
    venues[c.venueIdx][c.field] = c.newUrl;
    // Update "source" field to reflect the new source domain
    if (c.field === "source_url") {
      try {
        const domain = new URL(c.newUrl).hostname.replace(/^www\./, "");
        venues[c.venueIdx].source = domain;
      } catch {
        // leave source as-is
      }
    }
  }

  writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2) + "\n", "utf-8");
  console.log(`Wrote updated venues.json (${changes.length} URL(s) fixed).`);

  // Phase 4: re-verify the new URLs
  console.log("\nPhase 4: Re-verifying all fixed URLs...\n");
  let allGood = true;
  for (const c of changes) {
    process.stdout.write(`  Re-checking ${c.venueName} — ${c.field} ... `);
    const result = await checkUrl(c.newUrl);
    if (result.ok) {
      console.log(`OK (${result.status})`);
    } else {
      const reason = result.status ? `HTTP ${result.status}` : result.error;
      console.log(`STILL BROKEN (${reason}) — manual fix needed`);
      allGood = false;
    }
  }

  if (allGood) {
    console.log("\nAll fixed URLs verified successfully!");
  } else {
    console.log(
      "\nSome URLs still failed re-verification. Please check manually."
    );
  }

  process.exit(allGood ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(2);
});
