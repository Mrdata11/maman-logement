import { describe, it, expect } from "vitest";
import { applyRetreatFilters, countActiveFilters } from "@/lib/retreats/filters";
import type { RetreatVenueWithEval, RetreatFilterState } from "@/lib/retreats/types";
import { DEFAULT_RETREAT_FILTERS } from "@/lib/retreats/types";

// Factory helper — provides sensible defaults for RetreatVenueWithEval
function makeVenueItem(
  overrides: Partial<RetreatVenueWithEval["venue"]> = {},
  evalOverrides: Partial<RetreatVenueWithEval["evaluation"]> | null = null
): RetreatVenueWithEval {
  return {
    venue: {
      id: "v-1",
      source: "test",
      source_url: "https://example.com",
      name: "Lieu Test",
      description: "Un beau lieu de retraite",
      country: "France",
      region: "Provence",
      city: "Aix-en-Provence",
      latitude: 43.5,
      longitude: 5.4,
      nearest_airport: "Marseille",
      transfer_available: true,
      capacity_min: 10,
      capacity_max: 30,
      num_rooms: 15,
      num_beds: 30,
      accommodation_types: ["shared_rooms", "private_rooms"],
      room_has_private_bathroom: false,
      bed_configurations: ["single", "double"],
      bed_linen_provided: true,
      towels_provided: true,
      num_bathrooms: 5,
      num_shared_bathrooms: 3,
      num_toilets: 6,
      hot_water_type: "solar",
      bathroom_amenities: ["shower_only"],
      activity_spaces: ["yoga_hall", "meditation_room"],
      main_practice_space_capacity: 30,
      main_practice_space_m2: 100,
      num_practice_spaces: 2,
      practice_space_floor_type: "wood",
      practice_space_has_mirrors: false,
      practice_space_natural_light: true,
      practice_space_sound_insulation: true,
      practice_space_climate_control: true,
      outdoor_spaces: ["garden", "terrace"],
      pool_type: "outdoor",
      pool_dimensions: "10x5m",
      meal_service: "full_board",
      cuisine_options: ["vegetarian", "vegan"],
      kitchen_access: true,
      dietary_accommodations: true,
      kitchen_type: "professional",
      kitchen_capacity_persons: 30,
      kitchen_equipment: ["industrial_oven", "dishwasher"],
      currency: "EUR",
      price_per_person_per_night: 80,
      price_per_person_per_night_max: 120,
      price_full_venue_per_day: 2000,
      price_notes: null,
      meals_included_in_price: true,
      tourist_tax_per_person: 1.5,
      heating_supplement: false,
      security_deposit: 500,
      cleaning_fee: 200,
      linen_rental_available: false,
      extra_bed_cost: null,
      setting: ["countryside"],
      style: ["zen"],
      services: ["coordination", "catering"],
      cleaning_included: true,
      cleaning_frequency: "daily",
      staff_on_site: true,
      staff_count: 3,
      staff_details: null,
      suitable_for: ["yoga", "meditation"],
      alcohol_policy: "not_allowed",
      children_welcome: true,
      accessible: false,
      smoking_policy: "not_allowed",
      pets_allowed: false,
      ground_floor_rooms: 2,
      elevator: false,
      terrain_type: "flat",
      adapted_bathroom: false,
      images: [],
      image_categories: {},
      contact_email: "test@example.com",
      contact_phone: null,
      website: "https://example.com",
      booking_url: null,
      rating_average: 4.5,
      rating_count: 10,
      available_year_round: true,
      min_stay_nights: 2,
      lead_time_weeks: 4,
      check_in_time: "15:00",
      check_out_time: "10:00",
      languages_spoken: ["fr", "en"],
      cancellation_policy: null,
      deposit_required: null,
      group_discount: false,
      suggested_durations: [3, 5, 7],
      seasonal_availability: null,
      specialized_equipment: ["yoga_mats", "cushions"],
      ceremonies_allowed: true,
      silence_policy: null,
      noise_level: "quiet",
      climate_info: null,
      wifi_speed: "good",
      mobile_signal: "moderate",
      backup_power: false,
      heating_type: "central",
      air_conditioning_type: "natural_ventilation",
      mosquito_protection: false,
      drinking_water_safe: true,
      nearest_hospital_km: 15,
      nearest_pharmacy_km: 5,
      nearest_grocery_km: 3,
      nearest_restaurant_km: 2,
      first_aid_kit: true,
      fire_safety: true,
      emergency_procedure: true,
      retreats_hosted_count: 20,
      testimonials: [],
      exclusive_hire_only: false,
      nearest_airport_km: 40,
      nearest_train_station: "Aix TGV",
      nearest_train_station_km: 10,
      nearest_town_km: 5,
      parking_spaces: 15,
      parking_type: "free",
      eco_certifications: ["ecolabel"],
      sustainability_features: ["solar_panels", "composting"],
      nearby_activities: ["cycling", "cultural_visits"],
      nearest_beach_km: 60,
      liability_insurance: true,
      max_legal_occupancy: 35,
      ...overrides,
    } as RetreatVenueWithEval["venue"],
    evaluation: evalOverrides !== undefined
      ? evalOverrides === null
        ? null
        : { overall_score: 75, ...evalOverrides } as RetreatVenueWithEval["evaluation"]
      : { overall_score: 75 } as RetreatVenueWithEval["evaluation"],
    tags: null,
    status: "new" as const,
    notes: "",
  };
}

function makeFilters(overrides: Partial<RetreatFilterState> = {}): RetreatFilterState {
  return { ...DEFAULT_RETREAT_FILTERS, ...overrides };
}

describe("applyRetreatFilters", () => {
  it("returns true when all filters are default (empty)", () => {
    expect(applyRetreatFilters(makeVenueItem(), makeFilters())).toBe(true);
  });

  it("filters by searchText (name match)", () => {
    const item = makeVenueItem({ name: "Château de la Paix" });
    expect(applyRetreatFilters(item, makeFilters({ searchText: "château" }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ searchText: "plage" }))).toBe(false);
  });

  it("filters by searchText (description match)", () => {
    const item = makeVenueItem({ description: "Lieu calme en montagne" });
    expect(applyRetreatFilters(item, makeFilters({ searchText: "montagne" }))).toBe(true);
  });

  it("searchText is case-insensitive", () => {
    const item = makeVenueItem({ name: "ZEN TEMPLE" });
    expect(applyRetreatFilters(item, makeFilters({ searchText: "zen temple" }))).toBe(true);
  });

  it("filters by single country", () => {
    const item = makeVenueItem({ country: "France" });
    expect(applyRetreatFilters(item, makeFilters({ countries: ["France"] }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ countries: ["Espagne"] }))).toBe(false);
  });

  it("filters by multiple countries", () => {
    const item = makeVenueItem({ country: "Portugal" });
    expect(
      applyRetreatFilters(item, makeFilters({ countries: ["France", "Portugal"] }))
    ).toBe(true);
  });

  it("excludes venues with null country", () => {
    const item = makeVenueItem({ country: null });
    expect(applyRetreatFilters(item, makeFilters({ countries: ["France"] }))).toBe(false);
  });

  it("filters by language", () => {
    const item = makeVenueItem({ languages_spoken: ["fr", "en"] });
    expect(applyRetreatFilters(item, makeFilters({ languages: ["fr"] }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ languages: ["de"] }))).toBe(false);
  });

  it("filters by setting", () => {
    const item = makeVenueItem({ setting: ["countryside", "mountain"] });
    expect(applyRetreatFilters(item, makeFilters({ settings: ["countryside"] }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ settings: ["beach"] }))).toBe(false);
  });

  it("filters by style", () => {
    const item = makeVenueItem({ style: ["zen", "rustic"] });
    expect(applyRetreatFilters(item, makeFilters({ styles: ["zen"] }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ styles: ["luxury"] }))).toBe(false);
  });

  it("filters by capacity min", () => {
    const item = makeVenueItem({ capacity_max: 20 });
    expect(applyRetreatFilters(item, makeFilters({ capacityMin: 15 }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ capacityMin: 25 }))).toBe(false);
  });

  it("filters by capacity max", () => {
    const item = makeVenueItem({ capacity_min: 10 });
    expect(applyRetreatFilters(item, makeFilters({ capacityMax: 15 }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ capacityMax: 5 }))).toBe(false);
  });

  it("filters by price range", () => {
    const item = makeVenueItem({ price_per_person_per_night: 80 });
    expect(applyRetreatFilters(item, makeFilters({ priceMin: 50, priceMax: 100 }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ priceMin: 90 }))).toBe(false);
    expect(applyRetreatFilters(item, makeFilters({ priceMax: 60 }))).toBe(false);
  });

  it("allows null price through price filters", () => {
    const item = makeVenueItem({ price_per_person_per_night: null });
    expect(applyRetreatFilters(item, makeFilters({ priceMin: 50 }))).toBe(true);
  });

  it("filters by activity spaces", () => {
    const item = makeVenueItem({ activity_spaces: ["yoga_hall"] });
    expect(applyRetreatFilters(item, makeFilters({ activitySpaces: ["yoga_hall"] }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ activitySpaces: ["dance_floor"] }))).toBe(false);
  });

  it("filters by meal service", () => {
    const item = makeVenueItem({ meal_service: "full_board" });
    expect(applyRetreatFilters(item, makeFilters({ mealServices: ["full_board"] }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ mealServices: ["self_catering"] }))).toBe(false);
  });

  it("filters by cuisine options", () => {
    const item = makeVenueItem({ cuisine_options: ["vegetarian", "vegan"] });
    expect(applyRetreatFilters(item, makeFilters({ cuisineOptions: ["vegan"] }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ cuisineOptions: ["halal"] }))).toBe(false);
  });

  it("filters by services", () => {
    const item = makeVenueItem({ services: ["coordination"] });
    expect(applyRetreatFilters(item, makeFilters({ services: ["coordination"] }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ services: ["spa"] }))).toBe(false);
  });

  it("filters by suitable_for", () => {
    const item = makeVenueItem({ suitable_for: ["yoga", "meditation"] });
    expect(applyRetreatFilters(item, makeFilters({ suitableFor: ["yoga"] }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ suitableFor: ["dance"] }))).toBe(false);
  });

  it("filters by score minimum", () => {
    const item = makeVenueItem({}, { overall_score: 80 } as RetreatVenueWithEval["evaluation"]);
    expect(applyRetreatFilters(item, makeFilters({ scoreMin: 70 }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ scoreMin: 90 }))).toBe(false);
  });

  it("filters by ceremonies_allowed", () => {
    const item = makeVenueItem({ ceremonies_allowed: true });
    expect(applyRetreatFilters(item, makeFilters({ ceremoniesAllowed: true }))).toBe(true);
    expect(applyRetreatFilters(item, makeFilters({ ceremoniesAllowed: false }))).toBe(false);
  });

  it("filters by eco-friendly", () => {
    const ecoItem = makeVenueItem({ sustainability_features: ["solar_panels"] });
    expect(applyRetreatFilters(ecoItem, makeFilters({ ecoFriendly: true }))).toBe(true);

    const nonEcoItem = makeVenueItem({
      sustainability_features: [],
      eco_certifications: [],
    });
    expect(applyRetreatFilters(nonEcoItem, makeFilters({ ecoFriendly: true }))).toBe(false);
  });

  it("filters by pets_allowed", () => {
    const item = makeVenueItem({ pets_allowed: true });
    expect(applyRetreatFilters(item, makeFilters({ petsAllowed: true }))).toBe(true);

    const noPets = makeVenueItem({ pets_allowed: false });
    expect(applyRetreatFilters(noPets, makeFilters({ petsAllowed: true }))).toBe(false);
  });

  it("applies multiple filters simultaneously", () => {
    const item = makeVenueItem({
      country: "France",
      setting: ["countryside"],
      capacity_max: 20,
      price_per_person_per_night: 80,
    });
    expect(
      applyRetreatFilters(
        item,
        makeFilters({
          countries: ["France"],
          settings: ["countryside"],
          capacityMin: 10,
          priceMax: 100,
        })
      )
    ).toBe(true);
  });
});

describe("countActiveFilters", () => {
  it("returns 0 for default filters", () => {
    expect(countActiveFilters(DEFAULT_RETREAT_FILTERS)).toBe(0);
  });

  it("counts searchText as 1", () => {
    expect(countActiveFilters(makeFilters({ searchText: "test" }))).toBe(1);
  });

  it("counts each non-empty array as 1", () => {
    expect(
      countActiveFilters(
        makeFilters({ countries: ["FR"], languages: ["fr"] })
      )
    ).toBe(2);
  });

  it("counts each non-null boolean as 1", () => {
    expect(
      countActiveFilters(makeFilters({ ceremoniesAllowed: true, petsAllowed: false }))
    ).toBe(2);
  });

  it("counts numeric filters", () => {
    expect(
      countActiveFilters(makeFilters({ capacityMin: 5, priceMax: 100 }))
    ).toBe(2);
  });

  it("correctly sums multiple active filters", () => {
    expect(
      countActiveFilters(
        makeFilters({
          searchText: "yoga",
          countries: ["France"],
          capacityMin: 10,
          ceremoniesAllowed: true,
        })
      )
    ).toBe(4);
  });
});
