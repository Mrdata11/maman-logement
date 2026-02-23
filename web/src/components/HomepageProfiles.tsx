"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  ProfileCard as ProfileCardType,
  deriveProfileCardData,
} from "@/lib/profile-types";
import { ProfileCard } from "@/components/ProfileCard";

const DEMO_PROFILES: ProfileCardType[] = [
  {
    id: "demo-1",
    display_name: "Marie",
    avatar_url: "https://api.dicebear.com/9.x/notionists/svg?seed=Marie&backgroundColor=e8d5b7",
    location: "Ixelles, Bruxelles",
    age: 62,
    gender: "femme",
    sexuality: null,
    ai_summary:
      "Marie, 62 ans, ancienne enseignante, cherche un habitat groupé chaleureux près de Bruxelles. Passionnée de jardinage et de biodanza.",
    ai_tags: ["Près de Bruxelles", "Jardin partagé", "Biodanza", "Spiritualité"],
    budget_range: "max 700€/mois",
    preferred_regions: ["Bruxelles", "Brabant Wallon"],
    community_size: "Moyen (8-15)",
    core_values: ["Solidarité", "Spiritualité", "Ecologie"],
    intro_snippet:
      "Je m’appelle Marie, j’ai 62 ans et je vis à Ixelles depuis plus de 20 ans. Ancienne enseignante, je profite de mon temps pour mes passions...",
    created_at: "2026-02-20T10:00:00Z",
  },
  {
    id: "demo-2",
    display_name: "Jean-Pierre",
    avatar_url: "https://api.dicebear.com/9.x/notionists/svg?seed=JeanPierre&backgroundColor=c8d5c8",
    location: "Namur",
    age: 68,
    gender: "homme",
    sexuality: null,
    ai_summary:
      "Jean-Pierre, retraité dynamique de 68 ans, cherche un écolieu avec potager collectif et repas partagés.",
    ai_tags: ["Semi-rural", "Potager", "Menuiserie", "Repas partagés"],
    budget_range: "max 600€/mois",
    preferred_regions: ["Namur", "Luxembourg"],
    community_size: "Petit (4-8)",
    core_values: ["Ecologie", "Autonomie", "Respect"],
    intro_snippet:
      "Je suis Jean-Pierre, 68 ans, retraité depuis 3 ans. J’ai travaillé toute ma vie comme menuisier à Namur...",
    created_at: "2026-02-18T14:30:00Z",
  },
  {
    id: "demo-3",
    display_name: "Sofia",
    avatar_url: "https://api.dicebear.com/9.x/notionists/svg?seed=Sofia&backgroundColor=d5c8e0",
    location: "Liège",
    age: 45,
    gender: "femme",
    sexuality: null,
    ai_summary:
      "Sofia, 45 ans, artiste et mère de deux enfants, recherche une communauté ouverte et créative.",
    ai_tags: ["Famille", "Ateliers créatifs", "Enfants bienvenus", "Musique"],
    budget_range: "max 850€/mois",
    preferred_regions: ["Liège", "Bruxelles"],
    community_size: "Moyen (8-15)",
    core_values: ["Créativité", "Ouverture", "Solidarité"],
    intro_snippet:
      "Je suis Sofia, 45 ans, artiste plasticienne et mère de Noa (12 ans) et Lila (8 ans)...",
    created_at: "2026-02-15T09:00:00Z",
  },
  {
    id: "demo-4",
    display_name: "Thomas & Claire",
    avatar_url: "https://api.dicebear.com/9.x/notionists/svg?seed=ThomasClaire&backgroundColor=e0d5c8",
    location: "Louvain-la-Neuve",
    age: 33,
    gender: null,
    sexuality: null,
    ai_summary:
      "Couple trentenaire, Thomas et Claire cherchent un habitat groupé écologique avec permaculture et gouvernance partagée.",
    ai_tags: ["Permaculture", "Écologique", "Couple", "Gouvernance partagée"],
    budget_range: "max 900€/mois",
    preferred_regions: ["Brabant Wallon", "Bruxelles"],
    community_size: "Grand (15+)",
    core_values: ["Ecologie", "Démocratie", "Solidarité"],
    intro_snippet:
      "On est Thomas (33 ans, développeur web) et Claire (31 ans, infirmière). On vit ensemble depuis 8 ans...",
    created_at: "2026-02-12T16:00:00Z",
  },
];

function SkeletonCard() {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-[var(--surface)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[var(--surface)] rounded w-2/3" />
          <div className="h-3 bg-[var(--surface)] rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-[var(--surface)] rounded" />
        <div className="h-3 bg-[var(--surface)] rounded w-4/5" />
      </div>
      <div className="flex gap-1.5 mt-3">
        <div className="h-5 w-16 bg-[var(--surface)] rounded-full" />
        <div className="h-5 w-20 bg-[var(--surface)] rounded-full" />
      </div>
    </div>
  );
}

export function HomepageProfiles() {
  const [profiles, setProfiles] = useState<ProfileCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, display_name, avatar_url, location, age, gender, sexuality, ai_summary, ai_tags, questionnaire_answers, introduction, created_at"
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data && data.length > 0) {
        const cards: ProfileCardType[] = data.map((row) => {
          const derived = deriveProfileCardData(
            row.questionnaire_answers || {}
          );
          const introText =
            (row.introduction as Record<string, string>)?.whoAreYou || "";
          const intro_snippet =
            introText.length > 150
              ? introText.slice(0, 147) + "..."
              : introText || undefined;
          return {
            id: row.id,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
            location: row.location,
            age: row.age ?? null,
            gender: row.gender ?? null,
            sexuality: row.sexuality ?? null,
            ai_summary: row.ai_summary,
            ai_tags: row.ai_tags || [],
            ...derived,
            intro_snippet,
            created_at: row.created_at,
            questionnaire_answers: row.questionnaire_answers || undefined,
          };
        });
        setProfiles(cards);
      } else {
        setProfiles(DEMO_PROFILES);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {profiles.slice(0, 6).map((profile) => (
        <ProfileCard key={profile.id} profile={profile} />
      ))}
    </div>
  );
}
