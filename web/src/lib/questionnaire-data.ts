import { StepDefinition } from "./questionnaire-types";

export const QUESTIONNAIRE_STEPS: StepDefinition[] = [
  {
    id: "motivations",
    title: "Tes motivations",
    subtitle:
      "Avant de parcourir les annonces, prenons quelques minutes pour bien comprendre ce que tu recherches. Il n'y a pas de mauvaise réponse -- chaque personne a son propre idéal de vie en communauté.",
    questions: [
      {
        id: "motivation",
        text: "Qu'est-ce qui t'attire le plus dans l'habitat groupe ?",
        type: "multi_choice",
        maxSelections: 3,
        options: [
          { id: "romper_isolement", label: "Rompre l'isolement, retrouver du lien" },
          { id: "entraide", label: "L'entraide au quotidien" },
          { id: "projets_communs", label: "Partager des projets communs" },
          { id: "valeurs", label: "Vivre selon ses valeurs" },
          { id: "economique", label: "Avantage économique, partager les coûts" },
          { id: "ecologique", label: "Un mode de vie plus écologique" },
          { id: "securite", label: "Se sentir en sécurité, entourée" },
        ],
      },
      {
        id: "health_proximity",
        text: "Y a-t-il une raison de santé ou de proximité avec un établissement de soins qui compte pour toi ?",
        type: "single_choice",
        options: [
          {
            id: "essential",
            label: "Oui, c'est essentiel -- je dois être proche d'un hôpital ou centre de soins",
          },
          { id: "preferable", label: "Ce serait un plus, mais pas indispensable" },
          { id: "not_needed", label: "Non, ce n'est pas un critère" },
        ],
      },
      {
        id: "dream_vision",
        text: "En quelques mots, qu'est-ce que tu imagines quand tu penses à ta vie idéale en habitat groupé ?",
        type: "open_text",
        placeholder:
          "Par exemple : un endroit calme avec un jardin, des voisins bienveillants, pouvoir cuisiner ensemble le dimanche...",
      },
    ],
  },
  {
    id: "valeurs",
    title: "Valeurs et état d'esprit",
    subtitle:
      "Chaque habitat groupé a sa personnalité. Quelles valeurs et quel état d'esprit recherches-tu ?",
    questions: [
      {
        id: "core_values",
        text: "Quelles valeurs sont essentielles pour toi dans un habitat groupe ?",
        type: "multi_choice",
        maxSelections: 4,
        options: [
          { id: "respect", label: "Respect et bienveillance" },
          { id: "solidarity", label: "Solidarité et entraide" },
          { id: "ecology", label: "Écologie et sobriété" },
          { id: "openness", label: "Ouverture au monde et diversité" },
          { id: "autonomy", label: "Autonomie et liberté individuelle" },
          { id: "spirituality", label: "Spiritualité et développement personnel" },
          { id: "democracy", label: "Décisions démocratiques et transparence" },
          { id: "creativity", label: "Créativité et expression artistique" },
        ],
      },
      {
        id: "spiritual_importance",
        text: "L'aspect spirituel ou bien-être (biodanza, méditation, yoga...) est-il important ?",
        type: "single_choice",
        options: [
          {
            id: "central",
            label: "C'est central dans ma vie -- je cherche un lieu qui le partage",
          },
          {
            id: "welcome",
            label: "J'apprécie mais ce n'est pas un critère de choix",
          },
          { id: "neutral", label: "Je respecte mais ce n'est pas pour moi" },
          {
            id: "prefer_without",
            label: "Je préfère un cadre laïque, sans orientation spirituelle",
          },
        ],
      },
      {
        id: "charter_preference",
        text: "Le projet a-t-il besoin d'avoir une charte ou des règles écrites ?",
        type: "single_choice",
        options: [
          { id: "essential", label: "Oui, une charte claire est rassurante" },
          { id: "good_idea", label: "C'est une bonne idée mais pas obligatoire" },
          {
            id: "informal",
            label: "Je préfère des règles informelles, basées sur la confiance",
          },
          { id: "no_opinion", label: "Je n'ai pas d'avis" },
        ],
      },
      {
        id: "top_priority_text",
        text: "Que dirais-tu que tu recherches par-dessus tout dans ta future communauté ?",
        type: "open_text",
        placeholder: "En une phrase, ce qui compte le plus pour toi...",
      },
    ],
  },
  {
    id: "communaute",
    title: "La vie en communauté",
    subtitle:
      "L'habitat groupé, c'est avant tout des gens qui vivent ensemble. Parlons de la communauté idéale pour toi.",
    questions: [
      {
        id: "community_size",
        text: "Quelle taille de communauté t'attire ?",
        type: "single_choice",
        options: [
          { id: "small", label: "Petite (4 à 8 ménages) -- intime et familial" },
          {
            id: "medium",
            label: "Moyenne (8 à 15 ménages) -- on connaît tout le monde",
          },
          { id: "large", label: "Grande (15+ ménages) -- plus de diversité" },
          { id: "no_preference", label: "Pas de préférence" },
        ],
      },
      {
        id: "project_maturity",
        text: "Préfères-tu rejoindre un projet existant et mature, ou participer à une création ?",
        type: "single_choice",
        options: [
          { id: "existing_mature", label: "Un projet existant, déjà en place" },
          { id: "existing_recent", label: "Un projet récent mais déjà habité" },
          {
            id: "creation",
            label: "Participer à la création d'un nouveau projet",
          },
          { id: "any", label: "Les deux m'intéressent" },
        ],
      },
      {
        id: "community_activities",
        text: "Quelles activités communautaires t'intéressent ?",
        type: "multi_choice",
        options: [
          { id: "shared_meals", label: "Repas partagés réguliers" },
          { id: "garden", label: "Potager ou jardin collectif" },
          { id: "workshops", label: "Ateliers créatifs ou manuels" },
          { id: "cultural", label: "Sorties ou activités culturelles" },
          { id: "spiritual", label: "Cercles spirituels, méditation, biodanza" },
          { id: "grocery_coop", label: "Épicerie ou achats groupés" },
          { id: "diy", label: "Bricolage et entraide pratique" },
          { id: "none", label: "Je préfère garder mon indépendance" },
        ],
      },
      {
        id: "involvement_level",
        text: "À quel point veux-tu participer à la vie communautaire ?",
        type: "slider",
        sliderConfig: {
          min: 1,
          max: 5,
          step: 1,
          defaultValue: 3,
          labels: {
            1: "Chacun chez soi",
            3: "Quand j'en ai envie",
            5: "Très impliquée",
          },
        },
      },
      {
        id: "shared_meals_importance",
        text: "Les repas en commun, c'est important pour toi ?",
        type: "single_choice",
        options: [
          {
            id: "essential",
            label: "Oui, au moins plusieurs fois par semaine",
          },
          { id: "nice", label: "De temps en temps, c'est agréable" },
          { id: "occasional", label: "Occasionnellement, pour des fêtes" },
          { id: "not_interested", label: "Non, je préfère manger chez moi" },
        ],
      },
    ],
  },
  {
    id: "localisation",
    title: "Où vivre ?",
    subtitle:
      "La Belgique est petite mais diverse. Où aimerais-tu t'installer ?",
    questions: [
      {
        id: "preferred_regions",
        text: "Quelles régions t'intéressent ?",
        type: "multi_choice",
        options: [
          { id: "bruxelles", label: "Bruxelles-Capitale" },
          { id: "brabant_wallon", label: "Brabant wallon" },
          { id: "hainaut", label: "Hainaut" },
          { id: "liege", label: "Province de Liège" },
          { id: "namur", label: "Province de Namur" },
          { id: "luxembourg", label: "Province de Luxembourg" },
          { id: "brabant_flamand", label: "Brabant flamand" },
          { id: "flandre", label: "Autre province flamande" },
          { id: "no_preference", label: "Pas de préférence" },
        ],
      },
      {
        id: "brussels_proximity",
        text: "Est-ce important d'être proche de Bruxelles ?",
        type: "single_choice",
        options: [
          { id: "in_brussels", label: "Je veux être dans Bruxelles même" },
          { id: "very_close", label: "Oui, dans les 30 minutes" },
          { id: "somewhat", label: "30 à 45 minutes, c'est bien" },
          { id: "not_important", label: "Non, la distance n'est pas un problème" },
        ],
      },
      {
        id: "setting_preference",
        text: "Quel cadre de vie préfères-tu ?",
        type: "single_choice",
        options: [
          { id: "rural", label: "Campagne, nature, calme" },
          { id: "semi_rural", label: "Village ou petite ville" },
          { id: "urban_green", label: "Ville avec accès à la nature" },
          { id: "urban", label: "En ville, proche des commodités" },
          { id: "no_preference", label: "Peu importe" },
        ],
      },
      {
        id: "locations_avoid",
        text: "Y a-t-il des lieux ou régions que tu veux absolument éviter ?",
        type: "open_text",
        placeholder:
          "Par exemple : trop isolé sans transports, Flandre (barrière de la langue)...",
      },
    ],
  },
  {
    id: "budget_logement",
    title: "Ton budget et ton logement",
    subtitle: "Parlons concret. Quel type de logement et quel budget as-tu en tête ?",
    questions: [
      {
        id: "budget_max",
        text: "Quel est ton budget mensuel maximum, charges comprises ?",
        type: "slider",
        sliderConfig: {
          min: 300,
          max: 1500,
          step: 50,
          defaultValue: 700,
          unit: "\u20ac",
          labels: {
            300: "300\u20ac",
            500: "Modeste",
            750: "Moyen",
            1000: "Confortable",
            1500: "1500\u20ac",
          },
        },
      },
      {
        id: "unit_type",
        text: "De quel type de logement as-tu besoin ?",
        type: "single_choice",
        options: [
          { id: "studio", label: "Studio" },
          { id: "1_bedroom", label: "Appartement 1 chambre" },
          { id: "2_bedrooms", label: "Appartement 2 chambres" },
          { id: "small_house", label: "Petite maison / rez-de-chaussée" },
          { id: "flexible", label: "Flexible, je m'adapterai" },
        ],
      },
      {
        id: "tenure_type",
        text: "Location ou achat ?",
        type: "single_choice",
        options: [
          { id: "rental", label: "Location -- je préfère louer" },
          { id: "purchase", label: "Achat -- je souhaite acheter" },
          { id: "either", label: "Les deux me conviennent" },
        ],
      },
      {
        id: "parking_needs",
        text: "As-tu besoin d'un parking ?",
        type: "multi_choice",
        options: [
          { id: "car", label: "Voiture" },
          { id: "motorcycle", label: "Moto / scooter" },
          { id: "bicycle", label: "Vélo uniquement" },
          { id: "none", label: "Pas de véhicule" },
        ],
      },
      {
        id: "practical_needs",
        text: "Y a-t-il d'autres besoins pratiques importants ?",
        type: "multi_choice",
        options: [
          { id: "ground_floor", label: "Rez-de-chaussée / accessibilité PMR" },
          { id: "elevator", label: "Ascenseur si en étage" },
          { id: "garden_access", label: "Accès à un jardin ou espace vert" },
          { id: "storage", label: "Cave ou rangement" },
          { id: "pet_friendly", label: "Animaux acceptés" },
          { id: "furnished", label: "Meublé de préférence" },
        ],
      },
    ],
  },
  {
    id: "dealbreakers",
    title: "Ce que tu ne veux surtout pas",
    subtitle:
      "Pour finir, il est aussi important de savoir ce que tu veux éviter. Cela nous aidera à écarter les annonces qui ne te correspondent vraiment pas.",
    questions: [
      {
        id: "dealbreakers",
        text: "Y a-t-il des situations que tu veux absolument éviter ?",
        type: "multi_choice",
        options: [
          { id: "too_isolated", label: "Trop isolé, loin de tout" },
          { id: "too_expensive", label: "Budget dépassé, coûts cachés" },
          { id: "no_privacy", label: "Pas assez d'intimité" },
          { id: "too_rigid", label: "Règles trop strictes" },
          { id: "too_chaotic", label: "Pas assez de structure" },
          { id: "no_accessibility", label: "Pas accessible PMR" },
          { id: "pet_ban", label: "Interdiction d'animaux" },
          {
            id: "language_barrier",
            label: "Communauté dans une langue que je ne parle pas",
          },
          { id: "religious_pressure", label: "Pression religieuse ou idéologique" },
        ],
      },
      {
        id: "other_dealbreakers",
        text: "Y a-t-il autre chose qui serait un motif de refus pour toi ?",
        type: "open_text",
        placeholder:
          "Par exemple : pas de fumeurs, pas de travaux en cours, pas de vis-à-vis...",
      },
      {
        id: "single_most_important",
        text: "Quel est le critère le plus important parmi tout ce que tu as dit ?",
        type: "single_choice",
        options: [
          { id: "budget", label: "Le budget" },
          { id: "location", label: "L'emplacement" },
          { id: "community_spirit", label: "L'esprit communautaire" },
          { id: "values", label: "Les valeurs partagées" },
          { id: "practical", label: "Le logement lui-même" },
          { id: "health", label: "La proximité des soins" },
        ],
      },
    ],
  },
];
