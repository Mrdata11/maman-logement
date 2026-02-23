"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  Profile,
  PROFILE_VOICE_QUESTIONS,
  INTRO_DISPLAY_TITLES,
  deriveProfileCardData,
} from "@/lib/profile-types";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";
import { AuthButton } from "@/components/AuthButton";
import { ProfileCreationFlow } from "@/components/ProfileCreationFlow";

export default function MonProfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
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
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
            Mon profil
          </h1>
          <p className="text-[var(--muted)]">
            Connecte-toi pour acc&eacute;der &agrave; ton profil.
          </p>
        </div>
        <div className="max-w-xs mx-auto">
          <AuthButton />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
            Mon profil
          </h1>
          <p className="text-[var(--muted)]">
            Tu n&apos;as pas encore de profil. Cr&eacute;e-le pour te pr&eacute;senter
            &agrave; la communaut&eacute;.
          </p>
        </div>
        <a
          href="/profils/creer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Cr&eacute;er mon profil
        </a>
      </div>
    );
  }

  const display = deriveProfileCardData(profile.questionnaire_answers);
  const intro = profile.introduction;
  const photos = profile.photos || [];

  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const GENDER_LABELS: Record<string, string> = {
    homme: "Homme",
    femme: "Femme",
    "non-binaire": "Non-binaire",
    autre: "Autre",
  };

  const demographicParts: string[] = [];
  if (profile.age) demographicParts.push(`${profile.age} ans`);
  if (profile.gender)
    demographicParts.push(GENDER_LABELS[profile.gender] || profile.gender);

  const introSections = PROFILE_VOICE_QUESTIONS.filter(
    (q) => intro[q.id]?.trim()
  ).map((q) => ({
    id: q.id,
    ...INTRO_DISPLAY_TITLES[q.id],
    content: intro[q.id],
  }));

  // Build detailed questionnaire display
  const questionnaireDetails: { label: string; value: string }[] = [];
  for (const step of QUESTIONNAIRE_STEPS) {
    for (const q of step.questions) {
      const answer = profile.questionnaire_answers[q.id];
      if (answer === undefined || answer === null) continue;

      let displayValue: string;
      if (Array.isArray(answer)) {
        displayValue = answer
          .map((a) => q.options?.find((o) => o.id === a)?.label || a)
          .join(", ");
      } else if (typeof answer === "number" && q.sliderConfig) {
        displayValue = `${answer}${q.sliderConfig.unit || ""}`;
      } else if (typeof answer === "string" && q.options) {
        displayValue =
          q.options.find((o) => o.id === answer)?.label || answer;
      } else if (typeof answer === "string") {
        displayValue = answer;
      } else {
        continue;
      }

      questionnaireDetails.push({ label: q.text, value: displayValue });
    }
  }

  if (editing) {
    return (
      <div className="py-4">
        <div className="max-w-2xl mx-auto mb-4">
          <button
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour &agrave; mon profil
          </button>
        </div>
        <ProfileCreationFlow existingProfile={profile} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header: status + actions */}
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

      {/* Identity card */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-20 h-20 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-[var(--primary)]">
                {initials}
              </span>
            </div>
          )}
          <div className="min-w-0 pt-1">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {profile.display_name}
            </h2>
            {demographicParts.length > 0 && (
              <p className="text-sm text-[var(--foreground)]/70 mt-0.5">
                {demographicParts.join(" \u00B7 ")}
              </p>
            )}
            {profile.location && (
              <p className="text-sm text-[var(--muted)] flex items-center gap-1 mt-0.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {profile.location}
              </p>
            )}
            <p className="text-sm text-[var(--muted)] flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {profile.contact_email}
            </p>
          </div>
        </div>

        {/* AI Summary */}
        {profile.ai_summary && (
          <p className="text-[var(--foreground)] leading-relaxed italic mt-5">
            &laquo; {profile.ai_summary} &raquo;
          </p>
        )}

        {/* AI Tags */}
        {profile.ai_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {profile.ai_tags.map((tag, i) => (
              <span
                key={i}
                className="text-sm px-2.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div
          className={`grid gap-2 ${
            photos.length === 1
              ? "grid-cols-1"
              : photos.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {photos.map((url, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-xl ${
                photos.length === 1 ? "aspect-[16/9]" : "aspect-square"
              }`}
            >
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Introduction sections */}
      {introSections.length > 0 && (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8">
          {introSections.map((section, i) => (
            <div
              key={section.id}
              className={i > 0 ? "mt-6 pt-6 border-t border-[var(--border-color)]" : ""}
            >
              <h3 className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="text-base">{section.icon}</span>
                {section.title}
              </h3>
              <p className="text-[var(--foreground)] leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Questionnaire summary */}
      {questionnaireDetails.length > 0 && (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 space-y-5">
          <h3 className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wide flex items-center gap-2">
            <span className="text-base">{"\uD83D\uDD0D"}</span>
            Ce que tu recherches
          </h3>

          {/* Visual summary grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {display.budget_range && (
              <div className="bg-[var(--surface)] rounded-lg p-3 text-center">
                <p className="text-xs text-[var(--muted)]">Budget</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {display.budget_range}
                </p>
              </div>
            )}
            {display.community_size && (
              <div className="bg-[var(--surface)] rounded-lg p-3 text-center">
                <p className="text-xs text-[var(--muted)]">Communaut&eacute;</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {display.community_size}
                </p>
              </div>
            )}
            {display.preferred_regions.length > 0 && (
              <div className="bg-[var(--surface)] rounded-lg p-3 text-center">
                <p className="text-xs text-[var(--muted)]">R&eacute;gion</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {display.preferred_regions.join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* Values */}
          {display.core_values.length > 0 && (
            <div>
              <p className="text-xs text-[var(--muted)] mb-1.5">
                Valeurs essentielles
              </p>
              <div className="flex flex-wrap gap-1.5">
                {display.core_values.map((v, i) => (
                  <span
                    key={i}
                    className="text-sm px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Q&A */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-[var(--primary)] font-medium hover:text-[var(--primary-hover)] transition-colors list-none flex items-center gap-1">
              Voir toutes les r&eacute;ponses
              <svg
                className="w-4 h-4 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="grid gap-3 mt-3 pt-3 border-t border-[var(--border-color)]">
              {questionnaireDetails.map((d, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:gap-4">
                  <span className="text-xs text-[var(--muted)] sm:w-1/2 shrink-0">
                    {d.label}
                  </span>
                  <span className="text-sm text-[var(--foreground)] font-medium">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setEditing(true)}
          className="flex-1 px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors text-center flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Modifier mon profil
        </button>
        <button
          onClick={togglePublished}
          className="flex-1 px-5 py-3 border border-[var(--border-color)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition-colors flex items-center justify-center gap-2"
        >
          {profile.is_published ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
              D&eacute;publier
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Publier
            </>
          )}
        </button>
      </div>

      {/* Public profile link */}
      {profile.is_published && (
        <a
          href={`/profils/${profile.id}`}
          className="flex items-center justify-center gap-1.5 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          Voir mon profil public
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

      {/* Profile date */}
      <p className="text-xs text-[var(--muted)] text-center">
        Profil cr&eacute;&eacute; le{" "}
        {new Date(profile.created_at).toLocaleDateString("fr-BE", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      {/* Danger zone */}
      <div className="pt-4 border-t border-[var(--border-color)]">
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
