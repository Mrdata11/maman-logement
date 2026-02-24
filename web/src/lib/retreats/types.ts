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
  bed_configurations: string[];              // single, double, twin, bunk, futon, mattress_floor
  bed_linen_provided: boolean | null;
  towels_provided: boolean | null;

  // Room-level details
  rooms: RetreatRoom[];

  // Bathrooms / sanitaires
  num_bathrooms: number | null;
  num_shared_bathrooms: number | null;
  num_toilets: number | null;
  hot_water_type: string | null;             // solar, electric, gas, unlimited, limited_tank
  bathroom_amenities: string[];              // towels, hair_dryer, toiletries, bathtub, shower_only, bidet

  // Activity/practice spaces
  activity_spaces: string[];
  main_practice_space_capacity: number | null;
  main_practice_space_m2: number | null;
  num_practice_spaces: number | null;
  practice_space_floor_type: string | null;  // wood, bamboo, concrete, tatami, grass, stone, vinyl
  practice_space_has_mirrors: boolean | null;
  practice_space_natural_light: boolean | null;
  practice_space_sound_insulation: boolean | null;
  practice_space_climate_control: boolean | null;

  // Outdoor & wellness
  outdoor_spaces: string[];
  pool_type: string | null;                  // outdoor, indoor, natural, heated, unheated, infinity, plunge
  pool_dimensions: string | null;            // e.g. "12x6m"

  // Dining
  meal_service: string | null;
  cuisine_options: string[];
  kitchen_access: boolean | null;
  dietary_accommodations: boolean | null;
  kitchen_type: string | null;               // professional, domestic, outdoor, none
  kitchen_capacity_persons: number | null;
  kitchen_equipment: string[];               // industrial_oven, blender, juicer, food_processor, dishwasher, multiple_fridges, freezer, coffee_machine, kettle, microwave

  // Pricing
  currency: string | null;
  price_per_person_per_night: number | null;
  price_per_person_per_night_max: number | null;
  price_full_venue_per_day: number | null;
  price_notes: string | null;
  meals_included_in_price: boolean | null;

  // Seasonal pricing
  price_high_season: number | null;          // prix haute saison /pers/nuit
  price_low_season: number | null;           // prix basse saison /pers/nuit
  high_season_months: string | null;         // e.g. "Juin-Septembre"
  low_season_months: string | null;          // e.g. "Octobre-Mars"
  weekend_supplement: boolean | null;        // supplément week-end

  // Package deals / forfaits
  package_deals: RetreatPackageDeal[];       // forfaits types proposés

  // Extra costs / frais supplémentaires
  tourist_tax_per_person: number | null;     // taxe de séjour par personne/nuit
  heating_supplement: boolean | null;        // supplément chauffage (hiver)
  security_deposit: number | null;           // caution (EUR)
  cleaning_fee: number | null;               // frais de ménage final (EUR)
  linen_rental_available: boolean | null;    // location de draps possible
  extra_bed_cost: number | null;             // lit supplémentaire (EUR/nuit)

  // Payment
  payment_methods: string[];                 // bank_transfer, credit_card, paypal, cash, crypto
  payment_installments: boolean | null;      // paiement échelonné possible
  contract_language: string | null;          // fr, en, es, etc.

  // Setting & style
  setting: string[];
  style: string[];

  // Services for organizers
  services: string[];

  // Cleaning / ménage
  cleaning_included: boolean | null;
  cleaning_frequency: string | null;         // daily, mid_stay, end_of_stay, on_request

  // Staff
  staff_on_site: boolean | null;
  staff_count: number | null;
  staff_details: string | null;              // e.g. "2 personnes, ménage + cuisine"

  // Suitable retreat types
  suitable_for: string[];

  // Rules
  alcohol_policy: string | null;
  children_welcome: boolean | null;
  accessible: boolean | null;
  smoking_policy: string | null;             // not_allowed, outdoor_only, designated_areas
  pets_allowed: boolean | null;

  // Accessibility details
  ground_floor_rooms: number | null;
  elevator: boolean | null;
  terrain_type: string | null;               // flat, slight_slope, hilly, steep, stairs
  adapted_bathroom: boolean | null;

  // Photos & media
  images: string[];
  image_categories: Record<string, string[]>;
  video_url: string | null;                  // YouTube, Vimeo, etc.
  virtual_tour_url: string | null;           // Matterport, 360°
  floor_plan_url: string | null;             // plan du lieu (image ou PDF)

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
  check_in_time: string | null;              // e.g. "15:00"
  check_out_time: string | null;             // e.g. "10:00"

  // Languages spoken by staff
  languages_spoken: string[];

  // Booking & policies
  cancellation_policy: string | null;
  deposit_required: string | null;
  group_discount: boolean | null;
  suggested_durations: number[];       // e.g. [3, 5, 7] nights
  seasonal_availability: string | null; // e.g. "Mai-Octobre"
  cancellation_insurance_available: boolean | null;
  covid_flexible_policy: boolean | null; // politique flexible COVID / force majeure
  average_response_time: string | null;  // e.g. "24h", "48h", "1 semaine"

  // Specialized equipment
  specialized_equipment: string[];

  // Environment & rules
  ceremonies_allowed: boolean | null;   // encens, bougies, rituels
  silence_policy: string | null;
  noise_level: string | null;          // "very_quiet" | "quiet" | "moderate" | "lively"
  climate_info: string | null;

  // Technical / infrastructure
  wifi_speed: string | null;           // none, basic, good, excellent, fiber
  mobile_signal: string | null;        // none, weak, moderate, good
  backup_power: boolean | null;        // groupe électrogène / onduleur

  // Climate & comfort
  heating_type: string | null;         // central, wood_stove, electric, radiator, underfloor, heat_pump, none
  air_conditioning_type: string | null; // central, split, fans_only, none, natural_ventilation
  mosquito_protection: boolean | null;
  drinking_water_safe: boolean | null; // eau du robinet potable

  // Safety
  nearest_hospital_km: number | null;
  nearest_pharmacy_km: number | null;
  nearest_grocery_km: number | null;
  nearest_restaurant_km: number | null;
  first_aid_kit: boolean | null;
  fire_safety: boolean | null;             // extincteurs, alarmes incendie
  emergency_procedure: boolean | null;     // procédure d'urgence documentée

  // Track record
  retreats_hosted_count: number | null;
  testimonials: RetreatTestimonial[];

  // Hire model
  exclusive_hire_only: boolean | null;

  // Transport / logistics
  nearest_airport_km: number | null;
  nearest_train_station: string | null;
  nearest_train_station_km: number | null;
  nearest_town_km: number | null;
  parking_spaces: number | null;
  parking_type: string | null;             // free, paid, on_site, street, none

  // Eco / sustainability
  eco_certifications: string[];            // ecolabel, green_key, bio, leed, breeam
  sustainability_features: string[];       // solar_panels, composting, recycling, rainwater, organic_garden, low_energy, natural_materials, zero_waste

  // Nearby activities
  nearby_activities: string[];             // kayaking, surfing, horse_riding, rock_climbing, snorkeling, cultural_visits, wine_tasting, cooking_class, local_market, thermal_baths, diving, sailing, cycling, golf
  nearest_beach_km: number | null;

  // Legal / insurance
  liability_insurance: boolean | null;
  max_legal_occupancy: number | null;

  // Metadata
  original_language: string | null;
  date_scraped: string;
  is_claimed: boolean;
}

export interface RetreatPackageDeal {
  name: string;              // e.g. "Weekend Yoga 12 pers."
  duration_nights: number;
  group_size: number;
  price_total: number;
  currency: string;
  includes: string[];        // e.g. ["hébergement", "repas", "salle de yoga", "ménage"]
  notes: string | null;
}

export interface RetreatRoom {
  name: string;              // e.g. "Chambre Lavande", "Dortoir 1"
  type: string;              // private_room, shared_room, dormitory, suite, etc.
  capacity: number;
  bed_type: string;          // single, double, twin, bunk
  has_private_bathroom: boolean;
  has_view: boolean | null;
  floor: number | null;      // 0 = RDC
  size_m2: number | null;
  amenities: string[];       // e.g. ["balcon", "bureau", "coffre-fort", "climatisation"]
  images: string[];
}

export interface RetreatTestimonial {
  author: string;
  role: string;           // e.g. "Professeur de Reiki", "Yoga teacher"
  text: string;
  rating: number;         // 1-5
  date: string;           // ISO date
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
  // New tags
  has_professional_kitchen: boolean | null;
  bed_linen_provided: boolean | null;
  towels_provided: boolean | null;
  cleaning_included: boolean | null;
  staff_on_site: boolean | null;
  has_parking: boolean | null;
  smoking_not_allowed: boolean | null;
  pets_allowed: boolean | null;
  has_heating: boolean | null;
  has_ac: boolean | null;
  drinking_water_safe: boolean | null;
  first_aid_kit: boolean | null;
  eco_friendly: boolean | null;
  has_nearby_activities: boolean | null;
  has_liability_insurance: boolean | null;
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
  languages: string[];
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
  specializedEquipment: string[];
  ceremoniesAllowed: boolean | null;
  // New filter dimensions
  kitchenEquipment: string[];
  bedConfigurations: string[];
  sustainabilityFeatures: string[];
  nearbyActivities: string[];
  bedLinenProvided: boolean | null;
  towelsProvided: boolean | null;
  cleaningIncluded: boolean | null;
  staffOnSite: boolean | null;
  hasParking: boolean | null;
  petsAllowed: boolean | null;
  drinkingWaterSafe: boolean | null;
  ecoFriendly: boolean | null;
}

export const DEFAULT_RETREAT_FILTERS: RetreatFilterState = {
  searchText: "",
  countries: [],
  languages: [],
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
  specializedEquipment: [],
  ceremoniesAllowed: null,
  kitchenEquipment: [],
  bedConfigurations: [],
  sustainabilityFeatures: [],
  nearbyActivities: [],
  bedLinenProvided: null,
  towelsProvided: null,
  cleaningIncluded: null,
  staffOnSite: null,
  hasParking: null,
  petsAllowed: null,
  drinkingWaterSafe: null,
  ecoFriendly: null,
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

export const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Fran\u00e7ais",
  en: "Anglais",
  es: "Espagnol",
  pt: "Portugais",
  it: "Italien",
  de: "Allemand",
  nl: "N\u00e9erlandais",
  th: "Tha\u00ef",
  id: "Indon\u00e9sien",
  el: "Grec",
  ar: "Arabe",
};

export const LANGUAGE_FLAGS: Record<string, string> = {
  fr: "\ud83c\uddeb\ud83c\uddf7",
  en: "\ud83c\uddec\ud83c\udde7",
  es: "\ud83c\uddea\ud83c\uddf8",
  pt: "\ud83c\uddf5\ud83c\uddf9",
  it: "\ud83c\uddee\ud83c\uddf9",
  de: "\ud83c\udde9\ud83c\uddea",
  nl: "\ud83c\uddf3\ud83c\uddf1",
  th: "\ud83c\uddf9\ud83c\udded",
  id: "\ud83c\uddee\ud83c\udde9",
  el: "\ud83c\uddec\ud83c\uddf7",
  ar: "\ud83c\uddf2\ud83c\udde6",
};

export const SPECIALIZED_EQUIPMENT_LABELS: Record<string, string> = {
  singing_bowls: "Bols tib\u00e9tains / chantants",
  gongs: "Gongs",
  crystal_bowls: "Bols en cristal",
  yoga_props: "Props yoga (bolsters, blocs, sangles)",
  meditation_cushions: "Coussins de méditation",
  massage_tables: "Tables de massage",
  reiki_tables: "Tables de Reiki",
  essential_oils: "Huiles essentielles / diffuseurs",
  incense: "Encens",
  candles: "Bougies / \u00e9clairage tamisable",
  altar_space: "Espace autel",
  blankets: "Couvertures / plaids",
  heating: "Chauffage dans les salles",
  air_conditioning: "Climatisation",
  blackout: "Occultation (stores / rideaux opaques)",
};

// === Nouveaux labels pour champs ajoutés ===

export const BED_CONFIGURATION_LABELS: Record<string, string> = {
  single: "Lit simple",
  double: "Lit double",
  twin: "Lits jumeaux",
  bunk: "Lits superposés",
  futon: "Futon",
  mattress_floor: "Matelas au sol",
};

export const HOT_WATER_LABELS: Record<string, string> = {
  solar: "Solaire",
  electric: "Électrique",
  gas: "Gaz",
  unlimited: "Illimitée",
  limited_tank: "Réservoir limité",
};

export const BATHROOM_AMENITY_LABELS: Record<string, string> = {
  towels: "Serviettes fournies",
  hair_dryer: "Sèche-cheveux",
  toiletries: "Produits d'hygiène",
  bathtub: "Baignoire",
  shower_only: "Douche uniquement",
  bidet: "Bidet",
};

export const PRACTICE_FLOOR_LABELS: Record<string, string> = {
  wood: "Parquet bois",
  bamboo: "Bambou",
  concrete: "Béton",
  tatami: "Tatami",
  grass: "Herbe / pelouse",
  stone: "Pierre",
  vinyl: "Vinyle / sol souple",
};

export const POOL_TYPE_LABELS: Record<string, string> = {
  outdoor: "Extérieure",
  indoor: "Intérieure",
  natural: "Naturelle / biologique",
  heated: "Chauffée",
  unheated: "Non chauffée",
  infinity: "À débordement",
  plunge: "Bain froid / plongeon",
};

export const KITCHEN_TYPE_LABELS: Record<string, string> = {
  professional: "Cuisine professionnelle",
  domestic: "Cuisine domestique",
  outdoor: "Cuisine extérieure",
  none: "Pas de cuisine",
};

export const KITCHEN_EQUIPMENT_LABELS: Record<string, string> = {
  industrial_oven: "Four professionnel",
  blender: "Blender",
  juicer: "Extracteur de jus",
  food_processor: "Robot culinaire",
  dishwasher: "Lave-vaisselle",
  multiple_fridges: "Plusieurs réfrigérateurs",
  freezer: "Congélateur",
  coffee_machine: "Machine à café",
  kettle: "Bouilloire",
  microwave: "Micro-ondes",
};

export const CLEANING_FREQUENCY_LABELS: Record<string, string> = {
  daily: "Quotidien",
  mid_stay: "En milieu de séjour",
  end_of_stay: "Fin de séjour",
  on_request: "Sur demande",
};

export const SMOKING_POLICY_LABELS: Record<string, string> = {
  not_allowed: "Interdit",
  outdoor_only: "Extérieur uniquement",
  designated_areas: "Zones désignées",
};

export const TERRAIN_TYPE_LABELS: Record<string, string> = {
  flat: "Plat",
  slight_slope: "Légère pente",
  hilly: "Vallonné",
  steep: "Escarpé",
  stairs: "Escaliers",
};

export const WIFI_SPEED_LABELS: Record<string, string> = {
  none: "Pas de Wi-Fi",
  basic: "Basique (email)",
  good: "Bon (vidéo)",
  excellent: "Excellent (streaming)",
  fiber: "Fibre",
};

export const MOBILE_SIGNAL_LABELS: Record<string, string> = {
  none: "Aucun signal",
  weak: "Faible",
  moderate: "Modéré",
  good: "Bon",
};

export const HEATING_TYPE_LABELS: Record<string, string> = {
  central: "Chauffage central",
  wood_stove: "Poêle à bois",
  electric: "Radiateurs électriques",
  radiator: "Radiateurs",
  underfloor: "Plancher chauffant",
  heat_pump: "Pompe à chaleur",
  none: "Pas de chauffage",
};

export const AC_TYPE_LABELS: Record<string, string> = {
  central: "Climatisation centrale",
  split: "Split / réversible",
  fans_only: "Ventilateurs uniquement",
  none: "Pas de climatisation",
  natural_ventilation: "Ventilation naturelle",
};

export const PARKING_TYPE_LABELS: Record<string, string> = {
  free: "Gratuit sur place",
  paid: "Payant",
  on_site: "Sur place",
  street: "Rue / extérieur",
  none: "Pas de parking",
};

export const ECO_CERTIFICATION_LABELS: Record<string, string> = {
  ecolabel: "Écolabel européen",
  green_key: "Clef Verte",
  bio: "Agriculture biologique",
  leed: "LEED",
  breeam: "BREEAM",
};

export const SUSTAINABILITY_LABELS: Record<string, string> = {
  solar_panels: "Panneaux solaires",
  composting: "Compostage",
  recycling: "Tri sélectif",
  rainwater: "Récupération eau de pluie",
  organic_garden: "Potager / jardin bio",
  low_energy: "Basse consommation",
  natural_materials: "Matériaux naturels",
  zero_waste: "Zéro déchet",
};

export const NEARBY_ACTIVITY_LABELS: Record<string, string> = {
  kayaking: "Kayak",
  surfing: "Surf",
  horse_riding: "Équitation",
  rock_climbing: "Escalade",
  snorkeling: "Snorkeling",
  cultural_visits: "Visites culturelles",
  wine_tasting: "Dégustation de vin",
  cooking_class: "Cours de cuisine",
  local_market: "Marché local",
  thermal_baths: "Thermes",
  diving: "Plongée",
  sailing: "Voile",
  cycling: "Vélo",
  golf: "Golf",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Virement bancaire",
  credit_card: "Carte bancaire",
  paypal: "PayPal",
  cash: "Espèces",
  crypto: "Crypto-monnaie",
  check: "Chèque",
};

export const ROOM_AMENITY_LABELS: Record<string, string> = {
  balcon: "Balcon",
  bureau: "Bureau",
  coffre_fort: "Coffre-fort",
  climatisation: "Climatisation",
  ventilateur: "Ventilateur",
  moustiquaire: "Moustiquaire",
  vue_mer: "Vue mer",
  vue_montagne: "Vue montagne",
  vue_jardin: "Vue jardin",
  terrasse_privee: "Terrasse privée",
  cheminee: "Cheminée",
  mini_frigo: "Mini-frigo",
  bouilloire: "Bouilloire",
};

export const NOISE_LEVEL_LABELS: Record<string, string> = {
  very_quiet: "Tr\u00e8s calme (isol\u00e9)",
  quiet: "Calme",
  moderate: "Mod\u00e9r\u00e9",
  lively: "Anim\u00e9",
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
