export interface Listing {
  id: string;
  source: string;
  source_url: string;
  title: string;
  description: string;
  location: string | null;
  province: string | null;
  price: string | null;
  price_amount: number | null;
  listing_type: string | null;
  contact: string | null;
  images: string[];
  date_published: string | null;
  date_scraped: string;
}

export interface CriteriaScores {
  community_size_and_maturity: number;
  values_alignment: number;
  common_projects: number;
  large_hall_biodanza: number;
  rental_price: number;
  unit_type: number;
  parking: number;
  spiritual_alignment: number;
  charter_openness: number;
  community_meals: number;
  location_brussels: number;
  near_hospital: number;
}

export interface Evaluation {
  listing_id: string;
  overall_score: number;
  match_summary: string;
  criteria_scores: CriteriaScores;
  highlights: string[];
  concerns: string[];
  date_evaluated: string;
}

export type ListingStatus = "new" | "archived" | "in_discussion" | "favorite";

export interface ListingWithEval {
  listing: Listing;
  evaluation: Evaluation | null;
  status: ListingStatus;
  notes: string;
}

// Refinement types for "Paufini la recherche"
export type RefinementWeights = Record<keyof CriteriaScores, number>;

export interface RefinementFilters {
  listing_types_include: string[];
  listing_types_exclude: string[];
  locations_include: string[];
  locations_exclude: string[];
  max_price: number | null;
  min_score: number | null;
  keywords_include: string[];
  keywords_exclude: string[];
}

export const DEFAULT_FILTERS: RefinementFilters = {
  listing_types_include: [],
  listing_types_exclude: [],
  locations_include: [],
  locations_exclude: [],
  max_price: null,
  min_score: null,
  keywords_include: [],
  keywords_exclude: [],
};

export interface RefinementEntry {
  id: string;
  timestamp: string;
  userMessage: string;
  explanation: string;
  weightsBefore: RefinementWeights;
  weightsAfter: RefinementWeights;
  filtersBefore: RefinementFilters;
  filtersAfter: RefinementFilters;
}

export function applyRefinementFilters(
  item: ListingWithEval,
  filters: RefinementFilters,
  adjustedScore?: number
): boolean {
  const { listing } = item;

  // Listing type include
  if (
    filters.listing_types_include.length > 0 &&
    (!listing.listing_type ||
      !filters.listing_types_include.includes(listing.listing_type))
  ) {
    return false;
  }

  // Listing type exclude
  if (
    filters.listing_types_exclude.length > 0 &&
    listing.listing_type &&
    filters.listing_types_exclude.includes(listing.listing_type)
  ) {
    return false;
  }

  // Location include (case-insensitive contains on location + province)
  if (filters.locations_include.length > 0) {
    const loc = `${listing.location ?? ""} ${listing.province ?? ""}`.toLowerCase();
    const match = filters.locations_include.some((l) =>
      loc.includes(l.toLowerCase())
    );
    if (!match) return false;
  }

  // Location exclude
  if (filters.locations_exclude.length > 0) {
    const loc = `${listing.location ?? ""} ${listing.province ?? ""}`.toLowerCase();
    const excluded = filters.locations_exclude.some((l) =>
      loc.includes(l.toLowerCase())
    );
    if (excluded) return false;
  }

  // Max price
  if (filters.max_price !== null && listing.price_amount !== null) {
    if (listing.price_amount > filters.max_price) return false;
  }

  // Min score
  if (filters.min_score !== null) {
    const score = adjustedScore ?? item.evaluation?.overall_score;
    if (score === undefined || score < filters.min_score) return false;
  }

  // Keywords include (at least one must match in title or description)
  if (filters.keywords_include.length > 0) {
    const text = `${listing.title} ${listing.description}`.toLowerCase();
    const match = filters.keywords_include.some((kw) =>
      text.includes(kw.toLowerCase())
    );
    if (!match) return false;
  }

  // Keywords exclude (none must match)
  if (filters.keywords_exclude.length > 0) {
    const text = `${listing.title} ${listing.description}`.toLowerCase();
    const excluded = filters.keywords_exclude.some((kw) =>
      text.includes(kw.toLowerCase())
    );
    if (excluded) return false;
  }

  return true;
}

export const DEFAULT_WEIGHTS: RefinementWeights = {
  community_size_and_maturity: 1.0,
  values_alignment: 1.0,
  common_projects: 1.0,
  large_hall_biodanza: 1.0,
  rental_price: 1.0,
  unit_type: 1.0,
  parking: 1.0,
  spiritual_alignment: 1.0,
  charter_openness: 1.0,
  community_meals: 1.0,
  location_brussels: 1.0,
  near_hospital: 1.0,
};

export function calculateRefinedScore(
  criteria: CriteriaScores,
  weights: RefinementWeights
): number {
  const keys = Object.keys(weights) as (keyof CriteriaScores)[];
  let totalWeighted = 0;
  let totalWeight = 0;
  for (const key of keys) {
    totalWeighted += criteria[key] * weights[key];
    totalWeight += weights[key];
  }
  if (totalWeight === 0) return 0;
  return Math.round((totalWeighted / totalWeight) * 10);
}

// UI filter state for the filter panel
export interface UIFilterState {
  searchText: string;
  provinces: string[];
  listingTypes: string[];
  priceMin: number | null;
  priceMax: number | null;
  includeNullPrice: boolean;
  scoreMin: number | null;
  includeUnscored: boolean;
}

export const DEFAULT_UI_FILTERS: UIFilterState = {
  searchText: "",
  provinces: [],
  listingTypes: [],
  priceMin: null,
  priceMax: null,
  includeNullPrice: true,
  scoreMin: null,
  includeUnscored: true,
};

export const LISTING_TYPE_LABELS: Record<string, string> = {
  "offre-location": "Location",
  "offre-vente": "Vente",
  "demande-location": "Recherche location",
  "demande-vente": "Recherche achat",
  "creation-groupe": "Création de groupe",
  "habitat-leger": "Habitat léger",
  divers: "Divers",
  autre: "Autre",
};

export const CRITERIA_LABELS: Record<keyof CriteriaScores, string> = {
  community_size_and_maturity: "Taille & maturit\u00e9 de la communaut\u00e9",
  values_alignment: "Valeurs (respect, bienveillance, solidarit\u00e9)",
  common_projects: "Projets communs (potager, \u00e9picerie...)",
  large_hall_biodanza: "Grande salle biodanza (180-250m\u00b2)",
  rental_price: "Loyer (500-750\u20ac charges comprises)",
  unit_type: "Type de logement (studio/1 chambre)",
  parking: "Parking voiture + moto",
  spiritual_alignment: "Esprit biodanseur / spirituel",
  charter_openness: "Charte & ouverture au monde",
  community_meals: "Repas & activit\u00e9s communautaires",
  location_brussels: "Proximit\u00e9 Bruxelles (30-45 min)",
  near_hospital: "Proximit\u00e9 h\u00f4pital soins palliatifs",
};
