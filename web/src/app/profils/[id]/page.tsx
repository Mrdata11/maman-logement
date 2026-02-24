import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";
import { Profile } from "@/lib/profile-types";
import { ProfileDetail } from "@/components/ProfileDetail";

const DEMO_PROFILES: Record<string, Profile> = {
  "demo-1": {
    id: "demo-1",
    user_id: "demo",
    display_name: "Marie",
    avatar_url: null,
    location: "Ixelles, Bruxelles",
    contact_email: "marie.exemple@gmail.com",
    age: 62,
    gender: "femme",
    sexuality: null,
    questionnaire_answers: {
      budget_max: 700,
      preferred_regions: ["bruxelles", "brabant_wallon"],
      community_size: "medium",
      core_values: ["solidarity", "spirituality", "ecology"],
      motivation: ["social_link", "share_values", "aging_well"],
      setting_preference: "urban_nature",
      community_activities: ["shared_meals", "garden", "spiritual"],
      shared_meals_importance: "essential",
      involvement_level: 4,
    },
    introduction: {
      whoAreYou: "Je m'appelle Marie, j'ai 62 ans et je vis à Ixelles depuis plus de 20 ans. Ancienne enseignante de français, je suis maintenant retraitée et je profite de mon temps pour me consacrer à mes passions : le jardinage, la biodanza et la lecture.",
      whyGroupHousing: "Après le départ de mes enfants, ma grande maison est devenue trop vide. Je ne veux pas vieillir seule. L'idée de partager mon quotidien avec d'autres personnes bienveillantes me porte depuis des années. J'ai découvert l'habitat groupé lors d'un stage de biodanza et ça a été une évidence.",
      communityValues: "La bienveillance avant tout. J'ai besoin d'un espace où on s'écoute, où on se respecte, où on peut être soi-même. La dimension spirituelle est importante pour moi, pas dans un sens religieux, mais dans le sens d'une connexion profonde avec les autres et avec la nature.",
      whatYouBring: "Je suis une cuisinière passionnée, j'adore préparer de grands repas pour tout le monde. J'ai aussi la main verte et je pourrais m'occuper du potager. Et surtout, je suis à l'écoute, j'aime prendre soin des gens autour de moi.",
      idealDay: "Le matin, je prends mon café dans le jardin commun en discutant avec les voisins. En fin de matinée, je m'occupe du potager. L'après-midi, un atelier biodanza ou une balade. Le soir, un repas partagé avec ceux qui veulent, dans une ambiance détendue et joyeuse.",
      additionalInfo: "J'ai un chat, Filou, qui fait partie de la famille ! J'espère trouver un lieu qui accepte les animaux. Je suis aussi ouverte à l'intergénérationnel, je trouve que la présence d'enfants apporte beaucoup de vie.",
    },
    ai_summary: "Marie, 62 ans, ancienne enseignante, cherche un habitat groupé chaleureux près de Bruxelles. Passionnée de jardinage et de biodanza, elle rêve d'un lieu où le partage et la bienveillance sont au coeur du quotidien.",
    ai_tags: ["Près de Bruxelles", "Jardin partagé", "Biodanza", "Spiritualité", "Budget modeste"],
    photos: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585128903994-9788298932a4?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=600&h=400&fit=crop",
    ],
    is_published: true,
    is_verified: false,
    verified_at: null,
    verification_session_id: null,
    created_at: "2026-02-20T10:00:00Z",
    updated_at: "2026-02-20T10:00:00Z",
  },
  "demo-2": {
    id: "demo-2",
    user_id: "demo",
    display_name: "Jean-Pierre",
    avatar_url: null,
    location: "Namur",
    contact_email: "jp.exemple@gmail.com",
    age: 68,
    gender: "homme",
    sexuality: null,
    questionnaire_answers: {
      budget_max: 600,
      preferred_regions: ["namur", "luxembourg"],
      community_size: "small",
      core_values: ["ecology", "autonomy", "respect"],
      motivation: ["ecology", "share_resources", "aging_well"],
      setting_preference: "semi_rural",
      community_activities: ["shared_meals", "garden", "workshops"],
      shared_meals_importance: "essential",
      involvement_level: 5,
    },
    introduction: {
      whoAreYou: "Je suis Jean-Pierre, 68 ans, retraité depuis 3 ans. J'ai travaillé toute ma vie comme menuisier à Namur. Je vis seul depuis le décès de ma femme il y a 5 ans, et mes enfants vivent à l'étranger.",
      whyGroupHousing: "Je ne veux pas finir en maison de repos. J'ai encore plein d'énergie et de choses à partager. L'habitat groupé, c'est pour moi la solution idéale : garder mon autonomie tout en étant entouré.",
      communityValues: "Le respect mutuel et l'autonomie de chacun. Je veux pouvoir avoir mes moments de solitude quand j'en ai besoin, mais aussi profiter de la vie commune. L'écologie concrète me tient à coeur : potager, compost, entraide.",
      whatYouBring: "40 ans de menuiserie, ça peut servir ! Je peux réparer à peu près tout. Je fais aussi d'excellentes confitures et je suis un lève-tôt, idéal pour nourrir les poules le matin.",
      idealDay: "Debout à 6h, café tranquille, un tour au poulailler. Matinée dans mon atelier bois. Repas de midi avec la communauté. Après-midi au potager ou lecture. Soirée jeux de société ou calme chez moi.",
      additionalInfo: "Je cherche quelque chose d'assez petit, je n'ai pas besoin de beaucoup d'espace. Un studio ou un petit appartement me suffit. Par contre, j'ai besoin d'un atelier ou d'un garage pour ma menuiserie.",
    },
    ai_summary: "Jean-Pierre, retraité dynamique de 68 ans, cherche un écolieu où il pourrait mettre à profit ses compétences en menuiserie. Il souhaite un cadre semi-rural avec un potager collectif et des repas partagés.",
    ai_tags: ["Semi-rural", "Potager", "Menuiserie", "Repas partagés", "Intergénérationnel"],
    photos: [
      "https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1464146072230-91cabc968266?w=600&h=400&fit=crop",
    ],
    is_published: true,
    is_verified: false,
    verified_at: null,
    verification_session_id: null,
    created_at: "2026-02-18T14:30:00Z",
    updated_at: "2026-02-18T14:30:00Z",
  },
  "demo-3": {
    id: "demo-3",
    user_id: "demo",
    display_name: "Sofia",
    avatar_url: null,
    location: "Liège",
    contact_email: "sofia.exemple@gmail.com",
    age: 45,
    gender: "femme",
    sexuality: "bisexuelle",
    questionnaire_answers: {
      budget_max: 850,
      preferred_regions: ["liege", "bruxelles"],
      community_size: "medium",
      core_values: ["creativity", "openness", "solidarity"],
      motivation: ["social_link", "children_environment", "share_values"],
      setting_preference: "urban_nature",
      community_activities: ["workshops", "cultural", "shared_meals"],
      shared_meals_importance: "nice_to_have",
      involvement_level: 3,
    },
    introduction: {
      whoAreYou: "Je suis Sofia, 45 ans, artiste plasticienne et mère de Noa (12 ans) et Lila (8 ans). On vit à Liège dans un appartement qui devient trop petit et trop isolé.",
      whyGroupHousing: "Elever mes enfants seule, c'est épuisant. Je rêve d'un lieu où ils seraient entourés d'adultes bienveillants, où on pourrait s'entraider au quotidien. Et pour moi, être entourée d'autres créatifs serait une source d'inspiration.",
      communityValues: "L'ouverture d'esprit et le respect des différences. Je viens d'une famille multiculturelle et c'est important pour moi que mes enfants grandissent dans un environnement divers. La créativité et l'expression artistique aussi.",
      whatYouBring: "Mon énergie créative ! Je peux animer des ateliers d'art pour les enfants et les adultes. Je fais aussi de la musique (guitare) et j'organise des petits concerts. Et mes enfants apportent de la joie et du mouvement.",
      idealDay: "Réveil en douceur, petit-déjeuner avec les enfants et les voisins. Les enfants partent à l'école, je file dans mon atelier. L'après-midi, j'anime un atelier pour les enfants du groupe. Le soir, on cuisine ensemble.",
      additionalInfo: "J'ai besoin d'un espace assez grand (2 chambres minimum pour les enfants) et idéalement d'un atelier où je peux travailler. Les enfants ont un lapin, Caramel, qui vit en semi-liberté.",
    },
    ai_summary: "Sofia, 45 ans, artiste et mère de deux enfants, recherche une communauté ouverte et créative. Elle aimerait un espace où ses enfants grandissent entourés d'adultes bienveillants, avec des ateliers et de la musique.",
    ai_tags: ["Famille", "Ateliers créatifs", "Enfants bienvenus", "Musique", "Ouverture"],
    photos: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1617104678098-de229db51175?w=600&h=400&fit=crop",
    ],
    is_published: true,
    is_verified: false,
    verified_at: null,
    verification_session_id: null,
    created_at: "2026-02-15T09:00:00Z",
    updated_at: "2026-02-15T09:00:00Z",
  },
  "demo-4": {
    id: "demo-4",
    user_id: "demo",
    display_name: "Thomas & Claire",
    avatar_url: null,
    location: "Louvain-la-Neuve",
    contact_email: "thomas.claire@gmail.com",
    age: 33,
    gender: null,
    sexuality: null,
    questionnaire_answers: {
      budget_max: 900,
      preferred_regions: ["brabant_wallon", "bruxelles"],
      community_size: "large",
      core_values: ["ecology", "democracy", "solidarity", "autonomy"],
      motivation: ["ecology", "share_resources", "social_link"],
      setting_preference: "semi_rural",
      community_activities: ["garden", "workshops", "shared_meals", "grocery_coop"],
      shared_meals_importance: "essential",
      involvement_level: 5,
    },
    introduction: {
      whoAreYou: "On est Thomas (33 ans, développeur web) et Claire (31 ans, infirmière). On vit ensemble depuis 8 ans à Louvain-la-Neuve et on n'a pas d'enfants pour l'instant.",
      whyGroupHousing: "On est convaincus que le mode de vie individualiste n'a pas d'avenir. On veut vivre de manière plus sobre, partager les ressources, et avoir un impact écologique réduit. On a visité plusieurs écolieux en France et ça nous a donné envie.",
      communityValues: "La gouvernance partagée, c'est fondamental pour nous. On veut un lieu où les décisions se prennent ensemble, de manière horizontale. L'écologie concrète au quotidien aussi : permaculture, énergie renouvelable, zéro déchet.",
      whatYouBring: "Thomas peut aider sur tout ce qui est technique et numérique (site web, domotique, etc.). Claire a des compétences en soins et premiers secours. On est tous les deux motivés par la permaculture et on a suivi une formation.",
      idealDay: "Thomas travaille à distance le matin. Claire part à l'hôpital tôt et rentre en début d'après-midi. L'après-midi, potager ensemble. Le soir, repas communautaire et parfois réunion de gouvernance.",
      additionalInfo: "On aimerait un projet qui a déjà une charte écologique claire. On est prêts à s'investir énormément dans la construction du projet, y compris physiquement (chantiers participatifs).",
    },
    ai_summary: "Couple trentenaire sans enfants, Thomas et Claire cherchent un habitat groupé écologique où ils pourront s'impliquer activement. Lui est développeur, elle est infirmière. Ils rêvent de permaculture et de gouvernance partagée.",
    ai_tags: ["Permaculture", "Écologique", "Couple", "Gouvernance partagée", "Engagés"],
    photos: [
      "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&h=400&fit=crop",
    ],
    is_published: true,
    is_verified: false,
    verified_at: null,
    verification_session_id: null,
    created_at: "2026-02-12T16:00:00Z",
    updated_at: "2026-02-12T16:00:00Z",
  },
};

async function getProfile(id: string): Promise<Profile | null> {
  if (id.startsWith("demo-") && DEMO_PROFILES[id]) {
    return DEMO_PROFILES[id];
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .single();

    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfile(id);

  if (!profile) {
    return { title: "Profil introuvable" };
  }

  return {
    title: `${profile.display_name} — Cohabitat Europe`,
    description: profile.ai_summary || `Profil de ${profile.display_name} sur Cohabitat Europe`,
    openGraph: {
      title: `${profile.display_name} — Cohabitat Europe`,
      description: profile.ai_summary || `Découvrez le profil de ${profile.display_name}`,
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile(id);

  if (!profile) {
    notFound();
  }

  return <ProfileDetail profile={profile} />;
}
