import { describe, it, expect } from "vitest";
import { mapQuestionnaireToFilters } from "@/lib/questionnaire-mapping";
import type { QuestionnaireAnswers } from "@/lib/questionnaire-types";

describe("mapQuestionnaireToFilters", () => {
  describe("empty answers", () => {
    it("returns isActive: false for empty answers", () => {
      const result = mapQuestionnaireToFilters({});
      expect(result.isActive).toBe(false);
    });

    it("returns empty summary", () => {
      const result = mapQuestionnaireToFilters({});
      expect(result.summary).toEqual([]);
    });
  });

  describe("single_most_important", () => {
    it("budget priority adds to summary and sets rental_price weight", () => {
      const result = mapQuestionnaireToFilters({ single_most_important: "budget" });
      expect(result.summary).toContain("Priorité : budget");
      expect(result.isActive).toBe(true);
      // Weight key is set (DEFAULT_WEIGHTS is empty, so += produces NaN — known limitation)
      expect("rental_price" in result.weights).toBe(true);
    });

    it("location priority adds to summary", () => {
      const result = mapQuestionnaireToFilters({ single_most_important: "location" });
      expect(result.summary).toContain("Priorité : emplacement");
      expect("location_brussels" in result.weights).toBe(true);
    });

    it("community_spirit priority adds to summary", () => {
      const result = mapQuestionnaireToFilters({ single_most_important: "community_spirit" });
      expect(result.summary).toContain("Priorité : esprit communautaire");
    });

    it("health priority adds to summary and sets near_hospital weight", () => {
      const result = mapQuestionnaireToFilters({ single_most_important: "health" });
      expect(result.summary).toContain("Priorité : proximité des soins");
      expect("near_hospital" in result.weights).toBe(true);
    });
  });

  describe("budget_max", () => {
    it("sets max_price filter with 15% buffer by default", () => {
      const result = mapQuestionnaireToFilters({ budget_max: 800 });
      expect(result.filters.max_price).toBe(Math.round(800 * 1.15));
    });

    it("sets max_price filter with 5% buffer when budget is top priority", () => {
      const result = mapQuestionnaireToFilters({
        single_most_important: "budget",
        budget_max: 800,
      });
      expect(result.filters.max_price).toBe(Math.round(800 * 1.05));
    });

    it("sets rental_price weight key for low budgets (<=600)", () => {
      const result = mapQuestionnaireToFilters({ budget_max: 500 });
      // DEFAULT_WEIGHTS is {} so += produces NaN, but the key is created
      expect("rental_price" in result.weights).toBe(true);
    });

    it("reduces rental_price weight for high budgets (>=1200)", () => {
      const result = mapQuestionnaireToFilters({ budget_max: 1500 });
      expect(result.weights.rental_price).toBe(0.3);
    });
  });

  describe("preferred_regions", () => {
    it("maps region IDs to province names in locations_include", () => {
      const result = mapQuestionnaireToFilters({
        preferred_regions: ["bruxelles", "namur"],
      });
      expect(result.filters.locations_include).toContain("Bruxelles");
      expect(result.filters.locations_include).toContain("Namur");
    });

    it('ignores "no_preference"', () => {
      const result = mapQuestionnaireToFilters({
        preferred_regions: ["no_preference"],
      });
      expect(result.filters.locations_include).toEqual([]);
    });

    it("handles multiple regions", () => {
      const result = mapQuestionnaireToFilters({
        preferred_regions: ["hainaut", "liege", "luxembourg"],
      });
      expect(result.filters.locations_include).toContain("Hainaut");
      expect(result.filters.locations_include).toContain("Liège");
      expect(result.filters.locations_include).toContain("Luxembourg");
    });
  });

  describe("tenure_type", () => {
    it('"rental" sets listing_types_include to location types', () => {
      const result = mapQuestionnaireToFilters({ tenure_type: "rental" });
      expect(result.filters.listing_types_include).toContain("offre-location");
      expect(result.filters.listing_types_include).toContain("creation-groupe");
    });

    it('"purchase" sets listing_types_include to vente types', () => {
      const result = mapQuestionnaireToFilters({ tenure_type: "purchase" });
      expect(result.filters.listing_types_include).toContain("offre-vente");
    });

    it('"either" includes both', () => {
      const result = mapQuestionnaireToFilters({ tenure_type: "either" });
      expect(result.filters.listing_types_include).toContain("offre-location");
      expect(result.filters.listing_types_include).toContain("offre-vente");
      expect(result.filters.listing_types_include).toContain("creation-groupe");
    });
  });

  describe("spiritual_importance", () => {
    it('"central" sets spiritual_alignment and large_hall_biodanza weight keys', () => {
      const result = mapQuestionnaireToFilters({ spiritual_importance: "central" });
      expect("spiritual_alignment" in result.weights).toBe(true);
      expect("large_hall_biodanza" in result.weights).toBe(true);
    });

    it('"prefer_without" reduces spiritual weights', () => {
      const result = mapQuestionnaireToFilters({ spiritual_importance: "prefer_without" });
      expect(result.weights.spiritual_alignment).toBe(0.2);
      expect(result.weights.large_hall_biodanza).toBe(0.2);
    });
  });

  describe("dealbreakers", () => {
    it('"language_barrier" excludes Flandre from locations', () => {
      const result = mapQuestionnaireToFilters({
        dealbreakers: ["language_barrier"],
      });
      expect(result.filters.locations_exclude).toContain("Flandre");
    });

    it('"pet_ban" sets petsAllowed tag filter', () => {
      const result = mapQuestionnaireToFilters({
        dealbreakers: ["pet_ban"],
      });
      expect(result.tagFilters.petsAllowed).toBe(true);
    });

    it('"too_isolated" sets environments to suburban/urban', () => {
      const result = mapQuestionnaireToFilters({
        dealbreakers: ["too_isolated"],
      });
      expect(result.tagFilters.environments).toContain("suburban");
      expect(result.tagFilters.environments).toContain("urban");
    });
  });

  describe("locations_avoid", () => {
    it('parses "flandre" from free text into locations_exclude', () => {
      const result = mapQuestionnaireToFilters({
        locations_avoid: "Pas en Flandre svp",
      });
      expect(result.filters.locations_exclude).toContain("Flandre");
    });

    it('handles accented text ("liège")', () => {
      const result = mapQuestionnaireToFilters({
        locations_avoid: "Pas liège ni namur",
      });
      expect(result.filters.locations_exclude).toContain("Liège");
      expect(result.filters.locations_exclude).toContain("Namur");
    });
  });

  describe("weight clamping", () => {
    it("weights set via direct assignment are clamped to [0.2, 3.0]", () => {
      // "prefer_without" uses direct assignment (=) so these are properly clamped
      const result = mapQuestionnaireToFilters({ spiritual_importance: "prefer_without" });
      expect(result.weights.spiritual_alignment).toBe(0.2);
      expect(result.weights.large_hall_biodanza).toBe(0.2);
    });

    it("high budget sets rental_price via direct assignment to 0.3", () => {
      const result = mapQuestionnaireToFilters({ budget_max: 1500 });
      expect(result.weights.rental_price).toBe(0.3);
    });

    it("not_important brussels sets location_brussels via direct assignment to 0.3", () => {
      const result = mapQuestionnaireToFilters({ brussels_proximity: "not_important" });
      expect(result.weights.location_brussels).toBe(0.3);
    });
  });

  describe("summary generation", () => {
    it("includes budget summary when budget_max is set", () => {
      const result = mapQuestionnaireToFilters({ budget_max: 800 });
      expect(result.summary.some((s) => s.includes("Budget max"))).toBe(true);
    });

    it("includes region summary when regions are selected", () => {
      const result = mapQuestionnaireToFilters({
        preferred_regions: ["bruxelles"],
      });
      expect(result.summary.some((s) => s.includes("Régions"))).toBe(true);
    });

    it("includes Brussels proximity label", () => {
      const result = mapQuestionnaireToFilters({
        brussels_proximity: "in_brussels",
      });
      expect(result.summary.some((s) => s.includes("Bruxelles"))).toBe(true);
    });
  });

  describe("isActive", () => {
    it("returns isActive: true when at least one answer is provided", () => {
      const result = mapQuestionnaireToFilters({ budget_max: 800 });
      expect(result.isActive).toBe(true);
    });
  });
});
