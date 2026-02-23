"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Profile, PROFILE_VOICE_QUESTIONS, deriveProfileCardData } from "@/lib/profile-types";
import { AuthButton } from "@/components/AuthButton";

export default function MonProfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (data) {
        setProfile(data as Profile);
      }
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadProfile(user.id);
      } else {
        setLoading(false);
      }
    });
  }, [supabase, loadProfile]);

  const handleDelete = useCallback(async () => {
    if (!profile || !confirm("Supprimer d\u00e9finitivement ton profil ?"))
      return;

    setDeleting(true);
    await supabase.from("profiles").delete().eq("id", profile.id);
    setProfile(null);
    setDeleting(false);
  }, [profile, supabase]);

  const togglePublished = useCallback(async () => {
    if (!profile) return;
    const newStatus = !profile.is_published;
    await supabase
      .from("profiles")
      .update({ is_published: newStatus, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setProfile({ ...profile, is_published: newStatus });
  }, [profile, supabase]);

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
        <p className="text-sm text-[var(--muted)]">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          Mon profil
        </h1>
        <p className="text-[var(--muted)]">
          Connecte-toi pour acc&eacute;der &agrave; ton profil.
        </p>
        <AuthButton className="mx-auto" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          Mon profil
        </h1>
        <p className="text-[var(--muted)]">
          Tu n&apos;as pas encore de profil.
        </p>
        <a
          href="/profils/creer"
          className="inline-block px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          Cr&eacute;er mon profil
        </a>
      </div>
    );
  }

  const display = deriveProfileCardData(profile.questionnaire_answers);
  const intro = profile.introduction;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Mon profil
        </h1>
        <span
          className={`text-sm px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 ${
            profile.is_published
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              profile.is_published ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {profile.is_published ? "Publi\u00e9" : "Brouillon"}
        </span>
      </div>

      {/* Profile summary card */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-start gap-4 mb-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <span className="text-lg font-bold text-[var(--primary)]">
                {profile.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              {profile.display_name}
            </h2>
            {profile.location && (
              <p className="text-sm text-[var(--muted)]">{profile.location}</p>
            )}
            <p className="text-sm text-[var(--muted)]">
              {profile.contact_email}
            </p>
          </div>
        </div>

        {profile.ai_summary && (
          <p className="text-sm text-[var(--foreground)] italic mb-3 leading-relaxed">
            &laquo; {profile.ai_summary} &raquo;
          </p>
        )}

        {profile.ai_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {profile.ai_tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Introduction sections */}
        <div className="space-y-3 mt-4 pt-4 border-t border-[var(--border-color)]">
          {PROFILE_VOICE_QUESTIONS.filter((q) => intro[q.id]?.trim()).map(
            (q) => (
              <div key={q.id}>
                <p className="text-xs font-medium text-[var(--muted)]">
                  {q.question}
                </p>
                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                  {intro[q.id]}
                </p>
              </div>
            )
          )}
        </div>

        {/* Questionnaire summary */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-[var(--border-color)]">
          {display.budget_range && (
            <span className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--muted)] rounded-full">
              {display.budget_range}
            </span>
          )}
          {display.preferred_regions.map((r, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--muted)] rounded-full"
            >
              {r}
            </span>
          ))}
          {display.core_values.map((v, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--muted)] rounded-full"
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Primary actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="/profils/creer"
          className="flex-1 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors text-center"
        >
          Modifier mon profil
        </a>
        <button
          onClick={togglePublished}
          className="flex-1 px-5 py-2.5 border border-[var(--border-color)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition-colors"
        >
          {profile.is_published ? "D\u00e9publier" : "Publier"}
        </button>
      </div>

      {/* View public profile */}
      {profile.is_published && (
        <a
          href={`/profils/${profile.id}`}
          className="block text-center text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          Voir mon profil public &rarr;
        </a>
      )}

      {/* Danger zone - visually separated */}
      <div className="pt-4 mt-2 border-t border-[var(--border-color)]">
        <details>
          <summary className="text-xs text-[var(--muted)] cursor-pointer hover:text-red-500 transition-colors list-none">
            Zone de suppression
          </summary>
          <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 mb-3">
              Cette action est irr&eacute;versible. Ton profil sera d&eacute;finitivement supprim&eacute;.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? "Suppression..." : "Supprimer d\u00e9finitivement"}
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
