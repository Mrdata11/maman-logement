import { z } from "zod";

/**
 * Schema de validation Zod pour le formulaire d'inscription de lieu de retraite.
 * Organise par etape du wizard.
 */

// Etape 1 : Informations de base
export const stepBasicInfoSchema = z.object({
  name: z.string().min(2, "Le nom du lieu est requis (min. 2 caracteres)"),
  description: z
    .string()
    .min(20, "La description est requise (min. 20 caracteres)"),
  country: z.string().min(1, "Le pays est requis"),
  region: z.string().optional().default(""),
  city: z.string().optional().default(""),
  website: z
    .string()
    .url("URL invalide")
    .optional()
    .or(z.literal(""))
    .default(""),
  contact_email: z.string().email("Email invalide"),
  contact_phone: z.string().optional().default(""),
});

// Etape 2 : Espaces
export const stepSpacesSchema = z.object({
  capacity_min: z.number().int().positive().nullable().optional().default(null),
  capacity_max: z.number().int().positive().nullable().optional().default(null),
  num_rooms: z.number().int().positive().nullable().optional().default(null),
  num_beds: z.number().int().positive().nullable().optional().default(null),
  accommodation_types: z.array(z.string()).optional().default([]),
  activity_spaces: z.array(z.string()).optional().default([]),
  outdoor_spaces: z.array(z.string()).optional().default([]),
  main_practice_space_capacity: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .default(null),
  main_practice_space_m2: z
    .number()
    .positive()
    .nullable()
    .optional()
    .default(null),
});

// Etape 3 : Restauration
export const stepDiningSchema = z.object({
  meal_service: z.string().nullable().optional().default(null),
  cuisine_options: z.array(z.string()).optional().default([]),
  kitchen_access: z.boolean().nullable().optional().default(null),
  kitchen_type: z.string().nullable().optional().default(null),
  kitchen_equipment: z.array(z.string()).optional().default([]),
});

// Etape 4 : Tarifs
export const stepPricingSchema = z.object({
  currency: z.string().nullable().optional().default("EUR"),
  price_per_person_per_night: z
    .number()
    .positive()
    .nullable()
    .optional()
    .default(null),
  price_full_venue_per_day: z
    .number()
    .positive()
    .nullable()
    .optional()
    .default(null),
  meals_included_in_price: z.boolean().nullable().optional().default(null),
  deposit_required: z.string().nullable().optional().default(null),
  cancellation_policy: z.string().nullable().optional().default(null),
  seasonal_availability: z.string().nullable().optional().default(null),
});

// Etape 5 : Photos
export const stepPhotosSchema = z.object({
  images: z.array(z.string().url("URL invalide")).optional().default([]),
  image_categories: z.record(z.string(), z.array(z.string())).optional().default({}),
});

// Etape 6 : Politiques et services
export const stepPoliciesSchema = z.object({
  alcohol_policy: z.string().nullable().optional().default(null),
  children_welcome: z.boolean().nullable().optional().default(null),
  accessible: z.boolean().nullable().optional().default(null),
  smoking_policy: z.string().nullable().optional().default(null),
  pets_allowed: z.boolean().nullable().optional().default(null),
  noise_level: z.string().nullable().optional().default(null),
  ceremonies_allowed: z.boolean().nullable().optional().default(null),
  languages_spoken: z.array(z.string()).optional().default([]),
  services: z.array(z.string()).optional().default([]),
  suitable_for: z.array(z.string()).optional().default([]),
  specialized_equipment: z.array(z.string()).optional().default([]),
});

// Schema complet combinant toutes les etapes
export const venueFormSchema = stepBasicInfoSchema
  .merge(stepSpacesSchema)
  .merge(stepDiningSchema)
  .merge(stepPricingSchema)
  .merge(stepPhotosSchema)
  .merge(stepPoliciesSchema);

export type VenueFormData = z.infer<typeof venueFormSchema>;
