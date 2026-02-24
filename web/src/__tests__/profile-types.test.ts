import { describe, it, expect } from "vitest";
import {
  deriveProfileCardData,
  isIntroAnswer,
  getIntroText,
  getIntroAudioUrl,
  EMPTY_INTRODUCTION,
  INTRO_DISPLAY_TITLES,
} from "@/lib/profile-types";

describe("deriveProfileCardData", () => {
  it("returns null budget_range when no budget_max answer", () => {
    const result = deriveProfileCardData({});
    expect(result.budget_range).toBeNull();
  });

  it("returns formatted budget_range string when budget_max is numeric", () => {
    const result = deriveProfileCardData({ budget_max: 800 });
    expect(result.budget_range).toBe("max 800€/mois");
  });

  it("returns empty preferred_regions for no answers", () => {
    const result = deriveProfileCardData({});
    expect(result.preferred_regions).toEqual([]);
  });

  it("maps region IDs to French labels", () => {
    const result = deriveProfileCardData({
      preferred_regions: ["bruxelles", "namur"],
    });
    expect(result.preferred_regions).toContain("Bruxelles");
    expect(result.preferred_regions).toContain("Namur");
  });

  it('filters out "no_preference" from preferred_regions', () => {
    const result = deriveProfileCardData({
      preferred_regions: ["bruxelles", "no_preference"],
    });
    expect(result.preferred_regions).toEqual(["Bruxelles"]);
  });

  it("maps community_size strings to French labels", () => {
    expect(deriveProfileCardData({ community_size: "small" }).community_size).toBe(
      "Petit (4-8)"
    );
    expect(deriveProfileCardData({ community_size: "medium" }).community_size).toBe(
      "Moyen (8-15)"
    );
    expect(deriveProfileCardData({ community_size: "large" }).community_size).toBe(
      "Grand (15+)"
    );
  });

  it("returns null community_size for unknown values", () => {
    expect(
      deriveProfileCardData({ community_size: "gigantic" }).community_size
    ).toBeNull();
  });

  it("maps core_values IDs to French labels", () => {
    const result = deriveProfileCardData({
      core_values: ["respect", "ecology", "solidarity"],
    });
    expect(result.core_values).toContain("Respect");
    expect(result.core_values).toContain("Ecologie");
    expect(result.core_values).toContain("Solidarité");
  });

  it("handles empty questionnaire answers", () => {
    const result = deriveProfileCardData({});
    expect(result.budget_range).toBeNull();
    expect(result.preferred_regions).toEqual([]);
    expect(result.community_size).toBeNull();
    expect(result.core_values).toEqual([]);
  });
});

describe("isIntroAnswer", () => {
  it("returns true for IntroAnswer object", () => {
    expect(
      isIntroAnswer({
        audio_url: "https://audio.com/file.mp3",
        audio_path: "/uploads/file.mp3",
        transcript: "Hello",
        duration_seconds: 10,
      })
    ).toBe(true);
  });

  it("returns false for string", () => {
    expect(isIntroAnswer("text")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isIntroAnswer(null)).toBe(false);
  });
});

describe("getIntroText", () => {
  it("returns transcript from IntroAnswer", () => {
    expect(
      getIntroText({
        audio_url: "https://x.com/a.mp3",
        audio_path: "/a.mp3",
        transcript: "Bonjour",
        duration_seconds: 5,
      })
    ).toBe("Bonjour");
  });

  it("returns string value directly", () => {
    expect(getIntroText("Je suis Marie.")).toBe("Je suis Marie.");
  });

  it("returns empty string for null", () => {
    expect(getIntroText(null)).toBe("");
  });
});

describe("getIntroAudioUrl", () => {
  it("returns audio_url from IntroAnswer", () => {
    expect(
      getIntroAudioUrl({
        audio_url: "https://x.com/a.mp3",
        audio_path: "/a.mp3",
        transcript: "Hello",
        duration_seconds: 5,
      })
    ).toBe("https://x.com/a.mp3");
  });

  it("returns null for string value", () => {
    expect(getIntroAudioUrl("text")).toBeNull();
  });

  it("returns null for null", () => {
    expect(getIntroAudioUrl(null)).toBeNull();
  });
});

describe("EMPTY_INTRODUCTION", () => {
  it("all fields are null", () => {
    const keys = Object.keys(EMPTY_INTRODUCTION) as (keyof typeof EMPTY_INTRODUCTION)[];
    for (const key of keys) {
      expect(EMPTY_INTRODUCTION[key]).toBeNull();
    }
  });
});

describe("INTRO_DISPLAY_TITLES", () => {
  it("has entries for all 6 ProfileIntroduction keys", () => {
    const expectedKeys = [
      "whoAreYou",
      "whyGroupHousing",
      "communityValues",
      "whatYouBring",
      "idealDay",
      "additionalInfo",
    ];
    for (const key of expectedKeys) {
      expect(INTRO_DISPLAY_TITLES[key as keyof typeof INTRO_DISPLAY_TITLES]).toBeDefined();
    }
  });

  it("each entry has title and icon", () => {
    const entries = Object.values(INTRO_DISPLAY_TITLES);
    for (const entry of entries) {
      expect(entry.title).toBeTruthy();
      expect(entry.icon).toBeTruthy();
    }
  });
});
