import { describe, it, expect } from "vitest";
import {
  getQAString,
  getQAStringArray,
  DEFAULT_PROFILE_UI_FILTERS,
  DEFAULT_PROFILE_TAG_FILTERS,
  PROFILE_LABELS,
} from "@/lib/profile-filter-types";

describe("getQAString", () => {
  it("returns string value for string answer", () => {
    expect(getQAString({ name: "Marie" }, "name")).toBe("Marie");
  });

  it("returns null for array answer", () => {
    expect(getQAString({ regions: ["a", "b"] }, "regions")).toBeNull();
  });

  it("returns null for number answer", () => {
    expect(getQAString({ budget: 800 }, "budget")).toBeNull();
  });

  it("returns null for undefined qa", () => {
    expect(getQAString(undefined, "anything")).toBeNull();
  });

  it("returns null for missing key", () => {
    expect(getQAString({ name: "Marie" }, "missing_key")).toBeNull();
  });
});

describe("getQAStringArray", () => {
  it("returns array for array answer", () => {
    expect(getQAStringArray({ values: ["a", "b"] }, "values")).toEqual(["a", "b"]);
  });

  it("returns empty array for string answer", () => {
    expect(getQAStringArray({ name: "Marie" }, "name")).toEqual([]);
  });

  it("returns empty array for undefined qa", () => {
    expect(getQAStringArray(undefined, "anything")).toEqual([]);
  });
});

describe("DEFAULT_PROFILE_UI_FILTERS", () => {
  it("has empty arrays and null values", () => {
    expect(DEFAULT_PROFILE_UI_FILTERS.regions).toEqual([]);
    expect(DEFAULT_PROFILE_UI_FILTERS.genders).toEqual([]);
    expect(DEFAULT_PROFILE_UI_FILTERS.ageMin).toBeNull();
    expect(DEFAULT_PROFILE_UI_FILTERS.ageMax).toBeNull();
    expect(DEFAULT_PROFILE_UI_FILTERS.communitySize).toEqual([]);
  });
});

describe("DEFAULT_PROFILE_TAG_FILTERS", () => {
  it("has all empty arrays", () => {
    const values = Object.values(DEFAULT_PROFILE_TAG_FILTERS);
    for (const val of values) {
      expect(val).toEqual([]);
    }
  });
});

describe("PROFILE_LABELS", () => {
  it("has entries for all expected filter categories", () => {
    const expectedKeys = [
      "genders",
      "regions",
      "communitySize",
      "coreValues",
      "settingType",
      "targetAudience",
      "governance",
      "sharedSpaces",
      "mealsTogether",
      "financialModel",
      "unitTypes",
      "petsAllowed",
      "accessibility",
      "projectStage",
      "housingType",
    ];
    for (const key of expectedKeys) {
      expect(PROFILE_LABELS[key as keyof typeof PROFILE_LABELS]).toBeDefined();
      expect(Object.keys(PROFILE_LABELS[key as keyof typeof PROFILE_LABELS]).length).toBeGreaterThan(0);
    }
  });
});
