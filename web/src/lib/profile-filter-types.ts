import { QuestionnaireAnswers } from "./questionnaire-types";

// --- UI Filters (top section of the modal) ---

export interface ProfileUIFilters {
  regions: string[];
  genders: string[];
  ageMin: number | null;
  ageMax: number | null;
  communitySize: string[];
}

export const DEFAULT_PROFILE_UI_FILTERS: ProfileUIFilters = {
  regions: [],
  genders: [],
  ageMin: null,
  ageMax: null,
  communitySize: [],
};

// --- Tag Filters (collapsible sections) ---

export interface ProfileTagFilters {
  coreValues: string[];
  settingType: string[];
  targetAudience: string[];
  governance: string[];
  sharedSpaces: string[];
  mealsTogether: string[];
  financialModel: string[];
  unitTypes: string[];
  petsAllowed: string[];
  accessibility: string[];
  projectStage: string[];
  housingType: string[];
}

export const DEFAULT_PROFILE_TAG_FILTERS: ProfileTagFilters = {
  coreValues: [],
  settingType: [],
  targetAudience: [],
  governance: [],
  sharedSpaces: [],
  mealsTogether: [],
  financialModel: [],
  unitTypes: [],
  petsAllowed: [],
  accessibility: [],
  projectStage: [],
  housingType: [],
};

// --- Counts for available filter options ---

export interface ProfileFilterCounts {
  regions: { value: string; count: number }[];
  genders: { value: string; count: number }[];
  communitySize: { value: string; count: number }[];
  coreValues: { value: string; count: number }[];
  settingType: { value: string; count: number }[];
  targetAudience: { value: string; count: number }[];
  governance: { value: string; count: number }[];
  sharedSpaces: { value: string; count: number }[];
  mealsTogether: { value: string; count: number }[];
  financialModel: { value: string; count: number }[];
  unitTypes: { value: string; count: number }[];
  petsAllowed: { value: string; count: number }[];
  accessibility: { value: string; count: number }[];
  projectStage: { value: string; count: number }[];
  housingType: { value: string; count: number }[];
}

// --- French label maps ---

export const PROFILE_LABELS = {
  genders: {
    homme: "Homme",
    femme: "Femme",
    "non-binaire": "Non-binaire",
    autre: "Autre",
  } as Record<string, string>,

  regions: {
    Bruxelles: "Bruxelles",
    "Brabant Wallon": "Brabant Wallon",
    "Brabant Flamand": "Brabant Flamand",
    Hainaut: "Hainaut",
    "Liège": "Liège",
    Namur: "Namur",
    Luxembourg: "Luxembourg",
    Flandre: "Flandre",
  } as Record<string, string>,

  communitySize: {
    "Petit (4-8)": "Petit (4-8)",
    "Moyen (8-15)": "Moyen (8-15)",
    "Grand (15+)": "Grand (15+)",
    "Pas de préférence": "Pas de préférence",
  } as Record<string, string>,

  coreValues: {
    Respect: "Respect",
    "Solidarité": "Solidarité",
    Ecologie: "Ecologie",
    Ouverture: "Ouverture",
    Autonomie: "Autonomie",
    "Spiritualité": "Spiritualité",
    "Démocratie": "Démocratie",
    "Créativité": "Créativité",
  } as Record<string, string>,

  settingType: {
    rural: "Campagne, pleine nature",
    semi_rural: "Village ou petite ville",
    urban_green: "Ville avec accès à la nature",
    urban: "En ville",
    not_decided: "Pas encore décidé",
  } as Record<string, string>,

  targetAudience: {
    families: "Familles avec enfants",
    seniors: "Seniors",
    young_adults: "Jeunes adultes",
    intergenerational: "Intergénérationnel",
    all: "Tout public",
  } as Record<string, string>,

  governance: {
    consensus: "Consensus",
    sociocracy: "Sociocratie",
    association: "Association avec votes",
    informal: "Informel",
    not_decided: "Pas encore défini",
  } as Record<string, string>,

  sharedSpaces: {
    garden: "Jardin ou potager",
    kitchen: "Cuisine commune",
    common_room: "Salle commune",
    workshop: "Atelier / bricolage",
    laundry: "Buanderie partagée",
    coworking: "Espace coworking",
    playground: "Aire de jeux",
    other: "Autre",
  } as Record<string, string>,

  mealsTogether: {
    daily: "Quotidiennement",
    weekly: "1 à 2 fois par semaine",
    occasional: "Occasionnellement",
    none: "Non, chacun chez soi",
    to_decide: "À décider ensemble",
  } as Record<string, string>,

  financialModel: {
    rental: "Location",
    purchase: "Achat individuel",
    cooperative: "Coopérative",
    mixed: "Mixte (location + achat)",
    not_decided: "Pas encore défini",
  } as Record<string, string>,

  unitTypes: {
    studio: "Studios",
    "1_bedroom": "1 chambre",
    "2_bedrooms": "2 chambres",
    "3_bedrooms": "3+ chambres",
    small_house: "Petites maisons",
    flexible: "Flexible",
  } as Record<string, string>,

  petsAllowed: {
    yes: "Oui",
    no: "Non",
    to_discuss: "À discuter",
  } as Record<string, string>,

  accessibility: {
    yes: "Oui, entièrement",
    partial: "En partie",
    no: "Non",
    planned: "Prévu dans le projet",
  } as Record<string, string>,

  projectStage: {
    idea: "Encore une idée",
    searching: "En recherche",
    land_found: "Terrain trouvé",
    construction: "En travaux",
    existing: "Projet existant",
  } as Record<string, string>,

  housingType: {
    renovation: "Rénovation",
    new_build: "Construction neuve",
    existing: "Bâtiment existant",
    mixed: "Mixte",
    not_decided: "Pas encore défini",
  } as Record<string, string>,
};

// --- Helper to get a questionnaire field value ---

export function getQAString(qa: QuestionnaireAnswers | undefined, key: string): string | null {
  if (!qa) return null;
  const val = qa[key];
  return typeof val === "string" ? val : null;
}

export function getQAStringArray(qa: QuestionnaireAnswers | undefined, key: string): string[] {
  if (!qa) return [];
  const val = qa[key];
  return Array.isArray(val) ? (val as string[]) : [];
}
