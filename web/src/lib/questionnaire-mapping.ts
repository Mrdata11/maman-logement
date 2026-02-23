import {
  RefinementWeights,
  RefinementFilters,
  DEFAULT_WEIGHTS,
  DEFAULT_FILTERS,
  UITagFilters,
  DEFAULT_TAG_FILTERS,
} from "./types";
import { QuestionnaireAnswers } from "./questionnaire-types";

export interface QuestionnaireFilterResult {
  weights: RefinementWeights;
  filters: RefinementFilters;
  tagFilters: UITagFilters;
  isActive: boolean;
  summary: string[];
}

// Map questionnaire region IDs to province names in our data
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

// Known region tokens for parsing open text "locations_avoid"
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

function getStr(answers: QuestionnaireAnswers, key: string): string | null {
  const v = answers[key];
  if (typeof v === "string") return v;
  return null;
}

function getArr(answers: QuestionnaireAnswers, key: string): string[] {
  const v = answers[key];
  if (Array.isArray(v)) return v as string[];
  return [];
}

function getNum(answers: QuestionnaireAnswers, key: string): number | null {
  const v = answers[key];
  if (typeof v === "number") return v;
  return null;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function parseLocationsAvoid(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const [token, province] of Object.entries(REGION_TOKENS)) {
    if (lower.includes(token)) {
      found.add(province);
    }
  }
  return Array.from(found);
}

export function mapQuestionnaireToFilters(
  answers: QuestionnaireAnswers
): QuestionnaireFilterResult {
  // Start from defaults
  const w: RefinementWeights = { ...DEFAULT_WEIGHTS };
  const f: RefinementFilters = { ...DEFAULT_FILTERS };
  const t: UITagFilters = { ...DEFAULT_TAG_FILTERS };
  const summary: string[] = [];

  const answeredCount = Object.keys(answers).length;
  if (answeredCount === 0) {
    return { weights: w, filters: f, tagFilters: t, isActive: false, summary };
  }

  // ─── single_most_important (master priority) ───
  const mostImportant = getStr(answers, "single_most_important");
  if (mostImportant) {
    switch (mostImportant) {
      case "budget":
        w.rental_price += 1.0;
        summary.push("Priorite : budget");
        break;
      case "location":
        w.location_brussels += 1.0;
        summary.push("Priorite : emplacement");
        break;
      case "community_spirit":
        w.community_meals += 0.5;
        w.community_size_and_maturity += 0.5;
        w.common_projects += 0.5;
        summary.push("Priorite : esprit communautaire");
        break;
      case "values":
        w.values_alignment += 1.0;
        summary.push("Priorite : valeurs partagees");
        break;
      case "practical":
        w.unit_type += 0.5;
        w.parking += 0.5;
        summary.push("Priorite : logement pratique");
        break;
      case "health":
        w.near_hospital += 1.5;
        summary.push("Priorite : proximite des soins");
        break;
    }
  }

  // ─── spiritual_importance ───
  const spiritual = getStr(answers, "spiritual_importance");
  if (spiritual) {
    switch (spiritual) {
      case "central":
        w.spiritual_alignment += 1.5;
        w.large_hall_biodanza += 1.5;
        w.values_alignment += 0.5;
        break;
      case "welcome":
        w.spiritual_alignment += 0.5;
        w.large_hall_biodanza += 0.3;
        break;
      case "neutral":
        // no change
        break;
      case "prefer_without":
        w.spiritual_alignment = 0.2;
        w.large_hall_biodanza = 0.2;
        break;
    }
  }

  // ─── brussels_proximity ───
  const brussels = getStr(answers, "brussels_proximity");
  if (brussels) {
    switch (brussels) {
      case "in_brussels":
        w.location_brussels += 2.0;
        break;
      case "very_close":
        w.location_brussels += 1.5;
        break;
      case "somewhat":
        w.location_brussels += 0.5;
        break;
      case "not_important":
        w.location_brussels = 0.3;
        break;
    }
  }

  // ─── health_proximity ───
  const health = getStr(answers, "health_proximity");
  if (health) {
    switch (health) {
      case "essential":
        w.near_hospital += 1.5;
        break;
      case "preferable":
        w.near_hospital += 0.5;
        break;
      case "not_needed":
        w.near_hospital = 0.3;
        break;
    }
  }

  // ─── shared_meals_importance ───
  const meals = getStr(answers, "shared_meals_importance");
  if (meals) {
    switch (meals) {
      case "essential":
        w.community_meals += 1.5;
        t.sharedMeals = ["daily", "weekly"];
        break;
      case "nice":
        w.community_meals += 0.5;
        break;
      case "occasional":
        // no change
        break;
      case "not_interested":
        w.community_meals = 0.3;
        break;
    }
  }

  // ─── involvement_level (slider 1-5) ───
  const involvement = getNum(answers, "involvement_level");
  if (involvement !== null) {
    if (involvement >= 4) {
      w.common_projects += 0.5;
      w.community_meals += 0.3;
    } else if (involvement <= 2) {
      w.common_projects = Math.max(0.3, w.common_projects - 0.3);
      w.community_meals = Math.max(0.3, w.community_meals - 0.3);
    }
  }

  // ─── charter_preference ───
  const charter = getStr(answers, "charter_preference");
  if (charter) {
    switch (charter) {
      case "essential":
        w.charter_openness += 1.0;
        t.hasCharter = true;
        break;
      case "good_idea":
        w.charter_openness += 0.3;
        break;
      case "informal":
        w.charter_openness = 0.5;
        break;
    }
  }

  // ─── parking_needs ───
  const parking = getArr(answers, "parking_needs");
  if (parking.length > 0) {
    if (parking.includes("car") || parking.includes("motorcycle")) {
      w.parking += 1.0;
    } else {
      w.parking = 0.3;
    }
  }

  // ─── budget_max (slider 300-1500) ───
  const budgetMax = getNum(answers, "budget_max");
  if (budgetMax !== null) {
    // Weight adjustment
    if (budgetMax <= 600) {
      w.rental_price += 1.0;
    } else if (budgetMax <= 800) {
      w.rental_price += 0.5;
    } else if (budgetMax >= 1200) {
      w.rental_price = 0.3;
    }

    // Hard filter with buffer
    const buffer = mostImportant === "budget" ? 1.05 : 1.15;
    f.max_price = Math.round(budgetMax * buffer);
    summary.push(`Budget max: ${f.max_price}\u20ac`);
  }

  // ─── unit_type ───
  const unitType = getStr(answers, "unit_type");
  if (unitType && unitType !== "flexible") {
    switch (unitType) {
      case "studio":
        w.unit_type += 0.5;
        t.unitTypes = ["studio"];
        break;
      case "1_bedroom":
        w.unit_type += 0.5;
        t.unitTypes = ["apartment"];
        break;
      case "2_bedrooms":
        w.unit_type += 1.0;
        t.unitTypes = ["apartment", "house"];
        break;
      case "small_house":
        w.unit_type += 1.0;
        t.unitTypes = ["house"];
        break;
    }
  }

  // ─── tenure_type ───
  const tenure = getStr(answers, "tenure_type");
  if (tenure) {
    switch (tenure) {
      case "rental":
        f.listing_types_include = ["offre-location", "creation-groupe"];
        break;
      case "purchase":
        f.listing_types_include = ["offre-vente", "creation-groupe"];
        break;
      case "either":
        f.listing_types_include = ["offre-location", "offre-vente", "creation-groupe"];
        break;
    }
  }

  // ─── preferred_regions ───
  const regions = getArr(answers, "preferred_regions");
  if (regions.length > 0 && !regions.includes("no_preference")) {
    const provinces = new Set<string>();
    for (const r of regions) {
      const mapped = REGION_TO_PROVINCE[r];
      if (mapped) mapped.forEach((p) => provinces.add(p));
    }
    if (provinces.size > 0) {
      f.locations_include = Array.from(provinces);
      summary.push(`Regions: ${f.locations_include.join(", ")}`);
    }
  }

  // ─── locations_avoid (open text) ───
  const locAvoid = getStr(answers, "locations_avoid");
  if (locAvoid && locAvoid.trim()) {
    const excluded = parseLocationsAvoid(locAvoid);
    if (excluded.length > 0) {
      f.locations_exclude = [...new Set([...f.locations_exclude, ...excluded])];
    }
  }

  // ─── setting_preference ───
  const setting = getStr(answers, "setting_preference");
  if (setting && setting !== "no_preference") {
    switch (setting) {
      case "rural":
        t.environments = ["rural"];
        break;
      case "semi_rural":
        t.environments = ["rural", "suburban"];
        break;
      case "urban_green":
        t.environments = ["suburban", "urban"];
        break;
      case "urban":
        t.environments = ["urban"];
        break;
    }
  }

  // ─── practical_needs ───
  const practical = getArr(answers, "practical_needs");
  if (practical.includes("pet_friendly")) {
    t.petsAllowed = true;
  }
  if (practical.includes("garden_access")) {
    t.sharedSpaces = [...new Set([...t.sharedSpaces, "garden", "vegetable_garden"])];
  }

  // ─── community_activities ───
  const activities = getArr(answers, "community_activities");
  if (activities.includes("garden")) {
    t.sharedSpaces = [...new Set([...t.sharedSpaces, "vegetable_garden", "garden"])];
  }
  if (activities.includes("workshops") || activities.includes("diy")) {
    t.sharedSpaces = [...new Set([...t.sharedSpaces, "workshop"])];
  }
  if (activities.includes("spiritual")) {
    w.spiritual_alignment += 0.5;
    w.large_hall_biodanza += 0.3;
  }
  if (activities.includes("shared_meals")) {
    w.community_meals += 0.3;
  }
  if (activities.includes("none")) {
    w.common_projects = Math.max(0.3, w.common_projects - 0.5);
    w.community_meals = Math.max(0.3, w.community_meals - 0.3);
  }

  // ─── community_size ───
  const communitySize = getStr(answers, "community_size");
  if (communitySize && communitySize !== "no_preference") {
    w.community_size_and_maturity += 0.5;
  }

  // ─── core_values ───
  const values = getArr(answers, "core_values");
  if (values.includes("ecology")) w.values_alignment += 0.3;
  if (values.includes("solidarity")) w.values_alignment += 0.3;
  if (values.includes("spirituality")) {
    w.spiritual_alignment += 0.5;
    w.large_hall_biodanza += 0.3;
  }
  if (values.includes("openness")) w.charter_openness += 0.3;
  if (values.includes("creativity")) w.common_projects += 0.3;

  // ─── motivation ───
  const motivation = getArr(answers, "motivation");
  if (motivation.includes("valeurs")) w.values_alignment += 0.3;
  if (motivation.includes("economique")) w.rental_price += 0.5;
  if (motivation.includes("ecologique")) w.values_alignment += 0.3;
  if (motivation.includes("projets_communs")) w.common_projects += 0.5;
  if (motivation.includes("entraide")) w.community_size_and_maturity += 0.3;
  if (motivation.includes("securite")) w.near_hospital += 0.3;

  // ─── dealbreakers ───
  const dealbreakers = getArr(answers, "dealbreakers");
  if (dealbreakers.includes("language_barrier")) {
    f.locations_exclude = [...new Set([...f.locations_exclude, "Flandre"])];
  }
  if (dealbreakers.includes("pet_ban")) {
    t.petsAllowed = true;
  }
  if (dealbreakers.includes("too_isolated") && t.environments.length === 0) {
    // Exclude purely rural if user fears isolation
    t.environments = ["suburban", "urban"];
  }
  if (dealbreakers.includes("too_chaotic")) {
    w.charter_openness += 0.5;
  }
  if (dealbreakers.includes("too_rigid")) {
    w.charter_openness = Math.max(0.3, w.charter_openness - 0.5);
  }
  if (dealbreakers.includes("no_accessibility")) {
    // Boost practical housing criteria
    w.unit_type += 0.3;
  }

  // ─── Clamp all weights to [0.2, 3.0] ───
  const keys = Object.keys(w) as (keyof RefinementWeights)[];
  for (const key of keys) {
    w[key] = clamp(w[key], 0.2, 3.0);
  }

  // ─── Build summary ───
  if (brussels) {
    const labels: Record<string, string> = {
      in_brussels: "Dans Bruxelles",
      very_close: "Proche Bruxelles (30 min)",
      somewhat: "30-45 min de Bruxelles",
      not_important: "Distance indifferente",
    };
    if (labels[brussels]) summary.push(labels[brussels]);
  }

  if (spiritual === "central") summary.push("Spiritualite importante");
  if (health === "essential") summary.push("Proximite soins essentielle");

  if (meals === "essential") summary.push("Repas partages importants");

  if (unitType && unitType !== "flexible") {
    const labels: Record<string, string> = {
      studio: "Studio",
      "1_bedroom": "1 chambre",
      "2_bedrooms": "2 chambres",
      small_house: "Petite maison",
    };
    if (labels[unitType]) summary.push(`Logement: ${labels[unitType]}`);
  }

  if (f.locations_exclude.length > 0) {
    summary.push(`Exclut: ${f.locations_exclude.join(", ")}`);
  }

  return { weights: w, filters: f, tagFilters: t, isActive: true, summary };
}
