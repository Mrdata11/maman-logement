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

  return true;
}

export function countActiveFilters(filters: RetreatFilterState): number {
  let count = 0;
  if (filters.searchText) count++;
  if (filters.countries.length > 0) count++;
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
  return count;
}
