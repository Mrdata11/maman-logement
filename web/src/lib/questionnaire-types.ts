export type QuestionType = "single_choice" | "multi_choice" | "open_text" | "slider";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  labels: Record<number, string>;
  unit?: string;
}

export interface QuestionDefinition {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  placeholder?: string;
  sliderConfig?: SliderConfig;
  maxSelections?: number;
  required?: boolean;
}

export interface StepDefinition {
  id: string;
  title: string;
  subtitle: string;
  questions: QuestionDefinition[];
}

export type QuestionnaireAnswers = Record<string, string | string[] | number>;

export interface QuestionnaireState {
  answers: QuestionnaireAnswers;
  currentStep: number;
  completedAt: string | null;
  lastEditedAt: string;
  version: number;
  inputMethod?: "manual" | "voice";
}

export const QUESTIONNAIRE_STORAGE_KEY = "questionnaire_state";

export const INITIAL_QUESTIONNAIRE_STATE: QuestionnaireState = {
  answers: {},
  currentStep: 0,
  completedAt: null,
  lastEditedAt: new Date().toISOString(),
  version: 1,
};
