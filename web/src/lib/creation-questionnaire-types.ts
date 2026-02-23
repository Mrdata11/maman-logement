import { QuestionnaireAnswers, StepDefinition } from "./questionnaire-types";

export interface CreationProjectState {
  answers: QuestionnaireAnswers;
  currentStep: number;
  completedAt: string | null;
  lastEditedAt: string;
  version: number;
  inputMethod?: "manual" | "voice" | "text";
}

export const CREATION_STORAGE_KEY = "creation_project_state";

export const INITIAL_CREATION_STATE: CreationProjectState = {
  answers: {},
  currentStep: 0,
  completedAt: null,
  lastEditedAt: new Date().toISOString(),
  version: 1,
};

// Re-export the shared types for convenience
export type { StepDefinition, QuestionnaireAnswers };
