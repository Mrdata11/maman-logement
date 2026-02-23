#!/usr/bin/env node

/**
 * Script to check all URLs in ALL data files (retreats, listings, apartments).
 * Run: node scripts/check-retreat-links.mjs [--all] [--retreats] [--listings] [--apartments] [--sample N]
 *
 * By default, checks all retreat URLs and a sample of 50 from other datasets.
 * Use --all to check every single URL (can take a long time for large datasets).
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

const TIMEOUT_MS = 10_000;
const BATCH_SIZE = 10;

const checkAll = args.includes("--all");
const checkRetreats = args.includes("--retreats") || (!args.some(a => a.startsWith("--")) || checkAll);
const checkListings = args.includes("--listings") || checkAll;
const checkApartments = args.includes("--apartments") || checkAll;
const sampleArg = args.find(a => a.startsWith("--sample"));
const sampleSize = sampleArg ? parseInt(args[args.indexOf(sampleArg) + 1] || "50") : (checkAll ? Infinity : 50);

function loadJSON(relPath) {
  try {
    return JSON.parse(readFileSync(resolve(__dirname, "..", relPath), "utf-8"));
  } catch {
    return null;
  }
}

// Domains that block automated requests (403/429) but work in a real browser.
const BROWSER_ONLY_DOMAINS = {
  "www.tripadvisor.com": [403],
  "www.bookyogaretreats.com": [403],
  "www.vrbo.com": [429, 403],
  "en.planetofhotels.com": [403],
  "retreatsandvenues.com": [429, 403],
};

function isBrowserOnlyOk(url, status) {
  try {
    const hostname = new URL(url).hostname;
    const allowed = BROWSER_ONLY_DOMAINS[hostname];
    return allowed ? allowed.includes(status) : false;
  } catch { return false; }
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
    const ok = res.ok || isBrowserOnlyOk(url, res.status);
    return { url, status: res.status, ok, error: null };
  } catch (err) {
    clearTimeout(timer);
    try {
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), TIMEOUT_MS);
      const res = await fetch(url, { method: "GET", signal: c2.signal, redirect: "follow" });
      clearTimeout(t2);
      const ok = res.ok || isBrowserOnlyOk(url, res.status);
      return { url, status: res.status, ok, error: null };
    } catch (err2) {
      return { url, status: null, ok: false, error: err2.cause?.code || err2.message };
    }
  }
}

function extractUrls(obj, source, field = "") {
  const urls = [];
  if (typeof obj === "string" && obj.startsWith("http")) {
    urls.push({ source, field, url: obj });
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      urls.push(...extractUrls(item, source, field));
    }
  } else if (obj && typeof obj === "object") {
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === "string" && val.startsWith("http")) {
        urls.push({ source, field: key, url: val });
      } else if (Array.isArray(val)) {
        for (const item of val) {
          urls.push(...extractUrls(item, source, key));
        }
      }
    }
  }
  return urls;
}

function sampleArray(arr, n) {
  if (n >= arr.length) return arr;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// Collect URLs from all sources
const allUrlEntries = [];

if (checkRetreats) {
  const venues = loadJSON("data/retreats/venues.json");
  if (venues) {
    for (const v of venues) {
      const entries = extractUrls(v, `retreat:${v.name || v.id}`);
      allUrlEntries.push(...entries);
    }
  }
}

if (checkListings) {
  const listings = loadJSON("data/listings.json");
  if (listings) {
    const entries = [];
    for (const l of listings) {
      entries.push(...extractUrls(l, `listing:${l.name || l.id || "unknown"}`));
    }
    const sampled = sampleArray(entries, sampleSize);
    allUrlEntries.push(...sampled);
    if (sampled.length < entries.length) {
      console.log(`  [listings] Sampling ${sampled.length}/${entries.length} URLs`);
    }
  }
}

if (checkApartments) {
  const apartments = loadJSON("data/apartments/listings.json");
  if (apartments) {
    const entries = [];
    for (const a of apartments) {
      entries.push(...extractUrls(a, `apartment:${a.title || a.id || "unknown"}`));
    }
    const sampled = sampleArray(entries, sampleSize);
    allUrlEntries.push(...sampled);
    if (sampled.length < entries.length) {
      console.log(`  [apartments] Sampling ${sampled.length}/${entries.length} URLs`);
    }
  }
}

// Deduplicate
const uniqueUrls = [...new Set(allUrlEntries.map(e => e.url))];
console.log(`\nChecking ${uniqueUrls.length} unique URLs...\n`);

// Check in batches
const results = new Map();
for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
  const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
  const batchResults = await Promise.all(batch.map(checkUrl));
  for (const r of batchResults) results.set(r.url, r);
  process.stdout.write(`  Checked ${Math.min(i + BATCH_SIZE, uniqueUrls.length)}/${uniqueUrls.length}\r`);
}
console.log("\n");

// Report
const broken = [];
const working = [];
for (const entry of allUrlEntries) {
  const result = results.get(entry.url);
  if (!result.ok) broken.push({ ...entry, ...result });
  else working.push({ ...entry, ...result });
}

const brokenByUrl = new Map();
for (const b of broken) {
  if (!brokenByUrl.has(b.url)) {
    brokenByUrl.set(b.url, { ...b, usages: [{ source: b.source, field: b.field }] });
  } else {
    brokenByUrl.get(b.url).usages.push({ source: b.source, field: b.field });
  }
}

if (brokenByUrl.size > 0) {
  console.log(`\u274c ${brokenByUrl.size} BROKEN URLs:\n`);
  for (const [url, info] of brokenByUrl) {
    const statusStr = info.status ? `HTTP ${info.status}` : info.error;
    const usedBy = info.usages.map(u => `${u.source} (${u.field})`).join(", ");
    console.log(`  ${statusStr} \u2014 ${url}`);
    console.log(`    Used by: ${usedBy}\n`);
  }
} else {
  console.log("\u2705 All URLs are working!\n");
}

const workingUrls = new Set(working.map(w => w.url));
console.log(`\u2705 ${workingUrls.size} working URLs`);

process.exit(brokenByUrl.size > 0 ? 1 : 0);
