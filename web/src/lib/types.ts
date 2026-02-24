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
  country: string | null;
  original_language: string | null;
  contact: string | null;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  date_published: string | null;
  date_scraped: string;
}

export interface Evaluation {
  listing_id: string;
  quality_score: number;
  overall_score?: number;
  quality_summary?: string;
  match_summary?: string;
  criteria_scores?: Record<string, number>;
  highlights: string[];
  concerns: string[];
  availability_status?: "likely_available" | "possibly_expired" | "unknown";
  data_quality_score?: number;
  ai_title?: string;
  ai_description?: string;
  date_evaluated: string;
}

export interface ListingTags {
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

export const TAG_LABELS: Record<string, Record<string, string>> = {
  project_types: {
    habitat_groupe: "Habitat group\u00e9",
    ecolieu: "\u00c9colieu",
    cooperative: "Coop\u00e9rative",
    habitat_leger: "Habitat l\u00e9ger",
    colocation: "Colocation",
    intergenerational: "Interg\u00e9n\u00e9rationnel",
    community_creation: "Cr\u00e9ation de groupe",
  },
  shared_spaces: {
    garden: "Jardin",
    vegetable_garden: "Potager",
    kitchen: "Cuisine commune",
    common_room: "Salle commune",
    laundry: "Buanderie",
    workshop: "Atelier",
    parking: "Parking",
    coworking: "Coworking",
    play_area: "Aire de jeux",
  },
  values: {
    ecological: "\u00c9cologique",
    permaculture: "Permaculture",
    spiritual: "Spirituel",
    solidarity: "Solidarit\u00e9",
    artistic: "Artistique",
    self_sufficiency: "Autosuffisance",
    biodanza: "Biodanza",
    meditation: "M\u00e9ditation",
    organic: "Bio",
  },
  environment: {
    rural: "Rural",
    urban: "Urbain",
    suburban: "P\u00e9riurbain",
  },
  unit_type: {
    studio: "Studio",
    apartment: "Appartement",
    house: "Maison",
    room: "Chambre",
    tiny_house: "Tiny house",
    other: "Autre",
  },
  shared_meals: {
    daily: "Quotidien",
    weekly: "Hebdomadaire",
    occasional: "Occasionnel",
  },
  age_range: {
    intergenerational: "Interg\u00e9n\u00e9rationnel",
    seniors: "Seniors",
    families: "Familles",
    young_adults: "Jeunes adultes",
  },
  family_types: {
    singles: "C\u00e9libataires",
    couples: "Couples",
    families: "Familles",
    retirees: "Retrait\u00e9s",
  },
  governance: {
    consensus: "Consensus",
    sociocracy: "Sociocratie",
    association: "Association",
  },
  pet_details: {
    dogs: "Chiens",
    cats: "Chats",
    poultry: "Volaille",
    horses: "Chevaux",
    farm_animals: "Animaux de ferme",
  },
};

export const COUNTRY_LABELS: Record<string, string> = {
  BE: "Belgique",
  FR: "France",
  ES: "Espagne",
  PT: "Portugal",
  NL: "Pays-Bas",
  CH: "Suisse",
  LU: "Luxembourg",
};

export const COUNTRY_FLAGS: Record<string, string> = {
  BE: "\ud83c\udde7\ud83c\uddea",
  FR: "\ud83c\uddeb\ud83c\uddf7",
  ES: "\ud83c\uddea\ud83c\uddf8",
  PT: "\ud83c\uddf5\ud83c\uddf9",
  NL: "\ud83c\uddf3\ud83c\uddf1",
  CH: "\ud83c\udde8\ud83c\udded",
  LU: "\ud83c\uddf1\ud83c\uddfa",
};

export const LANGUAGE_FLAGS: Record<string, string> = {
  fr: "\ud83c\uddeb\ud83c\uddf7",
  es: "\ud83c\uddea\ud83c\uddf8",
  en: "\ud83c\uddec\ud83c\udde7",
  nl: "\ud83c\uddf3\ud83c\uddf1",
  de: "\ud83c\udde9\ud83c\uddea",
  pt: "\ud83c\uddf5\ud83c\uddf9",
};

export const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  es: "Espagnol",
  en: "Anglais",
  nl: "Néerlandais",
  de: "Allemand",
  pt: "Portugais",
};

export interface PersonalizedResult {
  listing_id: string;
  score: number;
  explanation: string;
  highlights: string[];
  concerns: string[];
}

export type ListingStatus =
  | "new"
  | "favorite"
  | "contacted"
  | "visit_planned"
  | "in_discussion"
  | "rejected"
  | "archived";

export const STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; color: string; icon: string }
> = {
  new: {
    label: "Nouveau",
    color: "bg-sky-100 text-sky-800",
    icon: "sparkles",
  },
  favorite: {
    label: "Coup de coeur",
    color: "bg-rose-100 text-rose-800",
    icon: "heart",
  },
  contacted: {
    label: "Contacté",
    color:
      "bg-amber-100 text-amber-800",
    icon: "phone",
  },
  visit_planned: {
    label: "Visite prévue",
    color:
      "bg-orange-100 text-orange-800",
    icon: "calendar",
  },
  in_discussion: {
    label: "En discussion",
    color:
      "bg-violet-100 text-violet-800",
    icon: "chat",
  },
  rejected: {
    label: "Écarté",
    color: "bg-stone-100 text-stone-500",
    icon: "x",
  },
  archived: {
    label: "Archivé",
    color: "bg-stone-100 text-stone-500",
    icon: "archive",
  },
};

// Refinement weights — simplified after migration to quality_score model
export type RefinementWeights = Record<string, number>;
export const DEFAULT_WEIGHTS: RefinementWeights = {};

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

/**
 * Calcule un score personnalisé en combinant le score de qualité global
 * avec les criteria_scores pondérés par les préférences utilisateur.
 *
 * Si pas de criteria_scores ou pas de poids, retourne le qualityScore brut.
 */
export function calculateRefinedScore(
  qualityScore: number,
  weights: RefinementWeights,
  criteriaScores?: Record<string, number>
): number {
  if (!criteriaScores || Object.keys(weights).length === 0) {
    return qualityScore;
  }

  // Calcul pondéré : chaque criteria_score (0-10) × poids correspondant
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const score = criteriaScores[key];
    if (score !== undefined && weight > 0) {
      weightedSum += (score / 10) * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return qualityScore;

  // Score pondéré normalisé 0-100
  const weightedScore = (weightedSum / totalWeight) * 100;

  // Blend: 40% qualité globale + 60% score pondéré personnalisé
  return Math.round(qualityScore * 0.4 + weightedScore * 0.6);
}

/**
 * Soft penalties — ajustements de score pour les critères qui étaient
 * auparavant des filtres durs binaires.
 *
 * Retourne un ajustement en points (-30 à +10) à ajouter au score.
 */
export interface SoftFilterContext {
  budgetMax: number | null;
  settingPreference: string | null; // "rural" | "semi_rural" | "urban_green" | "urban"
  spiritualImportance: string | null; // "central" | "welcome" | "neutral" | "prefer_without"
  communitySize: string | null; // "small" | "medium" | "large"
  projectMaturity: string | null; // "existing_mature" | "existing_recent" | "creation"
  healthProximity: string | null; // "essential" | "preferable" | "not_needed"
}

export const DEFAULT_SOFT_CONTEXT: SoftFilterContext = {
  budgetMax: null,
  settingPreference: null,
  spiritualImportance: null,
  communitySize: null,
  projectMaturity: null,
  healthProximity: null,
};

export function calculateSoftPenalties(
  item: ListingWithEval,
  context: SoftFilterContext
): number {
  let adjustment = 0;
  const { listing, tags } = item;

  // ─── Budget ───
  if (context.budgetMax !== null && listing.price_amount !== null) {
    const ratio = listing.price_amount / context.budgetMax;
    if (ratio <= 0.7) adjustment += 10; // bien en dessous du budget
    else if (ratio <= 1.0) adjustment += 5; // dans le budget
    else if (ratio <= 1.15) adjustment -= 10; // légèrement au-dessus
    else if (ratio <= 1.3) adjustment -= 20; // au-dessus
    else adjustment -= 30; // très au-dessus
  }
  // Prix absent : pas de bonus ni pénalité (neutre)

  // ─── Cadre de vie (environment) ───
  if (context.settingPreference && tags?.environment) {
    const pref = context.settingPreference;
    const env = tags.environment;
    const matchMap: Record<string, string[]> = {
      rural: ["rural"],
      semi_rural: ["rural", "suburban"],
      urban_green: ["suburban", "urban"],
      urban: ["urban"],
    };
    const acceptable = matchMap[pref] ?? [];
    if (acceptable.includes(env)) {
      adjustment += 5;
    } else {
      // Mismatch : rural quand on veut urban = pénalité forte
      adjustment -= 15;
    }
  }

  // ─── Spiritualité ───
  if (context.spiritualImportance && tags?.values) {
    const hasSpiritual = tags.values.some((v) =>
      ["spiritual", "biodanza", "meditation"].includes(v)
    );
    if (context.spiritualImportance === "central" && hasSpiritual)
      adjustment += 8;
    else if (context.spiritualImportance === "central" && !hasSpiritual)
      adjustment -= 5;
    else if (context.spiritualImportance === "prefer_without" && hasSpiritual)
      adjustment -= 15;
    else if (context.spiritualImportance === "prefer_without" && !hasSpiritual)
      adjustment += 3;
  }

  // ─── Taille communauté ───
  if (context.communitySize && tags?.group_size) {
    const size = tags.group_size;
    switch (context.communitySize) {
      case "small":
        if (size >= 4 && size <= 8) adjustment += 5;
        else if (size > 15) adjustment -= 10;
        break;
      case "medium":
        if (size >= 8 && size <= 15) adjustment += 5;
        else if (size < 4 || size > 25) adjustment -= 8;
        break;
      case "large":
        if (size >= 15) adjustment += 5;
        else if (size < 8) adjustment -= 8;
        break;
    }
  }

  // ─── Maturité du projet ───
  if (context.projectMaturity && listing.listing_type) {
    const type = listing.listing_type;
    if (
      context.projectMaturity === "creation" &&
      type === "creation-groupe"
    )
      adjustment += 5;
    else if (
      context.projectMaturity === "existing_mature" &&
      type === "existing-project"
    )
      adjustment += 5;
    else if (
      context.projectMaturity === "existing_mature" &&
      type === "creation-groupe"
    )
      adjustment -= 8;
    else if (
      context.projectMaturity === "creation" &&
      type === "existing-project"
    )
      adjustment -= 5;
  }

  // Clamp à [-30, +15]
  return Math.max(-30, Math.min(15, adjustment));
}

export interface ListingWithEval {
  listing: Listing;
  evaluation: Evaluation | null;
  tags: ListingTags | null;
  status: ListingStatus;
  notes: string;
  /** Si c'est un projet Supabase, son UUID (permet la candidature) */
  project_id?: string;
}

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
    const score = adjustedScore ?? item.evaluation?.quality_score;
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

// UI filter state for the filter panel
export interface UIFilterState {
  searchText: string;
  provinces: string[];
  countries: string[];
  languages: string[];
  listingTypes: string[];
  sources: string[];
  priceMin: number | null;
  priceMax: number | null;
  includeNullPrice: boolean;
  scoreMin: number | null;
  includeUnscored: boolean;
}

export const DEFAULT_UI_FILTERS: UIFilterState = {
  searchText: "",
  provinces: [],
  countries: [],
  languages: [],
  listingTypes: [],
  sources: [],
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
  "existing-project": "Projet existant",
  "community-profile": "Profil communaute",
  ecovillage: "Ecovillage",
  directory: "Repertoire",
};

// Tag-based filter state
export interface UITagFilters {
  projectTypes: string[];
  environments: string[];
  sharedSpaces: string[];
  valuesTags: string[];
  petsAllowed: boolean | null; // true=oui, false=non, null=indifférent
  hasChildren: boolean | null;
  hasCharter: boolean | null;
  sharedMeals: string[];
  unitTypes: string[];
  minBedrooms: number | null;
  minSurface: number | null;
  maxSurface: number | null;
  // Community composition
  ageRange: string[];
  familyTypes: string[];
  minGroupSize: number | null;
  maxGroupSize: number | null;
  // Pet details
  petDetails: string[];
  // Housing features
  furnished: boolean | null;
  accessiblePmr: boolean | null;
  // Governance
  governance: string[];
  // Setting / proximity
  nearNature: boolean | null;
  nearTransport: boolean | null;
  // Availability (from evaluation)
  availabilityStatus: string[];
}

export const DEFAULT_TAG_FILTERS: UITagFilters = {
  projectTypes: [],
  environments: [],
  sharedSpaces: [],
  valuesTags: [],
  petsAllowed: null,
  hasChildren: null,
  hasCharter: null,
  sharedMeals: [],
  unitTypes: [],
  minBedrooms: null,
  minSurface: null,
  maxSurface: null,
  ageRange: [],
  familyTypes: [],
  minGroupSize: null,
  maxGroupSize: null,
  petDetails: [],
  furnished: null,
  accessiblePmr: null,
  governance: [],
  nearNature: null,
  nearTransport: null,
  availabilityStatus: [],
};

