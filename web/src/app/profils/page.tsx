"use client";

import { useState, useEffect, useMemo } from "react";
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
    ai_summary: "Marie, 62 ans, ancienne enseignante, cherche un habitat group\u00e9 chaleureux pr\u00e8s de Bruxelles. Passionn\u00e9e de jardinage et de biodanza, elle r\u00eave d'un lieu o\u00f9 le partage et la bienveillance sont au coeur du quotidien.",
    ai_tags: ["Pr\u00e8s de Bruxelles", "Jardin partag\u00e9", "Biodanza", "Spiritualit\u00e9", "Budget modeste"],
    budget_range: "max 700\u20ac/mois",
    preferred_regions: ["Bruxelles", "Brabant Wallon"],
    community_size: "Moyen (8-15)",
    core_values: ["Solidarit\u00e9", "Spiritualit\u00e9", "Ecologie"],
    intro_snippet: "Je m'appelle Marie, j'ai 62 ans et je vis \u00e0 Ixelles depuis plus de 20 ans. Ancienne enseignante de fran\u00e7ais, je suis maintenant retrait\u00e9e et je profite de mon temps pour me consacrer \u00e0 mes passions...",
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
    ai_summary: "Jean-Pierre, retrait\u00e9 dynamique de 68 ans, cherche un \u00e9colieu o\u00f9 il pourrait mettre \u00e0 profit ses comp\u00e9tences en menuiserie. Il souhaite un cadre semi-rural avec un potager collectif et des repas partag\u00e9s.",
    ai_tags: ["Semi-rural", "Potager", "Menuiserie", "Repas partag\u00e9s", "Interg\u00e9n\u00e9rationnel"],
    budget_range: "max 600\u20ac/mois",
    preferred_regions: ["Namur", "Luxembourg"],
    community_size: "Petit (4-8)",
    core_values: ["Ecologie", "Autonomie", "Respect"],
    intro_snippet: "Je suis Jean-Pierre, 68 ans, retrait\u00e9 depuis 3 ans. J'ai travaill\u00e9 toute ma vie comme menuisier \u00e0 Namur. Je vis seul depuis le d\u00e9c\u00e8s de ma femme il y a 5 ans...",
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
    ai_summary: "Sofia, 45 ans, artiste et m\u00e8re de deux enfants, recherche une communaut\u00e9 ouverte et cr\u00e9ative. Elle aimerait un espace o\u00f9 ses enfants grandissent entour\u00e9s d'adultes bienveillants, avec des ateliers et de la musique.",
    ai_tags: ["Famille", "Ateliers cr\u00e9atifs", "Enfants bienvenus", "Musique", "Ouverture"],
    budget_range: "max 850\u20ac/mois",
    preferred_regions: ["Li\u00e8ge", "Bruxelles"],
    community_size: "Moyen (8-15)",
    core_values: ["Cr\u00e9ativit\u00e9", "Ouverture", "Solidarit\u00e9"],
    intro_snippet: "Je suis Sofia, 45 ans, artiste plasticienne et m\u00e8re de Noa (12 ans) et Lila (8 ans). On vit \u00e0 Li\u00e8ge dans un appartement qui devient trop petit et trop isol\u00e9...",
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
    ai_summary: "Couple trentenaire sans enfants, Thomas et Claire cherchent un habitat group\u00e9 \u00e9cologique o\u00f9 ils pourront s'impliquer activement. Lui est d\u00e9veloppeur, elle est infirmi\u00e8re. Ils r\u00eavent de permaculture et de gouvernance partag\u00e9e.",
    ai_tags: ["Permaculture", "\u00c9cologique", "Couple", "Gouvernance partag\u00e9e", "Engag\u00e9s"],
    budget_range: "max 900\u20ac/mois",
    preferred_regions: ["Brabant Wallon", "Bruxelles"],
    community_size: "Grand (15+)",
    core_values: ["Ecologie", "D\u00e9mocratie", "Solidarit\u00e9", "Autonomie"],
    intro_snippet: "On est Thomas (33 ans, d\u00e9veloppeur web) et Claire (31 ans, infirmi\u00e8re). On vit ensemble depuis 8 ans \u00e0 Louvain-la-Neuve et on n'a pas d'enfants pour l'instant...",
    created_at: "2026-02-12T16:00:00Z",
  },
];

export default function ProfilsPage() {
  const [profiles, setProfiles] = useState<ProfileCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, display_name, avatar_url, location, age, gender, sexuality, ai_summary, ai_tags, questionnaire_answers, introduction, created_at"
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const cards: ProfileCardType[] = data.map((row) => {
          const derived = deriveProfileCardData(
            row.questionnaire_answers || {}
          );
          const introText = (row.introduction as Record<string, string>)?.whoAreYou || "";
          const intro_snippet = introText.length > 150
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
          };
        });
        setProfiles(cards);
      } else {
        setIsDemo(true);
        setProfiles(DEMO_PROFILES);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const availableRegions = useMemo(() => {
    const all = profiles.flatMap((p) => p.preferred_regions);
    return [...new Set(all)].sort();
  }, [profiles]);

  const availableValues = useMemo(() => {
    const all = profiles.flatMap((p) => p.core_values);
    return [...new Set(all)].sort();
  }, [profiles]);

  const filtered = useMemo(() => {
    let result = profiles;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.display_name.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.ai_summary?.toLowerCase().includes(q) ||
          p.ai_tags.some((t) => t.toLowerCase().includes(q)) ||
          p.preferred_regions.some((r) => r.toLowerCase().includes(q)) ||
          p.core_values.some((v) => v.toLowerCase().includes(q))
      );
    }
    if (selectedRegion) {
      result = result.filter((p) => p.preferred_regions.includes(selectedRegion));
    }
    if (selectedValue) {
      result = result.filter((p) => p.core_values.includes(selectedValue));
    }
    return result;
  }, [profiles, search, selectedRegion, selectedValue]);

  const hasActiveFilters = !!search.trim() || !!selectedRegion || !!selectedValue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Qui cherche un habitat group&eacute; ?
          </h1>
          <p className="text-[var(--muted)] mt-1">
            D&eacute;couvre les personnes qui, comme toi, r&ecirc;vent de vivre en communaut&eacute;.
          </p>
        </div>
        <a
          href="/profils/creer"
          className="shrink-0 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors inline-flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Cr&eacute;er mon profil
        </a>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, lieu, valeurs..."
          className="w-full pl-10 pr-4 py-2.5 border border-[var(--input-border)] rounded-xl text-sm bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Filter pills */}
      {!loading && (availableRegions.length > 0 || availableValues.length > 0) && (
        <div className="space-y-2">
          {availableRegions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-[var(--muted)] mr-1">R&eacute;gion :</span>
              {availableRegions.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(selectedRegion === r ? null : r)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    selectedRegion === r
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--primary)]/10"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          {availableValues.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-[var(--muted)] mr-1">Valeurs :</span>
              {availableValues.map((v) => (
                <button
                  key={v}
                  onClick={() => setSelectedValue(selectedValue === v ? null : v)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    selectedValue === v
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--primary)]/10"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
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
          <p className="text-sm text-[var(--muted)]">
            Chargement des profils...
          </p>
        </div>
      )}

      {/* Demo banner */}
      {!loading && isDemo && (
        <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              Ces profils sont des exemples
            </p>
            <p className="text-sm text-[var(--muted)]">
              Il n&apos;y a pas encore de profils publi&eacute;s. Voici quelques exemples pour te montrer &agrave; quoi &ccedil;a ressemble.
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 mx-auto bg-[var(--surface)] rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"
              />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          {hasActiveFilters ? (
            <div>
              <p className="text-[var(--muted)]">
                Aucun profil ne correspond &agrave; ta recherche.
              </p>
              <button
                onClick={() => { setSearch(""); setSelectedRegion(null); setSelectedValue(null); }}
                className="mt-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
              >
                Effacer les filtres
              </button>
            </div>
          ) : (
            <>
              <p className="text-[var(--foreground)] font-medium">
                Pas encore de profils
              </p>
              <p className="text-sm text-[var(--muted)]">
                Sois le/la premier(&egrave;re) &agrave; cr&eacute;er ton profil !
              </p>
              <a
                href="/profils/creer"
                className="inline-block px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                Cr&eacute;er mon profil
              </a>
            </>
          )}
        </div>
      )}

      {/* Profile grid */}
      {!loading && filtered.length > 0 && (
        <>
          <p className="text-sm text-[var(--muted)]">
            {filtered.length} personne{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
