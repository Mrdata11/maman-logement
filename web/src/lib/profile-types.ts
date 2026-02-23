import { QuestionnaireAnswers } from "./questionnaire-types";

export interface ProfileIntroduction {
  whoAreYou: string;
  whyGroupHousing: string;
  communityValues: string;
  whatYouBring: string;
  idealDay: string;
  additionalInfo: string;
}

export type Gender = "homme" | "femme" | "non-binaire" | "autre" | null;

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  location: string | null;
  contact_email: string;
  age: number | null;
  gender: Gender;
  sexuality: string | null;
  questionnaire_answers: QuestionnaireAnswers;
  introduction: ProfileIntroduction;
  ai_summary: string | null;
  ai_tags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileCard {
  id: string;
  display_name: string;
  avatar_url: string | null;
  location: string | null;
  age: number | null;
  gender: Gender;
  sexuality: string | null;
  ai_summary: string | null;
  ai_tags: string[];
  budget_range: string | null;
  preferred_regions: string[];
  community_size: string | null;
  core_values: string[];
  intro_snippet?: string;
  created_at: string;
}

export const EMPTY_INTRODUCTION: ProfileIntroduction = {
  whoAreYou: "",
  whyGroupHousing: "",
  communityValues: "",
  whatYouBring: "",
  idealDay: "",
  additionalInfo: "",
};

export const PROFILE_VOICE_QUESTIONS: {
  id: keyof ProfileIntroduction;
  question: string;
  placeholder: string;
  helpText: string;
}[] = [
  {
    id: "whoAreYou",
    question: "Qui es-tu ? D'o\u00f9 viens-tu ?",
    placeholder:
      "Par exemple : Je m'appelle Marie, j'ai 62 ans, je vis \u00e0 Ixelles depuis 20 ans...",
    helpText:
      "Pr\u00e9sente-toi bri\u00e8vement : ton pr\u00e9nom, ton \u00e2ge, d'o\u00f9 tu viens, ce que tu fais...",
  },
  {
    id: "whyGroupHousing",
    question: "Pourquoi l'habitat group\u00e9 t'attire ?",
    placeholder: "Ce qui me motive, c'est...",
    helpText:
      "Qu'est-ce qui t'a amen\u00e9(e) \u00e0 chercher un habitat group\u00e9 ? Un \u00e9v\u00e9nement, un d\u00e9sir de longue date ?",
  },
  {
    id: "communityValues",
    question:
      "Qu'est-ce qui est important pour toi dans une communaut\u00e9 ?",
    placeholder: "L'entraide, le respect, la convivialit\u00e9...",
    helpText:
      "Les valeurs, les qualit\u00e9s humaines, l'ambiance que tu recherches.",
  },
  {
    id: "whatYouBring",
    question: "Qu'est-ce que tu apportes \u00e0 une communaut\u00e9 ?",
    placeholder:
      "Je suis bon(ne) cuisinier(\u00e8re), j'adore jardiner, je suis \u00e0 l'\u00e9coute...",
    helpText: "Tes talents, tes passions, ce que tu aimes partager.",
  },
  {
    id: "idealDay",
    question: "D\u00e9cris ta journ\u00e9e id\u00e9ale en habitat group\u00e9.",
    placeholder:
      "Le matin, je prends mon caf\u00e9 dans le jardin commun...",
    helpText: "Imagine une journ\u00e9e typique dans ton futur lieu de vie.",
  },
  {
    id: "additionalInfo",
    question: "Y a-t-il autre chose que tu voudrais ajouter ?",
    placeholder: "Ce que je n'ai pas encore dit...",
    helpText:
      "Tout ce qui pourrait aider quelqu'un \u00e0 mieux te conna\u00eetre.",
  },
];

// Helper: extract display data from questionnaire answers for ProfileCard
export function deriveProfileCardData(answers: QuestionnaireAnswers): {
  budget_range: string | null;
  preferred_regions: string[];
  community_size: string | null;
  core_values: string[];
} {
  const budgetMax = answers.budget_max;
  const budget_range =
    typeof budgetMax === "number" ? `max ${budgetMax}\u20ac/mois` : null;

  const regions = Array.isArray(answers.preferred_regions)
    ? (answers.preferred_regions as string[])
    : [];

  const regionLabels: Record<string, string> = {
    bruxelles: "Bruxelles",
    brabant_wallon: "Brabant Wallon",
    brabant_flamand: "Brabant Flamand",
    hainaut: "Hainaut",
    liege: "Li\u00e8ge",
    namur: "Namur",
    luxembourg: "Luxembourg",
    flandre: "Flandre",
    no_preference: "Pas de pr\u00e9f\u00e9rence",
  };
  const preferred_regions = regions
    .filter((r) => r !== "no_preference")
    .map((r) => regionLabels[r] || r);

  const sizeMap: Record<string, string> = {
    small: "Petit (4-8)",
    medium: "Moyen (8-15)",
    large: "Grand (15+)",
    no_preference: "Pas de pr\u00e9f\u00e9rence",
  };
  const community_size =
    typeof answers.community_size === "string"
      ? sizeMap[answers.community_size] || null
      : null;

  const valueLabels: Record<string, string> = {
    respect: "Respect",
    solidarity: "Solidarit\u00e9",
    ecology: "Ecologie",
    openness: "Ouverture",
    autonomy: "Autonomie",
    spirituality: "Spiritualit\u00e9",
    democracy: "D\u00e9mocratie",
    creativity: "Cr\u00e9ativit\u00e9",
  };
  const valuesRaw = Array.isArray(answers.core_values)
    ? (answers.core_values as string[])
    : [];
  const core_values = valuesRaw.map((v) => valueLabels[v] || v);

  return { budget_range, preferred_regions, community_size, core_values };
}
