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

export type ListingStatus =
  | "new"
  | "favorite"
  | "contacted"
  | "visit_planned"
  | "visited"
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
  visited: {
    label: "Visité",
    color: "bg-emerald-100 text-emerald-800",
    icon: "check",
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

export interface ListingWithEval {
  listing: Listing;
  evaluation: Evaluation | null;
  tags: ListingTags | null;
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
  "existing-project": "Projet existant",
  "community-profile": "Profil communaute",
  ecovillage: "Ecovillage",
  directory: "Repertoire",
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

// === Apartment types (Brussels apartment search) ===

export interface ApartmentListing {
  id: string;
  source: string;
  source_url: string;
  title: string;
  description: string;
  commune: string | null;
  postal_code: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  price_monthly: number | null;
  charges_monthly: number | null;
  charges_included: boolean | null;
  bedrooms: number | null;
  bathrooms: number | null;
  surface_m2: number | null;
  floor: number | null;
  total_floors: number | null;
  has_elevator: boolean | null;
  peb_rating: string | null;
  peb_value: number | null;
  furnished: boolean | null;
  has_balcony: boolean | null;
  has_terrace: boolean | null;
  has_garden: boolean | null;
  has_parking: boolean | null;
  parking_count: number | null;
  has_cellar: boolean | null;
  pets_allowed: boolean | null;
  available_from: string | null;
  date_published: string | null;
  date_scraped: string;
  images: string[];
  agency_name: string | null;
  agency_phone: string | null;
  immoweb_id: number | null;
}

export interface ApartmentCriteriaScores {
  price_budget: number;
  bedroom_count: number;
  proximity_ixelles: number;
  surface_area: number;
  condition_energy: number;
  amenities: number;
  transport_access: number;
  value_for_money: number;
}

export interface ApartmentEvaluation {
  listing_id: string;
  overall_score: number;
  match_summary: string;
  criteria_scores: ApartmentCriteriaScores;
  highlights: string[];
  concerns: string[];
  date_evaluated: string;
}

export interface ApartmentWithEval {
  listing: ApartmentListing;
  evaluation: ApartmentEvaluation | null;
  status: ListingStatus;
  notes: string;
}

export interface ApartmentFilterState {
  searchText: string;
  communes: string[];
  priceMin: number | null;
  priceMax: number | null;
  bedroomsMin: number | null;
  bathroomsMin: number | null;
  surfaceMin: number | null;
  surfaceMax: number | null;
  pebRatings: string[];
  furnished: boolean | null;
  hasParking: boolean | null;
  hasBalconyOrTerrace: boolean | null;
  hasGarden: boolean | null;
  petsAllowed: boolean | null;
  hasElevator: boolean | null;
  scoreMin: number | null;
}

export const DEFAULT_APARTMENT_FILTERS: ApartmentFilterState = {
  searchText: "",
  communes: [],
  priceMin: null,
  priceMax: null,
  bedroomsMin: 2,
  bathroomsMin: null,
  surfaceMin: null,
  surfaceMax: null,
  pebRatings: [],
  furnished: null,
  hasParking: null,
  hasBalconyOrTerrace: null,
  hasGarden: null,
  petsAllowed: null,
  hasElevator: null,
  scoreMin: null,
};

export const APARTMENT_CRITERIA_LABELS: Record<keyof ApartmentCriteriaScores, string> = {
  price_budget: "Prix (budget 800-1300\u20ac)",
  bedroom_count: "Nombre de chambres (min 2)",
  proximity_ixelles: "Proximit\u00e9 d'Ixelles",
  surface_area: "Surface habitable",
  condition_energy: "\u00c9tat & PEB",
  amenities: "\u00c9quipements (balcon, parking...)",
  transport_access: "Transports en commun",
  value_for_money: "Rapport qualit\u00e9-prix",
};

export const PEB_RATING_COLORS: Record<string, string> = {
  A: "bg-green-600 text-white",
  B: "bg-green-500 text-white",
  C: "bg-yellow-400 text-gray-900",
  D: "bg-orange-400 text-white",
  E: "bg-orange-600 text-white",
  F: "bg-red-500 text-white",
  G: "bg-red-700 text-white",
};

export const BRUSSELS_COMMUNES = [
  "Anderlecht",
  "Auderghem",
  "Berchem-Sainte-Agathe",
  "Bruxelles",
  "Etterbeek",
  "Evere",
  "Forest",
  "Ganshoren",
  "Ixelles",
  "Jette",
  "Koekelberg",
  "Molenbeek-Saint-Jean",
  "Saint-Gilles",
  "Saint-Josse-ten-Noode",
  "Schaerbeek",
  "Uccle",
  "Watermael-Boitsfort",
  "Woluwe-Saint-Lambert",
  "Woluwe-Saint-Pierre",
];
