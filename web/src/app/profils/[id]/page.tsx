"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
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
      whoAreYou: "Je m'appelle Marie, j'ai 62 ans et je vis \u00e0 Ixelles depuis plus de 20 ans. Ancienne enseignante de fran\u00e7ais, je suis maintenant retrait\u00e9e et je profite de mon temps pour me consacrer \u00e0 mes passions : le jardinage, la biodanza et la lecture.",
      whyGroupHousing: "Apr\u00e8s le d\u00e9part de mes enfants, ma grande maison est devenue trop vide. Je ne veux pas vieillir seule. L'id\u00e9e de partager mon quotidien avec d'autres personnes bienveillantes me porte depuis des ann\u00e9es. J'ai d\u00e9couvert l'habitat group\u00e9 lors d'un stage de biodanza et \u00e7a a \u00e9t\u00e9 une \u00e9vidence.",
      communityValues: "La bienveillance avant tout. J'ai besoin d'un espace o\u00f9 on s'\u00e9coute, o\u00f9 on se respecte, o\u00f9 on peut \u00eatre soi-m\u00eame. La dimension spirituelle est importante pour moi, pas dans un sens religieux, mais dans le sens d'une connexion profonde avec les autres et avec la nature.",
      whatYouBring: "Je suis une cuisini\u00e8re passionn\u00e9e, j'adore pr\u00e9parer de grands repas pour tout le monde. J'ai aussi la main verte et je pourrais m'occuper du potager. Et surtout, je suis \u00e0 l'\u00e9coute, j'aime prendre soin des gens autour de moi.",
      idealDay: "Le matin, je prends mon caf\u00e9 dans le jardin commun en discutant avec les voisins. En fin de matin\u00e9e, je m'occupe du potager. L'apr\u00e8s-midi, un atelier biodanza ou une balade. Le soir, un repas partag\u00e9 avec ceux qui veulent, dans une ambiance d\u00e9tendue et joyeuse.",
      additionalInfo: "J'ai un chat, Filou, qui fait partie de la famille ! J'esp\u00e8re trouver un lieu qui accepte les animaux. Je suis aussi ouverte \u00e0 l'interg\u00e9n\u00e9rationnel, je trouve que la pr\u00e9sence d'enfants apporte beaucoup de vie.",
    },
    ai_summary: "Marie, 62 ans, ancienne enseignante, cherche un habitat group\u00e9 chaleureux pr\u00e8s de Bruxelles. Passionn\u00e9e de jardinage et de biodanza, elle r\u00eave d'un lieu o\u00f9 le partage et la bienveillance sont au coeur du quotidien.",
    ai_tags: ["Pr\u00e8s de Bruxelles", "Jardin partag\u00e9", "Biodanza", "Spiritualit\u00e9", "Budget modeste"],
    is_published: true,
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
      whoAreYou: "Je suis Jean-Pierre, 68 ans, retrait\u00e9 depuis 3 ans. J'ai travaill\u00e9 toute ma vie comme menuisier \u00e0 Namur. Je vis seul depuis le d\u00e9c\u00e8s de ma femme il y a 5 ans, et mes enfants vivent \u00e0 l'\u00e9tranger.",
      whyGroupHousing: "Je ne veux pas finir en maison de repos. J'ai encore plein d'\u00e9nergie et de choses \u00e0 partager. L'habitat group\u00e9, c'est pour moi la solution id\u00e9ale : garder mon autonomie tout en \u00e9tant entour\u00e9.",
      communityValues: "Le respect mutuel et l'autonomie de chacun. Je veux pouvoir avoir mes moments de solitude quand j'en ai besoin, mais aussi profiter de la vie commune. L'\u00e9cologie concr\u00e8te me tient \u00e0 coeur : potager, compost, entraide.",
      whatYouBring: "40 ans de menuiserie, \u00e7a peut servir ! Je peux r\u00e9parer \u00e0 peu pr\u00e8s tout. Je fais aussi d'excellentes confitures et je suis un l\u00e8ve-t\u00f4t, id\u00e9al pour nourrir les poules le matin.",
      idealDay: "Debout \u00e0 6h, caf\u00e9 tranquille, un tour au poulailler. Matin\u00e9e dans mon atelier bois. Repas de midi avec la communaut\u00e9. Apr\u00e8s-midi au potager ou lecture. Soir\u00e9e jeux de soci\u00e9t\u00e9 ou calme chez moi.",
      additionalInfo: "Je cherche quelque chose d'assez petit, je n'ai pas besoin de beaucoup d'espace. Un studio ou un petit appartement me suffit. Par contre, j'ai besoin d'un atelier ou d'un garage pour ma menuiserie.",
    },
    ai_summary: "Jean-Pierre, retrait\u00e9 dynamique de 68 ans, cherche un \u00e9colieu o\u00f9 il pourrait mettre \u00e0 profit ses comp\u00e9tences en menuiserie. Il souhaite un cadre semi-rural avec un potager collectif et des repas partag\u00e9s.",
    ai_tags: ["Semi-rural", "Potager", "Menuiserie", "Repas partag\u00e9s", "Interg\u00e9n\u00e9rationnel"],
    is_published: true,
    created_at: "2026-02-18T14:30:00Z",
    updated_at: "2026-02-18T14:30:00Z",
  },
  "demo-3": {
    id: "demo-3",
    user_id: "demo",
    display_name: "Sofia",
    avatar_url: null,
    location: "Li\u00e8ge",
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
      whoAreYou: "Je suis Sofia, 45 ans, artiste plasticienne et m\u00e8re de Noa (12 ans) et Lila (8 ans). On vit \u00e0 Li\u00e8ge dans un appartement qui devient trop petit et trop isol\u00e9.",
      whyGroupHousing: "Elever mes enfants seule, c'est \u00e9puisant. Je r\u00eave d'un lieu o\u00f9 ils seraient entour\u00e9s d'adultes bienveillants, o\u00f9 on pourrait s'entraider au quotidien. Et pour moi, \u00eatre entour\u00e9e d'autres cr\u00e9atifs serait une source d'inspiration.",
      communityValues: "L'ouverture d'esprit et le respect des diff\u00e9rences. Je viens d'une famille multiculturelle et c'est important pour moi que mes enfants grandissent dans un environnement divers. La cr\u00e9ativit\u00e9 et l'expression artistique aussi.",
      whatYouBring: "Mon \u00e9nergie cr\u00e9ative ! Je peux animer des ateliers d'art pour les enfants et les adultes. Je fais aussi de la musique (guitare) et j'organise des petits concerts. Et mes enfants apportent de la joie et du mouvement.",
      idealDay: "R\u00e9veil en douceur, petit-d\u00e9jeuner avec les enfants et les voisins. Les enfants partent \u00e0 l'\u00e9cole, je file dans mon atelier. L'apr\u00e8s-midi, j'anime un atelier pour les enfants du groupe. Le soir, on cuisine ensemble.",
      additionalInfo: "J'ai besoin d'un espace assez grand (2 chambres minimum pour les enfants) et id\u00e9alement d'un atelier o\u00f9 je peux travailler. Les enfants ont un lapin, Caramel, qui vit en semi-libert\u00e9.",
    },
    ai_summary: "Sofia, 45 ans, artiste et m\u00e8re de deux enfants, recherche une communaut\u00e9 ouverte et cr\u00e9ative. Elle aimerait un espace o\u00f9 ses enfants grandissent entour\u00e9s d'adultes bienveillants, avec des ateliers et de la musique.",
    ai_tags: ["Famille", "Ateliers cr\u00e9atifs", "Enfants bienvenus", "Musique", "Ouverture"],
    is_published: true,
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
      whoAreYou: "On est Thomas (33 ans, d\u00e9veloppeur web) et Claire (31 ans, infirmi\u00e8re). On vit ensemble depuis 8 ans \u00e0 Louvain-la-Neuve et on n'a pas d'enfants pour l'instant.",
      whyGroupHousing: "On est convaincus que le mode de vie individualiste n'a pas d'avenir. On veut vivre de mani\u00e8re plus sobre, partager les ressources, et avoir un impact \u00e9cologique r\u00e9duit. On a visit\u00e9 plusieurs \u00e9colieux en France et \u00e7a nous a donn\u00e9 envie.",
      communityValues: "La gouvernance partag\u00e9e, c'est fondamental pour nous. On veut un lieu o\u00f9 les d\u00e9cisions se prennent ensemble, de mani\u00e8re horizontale. L'\u00e9cologie concr\u00e8te au quotidien aussi : permaculture, \u00e9nergie renouvelable, z\u00e9ro d\u00e9chet.",
      whatYouBring: "Thomas peut aider sur tout ce qui est technique et num\u00e9rique (site web, domotique, etc.). Claire a des comp\u00e9tences en soins et premiers secours. On est tous les deux motiv\u00e9s par la permaculture et on a suivi une formation.",
      idealDay: "Thomas travaille \u00e0 distance le matin. Claire part \u00e0 l'h\u00f4pital t\u00f4t et rentre en d\u00e9but d'apr\u00e8s-midi. L'apr\u00e8s-midi, potager ensemble. Le soir, repas communautaire et parfois r\u00e9union de gouvernance.",
      additionalInfo: "On aimerait un projet qui a d\u00e9j\u00e0 une charte \u00e9cologique claire. On est pr\u00eats \u00e0 s'investir \u00e9norm\u00e9ment dans la construction du projet, y compris physiquement (chantiers participatifs).",
    },
    ai_summary: "Couple trentenaire sans enfants, Thomas et Claire cherchent un habitat group\u00e9 \u00e9cologique o\u00f9 ils pourront s'impliquer activement. Lui est d\u00e9veloppeur, elle est infirmi\u00e8re. Ils r\u00eavent de permaculture et de gouvernance partag\u00e9e.",
    ai_tags: ["Permaculture", "\u00c9cologique", "Couple", "Gouvernance partag\u00e9e", "Engag\u00e9s"],
    is_published: true,
    created_at: "2026-02-12T16:00:00Z",
    updated_at: "2026-02-12T16:00:00Z",
  },
};

export default function ProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      // Check demo profiles first
      if (id.startsWith("demo-") && DEMO_PROFILES[id]) {
        setProfile(DEMO_PROFILES[id]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data as Profile);
      }
      setLoading(false);
    }
    if (id) load();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center gap-1.5 mb-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full"
              style={{
                animation: `recording-pulse 1s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <p className="text-sm text-[var(--muted)]">Chargement du profil...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          Profil introuvable
        </h1>
        <p className="text-[var(--muted)]">
          Ce profil n&apos;existe pas ou n&apos;est plus publi&eacute;.
        </p>
        <a
          href="/profils"
          className="inline-block px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          Retour &agrave; la librairie
        </a>
      </div>
    );
  }

  if (!profile) return null;

  return <ProfileDetail profile={profile} />;
}
