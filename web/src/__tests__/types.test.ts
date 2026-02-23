import { describe, it, expect } from "vitest";
import {
  calculateRefinedScore,
  applyRefinementFilters,
  DEFAULT_WEIGHTS,
  DEFAULT_FILTERS,
  DEFAULT_UI_FILTERS,
  LISTING_TYPE_LABELS,
  STATUS_CONFIG,
  RefinementFilters,
  ListingWithEval,
  Listing,
} from "@/lib/types";

// Helper to create a minimal listing
function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "test-1",
    source: "habitat-groupe.be",
    source_url: "https://example.com",
    title: "Habitat groupé à Bruxelles",
    description: "Belle communauté avec jardin partagé",
    location: "Bruxelles",
    province: "Bruxelles-Capitale",
    price: "600€/mois",
    price_amount: 600,
    listing_type: "offre-location",
    country: null,
    original_language: null,
    contact: "test@example.com",
    images: [],
    date_published: null,
    date_scraped: "2026-02-23",
    ...overrides,
  };
}

function makeItem(
  listingOverrides: Partial<Listing> = {},
  evaluation: ListingWithEval["evaluation"] = null
): ListingWithEval {
  return {
    listing: makeListing(listingOverrides),
    evaluation,
    tags: null,
    status: "new",
    notes: "",
  };
}

describe("calculateRefinedScore", () => {
  it("returns the quality score directly (weights are deprecated)", () => {
    const score = calculateRefinedScore(75, DEFAULT_WEIGHTS);
    expect(score).toBe(75);
  });

  it("ignores weights and returns quality score", () => {
    const score = calculateRefinedScore(42, { some_weight: 5.0 });
    expect(score).toBe(42);
  });
});

describe("applyRefinementFilters", () => {
  it("returns true with default (empty) filters", () => {
    const item = makeItem();
    expect(applyRefinementFilters(item, DEFAULT_FILTERS)).toBe(true);
  });

  it("filters by listing_types_include", () => {
    const item = makeItem({ listing_type: "offre-location" });
    const filters: RefinementFilters = {
      ...DEFAULT_FILTERS,
      listing_types_include: ["offre-vente"],
    };
    expect(applyRefinementFilters(item, filters)).toBe(false);

    filters.listing_types_include = ["offre-location"];
    expect(applyRefinementFilters(item, filters)).toBe(true);
  });

  it("filters by listing_types_exclude", () => {
    const item = makeItem({ listing_type: "offre-location" });
    const filters: RefinementFilters = {
      ...DEFAULT_FILTERS,
      listing_types_exclude: ["offre-location"],
    };
    expect(applyRefinementFilters(item, filters)).toBe(false);
  });

  it("filters by locations_include (case-insensitive)", () => {
    const item = makeItem({ location: "Bruxelles", province: "Bruxelles-Capitale" });
    const filters: RefinementFilters = {
      ...DEFAULT_FILTERS,
      locations_include: ["bruxelles"],
    };
    expect(applyRefinementFilters(item, filters)).toBe(true);

    filters.locations_include = ["namur"];
    expect(applyRefinementFilters(item, filters)).toBe(false);
  });

  it("filters by locations_exclude", () => {
    const item = makeItem({ province: "Hainaut" });
    const filters: RefinementFilters = {
      ...DEFAULT_FILTERS,
      locations_exclude: ["hainaut"],
    };
    expect(applyRefinementFilters(item, filters)).toBe(false);
  });

  it("filters by max_price", () => {
    const item = makeItem({ price_amount: 800 });
    const filters: RefinementFilters = {
      ...DEFAULT_FILTERS,
      max_price: 700,
    };
    expect(applyRefinementFilters(item, filters)).toBe(false);

    filters.max_price = 900;
    expect(applyRefinementFilters(item, filters)).toBe(true);
  });

  it("allows null price_amount through max_price filter", () => {
    const item = makeItem({ price_amount: null });
    const filters: RefinementFilters = {
      ...DEFAULT_FILTERS,
      max_price: 700,
    };
    // null price_amount: the condition `listing.price_amount !== null` fails,
    // so the filter doesn't exclude it
    expect(applyRefinementFilters(item, filters)).toBe(true);
  });

  it("filters by min_score", () => {
    const item = makeItem({}, {
      listing_id: "test-1",
      quality_score: 40,
      quality_summary: "",
      highlights: [],
      concerns: [],
      date_evaluated: "2026-02-23",
    });
    const filters: RefinementFilters = {
      ...DEFAULT_FILTERS,
      min_score: 50,
    };
    expect(applyRefinementFilters(item, filters)).toBe(false);

    filters.min_score = 30;
    expect(applyRefinementFilters(item, filters)).toBe(true);
  });

  it("uses adjustedScore over quality_score for min_score", () => {
    const item = makeItem({}, {
      listing_id: "test-1",
      quality_score: 30,
      quality_summary: "",
      highlights: [],
      concerns: [],
      date_evaluated: "2026-02-23",
    });
    const filters: RefinementFilters = {
      ...DEFAULT_FILTERS,
      min_score: 50,
    };
    // adjustedScore = 60 overrides quality_score = 30
    expect(applyRefinementFilters(item, filters, 60)).toBe(true);
    expect(applyRefinementFilters(item, filters, 40)).toBe(false);
  });

  it("filters by keywords_include", () => {
    const item = makeItem({
      title: "Habitat groupé",
      description: "Belle communauté avec jardin",
    });
    const filters: RefinementFilters = {
      ...DEFAULT_FILTERS,
      keywords_include: ["jardin"],
    };
    expect(applyRefinementFilters(item, filters)).toBe(true);

    filters.keywords_include = ["piscine"];
    expect(applyRefinementFilters(item, filters)).toBe(false);
  });

  it("filters by keywords_exclude", () => {
    const item = makeItem({
      title: "Habitat groupé",
      description: "Belle communauté avec jardin",
    });
    const filters: RefinementFilters = {
      ...DEFAULT_FILTERS,
      keywords_exclude: ["jardin"],
    };
    expect(applyRefinementFilters(item, filters)).toBe(false);
  });

  it("handles null listing_type with listing_types_include", () => {
    const item = makeItem({ listing_type: null });
    const filters: RefinementFilters = {
      ...DEFAULT_FILTERS,
      listing_types_include: ["offre-location"],
    };
    expect(applyRefinementFilters(item, filters)).toBe(false);
  });

  it("excludes items with no evaluation when min_score is set", () => {
    const item = makeItem(); // no evaluation
    const filters: RefinementFilters = {
      ...DEFAULT_FILTERS,
      min_score: 30,
    };
    expect(applyRefinementFilters(item, filters)).toBe(false);
  });
});

describe("DEFAULT_UI_FILTERS", () => {
  it("has sensible defaults", () => {
    expect(DEFAULT_UI_FILTERS.searchText).toBe("");
    expect(DEFAULT_UI_FILTERS.provinces).toEqual([]);
    expect(DEFAULT_UI_FILTERS.listingTypes).toEqual([]);
    expect(DEFAULT_UI_FILTERS.priceMin).toBeNull();
    expect(DEFAULT_UI_FILTERS.priceMax).toBeNull();
    expect(DEFAULT_UI_FILTERS.includeNullPrice).toBe(true);
    expect(DEFAULT_UI_FILTERS.scoreMin).toBeNull();
    expect(DEFAULT_UI_FILTERS.includeUnscored).toBe(true);
  });
});

describe("LISTING_TYPE_LABELS", () => {
  it("maps all known listing types to French labels", () => {
    expect(LISTING_TYPE_LABELS["offre-location"]).toBe("Location");
    expect(LISTING_TYPE_LABELS["offre-vente"]).toBe("Vente");
    expect(LISTING_TYPE_LABELS["demande-location"]).toBe("Recherche location");
    expect(LISTING_TYPE_LABELS["demande-vente"]).toBe("Recherche achat");
    expect(LISTING_TYPE_LABELS["creation-groupe"]).toBe("Création de groupe");
    expect(LISTING_TYPE_LABELS["habitat-leger"]).toBe("Habitat léger");
    expect(LISTING_TYPE_LABELS["divers"]).toBe("Divers");
    expect(LISTING_TYPE_LABELS["autre"]).toBe("Autre");
  });

  it("has at least 8 entries", () => {
    expect(Object.keys(LISTING_TYPE_LABELS).length).toBeGreaterThanOrEqual(8);
  });
});

describe("STATUS_CONFIG", () => {
  it("covers all listing statuses", () => {
    const statuses = [
      "new",
      "favorite",
      "contacted",
      "visit_planned",
      "in_discussion",
      "rejected",
      "archived",
    ];
    for (const status of statuses) {
      expect(STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]).toBeDefined();
      expect(STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label).toBeTruthy();
      expect(STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].color).toBeTruthy();
    }
  });
});
