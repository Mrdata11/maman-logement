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
    avatar_url: null,
    location: "Ixelles, Bruxelles",
    age: 62,
    gender: "femme",
    sexuality: null,
    ai_summary:
      "Marie, 62 ans, ancienne enseignante, cherche un habitat group\u00e9 chaleureux pr\u00e8s de Bruxelles. Passionn\u00e9e de jardinage et de biodanza.",
    ai_tags: ["Pr\u00e8s de Bruxelles", "Jardin partag\u00e9", "Biodanza", "Spiritualit\u00e9"],
    budget_range: "max 700\u20ac/mois",
    preferred_regions: ["Bruxelles", "Brabant Wallon"],
    community_size: "Moyen (8-15)",
    core_values: ["Solidarit\u00e9", "Spiritualit\u00e9", "Ecologie"],
    intro_snippet:
      "Je m\u2019appelle Marie, j\u2019ai 62 ans et je vis \u00e0 Ixelles depuis plus de 20 ans. Ancienne enseignante, je profite de mon temps pour mes passions...",
    created_at: "2026-02-20T10:00:00Z",
  },
  {
    id: "demo-2",
    display_name: "Jean-Pierre",
    avatar_url: null,
    location: "Namur",
    age: 68,
    gender: "homme",
    sexuality: null,
    ai_summary:
      "Jean-Pierre, retrait\u00e9 dynamique de 68 ans, cherche un \u00e9colieu avec potager collectif et repas partag\u00e9s.",
    ai_tags: ["Semi-rural", "Potager", "Menuiserie", "Repas partag\u00e9s"],
    budget_range: "max 600\u20ac/mois",
    preferred_regions: ["Namur", "Luxembourg"],
    community_size: "Petit (4-8)",
    core_values: ["Ecologie", "Autonomie", "Respect"],
    intro_snippet:
      "Je suis Jean-Pierre, 68 ans, retrait\u00e9 depuis 3 ans. J\u2019ai travaill\u00e9 toute ma vie comme menuisier \u00e0 Namur...",
    created_at: "2026-02-18T14:30:00Z",
  },
  {
    id: "demo-3",
    display_name: "Sofia",
    avatar_url: null,
    location: "Li\u00e8ge",
    age: 45,
    gender: "femme",
    sexuality: null,
    ai_summary:
      "Sofia, 45 ans, artiste et m\u00e8re de deux enfants, recherche une communaut\u00e9 ouverte et cr\u00e9ative.",
    ai_tags: ["Famille", "Ateliers cr\u00e9atifs", "Enfants bienvenus", "Musique"],
    budget_range: "max 850\u20ac/mois",
    preferred_regions: ["Li\u00e8ge", "Bruxelles"],
    community_size: "Moyen (8-15)",
    core_values: ["Cr\u00e9ativit\u00e9", "Ouverture", "Solidarit\u00e9"],
    intro_snippet:
      "Je suis Sofia, 45 ans, artiste plasticienne et m\u00e8re de Noa (12 ans) et Lila (8 ans)...",
    created_at: "2026-02-15T09:00:00Z",
  },
  {
    id: "demo-4",
    display_name: "Thomas & Claire",
    avatar_url: null,
    location: "Louvain-la-Neuve",
    age: 33,
    gender: null,
    sexuality: null,
    ai_summary:
      "Couple trentenaire, Thomas et Claire cherchent un habitat group\u00e9 \u00e9cologique avec permaculture et gouvernance partag\u00e9e.",
    ai_tags: ["Permaculture", "\u00c9cologique", "Couple", "Gouvernance partag\u00e9e"],
    budget_range: "max 900\u20ac/mois",
    preferred_regions: ["Brabant Wallon", "Bruxelles"],
    community_size: "Grand (15+)",
    core_values: ["Ecologie", "D\u00e9mocratie", "Solidarit\u00e9"],
    intro_snippet:
      "On est Thomas (33 ans, d\u00e9veloppeur web) et Claire (31 ans, infirmi\u00e8re). On vit ensemble depuis 8 ans...",
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
