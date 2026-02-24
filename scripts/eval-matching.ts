#!/usr/bin/env node
/**
 * eval-matching.ts — Évaluation end-to-end du pipeline de matching
 *
 * Crée 5 personas fictives, fait tourner le pipeline complet
 * (questionnaire → filtres → scoring IA), puis demande à une IA juge
 * de noter la qualité des suggestions.
 *
 * Usage:
 *   npx tsx scripts/eval-matching.ts
 *
 * Nécessite ANTHROPIC_API_KEY dans web/.env.local
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ──────────────────────────────────────────────
// 0. Load env
// ──────────────────────────────────────────────

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
  console.error("❌ ANTHROPIC_API_KEY manquante dans web/.env.local");
  process.exit(1);
}

// ──────────────────────────────────────────────
// 1. Types (inline to avoid import gymnastics)
// ──────────────────────────────────────────────

type Answers = Record<string, string | string[] | number>;

interface Listing {
  id: string;
  title: string;
  description: string;
  location: string | null;
  province: string | null;
  price: string | null;
  price_amount: number | null;
  listing_type: string | null;
  country: string | null;
}

interface Evaluation {
  listing_id: string;
  overall_score?: number;
  quality_score?: number;
  quality_summary?: string;
  ai_title?: string;
  ai_description?: string;
  highlights?: string[];
  concerns?: string[];
}

interface ListingTags {
  listing_id: string;
  group_size: number | null;
  age_range: string[];
  family_types: string[];
  project_types: string[];
  pets_allowed: boolean | null;
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
}

interface RefinementFilters {
  listing_types_include: string[];
  listing_types_exclude: string[];
  locations_include: string[];
  locations_exclude: string[];
  max_price: number | null;
  min_score: number | null;
  keywords_include: string[];
  keywords_exclude: string[];
}

interface Persona {
  name: string;
  age: number;
  description: string; // short human-readable description
  answers: Answers;
}

interface ScoreResult {
  listing_id: string;
  score: number;
  explanation: string;
}

// ──────────────────────────────────────────────
// 2. The 5 personas
// ──────────────────────────────────────────────

const PERSONAS: Persona[] = [
  {
    name: "Marie, 68 ans — Retraitée spirituelle",
    age: 68,
    description:
      "Retraitée, veuve, cherche un lieu de vie communautaire avec spiritualité (biodanza, méditation), jardin partagé, proximité des soins. Budget modeste. Préfère un petit groupe chaleureux en campagne.",
    answers: {
      motivation: ["romper_isolement", "valeurs", "securite"],
      health_proximity: "essential",
      dream_vision:
        "Un lieu paisible en pleine nature avec un potager partagé, des voisins bienveillants, et la possibilité de pratiquer la biodanza et la méditation ensemble.",
      core_values: ["respect", "spirituality", "ecology", "solidarity"],
      spiritual_importance: "central",
      charter_preference: "good_idea",
      top_priority_text:
        "Trouver une communauté chaleureuse où la spiritualité et le respect du vivant sont au cœur du projet.",
      community_size: "small",
      project_maturity: "existing_mature",
      community_activities: ["shared_meals", "garden", "spiritual"],
      involvement_level: 4,
      shared_meals_importance: "essential",
      preferred_regions: ["no_preference"],
      brussels_proximity: "not_important",
      setting_preference: "rural",
      locations_avoid: "",
      budget_max: 500,
      unit_type: "1_bedroom",
      tenure_type: "rental",
      parking_needs: ["none"],
      practical_needs: ["ground_floor", "garden_access"],
      dealbreakers: ["too_isolated", "too_chaotic", "religious_pressure"],
      other_dealbreakers: "Pas de pression idéologique ou sectaire",
      single_most_important: "values",
    },
  },
  {
    name: "Karim, 35 ans — Famille écolo",
    age: 35,
    description:
      "Père de 2 enfants, cherche un écolieu avec potager, ateliers bricolage, espace pour les enfants. Budget moyen. Veut acheter. Préfère semi-rural, pas trop loin d'une ville pour l'école.",
    answers: {
      motivation: ["ecologique", "projets_communs", "entraide"],
      health_proximity: "preferable",
      dream_vision:
        "Un écolieu où mes enfants grandissent en liberté dans la nature, avec d'autres familles, un grand potager et des ateliers bois.",
      core_values: ["ecology", "solidarity", "autonomy", "creativity"],
      spiritual_importance: "neutral",
      charter_preference: "essential",
      top_priority_text:
        "Un cadre de vie sain et écologique pour élever mes enfants en communauté.",
      community_size: "medium",
      project_maturity: "existing_recent",
      community_activities: ["garden", "diy", "shared_meals", "workshops"],
      involvement_level: 5,
      shared_meals_importance: "nice",
      preferred_regions: ["no_preference"],
      brussels_proximity: "not_important",
      setting_preference: "semi_rural",
      locations_avoid: "",
      budget_max: 900,
      unit_type: "small_house",
      tenure_type: "purchase",
      parking_needs: ["car"],
      practical_needs: ["garden_access", "storage", "pet_friendly"],
      dealbreakers: ["too_expensive", "no_privacy", "language_barrier"],
      other_dealbreakers: "",
      single_most_important: "community_spirit",
    },
  },
  {
    name: "Sophie, 52 ans — Budget serré, urbaine",
    age: 52,
    description:
      "Célibataire, budget très serré, cherche une colocation solidaire ou habitat groupé pas cher près d'une ville (transports). Peu de besoins spirituels, veut surtout du lien social et de l'entraide.",
    answers: {
      motivation: ["economique", "romper_isolement", "entraide"],
      health_proximity: "preferable",
      dream_vision:
        "Un appartement abordable dans un habitat groupé en ville, avec des voisins solidaires et des repas partagés de temps en temps.",
      core_values: ["solidarity", "respect", "democracy", "openness"],
      spiritual_importance: "prefer_without",
      charter_preference: "essential",
      top_priority_text: "Un logement abordable avec des gens bienveillants.",
      community_size: "medium",
      project_maturity: "existing_mature",
      community_activities: ["shared_meals", "cultural", "grocery_coop"],
      involvement_level: 3,
      shared_meals_importance: "nice",
      preferred_regions: ["no_preference"],
      brussels_proximity: "not_important",
      setting_preference: "urban_green",
      locations_avoid: "trop isolé, pleine campagne",
      budget_max: 450,
      unit_type: "studio",
      tenure_type: "rental",
      parking_needs: ["none"],
      practical_needs: ["elevator"],
      dealbreakers: [
        "too_expensive",
        "too_isolated",
        "religious_pressure",
        "language_barrier",
      ],
      other_dealbreakers: "Pas de travaux en cours",
      single_most_important: "budget",
    },
  },
  {
    name: "Léa, 28 ans — Créatrice de communauté",
    age: 28,
    description:
      "Jeune entrepreneuse, veut CO-CRÉER un nouveau projet d'écolieu. Cherche un terrain ou un groupe en formation. Très impliquée, valeurs fortes (permaculture, gouvernance partagée). Budget flexible.",
    answers: {
      motivation: ["projets_communs", "valeurs", "ecologique"],
      health_proximity: "not_needed",
      dream_vision:
        "Cofonder un écovillage avec gouvernance sociocratique, permaculture, tiny houses, et un espace de coworking pour les artisans.",
      core_values: ["ecology", "creativity", "democracy", "autonomy"],
      spiritual_importance: "welcome",
      charter_preference: "essential",
      top_priority_text:
        "Trouver des co-porteurs de projet pour créer un écolieu depuis zéro.",
      community_size: "large",
      project_maturity: "creation",
      community_activities: [
        "garden",
        "workshops",
        "diy",
        "shared_meals",
        "grocery_coop",
      ],
      involvement_level: 5,
      shared_meals_importance: "essential",
      preferred_regions: ["no_preference"],
      brussels_proximity: "not_important",
      setting_preference: "rural",
      locations_avoid: "",
      budget_max: 1200,
      unit_type: "flexible",
      tenure_type: "purchase",
      parking_needs: ["car", "bicycle"],
      practical_needs: ["garden_access", "storage"],
      dealbreakers: ["too_rigid", "no_privacy"],
      other_dealbreakers: "",
      single_most_important: "community_spirit",
    },
  },
  {
    name: "Bernard, 73 ans — Senior autonome",
    age: 73,
    description:
      "Retraité, ancien prof, mobilité réduite (PMR). Cherche un habitat intergénérationnel accessible, pas trop grand, avec du calme. Très attaché à la laïcité. Petit budget.",
    answers: {
      motivation: ["romper_isolement", "securite", "entraide"],
      health_proximity: "essential",
      dream_vision:
        "Un petit collectif calme et intergénérationnel, accessible en fauteuil, près d'un centre-ville pour les commerces et l'hôpital.",
      core_values: ["respect", "solidarity", "democracy", "openness"],
      spiritual_importance: "prefer_without",
      charter_preference: "good_idea",
      top_priority_text:
        "Accessibilité PMR et proximité des soins, dans un cadre laïque et respectueux.",
      community_size: "small",
      project_maturity: "existing_mature",
      community_activities: ["cultural", "shared_meals"],
      involvement_level: 2,
      shared_meals_importance: "occasional",
      preferred_regions: ["no_preference"],
      brussels_proximity: "not_important",
      setting_preference: "urban_green",
      locations_avoid: "trop isolé",
      budget_max: 550,
      unit_type: "1_bedroom",
      tenure_type: "rental",
      parking_needs: ["none"],
      practical_needs: ["ground_floor", "elevator"],
      dealbreakers: [
        "too_isolated",
        "no_accessibility",
        "language_barrier",
        "religious_pressure",
      ],
      other_dealbreakers: "Pas de marches, rez-de-chaussée impératif",
      single_most_important: "health",
    },
  },
];

// ──────────────────────────────────────────────
// 3. Replicate questionnaire mapping (from questionnaire-mapping.ts)
// ──────────────────────────────────────────────

const REGION_TO_PROVINCE: Record<string, string[]> = {
  bruxelles: ["Bruxelles"],
  brabant_wallon: ["Brabant Wallon"],
  hainaut: ["Hainaut"],
  liege: ["Liège"],
  namur: ["Namur"],
  luxembourg: ["Luxembourg"],
  brabant_flamand: ["Flandre"],
  flandre: ["Flandre"],
};

const REGION_TOKENS: Record<string, string> = {
  flandre: "Flandre",
  flamand: "Flandre",
  flamande: "Flandre",
  bruxelles: "Bruxelles",
  hainaut: "Hainaut",
  liege: "Liège",
  liège: "Liège",
  namur: "Namur",
  luxembourg: "Luxembourg",
  "brabant wallon": "Brabant Wallon",
};

function getStr(a: Answers, k: string): string | null {
  const v = a[k];
  return typeof v === "string" ? v : null;
}
function getArr(a: Answers, k: string): string[] {
  const v = a[k];
  return Array.isArray(v) ? (v as string[]) : [];
}
function getNum(a: Answers, k: string): number | null {
  const v = a[k];
  return typeof v === "number" ? v : null;
}
function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function mapAnswersToFilters(answers: Answers): {
  filters: RefinementFilters;
  criteriaSummary: string;
} {
  const w: Record<string, number> = {};
  const f: RefinementFilters = {
    listing_types_include: [],
    listing_types_exclude: [],
    locations_include: [],
    locations_exclude: [],
    max_price: null,
    min_score: null,
    keywords_include: [],
    keywords_exclude: [],
  };
  const summaryParts: string[] = [];

  // single_most_important
  const mostImportant = getStr(answers, "single_most_important");

  // budget_max
  const budgetMax = getNum(answers, "budget_max");
  if (budgetMax !== null) {
    const buffer = mostImportant === "budget" ? 1.05 : 1.15;
    f.max_price = Math.round(budgetMax * buffer);
    summaryParts.push(`Budget max: ${f.max_price}€/mois`);
  }

  // tenure_type
  const tenure = getStr(answers, "tenure_type");
  if (tenure === "rental")
    f.listing_types_include = ["offre-location", "creation-groupe"];
  else if (tenure === "purchase")
    f.listing_types_include = ["offre-vente", "creation-groupe"];
  else if (tenure === "either")
    f.listing_types_include = [
      "offre-location",
      "offre-vente",
      "creation-groupe",
    ];

  // preferred_regions
  const regions = getArr(answers, "preferred_regions");
  if (regions.length > 0 && !regions.includes("no_preference")) {
    const provinces = new Set<string>();
    for (const r of regions) {
      const mapped = REGION_TO_PROVINCE[r];
      if (mapped) mapped.forEach((p) => provinces.add(p));
    }
    if (provinces.size > 0) {
      f.locations_include = Array.from(provinces);
      summaryParts.push(`Régions: ${f.locations_include.join(", ")}`);
    }
  }

  // locations_avoid
  const locAvoid = getStr(answers, "locations_avoid");
  if (locAvoid && locAvoid.trim()) {
    const lower = locAvoid.toLowerCase();
    for (const [token, province] of Object.entries(REGION_TOKENS)) {
      if (lower.includes(token)) f.locations_exclude.push(province);
    }
    f.locations_exclude = [...new Set(f.locations_exclude)];
  }

  // dealbreakers → language_barrier excludes Flandre
  const dealbreakers = getArr(answers, "dealbreakers");
  if (dealbreakers.includes("language_barrier")) {
    if (!f.locations_exclude.includes("Flandre"))
      f.locations_exclude.push("Flandre");
  }

  // Build human-readable criteria summary for the scoring AI
  const motivation = getArr(answers, "motivation");
  if (motivation.length > 0)
    summaryParts.push(`Motivations: ${motivation.join(", ")}`);

  const values = getArr(answers, "core_values");
  if (values.length > 0)
    summaryParts.push(`Valeurs: ${values.join(", ")}`);

  const spiritual = getStr(answers, "spiritual_importance");
  if (spiritual)
    summaryParts.push(`Spiritualité: ${spiritual}`);

  const communitySize = getStr(answers, "community_size");
  if (communitySize)
    summaryParts.push(`Taille communauté: ${communitySize}`);

  const maturity = getStr(answers, "project_maturity");
  if (maturity)
    summaryParts.push(`Maturité projet: ${maturity}`);

  const activities = getArr(answers, "community_activities");
  if (activities.length > 0)
    summaryParts.push(`Activités: ${activities.join(", ")}`);

  const meals = getStr(answers, "shared_meals_importance");
  if (meals)
    summaryParts.push(`Repas partagés: ${meals}`);

  const setting = getStr(answers, "setting_preference");
  if (setting)
    summaryParts.push(`Cadre: ${setting}`);

  const unitType = getStr(answers, "unit_type");
  if (unitType)
    summaryParts.push(`Type logement: ${unitType}`);

  const parking = getArr(answers, "parking_needs");
  if (parking.length > 0)
    summaryParts.push(`Parking: ${parking.join(", ")}`);

  const practical = getArr(answers, "practical_needs");
  if (practical.length > 0)
    summaryParts.push(`Besoins: ${practical.join(", ")}`);

  const health = getStr(answers, "health_proximity");
  if (health)
    summaryParts.push(`Proximité soins: ${health}`);

  if (dealbreakers.length > 0)
    summaryParts.push(`Dealbreakers: ${dealbreakers.join(", ")}`);

  const dream = getStr(answers, "dream_vision");
  if (dream)
    summaryParts.push(`Vision: ${dream}`);

  if (mostImportant)
    summaryParts.push(`Priorité n°1: ${mostImportant}`);

  return { filters: f, criteriaSummary: summaryParts.join("\n") };
}

// ──────────────────────────────────────────────
// 4. Apply hard filters
// ──────────────────────────────────────────────

function applyFilters(
  listing: Listing,
  eval_: Evaluation | null,
  filters: RefinementFilters
): boolean {
  if (
    filters.listing_types_include.length > 0 &&
    (!listing.listing_type ||
      !filters.listing_types_include.includes(listing.listing_type))
  ) {
    // Also allow existing-project and creation-groupe variants
    const expandedTypes = [...filters.listing_types_include];
    if (expandedTypes.includes("creation-groupe"))
      expandedTypes.push("existing-project");
    if (
      !listing.listing_type ||
      !expandedTypes.includes(listing.listing_type)
    )
      return false;
  }

  if (
    filters.listing_types_exclude.length > 0 &&
    listing.listing_type &&
    filters.listing_types_exclude.includes(listing.listing_type)
  )
    return false;

  if (filters.locations_include.length > 0) {
    const loc =
      `${listing.location ?? ""} ${listing.province ?? ""}`.toLowerCase();
    if (!filters.locations_include.some((l) => loc.includes(l.toLowerCase())))
      return false;
  }

  if (filters.locations_exclude.length > 0) {
    const loc =
      `${listing.location ?? ""} ${listing.province ?? ""}`.toLowerCase();
    if (filters.locations_exclude.some((l) => loc.includes(l.toLowerCase())))
      return false;
  }

  if (filters.max_price !== null && listing.price_amount !== null) {
    if (listing.price_amount > filters.max_price) return false;
  }

  return true;
}

// ──────────────────────────────────────────────
// 5. Anthropic API calls (scoring + judge)
// ──────────────────────────────────────────────

let totalInputTokens = 0;
let totalOutputTokens = 0;

async function callAnthropic(
  model: string,
  system: string,
  userMessage: string,
  maxTokens: number
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content[0].text.trim();
  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  totalInputTokens += inputTokens;
  totalOutputTokens += outputTokens;
  return { text, inputTokens, outputTokens };
}

// Score a batch of listings (same logic as the API route)
async function scoreBatch(
  criteria: string,
  listings: { id: string; title: string; description: string; location: string | null; country: string | null; price: string | null; listing_type: string | null; tags_summary: string }[]
): Promise<ScoreResult[]> {
  const listingsText = listings
    .map(
      (l, idx) =>
        `[${idx + 1}] ID: ${l.id}
Titre: ${l.title}
Lieu: ${l.location || "Non précisé"}${l.country ? ` (${l.country})` : ""}
Prix: ${l.price || "Non précisé"}
Type: ${l.listing_type || "Non précisé"}
Tags: ${l.tags_summary || "Aucun"}
Description: ${l.description.slice(0, 500)}`
    )
    .join("\n\n---\n\n");

  const system = `Tu es un assistant qui evalue la compatibilite entre des annonces d'habitat groupe et les criteres personnels d'un utilisateur.

Tu dois attribuer un score de 0 a 100 a chaque annonce:
- 80-100: Correspond tres bien aux criteres
- 60-79: Bonne correspondance partielle
- 40-59: Correspondance moyenne
- 20-39: Faible correspondance
- 0-19: Ne correspond pas

Reponds UNIQUEMENT avec un tableau JSON valide. Pas de texte avant ou apres.
Format: [{"listing_id": "...", "score": N, "explanation": "..."}]
L'explication doit etre courte (1 phrase max, en francais).`;

  const user = `CRITERES DE L'UTILISATEUR:
${criteria}

ANNONCES A EVALUER:
${listingsText}

Evalue chaque annonce selon les criteres. Reponds avec le tableau JSON uniquement.`;

  try {
    const { text } = await callAnthropic(
      "claude-haiku-4-5-20251001",
      system,
      user,
      2000
    );
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("  ⚠ Parsing échoué:", text.slice(0, 100));
      return listings.map((l) => ({
        listing_id: l.id,
        score: 0,
        explanation: "Erreur de parsing",
      }));
    }
    return JSON.parse(jsonMatch[0]);
  } catch (e: any) {
    console.error("  ⚠ Erreur scoring:", e.message);
    return listings.map((l) => ({
      listing_id: l.id,
      score: 0,
      explanation: "Erreur technique",
    }));
  }
}

// ──────────────────────────────────────────────
// 6. Judge AI — evaluates how good the suggestions are
// ──────────────────────────────────────────────

interface JudgeResult {
  overall_grade: string; // A/B/C/D/F
  overall_score: number; // 0-100
  relevance_score: number; // 0-100 — how relevant are the top results?
  diversity_score: number; // 0-100 — variety of suggestions
  dealbreaker_respect: number; // 0-100 — did it avoid dealbreakers?
  ranking_quality: number; // 0-100 — are best options ranked first?
  commentary: string;
  top3_analysis: string; // analysis of top 3 specifically
  worst_suggestion: string; // critique of worst suggestion in top 20
}

async function judgeResults(
  persona: Persona,
  topResults: { listing: Listing; score: number; explanation: string; eval_: Evaluation | null; tags: ListingTags | null }[]
): Promise<JudgeResult> {
  const system = `Tu es un evaluateur expert en matching immobilier communautaire.
On te presente un profil utilisateur et les 20 meilleures annonces que l'algorithme lui a suggerees.

Tu dois evaluer la QUALITE du matching avec des scores de 0 a 100 et une note globale (A/B/C/D/F).

Criteres d'evaluation:
- relevance_score: Les suggestions correspondent-elles au profil?
- diversity_score: Y a-t-il de la variete (lieux, types de projet)?
- dealbreaker_respect: L'algo a-t-il respecte les criteres eliminatoires?
- ranking_quality: Les meilleures options sont-elles en haut du classement?

Notes:
- A (85-100): Excellent matching, suggestions tres pertinentes
- B (70-84): Bon matching, quelques suggestions moyennes
- C (55-69): Matching correct mais des lacunes notables
- D (40-54): Matching mediocre, beaucoup de hors-sujet
- F (0-39): Matching defaillant

Reponds UNIQUEMENT en JSON valide, format:
{
  "overall_grade": "A",
  "overall_score": 87,
  "relevance_score": 90,
  "diversity_score": 80,
  "dealbreaker_respect": 95,
  "ranking_quality": 85,
  "commentary": "...",
  "top3_analysis": "...",
  "worst_suggestion": "..."
}`;

  const listingsText = topResults
    .map(
      (r, i) =>
        `#${i + 1} [Score algo: ${r.score}/100]
Titre: ${r.listing.title}
Lieu: ${r.listing.location || "?"} (${r.listing.country || "?"})
Prix: ${r.listing.price || "Non précisé"}
Type: ${r.listing.listing_type || "?"}
Description: ${r.listing.description.slice(0, 400)}
Explication algo: ${r.explanation}
${r.tags ? `Tags: env=${r.tags.environment || "?"}, group=${r.tags.group_size || "?"}, espaces=${(r.tags.shared_spaces || []).join(",")}, repas=${r.tags.shared_meals || "?"}, valeurs=${(r.tags.values || []).join(",")}, PMR=${r.tags.accessible_pmr ?? "?"}` : "Tags: non disponibles"}`
    )
    .join("\n\n---\n\n");

  const user = `PROFIL UTILISATEUR:
Nom: ${persona.name}
Description: ${persona.description}
Criteres cles:
- Budget: ${persona.answers.budget_max}€/mois
- Cadre: ${persona.answers.setting_preference}
- Taille communauté: ${persona.answers.community_size}
- Maturité: ${persona.answers.project_maturity}
- Spiritualité: ${persona.answers.spiritual_importance}
- Repas partagés: ${persona.answers.shared_meals_importance}
- Santé/proximité soins: ${persona.answers.health_proximity}
- Dealbreakers: ${(persona.answers.dealbreakers as string[]).join(", ")}
- Priorité n°1: ${persona.answers.single_most_important}
- Vision: ${persona.answers.dream_vision}

LES 20 SUGGESTIONS DE L'ALGORITHME:
${listingsText}

Evalue la qualite globale de ces suggestions pour ce profil.`;

  try {
    const { text } = await callAnthropic(
      "claude-sonnet-4-6-20250514",
      system,
      user,
      1500
    );
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found in judge response");
    return JSON.parse(jsonMatch[0]);
  } catch (e: any) {
    console.error("  ⚠ Erreur juge:", e.message);
    return {
      overall_grade: "?",
      overall_score: 0,
      relevance_score: 0,
      diversity_score: 0,
      dealbreaker_respect: 0,
      ranking_quality: 0,
      commentary: `Erreur: ${e.message}`,
      top3_analysis: "",
      worst_suggestion: "",
    };
  }
}

// ──────────────────────────────────────────────
// 7. Load data
// ──────────────────────────────────────────────

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, path), "utf-8"));
}

// ──────────────────────────────────────────────
// 8. Main
// ──────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║   ÉVALUATION DU PIPELINE DE MATCHING — Habitats Groupés    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();

  // Load data
  console.log("📂 Chargement des données...");
  const listings = loadJson<Listing[]>("data/listings.json");
  const evaluations = loadJson<Evaluation[]>("data/evaluations.json");
  const tags = loadJson<ListingTags[]>("data/tags.json");
  console.log(
    `   ${listings.length} annonces, ${evaluations.length} évaluations, ${tags.length} tags`
  );

  // Index by listing_id
  const evalMap = new Map(evaluations.map((e) => [e.listing_id, e]));
  const tagsMap = new Map(tags.map((t) => [t.listing_id, t]));

  const BATCH_SIZE = 10;
  const TOP_N = 20;
  const allJudgeResults: {
    persona: Persona;
    judge: JudgeResult;
    filteredCount: number;
    scoredCount: number;
  }[] = [];

  for (const persona of PERSONAS) {
    console.log();
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`👤 ${persona.name}`);
    console.log(`   ${persona.description}`);
    console.log();

    // Step 1: Map answers to filters
    const { filters, criteriaSummary } = mapAnswersToFilters(persona.answers);
    console.log(`📋 Filtres durs:`);
    if (filters.listing_types_include.length > 0)
      console.log(
        `   Types: ${filters.listing_types_include.join(", ")}`
      );
    if (filters.locations_include.length > 0)
      console.log(
        `   Régions: ${filters.locations_include.join(", ")}`
      );
    if (filters.locations_exclude.length > 0)
      console.log(
        `   Exclure: ${filters.locations_exclude.join(", ")}`
      );
    if (filters.max_price !== null)
      console.log(`   Prix max: ${filters.max_price}€`);

    // Step 2: Apply hard filters
    const filtered = listings.filter((l) =>
      applyFilters(l, evalMap.get(l.id) ?? null, filters)
    );
    console.log(
      `🔍 ${filtered.length}/${listings.length} annonces après filtrage`
    );

    if (filtered.length === 0) {
      console.log("   ⚠ Aucune annonce après filtrage, skip.");
      allJudgeResults.push({
        persona,
        judge: {
          overall_grade: "F",
          overall_score: 0,
          relevance_score: 0,
          diversity_score: 0,
          dealbreaker_respect: 0,
          ranking_quality: 0,
          commentary: "Aucune annonce ne passe les filtres durs.",
          top3_analysis: "",
          worst_suggestion: "",
        },
        filteredCount: 0,
        scoredCount: 0,
      });
      continue;
    }

    // Step 3: Prepare for scoring — take a sample if too many
    const toScore =
      filtered.length > 100
        ? (() => {
            // Sort by quality_score desc, take top 100
            const withEval = filtered.map((l) => ({
              listing: l,
              score: evalMap.get(l.id)?.overall_score ?? evalMap.get(l.id)?.quality_score ?? 0,
            }));
            withEval.sort((a, b) => b.score - a.score);
            return withEval.slice(0, 100).map((w) => w.listing);
          })()
        : filtered;

    console.log(`🤖 Scoring IA de ${toScore.length} annonces...`);

    // Build tags summary for each listing
    const listingSummaries = toScore.map((l) => {
      const t = tagsMap.get(l.id);
      const tagParts: string[] = [];
      if (t) {
        if (t.environment) tagParts.push(t.environment);
        if (t.group_size) tagParts.push(`${t.group_size} pers.`);
        if (t.shared_spaces?.length) tagParts.push(t.shared_spaces.join(", "));
        if (t.values?.length) tagParts.push(t.values.join(", "));
        if (t.shared_meals) tagParts.push(`repas: ${t.shared_meals}`);
        if (t.pets_allowed) tagParts.push("animaux OK");
        if (t.accessible_pmr) tagParts.push("PMR");
        if (t.project_types?.length) tagParts.push(t.project_types.join(", "));
      }
      return {
        id: l.id,
        title: l.title,
        description: l.description,
        location: l.location,
        country: l.country,
        price: l.price,
        listing_type: l.listing_type,
        tags_summary: tagParts.join(" | ") || "Aucun tag",
      };
    });

    // Score in batches
    const allScores: ScoreResult[] = [];
    for (let i = 0; i < listingSummaries.length; i += BATCH_SIZE) {
      const batch = listingSummaries.slice(i, i + BATCH_SIZE);
      process.stdout.write(
        `   Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(listingSummaries.length / BATCH_SIZE)}...`
      );
      const results = await scoreBatch(criteriaSummary, batch);
      allScores.push(...results);
      console.log(` ✓`);
    }

    // Sort by score desc
    allScores.sort((a, b) => b.score - a.score);
    const top20 = allScores.slice(0, TOP_N);

    console.log(
      `📊 Top 5 scores: ${top20
        .slice(0, 5)
        .map((r) => r.score)
        .join(", ")}`
    );

    // Step 4: Judge
    console.log(`⚖️  Évaluation par le juge IA...`);
    const topWithData = top20.map((r) => {
      const listing = listings.find((l) => l.id === r.listing_id)!;
      return {
        listing,
        score: r.score,
        explanation: r.explanation,
        eval_: evalMap.get(r.listing_id) ?? null,
        tags: tagsMap.get(r.listing_id) ?? null,
      };
    });

    const judgeResult = await judgeResults(persona, topWithData);
    console.log(
      `   Note: ${judgeResult.overall_grade} (${judgeResult.overall_score}/100)`
    );

    allJudgeResults.push({
      persona,
      judge: judgeResult,
      filteredCount: filtered.length,
      scoredCount: toScore.length,
    });
  }

  // ──────────────────────────────────────────────
  // 9. Summary table
  // ──────────────────────────────────────────────

  console.log();
  console.log("╔══════════════════════════════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                                    RÉSULTATS DE L'ÉVALUATION                                          ║");
  console.log("╠═════════════════════════════════════╦═══════╦═══════╦═══════════╦═══════════╦══════════════╦════════════╣");
  console.log("║ Persona                             ║ Note  ║ Score ║ Pertinence║ Diversité ║ Dealbreakers ║ Classement ║");
  console.log("╠═════════════════════════════════════╬═══════╬═══════╬═══════════╬═══════════╬══════════════╬════════════╣");

  for (const r of allJudgeResults) {
    const name = r.persona.name.slice(0, 35).padEnd(35);
    const grade = r.judge.overall_grade.padStart(2).padEnd(5);
    const score = String(r.judge.overall_score).padStart(3).padEnd(5);
    const rel = String(r.judge.relevance_score).padStart(5).padEnd(9);
    const div = String(r.judge.diversity_score).padStart(5).padEnd(9);
    const db = String(r.judge.dealbreaker_respect).padStart(6).padEnd(12);
    const rank = String(r.judge.ranking_quality).padStart(5).padEnd(10);
    console.log(
      `║ ${name} ║ ${grade} ║ ${score} ║ ${rel} ║ ${div} ║ ${db} ║ ${rank} ║`
    );
  }

  console.log("╠═════════════════════════════════════╬═══════╬═══════╬═══════════╬═══════════╬══════════════╬════════════╣");

  // Average
  const avg = (key: keyof JudgeResult) => {
    const vals = allJudgeResults.map((r) => r.judge[key] as number);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  const avgScore = avg("overall_score");
  const avgGrade =
    avgScore >= 85
      ? "A"
      : avgScore >= 70
        ? "B"
        : avgScore >= 55
          ? "C"
          : avgScore >= 40
            ? "D"
            : "F";
  console.log(
    `║ ${"MOYENNE".padEnd(35)} ║ ${avgGrade.padStart(2).padEnd(5)} ║ ${String(avgScore).padStart(3).padEnd(5)} ║ ${String(avg("relevance_score")).padStart(5).padEnd(9)} ║ ${String(avg("diversity_score")).padStart(5).padEnd(9)} ║ ${String(avg("dealbreaker_respect")).padStart(6).padEnd(12)} ║ ${String(avg("ranking_quality")).padStart(5).padEnd(10)} ║`
  );
  console.log("╚═════════════════════════════════════╩═══════╩═══════╩═══════════╩═══════════╩══════════════╩════════════╝");

  // Detailed commentary
  console.log();
  console.log("─── DÉTAILS PAR PERSONA ───");
  for (const r of allJudgeResults) {
    console.log();
    console.log(`👤 ${r.persona.name}`);
    console.log(`   Annonces filtrées: ${r.filteredCount} | Scorées: ${r.scoredCount}`);
    console.log(`   ${r.judge.commentary}`);
    if (r.judge.top3_analysis)
      console.log(`   Top 3: ${r.judge.top3_analysis}`);
    if (r.judge.worst_suggestion)
      console.log(`   Pire suggestion: ${r.judge.worst_suggestion}`);
  }

  // Cost estimation
  console.log();
  console.log("─── COÛT ───");
  // Haiku pricing: $0.80/MTok input, $4/MTok output
  // Sonnet pricing: $3/MTok input, $15/MTok output
  const haikuInputCostPerM = 0.80;
  const haikuOutputCostPerM = 4.0;
  const sonnetInputCostPerM = 3.0;
  const sonnetOutputCostPerM = 15.0;

  // Rough split: 5 judge calls = Sonnet, rest = Haiku
  // We can't separate perfectly, so estimate
  const estimatedSonnetInput = PERSONAS.length * 3000; // ~3k tokens per judge call
  const estimatedSonnetOutput = PERSONAS.length * 800; // ~800 tokens per response
  const estimatedHaikuInput = totalInputTokens - estimatedSonnetInput;
  const estimatedHaikuOutput = totalOutputTokens - estimatedSonnetOutput;

  const haikuCost =
    (Math.max(0, estimatedHaikuInput) / 1_000_000) * haikuInputCostPerM +
    (Math.max(0, estimatedHaikuOutput) / 1_000_000) * haikuOutputCostPerM;
  const sonnetCost =
    (estimatedSonnetInput / 1_000_000) * sonnetInputCostPerM +
    (estimatedSonnetOutput / 1_000_000) * sonnetOutputCostPerM;

  console.log(`   Tokens totaux: ${totalInputTokens.toLocaleString()} input + ${totalOutputTokens.toLocaleString()} output`);
  console.log(`   Coût estimé: ~$${(haikuCost + sonnetCost).toFixed(3)}`);
  console.log(`     Haiku (scoring):  ~$${haikuCost.toFixed(3)}`);
  console.log(`     Sonnet (juge):    ~$${sonnetCost.toFixed(3)}`);
  console.log();

  // Per-user cost estimate (if this was production)
  const scoringCallsPerUser = Math.ceil(100 / BATCH_SIZE);
  const avgTokensPerScoringCall = totalInputTokens / (PERSONAS.length * scoringCallsPerUser);
  const perUserCost =
    (scoringCallsPerUser * avgTokensPerScoringCall / 1_000_000) * haikuInputCostPerM +
    (scoringCallsPerUser * 500 / 1_000_000) * haikuOutputCostPerM;
  console.log(`   💡 Coût estimé par utilisateur en prod (scoring seul): ~$${perUserCost.toFixed(4)}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
