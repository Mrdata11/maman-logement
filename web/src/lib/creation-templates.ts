import { QuestionnaireAnswers } from "./questionnaire-types";

export interface CreationTemplate {
  id: string;
  label: string;
  description: string;
  icon: "tree" | "building" | "heart";
  answers: QuestionnaireAnswers;
}

export const CREATION_TEMPLATES: CreationTemplate[] = [
  {
    id: "ecovillage",
    label: "\u00c9covillage rural",
    description: "Vie en nature, autonomie, \u00e9cologie",
    icon: "tree",
    answers: {
      project_stage: "idea",
      setting_type: "rural",
      housing_type: "mixed",
      planned_units: 10,
      unit_types: ["small_house", "2_bedrooms", "3_bedrooms"],
      financial_model: "cooperative",
      target_audience: ["intergenerational", "families"],
      community_values: ["ecology", "solidarity", "autonomy", "creativity"],
      governance: "sociocracy",
      shared_spaces: ["garden", "kitchen", "common_room", "workshop"],
      meals_together: "weekly",
      pets_allowed: "yes",
      accessibility: "planned",
    },
  },
  {
    id: "cooperative_urbaine",
    label: "Coop\u00e9rative urbaine",
    description: "Proximit\u00e9, partage, accessibilit\u00e9",
    icon: "building",
    answers: {
      project_stage: "searching",
      setting_type: "urban_green",
      housing_type: "renovation",
      planned_units: 12,
      unit_types: ["studio", "1_bedroom", "2_bedrooms"],
      financial_model: "cooperative",
      target_audience: ["all"],
      community_values: ["solidarity", "democracy", "openness", "ecology"],
      governance: "consensus",
      shared_spaces: ["garden", "common_room", "laundry", "coworking"],
      meals_together: "occasional",
      required_contribution: "investment",
      pets_allowed: "to_discuss",
      accessibility: "yes",
    },
  },
  {
    id: "intergenerationnel",
    label: "Colocation solidaire",
    description: "Interg\u00e9n\u00e9rationnel, entraide, lien",
    icon: "heart",
    answers: {
      project_stage: "idea",
      setting_type: "semi_rural",
      housing_type: "existing",
      planned_units: 6,
      unit_types: ["1_bedroom", "2_bedrooms", "flexible"],
      financial_model: "rental",
      target_audience: ["intergenerational", "seniors", "young_adults"],
      community_values: ["respect", "solidarity", "openness", "democracy"],
      governance: "informal",
      shared_spaces: ["garden", "kitchen", "common_room"],
      meals_together: "weekly",
      required_contribution: "rent_only",
      pets_allowed: "yes",
      accessibility: "partial",
    },
  },
];
