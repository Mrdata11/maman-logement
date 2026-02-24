import { RetreatVenueWithEval, RetreatFilterState } from "./types";

export function applyRetreatFilters(
  item: RetreatVenueWithEval,
  filters: RetreatFilterState
): boolean {
  const { venue } = item;

  // Text search
  if (filters.searchText) {
    const text = `${venue.name} ${venue.description} ${venue.region ?? ""} ${venue.city ?? ""}`.toLowerCase();
    if (!text.includes(filters.searchText.toLowerCase())) return false;
  }

  // Country
  if (filters.countries.length > 0) {
    if (!venue.country || !filters.countries.includes(venue.country)) return false;
  }

  // Languages
  if (filters.languages.length > 0) {
    if (!venue.languages_spoken || !filters.languages.some((l) => venue.languages_spoken.includes(l))) return false;
  }

  // Setting
  if (filters.settings.length > 0) {
    if (!venue.setting.some((s) => filters.settings.includes(s))) return false;
  }

  // Style
  if (filters.styles.length > 0) {
    if (!venue.style.some((s) => filters.styles.includes(s))) return false;
  }

  // Capacity
  if (filters.capacityMin !== null && venue.capacity_max !== null) {
    if (venue.capacity_max < filters.capacityMin) return false;
  }
  if (filters.capacityMax !== null && venue.capacity_min !== null) {
    if (venue.capacity_min > filters.capacityMax) return false;
  }

  // Price
  if (filters.priceMin !== null && venue.price_per_person_per_night !== null) {
    if (venue.price_per_person_per_night < filters.priceMin) return false;
  }
  if (filters.priceMax !== null && venue.price_per_person_per_night !== null) {
    if (venue.price_per_person_per_night > filters.priceMax) return false;
  }

  // Activity spaces
  if (filters.activitySpaces.length > 0) {
    if (!filters.activitySpaces.some((s) => venue.activity_spaces.includes(s))) return false;
  }

  // Meal service
  if (filters.mealServices.length > 0) {
    if (!venue.meal_service || !filters.mealServices.includes(venue.meal_service)) return false;
  }

  // Cuisine options
  if (filters.cuisineOptions.length > 0) {
    if (!filters.cuisineOptions.some((c) => venue.cuisine_options.includes(c))) return false;
  }

  // Services
  if (filters.services.length > 0) {
    if (!filters.services.some((s) => venue.services.includes(s))) return false;
  }

  // Suitable for
  if (filters.suitableFor.length > 0) {
    if (!filters.suitableFor.some((s) => venue.suitable_for.includes(s))) return false;
  }

  // Score min
  if (filters.scoreMin !== null) {
    const score = item.evaluation?.overall_score;
    if (score === undefined || score === null || score < filters.scoreMin) return false;
  }

  // Accommodation types
  if (filters.accommodationTypes.length > 0) {
    if (!filters.accommodationTypes.some((a) => venue.accommodation_types.includes(a))) return false;
  }

  // Outdoor spaces
  if (filters.outdoorSpaces.length > 0) {
    if (!filters.outdoorSpaces.some((o) => venue.outdoor_spaces.includes(o))) return false;
  }

  // Specialized equipment
  if (filters.specializedEquipment.length > 0) {
    if (!venue.specialized_equipment || !filters.specializedEquipment.some((e) => venue.specialized_equipment.includes(e))) return false;
  }

  // Ceremonies allowed
  if (filters.ceremoniesAllowed !== null) {
    if (venue.ceremonies_allowed !== filters.ceremoniesAllowed) return false;
  }

  // Kitchen equipment
  if (filters.kitchenEquipment.length > 0) {
    if (!venue.kitchen_equipment || !filters.kitchenEquipment.some((e) => venue.kitchen_equipment.includes(e))) return false;
  }

  // Bed configurations
  if (filters.bedConfigurations.length > 0) {
    if (!venue.bed_configurations || !filters.bedConfigurations.some((b) => venue.bed_configurations.includes(b))) return false;
  }

  // Sustainability features
  if (filters.sustainabilityFeatures.length > 0) {
    if (!venue.sustainability_features || !filters.sustainabilityFeatures.some((s) => venue.sustainability_features.includes(s))) return false;
  }

  // Nearby activities
  if (filters.nearbyActivities.length > 0) {
    if (!venue.nearby_activities || !filters.nearbyActivities.some((a) => venue.nearby_activities.includes(a))) return false;
  }

  // Bed linen provided
  if (filters.bedLinenProvided !== null) {
    if (venue.bed_linen_provided !== filters.bedLinenProvided) return false;
  }

  // Towels provided
  if (filters.towelsProvided !== null) {
    if (venue.towels_provided !== filters.towelsProvided) return false;
  }

  // Cleaning included
  if (filters.cleaningIncluded !== null) {
    if (venue.cleaning_included !== filters.cleaningIncluded) return false;
  }

  // Staff on site
  if (filters.staffOnSite !== null) {
    if (venue.staff_on_site !== filters.staffOnSite) return false;
  }

  // Parking
  if (filters.hasParking !== null) {
    if (filters.hasParking && (!venue.parking_spaces || venue.parking_spaces <= 0)) return false;
  }

  // Pets allowed
  if (filters.petsAllowed !== null) {
    if (venue.pets_allowed !== filters.petsAllowed) return false;
  }

  // Drinking water safe
  if (filters.drinkingWaterSafe !== null) {
    if (venue.drinking_water_safe !== filters.drinkingWaterSafe) return false;
  }

  // Eco friendly
  if (filters.ecoFriendly !== null) {
    if (filters.ecoFriendly && (!venue.sustainability_features || venue.sustainability_features.length === 0) && (!venue.eco_certifications || venue.eco_certifications.length === 0)) return false;
  }

  return true;
}

export function countActiveFilters(filters: RetreatFilterState): number {
  let count = 0;
  if (filters.searchText) count++;
  if (filters.countries.length > 0) count++;
  if (filters.languages.length > 0) count++;
  if (filters.settings.length > 0) count++;
  if (filters.styles.length > 0) count++;
  if (filters.capacityMin !== null) count++;
  if (filters.capacityMax !== null) count++;
  if (filters.priceMin !== null) count++;
  if (filters.priceMax !== null) count++;
  if (filters.activitySpaces.length > 0) count++;
  if (filters.mealServices.length > 0) count++;
  if (filters.cuisineOptions.length > 0) count++;
  if (filters.services.length > 0) count++;
  if (filters.suitableFor.length > 0) count++;
  if (filters.scoreMin !== null) count++;
  if (filters.accommodationTypes.length > 0) count++;
  if (filters.outdoorSpaces.length > 0) count++;
  if (filters.specializedEquipment.length > 0) count++;
  if (filters.ceremoniesAllowed !== null) count++;
  if (filters.kitchenEquipment.length > 0) count++;
  if (filters.bedConfigurations.length > 0) count++;
  if (filters.sustainabilityFeatures.length > 0) count++;
  if (filters.nearbyActivities.length > 0) count++;
  if (filters.bedLinenProvided !== null) count++;
  if (filters.towelsProvided !== null) count++;
  if (filters.cleaningIncluded !== null) count++;
  if (filters.staffOnSite !== null) count++;
  if (filters.hasParking !== null) count++;
  if (filters.petsAllowed !== null) count++;
  if (filters.drinkingWaterSafe !== null) count++;
  if (filters.ecoFriendly !== null) count++;
  return count;
}
