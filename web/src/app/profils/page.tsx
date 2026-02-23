"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import {
  ProfileCard as ProfileCardType,
  deriveProfileCardData,
} from "@/lib/profile-types";
import { ProfileCard } from "@/components/ProfileCard";

export default function ProfilsPage() {
  const [profiles, setProfiles] = useState<ProfileCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, display_name, avatar_url, location, ai_summary, ai_tags, questionnaire_answers, created_at"
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const cards: ProfileCardType[] = data.map((row) => {
          const derived = deriveProfileCardData(
            row.questionnaire_answers || {}
          );
          return {
            id: row.id,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
            location: row.location,
            ai_summary: row.ai_summary,
            ai_tags: row.ai_tags || [],
            ...derived,
            created_at: row.created_at,
          };
        });
        setProfiles(cards);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(
      (p) =>
        p.display_name.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.ai_summary?.toLowerCase().includes(q) ||
        p.ai_tags.some((t) => t.toLowerCase().includes(q)) ||
        p.preferred_regions.some((r) => r.toLowerCase().includes(q)) ||
        p.core_values.some((v) => v.toLowerCase().includes(q))
    );
  }, [profiles, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Profils
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Des personnes &agrave; la recherche d&apos;un habitat group&eacute;
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
          {search ? (
            <p className="text-[var(--muted)]">
              Aucun profil ne correspond &agrave; ta recherche.
            </p>
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
            {filtered.length} profil{filtered.length !== 1 ? "s" : ""}
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
