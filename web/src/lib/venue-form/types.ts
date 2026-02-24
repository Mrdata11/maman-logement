import type { VenueFormData } from "./schema";

/**
 * Definition d'une etape du formulaire.
 */
export interface FormStep {
  number: number;
  label: string;
  description: string;
}

export const FORM_STEPS: FormStep[] = [
  {
    number: 1,
    label: "Informations",
    description: "Nom, description et coordonnees de votre lieu",
  },
  {
    number: 2,
    label: "Espaces",
    description: "Capacite, hebergement et espaces de pratique",
  },
  {
    number: 3,
    label: "Restauration",
    description: "Service de repas et equipement cuisine",
  },
  {
    number: 4,
    label: "Tarifs",
    description: "Prix, conditions et disponibilite",
  },
  {
    number: 5,
    label: "Photos",
    description: "Images de votre lieu par categorie",
  },
  {
    number: 6,
    label: "Details",
    description: "Regles, services et equipements",
  },
];

/**
 * Etat du formulaire dans le wizard.
 */
export interface VenueFormState {
  currentStep: number;
  formData: Partial<VenueFormData>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  errors: Record<string, string>;
}

/**
 * Valeurs initiales du formulaire.
 */
export const INITIAL_FORM_DATA: Partial<VenueFormData> = {
  name: "",
  description: "",
  country: "",
  region: "",
  city: "",
  website: "",
  contact_email: "",
  contact_phone: "",
  capacity_min: null,
  capacity_max: null,
  num_rooms: null,
  num_beds: null,
  accommodation_types: [],
  activity_spaces: [],
  outdoor_spaces: [],
  main_practice_space_capacity: null,
  main_practice_space_m2: null,
  meal_service: null,
  cuisine_options: [],
  kitchen_access: null,
  kitchen_type: null,
  kitchen_equipment: [],
  currency: "EUR",
  price_per_person_per_night: null,
  price_full_venue_per_day: null,
  meals_included_in_price: null,
  deposit_required: null,
  cancellation_policy: null,
  seasonal_availability: null,
  images: [],
  image_categories: {},
  alcohol_policy: null,
  children_welcome: null,
  accessible: null,
  smoking_policy: null,
  pets_allowed: null,
  noise_level: null,
  ceremonies_allowed: null,
  languages_spoken: [],
  services: [],
  suitable_for: [],
  specialized_equipment: [],
};
