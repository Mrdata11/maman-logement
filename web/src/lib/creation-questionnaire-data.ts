import { StepDefinition } from "./questionnaire-types";

export const CREATION_STEPS: StepDefinition[] = [
  {
    id: "projet",
    title: "Votre projet",
    subtitle:
      "Parlez-nous de votre projet d\u2019habitat group\u00e9. M\u00eame s\u2019il n\u2019en est qu\u2019\u00e0 ses d\u00e9buts, chaque d\u00e9tail compte.",
    questions: [
      {
        id: "project_stage",
        text: "O\u00f9 en est votre projet ?",
        type: "single_choice",
        options: [
          { id: "idea", label: "C\u2019est encore une id\u00e9e" },
          { id: "searching", label: "On cherche un terrain ou un b\u00e2timent" },
          { id: "land_found", label: "Terrain ou b\u00e2timent trouv\u00e9" },
          { id: "construction", label: "En travaux ou en construction" },
          { id: "existing", label: "Projet existant qui recrute de nouveaux membres" },
        ],
      },
      {
        id: "project_name",
        text: "Quel est le nom de votre projet ? (optionnel)",
        type: "open_text",
        placeholder: "Par exemple : La Ferme des Colibris, L\u2019\u00c9co-hameau du Val...",
      },
      {
        id: "project_vision",
        text: "D\u00e9crivez votre vision en quelques phrases",
        type: "open_text",
        placeholder:
          "Qu\u2019est-ce qui vous motive ? Quel type de vie imaginez-vous ? Qu\u2019est-ce qui rend votre projet unique ?",
      },
    ],
  },
  {
    id: "lieu",
    title: "Le lieu",
    subtitle:
      "O\u00f9 votre projet prend-il ou prendra-t-il vie ?",
    questions: [
      {
        id: "project_region",
        text: "Dans quelle(s) r\u00e9gion(s) se situe ou se situera le projet ?",
        type: "multi_choice",
        options: [
          { id: "bruxelles", label: "Bruxelles-Capitale" },
          { id: "brabant_wallon", label: "Brabant wallon" },
          { id: "hainaut", label: "Hainaut" },
          { id: "liege", label: "Province de Li\u00e8ge" },
          { id: "namur", label: "Province de Namur" },
          { id: "luxembourg", label: "Province de Luxembourg" },
          { id: "brabant_flamand", label: "Brabant flamand" },
          { id: "flandre", label: "Autre province flamande" },
          { id: "not_decided", label: "Pas encore d\u00e9cid\u00e9" },
        ],
      },
      {
        id: "setting_type",
        text: "Quel cadre pour votre projet ?",
        type: "single_choice",
        options: [
          { id: "rural", label: "Campagne, pleine nature" },
          { id: "semi_rural", label: "Village ou petite ville" },
          { id: "urban_green", label: "Ville avec acc\u00e8s \u00e0 la nature" },
          { id: "urban", label: "En ville, proche des commodit\u00e9s" },
          { id: "not_decided", label: "Pas encore d\u00e9cid\u00e9" },
        ],
      },
      {
        id: "land_status",
        text: "Avez-vous d\u00e9j\u00e0 trouv\u00e9 un terrain ou un b\u00e2timent ?",
        type: "single_choice",
        options: [
          { id: "yes", label: "Oui, c\u2019est trouv\u00e9" },
          { id: "searching", label: "On est en recherche active" },
          { id: "not_yet", label: "Pas encore, on d\u00e9marre" },
        ],
      },
    ],
  },
  {
    id: "logement",
    title: "Le logement",
    subtitle:
      "Parlons du concret : quel type de logements pr\u00e9voyez-vous ?",
    questions: [
      {
        id: "housing_type",
        text: "Quel type de projet immobilier ?",
        type: "single_choice",
        options: [
          { id: "renovation", label: "R\u00e9novation d\u2019un b\u00e2timent existant" },
          { id: "new_build", label: "Construction neuve" },
          { id: "existing", label: "B\u00e2timent existant \u00e0 am\u00e9nager" },
          { id: "mixed", label: "Mixte (neuf + r\u00e9novation)" },
          { id: "not_decided", label: "Pas encore d\u00e9fini" },
        ],
      },
      {
        id: "planned_units",
        text: "Combien de logements pr\u00e9voyez-vous ?",
        type: "slider",
        sliderConfig: {
          min: 2,
          max: 30,
          step: 1,
          defaultValue: 8,
          labels: {
            2: "2",
            8: "8",
            15: "15",
            30: "30",
          },
        },
      },
      {
        id: "unit_types",
        text: "Quels types de logements seront propos\u00e9s ?",
        type: "multi_choice",
        options: [
          { id: "studio", label: "Studios" },
          { id: "1_bedroom", label: "Appartements 1 chambre" },
          { id: "2_bedrooms", label: "Appartements 2 chambres" },
          { id: "3_bedrooms", label: "Appartements 3+ chambres" },
          { id: "small_house", label: "Petites maisons" },
          { id: "flexible", label: "Flexible, \u00e0 d\u00e9finir" },
        ],
      },
      {
        id: "financial_model",
        text: "Quel mod\u00e8le financier ?",
        type: "single_choice",
        options: [
          { id: "rental", label: "Location" },
          { id: "purchase", label: "Achat individuel" },
          { id: "cooperative", label: "Coop\u00e9rative" },
          { id: "mixed", label: "Mixte (location + achat)" },
          { id: "not_decided", label: "Pas encore d\u00e9fini" },
        ],
      },
      {
        id: "price_range",
        text: "Fourchette de prix indicative (optionnel)",
        type: "open_text",
        placeholder:
          "Par exemple : loyers entre 500\u20ac et 800\u20ac/mois, parts coop\u00e9ratives \u00e0 partir de 20 000\u20ac...",
      },
    ],
  },
  {
    id: "communaute",
    title: "La communaut\u00e9",
    subtitle:
      "L\u2019habitat group\u00e9, c\u2019est avant tout un projet humain. Quelle communaut\u00e9 souhaitez-vous cr\u00e9er ?",
    questions: [
      {
        id: "target_audience",
        text: "Quel public visez-vous ?",
        type: "multi_choice",
        options: [
          { id: "families", label: "Familles avec enfants" },
          { id: "seniors", label: "Seniors" },
          { id: "young_adults", label: "Jeunes adultes" },
          { id: "intergenerational", label: "Interg\u00e9n\u00e9rationnel" },
          { id: "all", label: "Tout public" },
        ],
      },
      {
        id: "community_values",
        text: "Quelles valeurs portez-vous ?",
        type: "multi_choice",
        maxSelections: 4,
        options: [
          { id: "respect", label: "Respect et bienveillance" },
          { id: "solidarity", label: "Solidarit\u00e9 et entraide" },
          { id: "ecology", label: "\u00c9cologie et sobri\u00e9t\u00e9" },
          { id: "openness", label: "Ouverture au monde et diversit\u00e9" },
          { id: "autonomy", label: "Autonomie et libert\u00e9 individuelle" },
          { id: "spirituality", label: "Spiritualit\u00e9 et d\u00e9veloppement personnel" },
          { id: "democracy", label: "D\u00e9cisions d\u00e9mocratiques et transparence" },
          { id: "creativity", label: "Cr\u00e9ativit\u00e9 et expression artistique" },
        ],
      },
      {
        id: "governance",
        text: "Quel mode de gouvernance pr\u00e9voyez-vous ?",
        type: "single_choice",
        options: [
          { id: "consensus", label: "Consensus" },
          { id: "sociocracy", label: "Sociocratie" },
          { id: "association", label: "Association avec votes" },
          { id: "informal", label: "Informel, bas\u00e9 sur la confiance" },
          { id: "not_decided", label: "Pas encore d\u00e9fini" },
        ],
      },
      {
        id: "shared_spaces",
        text: "Quels espaces partag\u00e9s pr\u00e9voyez-vous ?",
        type: "multi_choice",
        options: [
          { id: "garden", label: "Jardin ou potager" },
          { id: "kitchen", label: "Cuisine commune" },
          { id: "common_room", label: "Salle commune" },
          { id: "workshop", label: "Atelier / bricolage" },
          { id: "laundry", label: "Buanderie partag\u00e9e" },
          { id: "coworking", label: "Espace coworking" },
          { id: "playground", label: "Aire de jeux" },
          { id: "other", label: "Autre" },
        ],
      },
      {
        id: "meals_together",
        text: "Pr\u00e9voyez-vous des repas partag\u00e9s ?",
        type: "single_choice",
        options: [
          { id: "daily", label: "Quotidiennement" },
          { id: "weekly", label: "Une \u00e0 deux fois par semaine" },
          { id: "occasional", label: "Occasionnellement, pour les f\u00eates" },
          { id: "none", label: "Non, chacun chez soi" },
          { id: "to_decide", label: "\u00c0 d\u00e9cider ensemble" },
        ],
      },
    ],
  },
  {
    id: "recherche",
    title: "Qui cherchez-vous ?",
    subtitle:
      "D\u00e9crivez le type de personnes que vous aimeriez accueillir dans votre projet.",
    questions: [
      {
        id: "looking_for",
        text: "Quel type de personnes recherchez-vous ?",
        type: "open_text",
        placeholder:
          "Par exemple : des personnes engag\u00e9es, ouvertes d\u2019esprit, pr\u00eates \u00e0 s\u2019investir dans le collectif...",
      },
      {
        id: "required_contribution",
        text: "Quelle contribution financi\u00e8re est attendue ?",
        type: "single_choice",
        options: [
          { id: "investment", label: "Investissement requis (achat de parts, apport)" },
          { id: "rent_only", label: "Loyer uniquement" },
          { id: "to_define", label: "\u00c0 d\u00e9finir ensemble" },
        ],
      },
      {
        id: "pets_allowed",
        text: "Les animaux sont-ils accept\u00e9s ?",
        type: "single_choice",
        options: [
          { id: "yes", label: "Oui" },
          { id: "no", label: "Non" },
          { id: "to_discuss", label: "\u00c0 discuter" },
        ],
      },
      {
        id: "accessibility",
        text: "Le projet est-il accessible PMR ?",
        type: "single_choice",
        options: [
          { id: "yes", label: "Oui, enti\u00e8rement" },
          { id: "partial", label: "En partie" },
          { id: "no", label: "Non" },
          { id: "planned", label: "Pr\u00e9vu dans le projet" },
        ],
      },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    subtitle:
      "Comment les personnes int\u00e9ress\u00e9es peuvent-elles vous contacter ?",
    questions: [
      {
        id: "contact_name",
        text: "Nom ou pseudo de contact",
        type: "open_text",
        placeholder: "Votre pr\u00e9nom ou le nom du collectif",
      },
      {
        id: "contact_email",
        text: "Adresse email",
        type: "open_text",
        placeholder: "contact@monprojet.be",
      },
      {
        id: "contact_phone",
        text: "T\u00e9l\u00e9phone (optionnel)",
        type: "open_text",
        placeholder: "+32 ...",
      },
      {
        id: "website",
        text: "Site web ou page Facebook (optionnel)",
        type: "open_text",
        placeholder: "https://...",
      },
    ],
  },
];
