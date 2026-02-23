#!/usr/bin/env node

/**
 * Script to check all URLs in retreat venues data.
 * Tests website, booking_url, source_url, and image URLs.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const venuesPath = resolve(__dirname, "../data/retreats/venues.json");
const venues = JSON.parse(readFileSync(venuesPath, "utf-8"));

const TIMEOUT_MS = 10_000;

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    return { url, status: res.status, ok: res.ok, error: null };
  } catch (err) {
    clearTimeout(timer);
    // Retry with GET if HEAD fails (some servers reject HEAD)
    try {
      const controller2 = new AbortController();
      const timer2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);
      const res = await fetch(url, {
        method: "GET",
        signal: controller2.signal,
        redirect: "follow",
      });
      clearTimeout(timer2);
      return { url, status: res.status, ok: res.ok, error: null };
    } catch (err2) {
      return {
        url,
        status: null,
        ok: false,
        error: err2.cause?.code || err2.message,
      };
    }
  }
}

// Collect all URLs to test
const urlEntries = [];

for (const venue of venues) {
  if (venue.website) {
    urlEntries.push({ venue: venue.name, field: "website", url: venue.website });
  }
  if (venue.booking_url) {
    urlEntries.push({ venue: venue.name, field: "booking_url", url: venue.booking_url });
  }
  if (venue.source_url) {
    urlEntries.push({ venue: venue.name, field: "source_url", url: venue.source_url });
  }
  for (const img of venue.images || []) {
    urlEntries.push({ venue: venue.name, field: "image", url: img });
  }
}

// Deduplicate URLs but keep all entries for reporting
const uniqueUrls = [...new Set(urlEntries.map((e) => e.url))];

console.log(`\nChecking ${uniqueUrls.length} unique URLs from ${venues.length} venues...\n`);

// Check in batches of 5 to avoid overwhelming
const results = new Map();
const BATCH = 5;

for (let i = 0; i < uniqueUrls.length; i += BATCH) {
  const batch = uniqueUrls.slice(i, i + BATCH);
  const batchResults = await Promise.all(batch.map(checkUrl));
  for (const r of batchResults) {
    results.set(r.url, r);
  }
  process.stdout.write(`  Checked ${Math.min(i + BATCH, uniqueUrls.length)}/${uniqueUrls.length}\r`);
}

console.log("\n");

// Report
const broken = [];
const working = [];

for (const entry of urlEntries) {
  const result = results.get(entry.url);
  if (!result.ok) {
    broken.push({ ...entry, ...result });
  } else {
    working.push({ ...entry, ...result });
  }
}

// Deduplicate broken by URL for the summary
const brokenByUrl = new Map();
for (const b of broken) {
  if (!brokenByUrl.has(b.url)) {
    brokenByUrl.set(b.url, { ...b, venues: [{ venue: b.venue, field: b.field }] });
  } else {
    brokenByUrl.get(b.url).venues.push({ venue: b.venue, field: b.field });
  }
}

if (brokenByUrl.size > 0) {
  console.log(`❌ ${brokenByUrl.size} BROKEN URLs:\n`);
  for (const [url, info] of brokenByUrl) {
    const statusStr = info.status ? `HTTP ${info.status}` : info.error;
    const usedBy = info.venues.map((v) => `${v.venue} (${v.field})`).join(", ");
    console.log(`  ${statusStr} — ${url}`);
    console.log(`    Used by: ${usedBy}\n`);
  }
} else {
  console.log("✅ All URLs are working!\n");
}

const workingUrls = new Set(working.map((w) => w.url));
if (workingUrls.size > 0) {
  console.log(`✅ ${workingUrls.size} working URLs\n`);
}

// Exit code
process.exit(brokenByUrl.size > 0 ? 1 : 0);
