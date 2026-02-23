import { describe, it, expect } from "vitest";
import {
  UIFilterState,
  DEFAULT_UI_FILTERS,
  ListingWithEval,
  Listing,
  Evaluation,
  CriteriaScores,
} from "@/lib/types";

// Reusable filter logic extracted from Dashboard for testability
// This mirrors the exact filtering logic from Dashboard.tsx
function applyUIFilters(
  items: ListingWithEval[],
  uiFilters: UIFilterState,
  adjustedScores?: Map<string, number>
): ListingWithEval[] {
  let result = [...items];

  // Text search
  if (uiFilters.searchText.trim()) {
    const query = uiFilters.searchText.toLowerCase().trim();
    result = result.filter(
      (i) =>
        i.listing.title.toLowerCase().includes(query) ||
        i.listing.description.toLowerCase().includes(query)
    );
  }

  // Provinces
  if (uiFilters.provinces.length > 0) {
    result = result.filter(
      (i) =>
        i.listing.province !== null &&
        uiFilters.provinces.includes(i.listing.province)
    );
  }

  // Listing types
  if (uiFilters.listingTypes.length > 0) {
    result = result.filter(
      (i) =>
        i.listing.listing_type !== null &&
        uiFilters.listingTypes.includes(i.listing.listing_type)
    );
  }

  // Price range
  if (uiFilters.priceMin !== null || uiFilters.priceMax !== null) {
    result = result.filter((i) => {
      if (i.listing.price_amount === null) return uiFilters.includeNullPrice;
      if (
        uiFilters.priceMin !== null &&
        i.listing.price_amount < uiFilters.priceMin
      )
        return false;
      if (
        uiFilters.priceMax !== null &&
        i.listing.price_amount > uiFilters.priceMax
      )
        return false;
      return true;
    });
  }

  // Score minimum
  if (uiFilters.scoreMin !== null) {
    result = result.filter((i) => {
      const score =
        adjustedScores?.get(i.listing.id) ??
        i.evaluation?.quality_score ??
        null;
      if (score === null) return uiFilters.includeUnscored;
      return score >= uiFilters.scoreMin!;
    });
  }

  return result;
}

// Helpers
function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: `listing-${Math.random().toString(36).slice(2, 8)}`,
    source: "habitat-groupe.be",
    source_url: "https://example.com",
    title: "Test listing",
    description: "Description de test",
    location: "Bruxelles",
    province: "Bruxelles-Capitale",
    price: "600€/mois",
    price_amount: 600,
    listing_type: "offre-location",
    country: null,
    original_language: null,
    contact: null,
    images: [],
    date_published: null,
    date_scraped: "2026-02-23",
    ...overrides,
  };
}

const MOCK_CRITERIA: CriteriaScores = {
  community_size_and_maturity: 5,
  values_alignment: 5,
  common_projects: 5,
  large_hall_biodanza: 5,
  rental_price: 5,
  unit_type: 5,
  parking: 5,
  spiritual_alignment: 5,
  charter_openness: 5,
  community_meals: 5,
  location_brussels: 5,
  near_hospital: 5,
};

function makeEvaluation(
  listingId: string,
  score: number
): Evaluation {
  return {
    listing_id: listingId,
    quality_score: score,
    quality_summary: "Test summary",
    criteria_scores: MOCK_CRITERIA,
    highlights: [],
    concerns: [],
    date_evaluated: "2026-02-23",
  };
}

function makeItem(
  listingOverrides: Partial<Listing> = {},
  score?: number
): ListingWithEval {
  const listing = makeListing(listingOverrides);
  return {
    listing,
    evaluation: score !== undefined ? makeEvaluation(listing.id, score) : null,
    tags: null,
    status: "new",
    notes: "",
  };
}

// Test data
const ITEMS: ListingWithEval[] = [
  makeItem({ id: "1", title: "Habitat avec jardin", province: "Brabant Wallon", listing_type: "offre-location", price_amount: 500 }, 70),
  makeItem({ id: "2", title: "Colocation Bruxelles", province: "Bruxelles-Capitale", listing_type: "offre-location", price_amount: 800 }, 45),
  makeItem({ id: "3", title: "Maison en vente Namur", province: "Namur", listing_type: "offre-vente", price_amount: 1200 }, 60),
  makeItem({ id: "4", title: "Création groupe Hainaut", province: "Hainaut", listing_type: "creation-groupe", price_amount: null }, undefined),
  makeItem({ id: "5", title: "Recherche location Liège", province: "Liège", listing_type: "demande-location", price_amount: 650 }, 30),
  makeItem({ id: "6", title: "Studio pas cher", province: "Brabant Wallon", listing_type: "offre-location", price_amount: 350 }, 55),
  makeItem({ id: "7", title: "Ferme communautaire", province: null, listing_type: null, price_amount: null }, undefined),
];

describe("UI Filtering Logic", () => {
  describe("text search", () => {
    it("filters by title", () => {
      const filters: UIFilterState = { ...DEFAULT_UI_FILTERS, searchText: "jardin" };
      const result = applyUIFilters(ITEMS, filters);
      expect(result).toHaveLength(1);
      expect(result[0].listing.id).toBe("1");
    });

    it("filters by description", () => {
      const items = [
        makeItem({ id: "a", title: "Nothing", description: "Un beau potager communautaire" }),
        makeItem({ id: "b", title: "Also nothing", description: "Pas de jardin" }),
      ];
      const filters: UIFilterState = { ...DEFAULT_UI_FILTERS, searchText: "potager" };
      const result = applyUIFilters(items, filters);
      expect(result).toHaveLength(1);
      expect(result[0].listing.id).toBe("a");
    });

    it("is case-insensitive", () => {
      const filters: UIFilterState = { ...DEFAULT_UI_FILTERS, searchText: "JARDIN" };
      const result = applyUIFilters(ITEMS, filters);
      expect(result).toHaveLength(1);
    });

    it("trims whitespace", () => {
      const filters: UIFilterState = { ...DEFAULT_UI_FILTERS, searchText: "  jardin  " };
      const result = applyUIFilters(ITEMS, filters);
      expect(result).toHaveLength(1);
    });

    it("returns all items when searchText is empty", () => {
      const filters: UIFilterState = { ...DEFAULT_UI_FILTERS, searchText: "" };
      const result = applyUIFilters(ITEMS, filters);
      expect(result).toHaveLength(ITEMS.length);
    });
  });

  describe("province filter", () => {
    it("filters by single province", () => {
      const filters: UIFilterState = { ...DEFAULT_UI_FILTERS, provinces: ["Brabant Wallon"] };
      const result = applyUIFilters(ITEMS, filters);
      expect(result).toHaveLength(2); // items 1 and 6
      expect(result.every((i) => i.listing.province === "Brabant Wallon")).toBe(true);
    });

    it("filters by multiple provinces", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        provinces: ["Brabant Wallon", "Namur"],
      };
      const result = applyUIFilters(ITEMS, filters);
      expect(result).toHaveLength(3); // items 1, 3, 6
    });

    it("excludes items with null province", () => {
      const filters: UIFilterState = { ...DEFAULT_UI_FILTERS, provinces: ["Brabant Wallon"] };
      const result = applyUIFilters(ITEMS, filters);
      expect(result.find((i) => i.listing.id === "7")).toBeUndefined();
    });

    it("returns all when provinces array is empty", () => {
      const filters: UIFilterState = { ...DEFAULT_UI_FILTERS, provinces: [] };
      const result = applyUIFilters(ITEMS, filters);
      expect(result).toHaveLength(ITEMS.length);
    });
  });

  describe("listing type filter", () => {
    it("filters by single type", () => {
      const filters: UIFilterState = { ...DEFAULT_UI_FILTERS, listingTypes: ["offre-vente"] };
      const result = applyUIFilters(ITEMS, filters);
      expect(result).toHaveLength(1);
      expect(result[0].listing.id).toBe("3");
    });

    it("filters by multiple types", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        listingTypes: ["offre-location", "offre-vente"],
      };
      const result = applyUIFilters(ITEMS, filters);
      expect(result).toHaveLength(4); // items 1, 2, 3, 6
    });

    it("excludes items with null listing_type", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        listingTypes: ["offre-location"],
      };
      const result = applyUIFilters(ITEMS, filters);
      expect(result.find((i) => i.listing.id === "7")).toBeUndefined();
    });
  });

  describe("price range filter", () => {
    it("filters by minimum price", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        priceMin: 600,
        includeNullPrice: false,
      };
      const result = applyUIFilters(ITEMS, filters);
      expect(result.every((i) => i.listing.price_amount !== null && i.listing.price_amount >= 600)).toBe(true);
    });

    it("filters by maximum price", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        priceMax: 700,
        includeNullPrice: false,
      };
      const result = applyUIFilters(ITEMS, filters);
      expect(
        result.every(
          (i) =>
            i.listing.price_amount !== null && i.listing.price_amount <= 700
        )
      ).toBe(true);
    });

    it("filters by price range", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        priceMin: 400,
        priceMax: 700,
        includeNullPrice: false,
      };
      const result = applyUIFilters(ITEMS, filters);
      // 500 (item 1) and 650 (item 5) are in range; 350 < 400, 800 > 700, 1200 > 700
      expect(result).toHaveLength(2);
    });

    it("includes null prices by default", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        priceMax: 700,
        includeNullPrice: true,
      };
      const result = applyUIFilters(ITEMS, filters);
      // Should include items with null price (4 and 7) + items with price <= 700 (1, 5, 6)
      const nullPriceItems = result.filter((i) => i.listing.price_amount === null);
      expect(nullPriceItems.length).toBe(2);
    });

    it("excludes null prices when includeNullPrice is false", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        priceMax: 700,
        includeNullPrice: false,
      };
      const result = applyUIFilters(ITEMS, filters);
      const nullPriceItems = result.filter((i) => i.listing.price_amount === null);
      expect(nullPriceItems.length).toBe(0);
    });

    it("no filtering when both min and max are null", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        priceMin: null,
        priceMax: null,
      };
      const result = applyUIFilters(ITEMS, filters);
      expect(result).toHaveLength(ITEMS.length);
    });
  });

  describe("score minimum filter", () => {
    it("filters by minimum score", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        scoreMin: 50,
        includeUnscored: false,
      };
      const result = applyUIFilters(ITEMS, filters);
      // Scores: 70, 45, 60, undefined, 30, 55, undefined
      // >= 50: items 1 (70), 3 (60), 6 (55) = 3 items
      expect(result).toHaveLength(3);
    });

    it("includes unscored items when includeUnscored is true", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        scoreMin: 50,
        includeUnscored: true,
      };
      const result = applyUIFilters(ITEMS, filters);
      // 3 scored items >= 50 + 2 unscored items = 5
      expect(result).toHaveLength(5);
    });

    it("excludes unscored items when includeUnscored is false", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        scoreMin: 50,
        includeUnscored: false,
      };
      const result = applyUIFilters(ITEMS, filters);
      expect(result.every((i) => i.evaluation !== null)).toBe(true);
    });

    it("uses adjustedScores when provided", () => {
      const adjustedScores = new Map<string, number>();
      // Give item 2 (originally score 45) an adjusted score of 80
      adjustedScores.set("2", 80);

      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        scoreMin: 50,
        includeUnscored: false,
      };
      const result = applyUIFilters(ITEMS, filters, adjustedScores);
      // Should now include item 2 (adjusted to 80)
      expect(result.find((i) => i.listing.id === "2")).toBeDefined();
    });

    it("no filtering when scoreMin is null", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        scoreMin: null,
      };
      const result = applyUIFilters(ITEMS, filters);
      expect(result).toHaveLength(ITEMS.length);
    });
  });

  describe("combined filters", () => {
    it("applies multiple filters together", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        provinces: ["Brabant Wallon"],
        listingTypes: ["offre-location"],
        priceMax: 600,
        includeNullPrice: false,
      };
      const result = applyUIFilters(ITEMS, filters);
      // Brabant Wallon + offre-location: items 1 (500) and 6 (350)
      // Price <= 600: both qualify
      expect(result).toHaveLength(2);
    });

    it("can result in empty set with strict filters", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        provinces: ["Namur"],
        listingTypes: ["offre-location"],
      };
      const result = applyUIFilters(ITEMS, filters);
      // Namur has only offre-vente, not offre-location
      expect(result).toHaveLength(0);
    });

    it("search + province filter", () => {
      const filters: UIFilterState = {
        ...DEFAULT_UI_FILTERS,
        searchText: "studio",
        provinces: ["Brabant Wallon"],
      };
      const result = applyUIFilters(ITEMS, filters);
      expect(result).toHaveLength(1);
      expect(result[0].listing.id).toBe("6");
    });
  });
});
