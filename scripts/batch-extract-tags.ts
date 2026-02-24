#!/usr/bin/env node
/**
 * batch-extract-tags.ts — Extraire les tags structurés pour les annonces non taggées
 *
 * Envoie chaque annonce à Claude Haiku pour extraire des tags structurés.
 * Sauvegarde incrémentalement toutes les 50 annonces.
 *
 * Usage:
 *   npx tsx scripts/batch-extract-tags.ts [--dry-run] [--limit N]
 *
 * Options:
 *   --dry-run   Afficher les stats sans appeler l'API
 *   --limit N   Limiter à N annonces (pour tester)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(process.cwd());
const envPath = resolve(ROOT, "web/.env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("ANTHROPIC_API_KEY manquante dans web/.env.local");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const limitIdx = process.argv.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1], 10) : Infinity;

// ── Types ──

interface Listing {
  id: string;
  title: string;
  description: string;
  location: string | null;
  province: string | null;
  listing_type: string | null;
  country: string | null;
}

interface ListingTags {
  listing_id: string;
  group_size: number | null;
  age_range: string[];
  has_children: boolean | null;
  family_types: string[];
  project_types: string[];
  pets_allowed: boolean | null;
  pet_details: string[];
  surface_m2: number | null;
  num_bedrooms: number | null;
  unit_type: string | null;
  furnished: boolean | null;
  accessible_pmr: boolean | null;
  shared_spaces: string[];
  values: string[];
  shared_meals: string | null;
  has_charter: boolean | null;
  governance: string | null;
  environment: string | null;
  near_nature: boolean | null;
  near_transport: boolean | null;
  date_extracted: string;
}

// ── Anthropic call ──

let totalInputTokens = 0;
let totalOutputTokens = 0;

async function callHaiku(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  totalInputTokens += data.usage?.input_tokens ?? 0;
  totalOutputTokens += data.usage?.output_tokens ?? 0;
  return data.content[0].text.trim();
}

// ── Tag extraction prompt ──

const SYSTEM_PROMPT = `Tu extrais des tags structurés à partir d'annonces d'habitat groupé/participatif.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.

Format exact:
{
  "group_size": <nombre ou null>,
  "age_range": [],
  "has_children": <true/false/null>,
  "family_types": [],
  "project_types": [],
  "pets_allowed": <true/false/null>,
  "pet_details": [],
  "surface_m2": <nombre ou null>,
  "num_bedrooms": <nombre ou null>,
  "unit_type": <string ou null>,
  "furnished": <true/false/null>,
  "accessible_pmr": <true/false/null>,
  "shared_spaces": [],
  "values": [],
  "shared_meals": <string ou null>,
  "has_charter": <true/false/null>,
  "governance": <string ou null>,
  "environment": <string ou null>,
  "near_nature": <true/false/null>,
  "near_transport": <true/false/null>
}

Valeurs autorisées:
- age_range: "intergenerational", "seniors", "families", "young_adults"
- family_types: "singles", "couples", "families", "retirees"
- project_types: "habitat_groupe", "ecolieu", "cooperative", "habitat_leger", "colocation", "intergenerational", "community_creation"
- pet_details: "dogs", "cats", "poultry", "horses", "farm_animals"
- unit_type: "studio", "apartment", "house", "room", "tiny_house", "other"
- shared_spaces: "garden", "vegetable_garden", "kitchen", "common_room", "laundry", "workshop", "parking", "coworking", "play_area"
- values: "ecological", "permaculture", "spiritual", "solidarity", "artistic", "self_sufficiency", "biodanza", "meditation", "organic"
- shared_meals: "daily", "weekly", "occasional" ou null
- governance: "consensus", "sociocracy", "association" ou null
- environment: "rural", "urban", "suburban"

Règles:
- group_size = nombre total de personnes ou foyers mentionnés (pas le nombre de logements, sauf si c'est le seul indice)
- Si l'info n'est pas dans le texte, mets null (pas de devinette)
- Pour les booléens, mets null si pas mentionné
- Déduis environment du lieu: village/campagne=rural, petite ville=suburban, grande ville=urban
- near_nature: true si jardin, forêt, campagne mentionnés
- near_transport: true si transports en commun, gare, métro mentionnés`;

function buildUserPrompt(listing: Listing): string {
  return `Titre: ${listing.title}
Lieu: ${listing.location || "Non précisé"} (${listing.country || "?"})
Type: ${listing.listing_type || "Non précisé"}

Description:
${listing.description.slice(0, 1500)}`;
}

// ── Batch processing ──

const BATCH_SIZE = 5; // concurrent calls
const SAVE_EVERY = 50;

async function extractTags(listing: Listing): Promise<ListingTags | null> {
  try {
    const text = await callHaiku(SYSTEM_PROMPT, buildUserPrompt(listing));
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`  ⚠ No JSON for ${listing.id}: ${text.slice(0, 80)}`);
      return null;
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      listing_id: listing.id,
      group_size: parsed.group_size ?? null,
      age_range: parsed.age_range ?? [],
      has_children: parsed.has_children ?? null,
      family_types: parsed.family_types ?? [],
      project_types: parsed.project_types ?? [],
      pets_allowed: parsed.pets_allowed ?? null,
      pet_details: parsed.pet_details ?? [],
      surface_m2: parsed.surface_m2 ?? null,
      num_bedrooms: parsed.num_bedrooms ?? null,
      unit_type: parsed.unit_type ?? null,
      furnished: parsed.furnished ?? null,
      accessible_pmr: parsed.accessible_pmr ?? null,
      shared_spaces: parsed.shared_spaces ?? [],
      values: parsed.values ?? [],
      shared_meals: parsed.shared_meals ?? null,
      has_charter: parsed.has_charter ?? null,
      governance: parsed.governance ?? null,
      environment: parsed.environment ?? null,
      near_nature: parsed.near_nature ?? null,
      near_transport: parsed.near_transport ?? null,
      date_extracted: new Date().toISOString(),
    };
  } catch (e: any) {
    console.error(`  ⚠ Error for ${listing.id}: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║   BATCH TAG EXTRACTION — Habitats Groupés    ║");
  console.log("╚═══════════════════════════════════════════════╝");
  console.log();

  const tagsPath = resolve(ROOT, "data/tags.json");
  const listingsPath = resolve(ROOT, "data/listings.json");

  const listings: Listing[] = JSON.parse(readFileSync(listingsPath, "utf-8"));
  const existingTags: ListingTags[] = JSON.parse(
    readFileSync(tagsPath, "utf-8")
  );
  const taggedIds = new Set(existingTags.map((t) => t.listing_id));

  const untagged = listings.filter((l) => !taggedIds.has(l.id));
  const toProcess = untagged.slice(0, LIMIT);

  console.log(`📊 ${listings.length} annonces totales`);
  console.log(`✅ ${existingTags.length} déjà taggées`);
  console.log(`🔲 ${untagged.length} sans tags`);
  console.log(`🎯 ${toProcess.length} à traiter${DRY_RUN ? " (DRY RUN)" : ""}`);
  console.log();

  if (DRY_RUN) {
    const estimatedTokens = toProcess.length * 1200; // ~1200 tokens/call avg
    const estimatedCost =
      (estimatedTokens / 1_000_000) * 0.8 +
      (toProcess.length * 300 / 1_000_000) * 4.0;
    console.log(`💰 Coût estimé: ~$${estimatedCost.toFixed(2)}`);
    console.log(`   (~${estimatedTokens.toLocaleString()} tokens input, ~${(toProcess.length * 300).toLocaleString()} tokens output)`);
    return;
  }

  const allTags = [...existingTags];
  let processed = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(extractTags));

    for (const result of results) {
      if (result) {
        allTags.push(result);
        processed++;
      } else {
        errors++;
      }
    }

    const total = i + batch.length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const rate = (total / ((Date.now() - startTime) / 1000)).toFixed(1);
    process.stdout.write(
      `\r   ${total}/${toProcess.length} (${rate}/s, ${elapsed}s, ${errors} erreurs)`
    );

    // Save incrementally
    if (total % SAVE_EVERY === 0 || total === toProcess.length) {
      writeFileSync(tagsPath, JSON.stringify(allTags, null, 2));
    }

    // Rate limit: ~50 req/min for Haiku
    if (BATCH_SIZE >= 5) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  // Final save
  writeFileSync(tagsPath, JSON.stringify(allTags, null, 2));

  console.log();
  console.log();
  console.log("─── RÉSULTAT ───");
  console.log(`   ✅ ${processed} tags extraits`);
  console.log(`   ❌ ${errors} erreurs`);
  console.log(`   📁 Total tags: ${allTags.length}/${listings.length}`);
  console.log(
    `   💰 Tokens: ${totalInputTokens.toLocaleString()} input + ${totalOutputTokens.toLocaleString()} output`
  );
  const cost =
    (totalInputTokens / 1_000_000) * 0.8 +
    (totalOutputTokens / 1_000_000) * 4.0;
  console.log(`   💰 Coût: ~$${cost.toFixed(2)}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
