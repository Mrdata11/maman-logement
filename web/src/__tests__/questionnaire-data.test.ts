import { describe, it, expect } from "vitest";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";

describe("QUESTIONNAIRE_STEPS structural integrity", () => {
  it("has at least 5 steps", () => {
    expect(QUESTIONNAIRE_STEPS.length).toBeGreaterThanOrEqual(5);
  });

  it("all steps have unique IDs", () => {
    const ids = QUESTIONNAIRE_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all steps have title and subtitle", () => {
    for (const step of QUESTIONNAIRE_STEPS) {
      expect(step.title).toBeTruthy();
      expect(step.subtitle).toBeTruthy();
    }
  });

  it("all questions within steps have unique IDs (globally)", () => {
    const allIds = QUESTIONNAIRE_STEPS.flatMap((s) =>
      s.questions.map((q) => q.id)
    );
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("all choice questions have at least 2 options", () => {
    for (const step of QUESTIONNAIRE_STEPS) {
      for (const q of step.questions) {
        if (q.type === "single_choice" || q.type === "multi_choice") {
          expect(q.options?.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it("all slider questions have sliderConfig with min, max, step", () => {
    for (const step of QUESTIONNAIRE_STEPS) {
      for (const q of step.questions) {
        if (q.type === "slider") {
          expect(q.sliderConfig).toBeDefined();
          expect(q.sliderConfig!.min).toBeDefined();
          expect(q.sliderConfig!.max).toBeDefined();
          expect(q.sliderConfig!.step).toBeDefined();
          expect(q.sliderConfig!.max).toBeGreaterThan(q.sliderConfig!.min);
        }
      }
    }
  });

  it("all option IDs within a question are unique", () => {
    for (const step of QUESTIONNAIRE_STEPS) {
      for (const q of step.questions) {
        if (q.options) {
          const optIds = q.options.map((o) => o.id);
          expect(new Set(optIds).size).toBe(optIds.length);
        }
      }
    }
  });

  it("all question types are valid", () => {
    const validTypes = ["single_choice", "multi_choice", "open_text", "slider"];
    for (const step of QUESTIONNAIRE_STEPS) {
      for (const q of step.questions) {
        expect(validTypes).toContain(q.type);
      }
    }
  });
});
