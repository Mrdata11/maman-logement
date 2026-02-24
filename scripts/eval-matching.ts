#!/usr/bin/env node
/**
 * eval-matching.ts — Évaluation end-to-end du pipeline de matching
 *
 * Crée 5 personas fictives, fait tourner le pipeline complet
 * (questionnaire → filtres → score pondéré + soft penalties),
 * puis demande à une IA juge de noter la qualité des suggestions.
 *
 * V2: Remplace le scoring Haiku par criteria_scores pondérés + soft penalties.
 *     Seul le juge utilise l'API (Sonnet). Scoring = $0/utilisateur.
 *
 * Usage:
 *   npx tsx scripts/eval-matching.ts
 *
 * Nécessite ANTHROPIC_API_KEY dans web/.env.local (pour le juge uniquement)
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
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("ANTHROPIC_API_KEY manquante dans web/.env.local");
  process.exit(1);
}

// ──────────────────────────────────────────────
// 1. Types
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
  criteria_scores?: Record<string, number>;
  match_summary?: string;
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

interface SoftFilterContext {
  budgetMax: number | null;
  settingPreference: string | null;
  spiritualImportance: string | null;
  communitySize: string | null;
  projectMaturity: string | null;
  healthProximity: string | null;
}

interface Persona {
  name: string;
  age: number;
  description: string;
  answers: Answers;
}

interface ScoredListing {
  listing: Listing;
  eval_: Evaluation | null;
  tags: ListingTags | null;
  baseScore: number;
  weightedScore: number;
  softPenalty: number;
  finalScore: number;
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
// 3. Questionnaire mapping (replicates questionnaire-mapping.ts)
// ──────────────────────────────────────────────

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

interface MappingResult {
  filters: RefinementFilters;
  weights: Record<string, number>;
  softContext: SoftFilterContext;
}

function mapAnswersToFiltersAndWeights(answers: Answers): MappingResult {
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

  // ─── Weights (replicated from questionnaire-mapping.ts) ───

  const mostImportant = getStr(answers, "single_most_important");
  if (mostImportant) {
    switch (mostImportant) {
      case "budget": w.rental_price = (w.rental_price ?? 1) + 1.0; break;
      case "location": w.location_brussels = (w.location_brussels ?? 1) + 1.0; break;
      case "community_spirit":
        w.community_meals = (w.community_meals ?? 1) + 0.5;
        w.community_size_and_maturity = (w.community_size_and_maturity ?? 1) + 0.5;
        w.common_projects = (w.common_projects ?? 1) + 0.5;
        break;
      case "values": w.values_alignment = (w.values_alignment ?? 1) + 1.0; break;
      case "practical":
        w.unit_type = (w.unit_type ?? 1) + 0.5;
        w.parking = (w.parking ?? 1) + 0.5;
        break;
      case "health": w.near_hospital = (w.near_hospital ?? 1) + 1.5; break;
    }
  }

  const spiritual = getStr(answers, "spiritual_importance");
  if (spiritual) {
    switch (spiritual) {
      case "central":
        w.spiritual_alignment = (w.spiritual_alignment ?? 1) + 1.5;
        w.large_hall_biodanza = (w.large_hall_biodanza ?? 1) + 1.5;
        w.values_alignment = (w.values_alignment ?? 1) + 0.5;
        break;
      case "welcome":
        w.spiritual_alignment = (w.spiritual_alignment ?? 1) + 0.5;
        break;
      case "prefer_without":
        w.spiritual_alignment = 0.2;
        w.large_hall_biodanza = 0.2;
        break;
    }
  }

  const brussels = getStr(answers, "brussels_proximity");
  if (brussels) {
    switch (brussels) {
      case "in_brussels": w.location_brussels = (w.location_brussels ?? 1) + 2.0; break;
      case "very_close": w.location_brussels = (w.location_brussels ?? 1) + 1.5; break;
      case "somewhat": w.location_brussels = (w.location_brussels ?? 1) + 0.5; break;
      case "not_important": w.location_brussels = 0.3; break;
    }
  }

  const health = getStr(answers, "health_proximity");
  if (health) {
    switch (health) {
      case "essential": w.near_hospital = (w.near_hospital ?? 1) + 1.5; break;
      case "preferable": w.near_hospital = (w.near_hospital ?? 1) + 0.5; break;
      case "not_needed": w.near_hospital = 0.3; break;
    }
  }

  const meals = getStr(answers, "shared_meals_importance");
  if (meals) {
    switch (meals) {
      case "essential": w.community_meals = (w.community_meals ?? 1) + 1.5; break;
      case "nice": w.community_meals = (w.community_meals ?? 1) + 0.5; break;
      case "not_interested": w.community_meals = 0.3; break;
    }
  }

  const involvement = getNum(answers, "involvement_level");
  if (involvement !== null) {
    if (involvement >= 4) {
      w.common_projects = (w.common_projects ?? 1) + 0.5;
      w.community_meals = (w.community_meals ?? 1) + 0.3;
    } else if (involvement <= 2) {
      w.common_projects = Math.max(0.3, (w.common_projects ?? 1) - 0.3);
      w.community_meals = Math.max(0.3, (w.community_meals ?? 1) - 0.3);
    }
  }

  const charter = getStr(answers, "charter_preference");
  if (charter === "essential") w.charter_openness = (w.charter_openness ?? 1) + 1.0;
  else if (charter === "good_idea") w.charter_openness = (w.charter_openness ?? 1) + 0.3;

  const parking = getArr(answers, "parking_needs");
  if (parking.includes("car") || parking.includes("motorcycle"))
    w.parking = (w.parking ?? 1) + 1.0;

  const budgetMax = getNum(answers, "budget_max");
  if (budgetMax !== null) {
    if (budgetMax <= 600) w.rental_price = (w.rental_price ?? 1) + 1.0;
    else if (budgetMax <= 800) w.rental_price = (w.rental_price ?? 1) + 0.5;
    else if (budgetMax >= 1200) w.rental_price = 0.3;
  }

  const unitType = getStr(answers, "unit_type");
  if (unitType && unitType !== "flexible") {
    w.unit_type = (w.unit_type ?? 1) + (unitType === "2_bedrooms" || unitType === "small_house" ? 1.0 : 0.5);
  }

  const values = getArr(answers, "core_values");
  if (values.includes("ecology")) w.values_alignment = (w.values_alignment ?? 1) + 0.3;
  if (values.includes("solidarity")) w.values_alignment = (w.values_alignment ?? 1) + 0.3;
  if (values.includes("spirituality")) {
    w.spiritual_alignment = (w.spiritual_alignment ?? 1) + 0.5;
    w.large_hall_biodanza = (w.large_hall_biodanza ?? 1) + 0.3;
  }
  if (values.includes("openness")) w.charter_openness = (w.charter_openness ?? 1) + 0.3;
  if (values.includes("creativity")) w.common_projects = (w.common_projects ?? 1) + 0.3;

  const motivation = getArr(answers, "motivation");
  if (motivation.includes("valeurs")) w.values_alignment = (w.values_alignment ?? 1) + 0.3;
  if (motivation.includes("economique")) w.rental_price = (w.rental_price ?? 1) + 0.5;
  if (motivation.includes("ecologique")) w.values_alignment = (w.values_alignment ?? 1) + 0.3;
  if (motivation.includes("projets_communs")) w.common_projects = (w.common_projects ?? 1) + 0.5;
  if (motivation.includes("entraide")) w.community_size_and_maturity = (w.community_size_and_maturity ?? 1) + 0.3;
  if (motivation.includes("securite")) w.near_hospital = (w.near_hospital ?? 1) + 0.3;

  const activities = getArr(answers, "community_activities");
  if (activities.includes("spiritual")) {
    w.spiritual_alignment = (w.spiritual_alignment ?? 1) + 0.5;
    w.large_hall_biodanza = (w.large_hall_biodanza ?? 1) + 0.3;
  }
  if (activities.includes("shared_meals")) w.community_meals = (w.community_meals ?? 1) + 0.3;

  const communitySize = getStr(answers, "community_size");
  if (communitySize && communitySize !== "no_preference")
    w.community_size_and_maturity = (w.community_size_and_maturity ?? 1) + 0.5;

  const dealbreakers = getArr(answers, "dealbreakers");
  if (dealbreakers.includes("too_chaotic")) w.charter_openness = (w.charter_openness ?? 1) + 0.5;

  // Clamp all weights
  for (const key of Object.keys(w)) {
    w[key] = clamp(w[key], 0.2, 3.0);
  }

  // ─── Hard filters ───

  const tenure = getStr(answers, "tenure_type");
  if (tenure === "rental") f.listing_types_include = ["offre-location", "creation-groupe"];
  else if (tenure === "purchase") f.listing_types_include = ["offre-vente", "creation-groupe"];
  else if (tenure === "either") f.listing_types_include = ["offre-location", "offre-vente", "creation-groupe"];

  // Location exclude only (no more hard include — let soft penalties handle proximity)
  const locAvoid = getStr(answers, "locations_avoid");
  if (locAvoid && locAvoid.trim()) {
    const REGION_TOKENS: Record<string, string> = {
      flandre: "Flandre", flamand: "Flandre", flamande: "Flandre",
      bruxelles: "Bruxelles", hainaut: "Hainaut",
      liege: "Liège", liège: "Liège", namur: "Namur",
      luxembourg: "Luxembourg", "brabant wallon": "Brabant Wallon",
    };
    const lower = locAvoid.toLowerCase();
    for (const [token, province] of Object.entries(REGION_TOKENS)) {
      if (lower.includes(token)) f.locations_exclude.push(province);
    }
    f.locations_exclude = [...new Set(f.locations_exclude)];
  }

  if (dealbreakers.includes("language_barrier")) {
    if (!f.locations_exclude.includes("Flandre")) f.locations_exclude.push("Flandre");
  }

  // Soft max_price: remove hard filter, handled by soft penalties
  // f.max_price is NOT set anymore

  // ─── Soft filter context ───
  const softContext: SoftFilterContext = {
    budgetMax: budgetMax,
    settingPreference: getStr(answers, "setting_preference"),
    spiritualImportance: spiritual,
    communitySize: communitySize,
    projectMaturity: getStr(answers, "project_maturity"),
    healthProximity: health,
  };

  return { filters: f, weights: w, softContext };
}

// ──────────────────────────────────────────────
// 4. Hard filters (only type + location exclude)
// ──────────────────────────────────────────────

function applyHardFilters(listing: Listing, filters: RefinementFilters): boolean {
  // Listing type
  if (filters.listing_types_include.length > 0) {
    const expandedTypes = [...filters.listing_types_include];
    if (expandedTypes.includes("creation-groupe")) expandedTypes.push("existing-project");
    if (!listing.listing_type || !expandedTypes.includes(listing.listing_type))
      return false;
  }

  // Location exclude (hard — language barrier etc.)
  if (filters.locations_exclude.length > 0) {
    const loc = `${listing.location ?? ""} ${listing.province ?? ""}`.toLowerCase();
    if (filters.locations_exclude.some((l) => loc.includes(l.toLowerCase())))
      return false;
  }

  return true;
}

// ──────────────────────────────────────────────
// 5. Weighted scoring (replaces Haiku API calls)
// ──────────────────────────────────────────────

function calculateWeightedScore(
  baseScore: number,
  weights: Record<string, number>,
  criteriaScores?: Record<string, number>
): number {
  if (!criteriaScores || Object.keys(weights).length === 0) return baseScore;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const score = criteriaScores[key];
    if (score !== undefined && weight > 0) {
      weightedSum += (score / 10) * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return baseScore;
  const weightedScore = (weightedSum / totalWeight) * 100;
  return Math.round(baseScore * 0.4 + weightedScore * 0.6);
}

// ──────────────────────────────────────────────
// 6. Soft penalties
// ──────────────────────────────────────────────

function calculateSoftPenalties(
  listing: Listing,
  tags: ListingTags | null,
  context: SoftFilterContext
): { penalty: number; reasons: string[] } {
  let penalty = 0;
  const reasons: string[] = [];

  // Budget
  if (context.budgetMax !== null && listing.price_amount !== null) {
    const ratio = listing.price_amount / context.budgetMax;
    if (ratio <= 0.7) { penalty += 10; reasons.push("prix très avantageux"); }
    else if (ratio <= 1.0) { penalty += 5; reasons.push("dans le budget"); }
    else if (ratio <= 1.15) { penalty -= 10; reasons.push("légèrement au-dessus du budget"); }
    else if (ratio <= 1.3) { penalty -= 20; reasons.push("au-dessus du budget"); }
    else { penalty -= 30; reasons.push("très au-dessus du budget"); }
  }

  // Environment
  if (context.settingPreference && tags?.environment) {
    const matchMap: Record<string, string[]> = {
      rural: ["rural"],
      semi_rural: ["rural", "suburban"],
      urban_green: ["suburban", "urban"],
      urban: ["urban"],
    };
    const acceptable = matchMap[context.settingPreference] ?? [];
    if (acceptable.includes(tags.environment)) {
      penalty += 5;
      reasons.push(`cadre ${tags.environment} correspond`);
    } else {
      penalty -= 15;
      reasons.push(`cadre ${tags.environment} ne correspond pas (veut ${context.settingPreference})`);
    }
  }

  // Spirituality
  if (context.spiritualImportance && tags?.values) {
    const hasSpiritual = tags.values.some((v) =>
      ["spiritual", "biodanza", "meditation"].includes(v)
    );
    if (context.spiritualImportance === "central" && hasSpiritual) {
      penalty += 8; reasons.push("spiritualité présente");
    } else if (context.spiritualImportance === "central" && !hasSpiritual) {
      penalty -= 5; reasons.push("spiritualité absente");
    } else if (context.spiritualImportance === "prefer_without" && hasSpiritual) {
      penalty -= 15; reasons.push("spiritualité non souhaitée mais présente");
    } else if (context.spiritualImportance === "prefer_without" && !hasSpiritual) {
      penalty += 3; reasons.push("cadre laïque");
    }
  }

  // Community size
  if (context.communitySize && tags?.group_size) {
    const size = tags.group_size;
    switch (context.communitySize) {
      case "small":
        if (size >= 4 && size <= 8) { penalty += 5; reasons.push(`taille ${size} = petit groupe`); }
        else if (size > 15) { penalty -= 10; reasons.push(`taille ${size} trop grande`); }
        break;
      case "medium":
        if (size >= 8 && size <= 15) { penalty += 5; reasons.push(`taille ${size} = groupe moyen`); }
        else if (size < 4 || size > 25) { penalty -= 8; reasons.push(`taille ${size} ne correspond pas`); }
        break;
      case "large":
        if (size >= 15) { penalty += 5; reasons.push(`taille ${size} = grand groupe`); }
        else if (size < 8) { penalty -= 8; reasons.push(`taille ${size} trop petite`); }
        break;
    }
  }

  // Project maturity
  if (context.projectMaturity && listing.listing_type) {
    if (context.projectMaturity === "creation" && listing.listing_type === "creation-groupe") {
      penalty += 5; reasons.push("projet en création");
    } else if (context.projectMaturity === "existing_mature" && listing.listing_type === "existing-project") {
      penalty += 5; reasons.push("projet mature");
    } else if (context.projectMaturity === "existing_mature" && listing.listing_type === "creation-groupe") {
      penalty -= 8; reasons.push("projet en création (veut mature)");
    } else if (context.projectMaturity === "creation" && listing.listing_type === "existing-project") {
      penalty -= 5; reasons.push("projet déjà existant (veut créer)");
    }
  }

  return { penalty: Math.max(-30, Math.min(15, penalty)), reasons };
}

// ──────────────────────────────────────────────
// 7. Anthropic API (Haiku scoring + Sonnet judge)
// ──────────────────────────────────────────────

let totalInputTokens = 0;
let totalOutputTokens = 0;
let haikuInputTokens = 0;
let haikuOutputTokens = 0;
let sonnetInputTokens = 0;
let sonnetOutputTokens = 0;

async function callAnthropic(
  model: string,
  system: string,
  userMessage: string,
  maxTokens: number
): Promise<{ text: string }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model, max_tokens: maxTokens, system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err}`);
  }

  const data = await res.json();
  const inTok = data.usage?.input_tokens ?? 0;
  const outTok = data.usage?.output_tokens ?? 0;
  totalInputTokens += inTok;
  totalOutputTokens += outTok;
  if (model.includes("haiku")) { haikuInputTokens += inTok; haikuOutputTokens += outTok; }
  else { sonnetInputTokens += inTok; sonnetOutputTokens += outTok; }
  return { text: data.content[0].text.trim() };
}

// ──────────────────────────────────────────────
// 7b. Haiku scoring (semantic refinement of top candidates)
// ──────────────────────────────────────────────

interface HaikuScoreResult { listing_id: string; score: number; explanation: string; }

async function scoreBatchWithHaiku(
  criteriaText: string,
  items: ScoredListing[]
): Promise<HaikuScoreResult[]> {
  const listingsText = items
    .map((r, idx) => {
      const tagParts: string[] = [];
      if (r.tags) {
        if (r.tags.environment) tagParts.push(r.tags.environment);
        if (r.tags.group_size) tagParts.push(`${r.tags.group_size} pers.`);
        if (r.tags.shared_spaces?.length) tagParts.push(r.tags.shared_spaces.join(", "));
        if (r.tags.values?.length) tagParts.push(r.tags.values.join(", "));
        if (r.tags.shared_meals) tagParts.push(`repas: ${r.tags.shared_meals}`);
        if (r.tags.pets_allowed) tagParts.push("animaux OK");
        if (r.tags.accessible_pmr) tagParts.push("PMR");
        if (r.tags.project_types?.length) tagParts.push(r.tags.project_types.join(", "));
      }
      return `[${idx + 1}] ID: ${r.listing.id}
Titre: ${r.listing.title}
Lieu: ${r.listing.location || "Non précisé"}${r.listing.country ? ` (${r.listing.country})` : ""}
Prix: ${r.listing.price || "Non précisé"}
Type: ${r.listing.listing_type || "Non précisé"}
Tags: ${tagParts.join(" | ") || "Aucun"}
Description: ${r.listing.description.slice(0, 500)}`;
    })
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
${criteriaText}

ANNONCES A EVALUER:
${listingsText}

Evalue chaque annonce selon les criteres. Reponds avec le tableau JSON uniquement.`;

  try {
    const { text } = await callAnthropic("claude-haiku-4-5-20251001", system, user, 2000);
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return items.map((r) => ({ listing_id: r.listing.id, score: 0, explanation: "Erreur parsing" }));
    return JSON.parse(jsonMatch[0]);
  } catch (e: any) {
    return items.map((r) => ({ listing_id: r.listing.id, score: 0, explanation: "Erreur technique" }));
  }
}

function buildCriteriaText(persona: Persona): string {
  const a = persona.answers;
  const parts: string[] = [persona.description];
  if (a.budget_max) parts.push(`Budget max: ${a.budget_max}€/mois`);
  if (a.setting_preference) parts.push(`Cadre: ${a.setting_preference}`);
  if (a.community_size) parts.push(`Taille communauté: ${a.community_size}`);
  if (a.project_maturity) parts.push(`Maturité: ${a.project_maturity}`);
  if (a.spiritual_importance) parts.push(`Spiritualité: ${a.spiritual_importance}`);
  if (a.shared_meals_importance) parts.push(`Repas partagés: ${a.shared_meals_importance}`);
  if (a.health_proximity) parts.push(`Proximité soins: ${a.health_proximity}`);
  const db = getArr(a, "dealbreakers");
  if (db.length > 0) parts.push(`Dealbreakers: ${db.join(", ")}`);
  if (a.dream_vision) parts.push(`Vision: ${a.dream_vision}`);
  if (a.single_most_important) parts.push(`Priorité n°1: ${a.single_most_important}`);
  return parts.join("\n");
}

// ──────────────────────────────────────────────
// 8. Judge AI
// ──────────────────────────────────────────────

interface JudgeResult {
  overall_grade: string;
  overall_score: number;
  relevance_score: number;
  diversity_score: number;
  dealbreaker_respect: number;
  ranking_quality: number;
  commentary: string;
  top3_analysis: string;
  worst_suggestion: string;
}

async function judgeResults(
  persona: Persona,
  topResults: ScoredListing[]
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
        `#${i + 1} [Score: ${r.finalScore} = base ${r.baseScore} + weighted ${r.weightedScore} + soft ${r.softPenalty > 0 ? "+" : ""}${r.softPenalty}]
Titre: ${r.listing.title}
Lieu: ${r.listing.location || "?"} (${r.listing.country || "?"})
Prix: ${r.listing.price || "Non précisé"}
Type: ${r.listing.listing_type || "?"}
Description: ${r.listing.description.slice(0, 400)}
Ajustements: ${r.explanation}
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

LES 20 SUGGESTIONS DE L'ALGORITHME (V2 — score pondéré + soft penalties):
${listingsText}

Evalue la qualite globale de ces suggestions pour ce profil.`;

  try {
    const { text } = await callAnthropic("claude-sonnet-4-5-20250929", system, user, 1500);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found in judge response");
    return JSON.parse(jsonMatch[0]);
  } catch (e: any) {
    console.error(`  ⚠ Erreur juge: ${e.message}`);
    return {
      overall_grade: "?", overall_score: 0, relevance_score: 0,
      diversity_score: 0, dealbreaker_respect: 0, ranking_quality: 0,
      commentary: `Erreur: ${e.message}`, top3_analysis: "", worst_suggestion: "",
    };
  }
}

// ──────────────────────────────────────────────
// 9. Load data
// ──────────────────────────────────────────────

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, path), "utf-8"));
}

// ──────────────────────────────────────────────
// 10. Main
// ──────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║   ÉVALUATION MATCHING V2 — Hybride pondéré + Haiku + Soft  ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();

  const listings = loadJson<Listing[]>("data/listings.json");
  const evaluations = loadJson<Evaluation[]>("data/evaluations.json");
  const tags = loadJson<ListingTags[]>("data/tags.json");
  console.log(`📂 ${listings.length} annonces, ${evaluations.length} évaluations, ${tags.length} tags`);

  const evalMap = new Map(evaluations.map((e) => [e.listing_id, e]));
  const tagsMap = new Map(tags.map((t) => [t.listing_id, t]));

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

    // Step 1: Map answers
    const { filters, weights, softContext } = mapAnswersToFiltersAndWeights(persona.answers);

    console.log(`📋 Filtres durs:`);
    if (filters.listing_types_include.length > 0)
      console.log(`   Types: ${filters.listing_types_include.join(", ")}`);
    if (filters.locations_exclude.length > 0)
      console.log(`   Exclure: ${filters.locations_exclude.join(", ")}`);
    console.log(`📊 Soft context: budget=${softContext.budgetMax}€, cadre=${softContext.settingPreference}, spirit=${softContext.spiritualImportance}, taille=${softContext.communitySize}`);

    const topWeights = Object.entries(weights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k}=${v.toFixed(1)}`);
    console.log(`⚖️  Top poids: ${topWeights.join(", ")}`);

    // Step 2: Hard filters
    const filtered = listings.filter((l) => applyHardFilters(l, filters));
    console.log(`🔍 ${filtered.length}/${listings.length} après filtrage dur`);

    if (filtered.length === 0) {
      allJudgeResults.push({
        persona,
        judge: {
          overall_grade: "F", overall_score: 0, relevance_score: 0,
          diversity_score: 0, dealbreaker_respect: 0, ranking_quality: 0,
          commentary: "Aucune annonce ne passe les filtres.", top3_analysis: "", worst_suggestion: "",
        },
        filteredCount: 0, scoredCount: 0,
      });
      continue;
    }

    // Step 3: Local scoring (instant) — weighted criteria + soft penalties
    console.log(`🧮 Scoring pondéré local de ${filtered.length} annonces...`);
    const scored: ScoredListing[] = filtered.map((listing) => {
      const eval_ = evalMap.get(listing.id) ?? null;
      const listingTags = tagsMap.get(listing.id) ?? null;
      const baseScore = eval_?.overall_score ?? eval_?.quality_score ?? 30;
      const criteriaScores = eval_?.criteria_scores;

      const weightedScore = calculateWeightedScore(baseScore, weights, criteriaScores);
      const { penalty: softPenalty, reasons } = calculateSoftPenalties(listing, listingTags, softContext);
      const localScore = Math.max(0, Math.min(100, weightedScore + softPenalty));

      return {
        listing, eval_, tags: listingTags,
        baseScore, weightedScore, softPenalty, finalScore: localScore,
        explanation: reasons.length > 0 ? reasons.join("; ") : "aucun ajustement",
      };
    });

    // Pre-rank by local score
    scored.sort((a, b) => b.finalScore - a.finalScore);

    const withEval = scored.filter((s) => s.eval_ !== null).length;
    const withTags = scored.filter((s) => s.tags !== null).length;
    console.log(`   Couverture: ${withEval}/${filtered.length} évaluations, ${withTags}/${filtered.length} tags`);
    console.log(`   Top 5 local: ${scored.slice(0, 5).map((r) => r.finalScore).join(", ")}`);

    // Step 4: Semantic refinement — send top 30 to Haiku
    const HAIKU_POOL = 30;
    const HAIKU_BATCH = 10;
    const top30 = scored.slice(0, HAIKU_POOL);
    const criteriaText = buildCriteriaText(persona);

    console.log(`🤖 Scoring sémantique Haiku des top ${HAIKU_POOL}...`);
    const haikuScores = new Map<string, HaikuScoreResult>();
    for (let i = 0; i < top30.length; i += HAIKU_BATCH) {
      const batch = top30.slice(i, i + HAIKU_BATCH);
      process.stdout.write(`   Batch ${Math.floor(i / HAIKU_BATCH) + 1}/${Math.ceil(top30.length / HAIKU_BATCH)}...`);
      const results = await scoreBatchWithHaiku(criteriaText, batch);
      for (const r of results) haikuScores.set(r.listing_id, r);
      console.log(` ✓`);
    }

    // Step 5: Combine local score + Haiku score
    for (const item of top30) {
      const haiku = haikuScores.get(item.listing.id);
      if (haiku && haiku.score > 0) {
        // Hybrid: 40% local score + 60% Haiku semantic score
        item.finalScore = Math.round(item.finalScore * 0.4 + haiku.score * 0.6);
        item.explanation = `${item.explanation} | Haiku: ${haiku.explanation} (${haiku.score})`;
      }
    }

    // Re-sort by final hybrid score
    top30.sort((a, b) => b.finalScore - a.finalScore);
    const top20 = top30.slice(0, TOP_N);

    console.log(`📊 Top 5 hybrides: ${top20.slice(0, 5).map((r) => r.finalScore).join(", ")}`);

    // Step 4: Judge
    console.log(`⚖️  Évaluation par le juge IA...`);
    const judgeResult = await judgeResults(persona, top20);
    console.log(`   Note: ${judgeResult.overall_grade} (${judgeResult.overall_score}/100)`);

    allJudgeResults.push({
      persona, judge: judgeResult,
      filteredCount: filtered.length, scoredCount: filtered.length,
    });
  }

  // ──────────────────────────────────────────────
  // Summary table
  // ──────────────────────────────────────────────

  console.log();
  console.log("╔══════════════════════════════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                          RÉSULTATS V2 — Hybride pondéré + Haiku + Soft                                ║");
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

  const avg = (key: keyof JudgeResult) => {
    const vals = allJudgeResults.map((r) => r.judge[key] as number);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  const avgScore = avg("overall_score");
  const avgGrade = avgScore >= 85 ? "A" : avgScore >= 70 ? "B" : avgScore >= 55 ? "C" : avgScore >= 40 ? "D" : "F";
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
      console.log(`   Pire: ${r.judge.worst_suggestion}`);
  }

  // Cost
  console.log();
  console.log("─── COÛT ───");
  const haikuCost = (haikuInputTokens / 1_000_000) * 0.80 + (haikuOutputTokens / 1_000_000) * 4.0;
  const sonnetCost = (sonnetInputTokens / 1_000_000) * 3.0 + (sonnetOutputTokens / 1_000_000) * 15.0;
  console.log(`   Tokens Haiku (scoring): ${haikuInputTokens.toLocaleString()} in + ${haikuOutputTokens.toLocaleString()} out = ~$${haikuCost.toFixed(3)}`);
  console.log(`   Tokens Sonnet (juge):   ${sonnetInputTokens.toLocaleString()} in + ${sonnetOutputTokens.toLocaleString()} out = ~$${sonnetCost.toFixed(3)}`);
  console.log(`   Total test: ~$${(haikuCost + sonnetCost).toFixed(3)}`);
  // Per user in prod: 3 batches of 10 = 30 listings scored by Haiku
  const perUserHaiku = (haikuInputTokens / PERSONAS.length / 1_000_000) * 0.80 + (haikuOutputTokens / PERSONAS.length / 1_000_000) * 4.0;
  console.log(`   💡 Coût par utilisateur en prod: ~$${perUserHaiku.toFixed(4)} (3 batches Haiku sur top 30)`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
