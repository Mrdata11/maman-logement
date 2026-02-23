// === Retreat Venue types (annuaire de lieux pour organisateurs de retraites) ===

export interface RetreatVenue {
  id: string;
  source: string;
  source_url: string;
  name: string;
  description: string;

  // Location
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  nearest_airport: string | null;
  transfer_available: boolean | null;

  // Capacity
  capacity_min: number | null;
  capacity_max: number | null;
  num_rooms: number | null;
  num_beds: number | null;

  // Accommodation
  accommodation_types: string[];
  room_has_private_bathroom: boolean | null;

  // Activity/practice spaces
  activity_spaces: string[];
  main_practice_space_capacity: number | null;
  main_practice_space_m2: number | null;
  num_practice_spaces: number | null;

  // Outdoor & wellness
  outdoor_spaces: string[];

  // Dining
  meal_service: string | null;
  cuisine_options: string[];
  kitchen_access: boolean | null;
  dietary_accommodations: boolean | null;

  // Pricing
  currency: string | null;
  price_per_person_per_night: number | null;
  price_per_person_per_night_max: number | null;
  price_full_venue_per_day: number | null;
  price_notes: string | null;
  meals_included_in_price: boolean | null;

  // Setting & style
  setting: string[];
  style: string[];

  // Services for organizers
  services: string[];

  // Suitable retreat types
  suitable_for: string[];

  // Rules
  alcohol_policy: string | null;
  children_welcome: boolean | null;
  accessible: boolean | null;

  // Photos
  images: string[];
  image_categories: Record<string, string[]>;

  // Contact
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  booking_url: string | null;

  // Reviews
  rating_average: number | null;
  rating_count: number | null;

  // Availability
  available_year_round: boolean | null;
  min_stay_nights: number | null;
  lead_time_weeks: number | null;

  // Metadata
  original_language: string | null;
  date_scraped: string;
  is_claimed: boolean;
}

export interface RetreatCriteriaScores {
  practice_spaces_quality: number;
  accommodation_quality: number;
  capacity_flexibility: number;
  dining_quality: number;
  natural_setting: number;
  value_for_money: number;
  accessibility_transport: number;
  organizer_services: number;
  atmosphere_vibe: number;
  data_completeness: number;
}

export interface RetreatVenueEvaluation {
  listing_id: string;
  overall_score: number;
  match_summary: string;
  criteria_scores: RetreatCriteriaScores;
  highlights: string[];
  concerns: string[];
  best_for: string[];
  ai_title?: string;
  ai_description?: string;
  date_evaluated: string;
}

export interface RetreatVenueTags {
  listing_id: string;
  capacity_range: string | null;
  accommodation_types: string[];
  has_private_rooms: boolean | null;
  has_shared_rooms: boolean | null;
  has_yoga_studio: boolean | null;
  has_meditation_hall: boolean | null;
  has_outdoor_practice_space: boolean | null;
  num_practice_spaces: number | null;
  has_pool: boolean | null;
  has_sauna_spa: boolean | null;
  has_beach_access: boolean | null;
  has_garden: boolean | null;
  meal_service: string | null;
  is_vegetarian: boolean | null;
  is_vegan_friendly: boolean | null;
  is_organic: boolean | null;
  setting: string[];
  style: string[];
  suitable_for: string[];
  has_airport_transfer: boolean | null;
  has_wifi: boolean | null;
  is_accessible: boolean | null;
  alcohol_free: boolean | null;
  children_welcome: boolean | null;
  price_bracket: string | null;
  date_extracted: string;
}

export type VenueStatus =
  | "new"
  | "favorite"
  | "contacted"
  | "visit_planned"
  | "in_discussion"
  | "rejected"
  | "archived";

export interface RetreatVenueWithEval {
  venue: RetreatVenue;
  evaluation: RetreatVenueEvaluation | null;
  tags: RetreatVenueTags | null;
  status: VenueStatus;
  notes: string;
}

// === Filter state ===

export interface RetreatFilterState {
  searchText: string;
  countries: string[];
  settings: string[];
  styles: string[];
  capacityMin: number | null;
  capacityMax: number | null;
  priceMin: number | null;
  priceMax: number | null;
  activitySpaces: string[];
  mealServices: string[];
  cuisineOptions: string[];
  services: string[];
  suitableFor: string[];
  scoreMin: number | null;
  accommodationTypes: string[];
  outdoorSpaces: string[];
}

export const DEFAULT_RETREAT_FILTERS: RetreatFilterState = {
  searchText: "",
  countries: [],
  settings: [],
  styles: [],
  capacityMin: null,
  capacityMax: null,
  priceMin: null,
  priceMax: null,
  activitySpaces: [],
  mealServices: [],
  cuisineOptions: [],
  services: [],
  suitableFor: [],
  scoreMin: null,
  accommodationTypes: [],
  outdoorSpaces: [],
};

// === Labels (French) ===

export const VENUE_STATUS_CONFIG: Record<
  VenueStatus,
  { label: string; color: string }
> = {
  new: { label: "Nouveau", color: "bg-sky-100 text-sky-800" },
  favorite: { label: "Coup de coeur", color: "bg-rose-100 text-rose-800" },
  contacted: { label: "Contact\u00e9", color: "bg-amber-100 text-amber-800" },
  visit_planned: { label: "Visite pr\u00e9vue", color: "bg-orange-100 text-orange-800" },
  in_discussion: { label: "En discussion", color: "bg-violet-100 text-violet-800" },
  rejected: { label: "\u00c9cart\u00e9", color: "bg-stone-100 text-stone-500" },
  archived: { label: "Archiv\u00e9", color: "bg-stone-100 text-stone-500" },
};

export const RETREAT_CRITERIA_LABELS: Record<keyof RetreatCriteriaScores, string> = {
  practice_spaces_quality: "Espaces de pratique",
  accommodation_quality: "H\u00e9bergement",
  capacity_flexibility: "Capacit\u00e9 d'accueil",
  dining_quality: "Restauration",
  natural_setting: "Cadre naturel",
  value_for_money: "Rapport qualit\u00e9-prix",
  accessibility_transport: "Accessibilit\u00e9 & transport",
  organizer_services: "Services pour organisateurs",
  atmosphere_vibe: "Ambiance & atmosph\u00e8re",
  data_completeness: "Compl\u00e9tude des infos",
};

export const COUNTRY_LABELS: Record<string, string> = {
  FR: "France",
  ES: "Espagne",
  PT: "Portugal",
  IT: "Italie",
  GR: "Gr\u00e8ce",
  MA: "Maroc",
  TH: "Tha\u00eflande",
  ID: "Bali / Indon\u00e9sie",
  CR: "Costa Rica",
  MX: "Mexique",
  IN: "Inde",
  LK: "Sri Lanka",
  GB: "Royaume-Uni",
  DE: "Allemagne",
  HR: "Croatie",
  ME: "Mont\u00e9n\u00e9gro",
  TR: "Turquie",
};

export const COUNTRY_FLAGS: Record<string, string> = {
  FR: "\ud83c\uddeb\ud83c\uddf7",
  ES: "\ud83c\uddea\ud83c\uddf8",
  PT: "\ud83c\uddf5\ud83c\uddf9",
  IT: "\ud83c\uddee\ud83c\uddf9",
  GR: "\ud83c\uddec\ud83c\uddf7",
  MA: "\ud83c\uddf2\ud83c\udde6",
  TH: "\ud83c\uddf9\ud83c\udded",
  ID: "\ud83c\uddee\ud83c\udde9",
  CR: "\ud83c\udde8\ud83c\uddf7",
  MX: "\ud83c\uddf2\ud83c\uddfd",
  IN: "\ud83c\uddee\ud83c\uddf3",
  LK: "\ud83c\uddf1\ud83c\uddf0",
  GB: "\ud83c\uddec\ud83c\udde7",
  DE: "\ud83c\udde9\ud83c\uddea",
  HR: "\ud83c\udded\ud83c\uddf7",
  ME: "\ud83c\uddf2\ud83c\uddea",
  TR: "\ud83c\uddf9\ud83c\uddf7",
};

export const SETTING_LABELS: Record<string, string> = {
  beach: "Bord de mer",
  mountain: "Montagne",
  forest: "For\u00eat",
  countryside: "Campagne",
  island: "\u00cele",
  lake: "Lac",
  desert: "D\u00e9sert",
  jungle: "Jungle",
  riverside: "Bord de rivi\u00e8re",
  vineyard: "Vignoble",
};

export const STYLE_LABELS: Record<string, string> = {
  rustic: "Rustique",
  luxury: "Luxe",
  eco: "\u00c9co-responsable",
  modern: "Moderne",
  bohemian: "Boh\u00e8me",
  spiritual: "Spirituel",
  boutique: "Boutique",
  minimalist: "Minimaliste",
  traditional: "Traditionnel",
};

export const ACCOMMODATION_LABELS: Record<string, string> = {
  private_room: "Chambre priv\u00e9e",
  shared_room: "Chambre partag\u00e9e",
  dormitory: "Dortoir",
  bungalow: "Bungalow",
  tent: "Tente",
  glamping: "Glamping",
  cabin: "Cabane",
  suite: "Suite",
  apartment: "Appartement",
  villa: "Villa",
};

export const ACTIVITY_SPACE_LABELS: Record<string, string> = {
  yoga_studio: "Studio de yoga",
  meditation_hall: "Salle de m\u00e9ditation",
  outdoor_deck: "Plateforme ext\u00e9rieure",
  workshop_room: "Salle d'atelier",
  ceremony_space: "Espace de c\u00e9r\u00e9monie",
  movement_studio: "Studio de mouvement",
  healing_room: "Salle de soins",
};

export const OUTDOOR_SPACE_LABELS: Record<string, string> = {
  pool: "Piscine",
  garden: "Jardin",
  hot_tub: "Jacuzzi",
  sauna: "Sauna",
  beach_access: "Acc\u00e8s plage",
  hiking_trails: "Sentiers de randonn\u00e9e",
  terrace: "Terrasse",
  fire_pit: "Foyer ext\u00e9rieur",
  meditation_garden: "Jardin de m\u00e9ditation",
  labyrinth: "Labyrinthe",
};

export const MEAL_SERVICE_LABELS: Record<string, string> = {
  full_board: "Pension compl\u00e8te",
  half_board: "Demi-pension",
  breakfast_only: "Petit-d\u00e9jeuner inclus",
  self_catering: "Cuisine \u00e0 disposition",
  flexible: "Flexible / sur demande",
};

export const CUISINE_LABELS: Record<string, string> = {
  vegetarian: "V\u00e9g\u00e9tarien",
  vegan: "V\u00e9gan",
  organic: "Bio",
  gluten_free: "Sans gluten",
  ayurvedic: "Ayurv\u00e9dique",
  local_seasonal: "Local & de saison",
  raw: "Crudivore",
  macrobiotic: "Macrobiotique",
};

export const SERVICE_LABELS: Record<string, string> = {
  airport_transfer: "Navette a\u00e9roport",
  yoga_mats: "Tapis de yoga",
  meditation_cushions: "Coussins de m\u00e9ditation",
  sound_system: "Syst\u00e8me son",
  projector: "Projecteur",
  whiteboard: "Tableau blanc",
  massage: "Massages",
  spa: "Spa",
  excursions: "Excursions",
  wifi: "Wi-Fi",
  laundry: "Blanchisserie",
  event_planning_support: "Aide \u00e0 l'organisation",
};

export const SUITABLE_FOR_LABELS: Record<string, string> = {
  yoga: "Yoga",
  meditation: "M\u00e9ditation",
  pilates: "Pilates",
  dance: "Danse",
  breathwork: "Breathwork",
  silent_retreat: "Retraite silencieuse",
  detox: "D\u00e9tox",
  writing: "\u00c9criture",
  art: "Art",
  teacher_training: "Formation enseignants",
  corporate_wellness: "Bien-\u00eatre corporate",
  sound_healing: "Bain sonore",
  ecstatic_dance: "Danse extatique",
  tantra: "Tantra",
  fasting: "Je\u00fbne",
};

export const ALCOHOL_POLICY_LABELS: Record<string, string> = {
  allowed: "Autoris\u00e9",
  not_allowed: "Interdit",
  limited: "Limit\u00e9",
};

export const PRICE_BRACKET_LABELS: Record<string, string> = {
  budget: "Budget (< 40\u20ac/nuit)",
  mid_range: "Moyen (40-80\u20ac/nuit)",
  premium: "Premium (80-150\u20ac/nuit)",
  luxury: "Luxe (> 150\u20ac/nuit)",
};

export const CAPACITY_RANGE_LABELS: Record<string, string> = {
  small: "Petit (< 15 pers.)",
  medium: "Moyen (15-30 pers.)",
  large: "Grand (30+ pers.)",
};
