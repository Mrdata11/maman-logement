import { StepDefinition } from "./questionnaire-types";

export const QUESTIONNAIRE_STEPS: StepDefinition[] = [
  {
    id: "motivations",
    title: "Tes motivations",
    subtitle:
      "Avant de parcourir les annonces, prenons quelques minutes pour bien comprendre ce que tu recherches. Il n'y a pas de mauvaise reponse -- chaque personne a son propre ideal de vie en communaute.",
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
          { id: "economique", label: "Avantage economique, partager les couts" },
          { id: "ecologique", label: "Un mode de vie plus ecologique" },
          { id: "securite", label: "Se sentir en securite, entouree" },
        ],
      },
      {
        id: "health_proximity",
        text: "Y a-t-il une raison de sante ou de proximite avec un etablissement de soins qui compte pour toi ?",
        type: "single_choice",
        options: [
          {
            id: "essential",
            label: "Oui, c'est essentiel -- je dois etre proche d'un hopital ou centre de soins",
          },
          { id: "preferable", label: "Ce serait un plus, mais pas indispensable" },
          { id: "not_needed", label: "Non, ce n'est pas un critere" },
        ],
      },
      {
        id: "dream_vision",
        text: "En quelques mots, qu'est-ce que tu imagines quand tu penses a ta vie ideale en habitat groupe ?",
        type: "open_text",
        placeholder:
          "Par exemple : un endroit calme avec un jardin, des voisins bienveillants, pouvoir cuisiner ensemble le dimanche...",
      },
    ],
  },
  {
    id: "budget_logement",
    title: "Ton budget et ton logement",
    subtitle: "Parlons concret. Quel type de logement et quel budget as-tu en tete ?",
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
          { id: "small_house", label: "Petite maison / rez-de-chaussee" },
          { id: "flexible", label: "Flexible, je m'adapterai" },
        ],
      },
      {
        id: "tenure_type",
        text: "Location ou achat ?",
        type: "single_choice",
        options: [
          { id: "rental", label: "Location -- je prefere louer" },
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
          { id: "bicycle", label: "Velo uniquement" },
          { id: "none", label: "Pas de vehicule" },
        ],
      },
      {
        id: "practical_needs",
        text: "Y a-t-il d'autres besoins pratiques importants ?",
        type: "multi_choice",
        options: [
          { id: "ground_floor", label: "Rez-de-chaussee / accessibilite PMR" },
          { id: "elevator", label: "Ascenseur si en etage" },
          { id: "garden_access", label: "Acces a un jardin ou espace vert" },
          { id: "storage", label: "Cave ou rangement" },
          { id: "pet_friendly", label: "Animaux acceptes" },
          { id: "furnished", label: "Meuble de preference" },
        ],
      },
    ],
  },
  {
    id: "localisation",
    title: "Ou vivre ?",
    subtitle:
      "La Belgique est petite mais diverse. Ou aimerais-tu t'installer ?",
    questions: [
      {
        id: "preferred_regions",
        text: "Quelles regions t'interessent ?",
        type: "multi_choice",
        options: [
          { id: "bruxelles", label: "Bruxelles-Capitale" },
          { id: "brabant_wallon", label: "Brabant wallon" },
          { id: "hainaut", label: "Hainaut" },
          { id: "liege", label: "Province de Liege" },
          { id: "namur", label: "Province de Namur" },
          { id: "luxembourg", label: "Province de Luxembourg" },
          { id: "brabant_flamand", label: "Brabant flamand" },
          { id: "flandre", label: "Autre province flamande" },
          { id: "no_preference", label: "Pas de preference" },
        ],
      },
      {
        id: "brussels_proximity",
        text: "Est-ce important d'etre proche de Bruxelles ?",
        type: "single_choice",
        options: [
          { id: "in_brussels", label: "Je veux etre dans Bruxelles meme" },
          { id: "very_close", label: "Oui, dans les 30 minutes" },
          { id: "somewhat", label: "30 a 45 minutes, c'est bien" },
          { id: "not_important", label: "Non, la distance n'est pas un probleme" },
        ],
      },
      {
        id: "setting_preference",
        text: "Quel cadre de vie preferes-tu ?",
        type: "single_choice",
        options: [
          { id: "rural", label: "Campagne, nature, calme" },
          { id: "semi_rural", label: "Village ou petite ville" },
          { id: "urban_green", label: "Ville avec acces a la nature" },
          { id: "urban", label: "En ville, proche des commodites" },
          { id: "no_preference", label: "Peu importe" },
        ],
      },
      {
        id: "locations_avoid",
        text: "Y a-t-il des lieux ou regions que tu veux absolument eviter ?",
        type: "open_text",
        placeholder:
          "Par exemple : trop isole sans transports, Flandre (barriere de la langue)...",
      },
    ],
  },
  {
    id: "communaute",
    title: "La vie en communaute",
    subtitle:
      "L'habitat groupe, c'est avant tout des gens qui vivent ensemble. Parlons de la communaute ideale pour toi.",
    questions: [
      {
        id: "community_size",
        text: "Quelle taille de communaute t'attire ?",
        type: "single_choice",
        options: [
          { id: "small", label: "Petite (4 a 8 menages) -- intime et familial" },
          {
            id: "medium",
            label: "Moyenne (8 a 15 menages) -- on connait tout le monde",
          },
          { id: "large", label: "Grande (15+ menages) -- plus de diversite" },
          { id: "no_preference", label: "Pas de preference" },
        ],
      },
      {
        id: "project_maturity",
        text: "Preferes-tu rejoindre un projet existant et mature, ou participer a une creation ?",
        type: "single_choice",
        options: [
          { id: "existing_mature", label: "Un projet existant, deja en place" },
          { id: "existing_recent", label: "Un projet recent mais deja habite" },
          {
            id: "creation",
            label: "Participer a la creation d'un nouveau projet",
          },
          { id: "any", label: "Les deux m'interessent" },
        ],
      },
      {
        id: "community_activities",
        text: "Quelles activites communautaires t'interessent ?",
        type: "multi_choice",
        options: [
          { id: "shared_meals", label: "Repas partages reguliers" },
          { id: "garden", label: "Potager ou jardin collectif" },
          { id: "workshops", label: "Ateliers creatifs ou manuels" },
          { id: "cultural", label: "Sorties ou activites culturelles" },
          { id: "spiritual", label: "Cercles spirituels, meditation, biodanza" },
          { id: "grocery_coop", label: "Epicerie ou achats groupes" },
          { id: "diy", label: "Bricolage et entraide pratique" },
          { id: "none", label: "Je prefere garder mon independance" },
        ],
      },
      {
        id: "involvement_level",
        text: "A quel point veux-tu participer a la vie communautaire ?",
        type: "slider",
        sliderConfig: {
          min: 1,
          max: 5,
          step: 1,
          defaultValue: 3,
          labels: {
            1: "Chacun chez soi",
            3: "Quand j'en ai envie",
            5: "Tres impliquee",
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
          { id: "nice", label: "De temps en temps, c'est agreable" },
          { id: "occasional", label: "Occasionnellement, pour des fetes" },
          { id: "not_interested", label: "Non, je prefere manger chez moi" },
        ],
      },
    ],
  },
  {
    id: "valeurs",
    title: "Valeurs et etat d'esprit",
    subtitle:
      "Chaque habitat groupe a sa personnalite. Quelles valeurs et quel etat d'esprit recherches-tu ?",
    questions: [
      {
        id: "core_values",
        text: "Quelles valeurs sont essentielles pour toi dans un habitat groupe ?",
        type: "multi_choice",
        maxSelections: 4,
        options: [
          { id: "respect", label: "Respect et bienveillance" },
          { id: "solidarity", label: "Solidarite et entraide" },
          { id: "ecology", label: "Ecologie et sobriete" },
          { id: "openness", label: "Ouverture au monde et diversite" },
          { id: "autonomy", label: "Autonomie et liberte individuelle" },
          { id: "spirituality", label: "Spiritualite et developpement personnel" },
          { id: "democracy", label: "Decisions democratiques et transparence" },
          { id: "creativity", label: "Creativite et expression artistique" },
        ],
      },
      {
        id: "spiritual_importance",
        text: "L'aspect spirituel ou bien-etre (biodanza, meditation, yoga...) est-il important ?",
        type: "single_choice",
        options: [
          {
            id: "central",
            label: "C'est central dans ma vie -- je cherche un lieu qui le partage",
          },
          {
            id: "welcome",
            label: "J'apprecie mais ce n'est pas un critere de choix",
          },
          { id: "neutral", label: "Je respecte mais ce n'est pas pour moi" },
          {
            id: "prefer_without",
            label: "Je prefere un cadre laique, sans orientation spirituelle",
          },
        ],
      },
      {
        id: "charter_preference",
        text: "Le projet a-t-il besoin d'avoir une charte ou des regles ecrites ?",
        type: "single_choice",
        options: [
          { id: "essential", label: "Oui, une charte claire est rassurante" },
          { id: "good_idea", label: "C'est une bonne idee mais pas obligatoire" },
          {
            id: "informal",
            label: "Je prefere des regles informelles, basees sur la confiance",
          },
          { id: "no_opinion", label: "Je n'ai pas d'avis" },
        ],
      },
      {
        id: "top_priority_text",
        text: "Que dirais-tu que tu recherches par-dessus tout dans ta future communaute ?",
        type: "open_text",
        placeholder: "En une phrase, ce qui compte le plus pour toi...",
      },
    ],
  },
  {
    id: "dealbreakers",
    title: "Ce que tu ne veux surtout pas",
    subtitle:
      "Pour finir, il est aussi important de savoir ce que tu veux eviter. Cela nous aidera a ecarter les annonces qui ne te correspondent vraiment pas.",
    questions: [
      {
        id: "dealbreakers",
        text: "Y a-t-il des situations que tu veux absolument eviter ?",
        type: "multi_choice",
        options: [
          { id: "too_isolated", label: "Trop isole, loin de tout" },
          { id: "too_expensive", label: "Budget depasse, couts caches" },
          { id: "no_privacy", label: "Pas assez d'intimite" },
          { id: "too_rigid", label: "Regles trop strictes" },
          { id: "too_chaotic", label: "Pas assez de structure" },
          { id: "no_accessibility", label: "Pas accessible PMR" },
          { id: "pet_ban", label: "Interdiction d'animaux" },
          {
            id: "language_barrier",
            label: "Communaute dans une langue que je ne parle pas",
          },
          { id: "religious_pressure", label: "Pression religieuse ou ideologique" },
        ],
      },
      {
        id: "other_dealbreakers",
        text: "Y a-t-il autre chose qui serait un motif de refus pour toi ?",
        type: "open_text",
        placeholder:
          "Par exemple : pas de fumeurs, pas de travaux en cours, pas de vis-a-vis...",
      },
      {
        id: "single_most_important",
        text: "Quel est le critere le plus important parmi tout ce que tu as dit ?",
        type: "single_choice",
        options: [
          { id: "budget", label: "Le budget" },
          { id: "location", label: "L'emplacement" },
          { id: "community_spirit", label: "L'esprit communautaire" },
          { id: "values", label: "Les valeurs partagees" },
          { id: "practical", label: "Le logement lui-meme" },
          { id: "health", label: "La proximite des soins" },
        ],
      },
    ],
  },
];
