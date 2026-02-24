import { describe, it, expect } from "vitest";
import {
  DEFAULT_SCREENING_QUESTIONS,
  VERIFICATION_PROFILE_QUESTIONS,
  VERIFICATION_PROJECT_QUESTIONS,
  SESSION_STATUS_CONFIG,
} from "@/lib/screening/types";

describe("DEFAULT_SCREENING_QUESTIONS", () => {
  it("has at least 4 questions", () => {
    expect(DEFAULT_SCREENING_QUESTIONS.length).toBeGreaterThanOrEqual(4);
  });

  it("all questions have unique IDs", () => {
    const ids = DEFAULT_SCREENING_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("questions are ordered sequentially (0, 1, 2...)", () => {
    DEFAULT_SCREENING_QUESTIONS.forEach((q, i) => {
      expect(q.order).toBe(i);
    });
  });

  it("all questions have text", () => {
    for (const q of DEFAULT_SCREENING_QUESTIONS) {
      expect(q.text.length).toBeGreaterThan(0);
    }
  });
});

describe("VERIFICATION_PROFILE_QUESTIONS", () => {
  it("has at least 4 questions", () => {
    expect(VERIFICATION_PROFILE_QUESTIONS.length).toBeGreaterThanOrEqual(4);
  });

  it("all questions have unique IDs", () => {
    const ids = VERIFICATION_PROFILE_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("VERIFICATION_PROJECT_QUESTIONS", () => {
  it("has at least 4 questions", () => {
    expect(VERIFICATION_PROJECT_QUESTIONS.length).toBeGreaterThanOrEqual(4);
  });

  it("all questions have unique IDs", () => {
    const ids = VERIFICATION_PROJECT_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("SESSION_STATUS_CONFIG", () => {
  it("covers all 4 statuses", () => {
    const expected = ["pending", "in_progress", "completed", "failed"];
    for (const status of expected) {
      expect(SESSION_STATUS_CONFIG[status as keyof typeof SESSION_STATUS_CONFIG]).toBeDefined();
    }
  });

  it("each status has label and color", () => {
    for (const config of Object.values(SESSION_STATUS_CONFIG)) {
      expect(config.label).toBeTruthy();
      expect(config.color).toBeTruthy();
    }
  });
});
