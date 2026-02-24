"use client";

import { useState, useEffect } from "react";
import {
  Profile,
  PROFILE_VOICE_QUESTIONS,
  INTRO_DISPLAY_TITLES,
  deriveProfileCardData,
  getIntroAudioUrl,
  getIntroText,
  isIntroAnswer,
} from "@/lib/profile-types";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { AuthButton } from "./AuthButton";
import { ProfilePhotoGallery } from "./ProfilePhotoGallery";
import { VerificationBadge } from "./screening/VerificationBadge";
import { VerificationCTA } from "./screening/VerificationCTA";

interface ProfileDetailProps {
  profile: Profile;
}

export function ProfileDetail({ profile }: ProfileDetailProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [emailRevealed, setEmailRevealed] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const supabase = createClient();
  const intro = profile.introduction;
  const display = deriveProfileCardData(profile.questionnaire_answers);
  const photos = profile.photos || [];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleContactClick = () => {
    if (user) {
      setEmailRevealed(true);
    } else {
      setShowAuthPrompt(true);
    }
  };

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
  if (profile.sexuality) demographicParts.push(profile.sexuality);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.contact_email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: profile.display_name,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    } catch {}
  };

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

  // Sections to display from introduction
  const introSections = PROFILE_VOICE_QUESTIONS.filter((q) => {
    const val = intro[q.id];
    if (!val) return false;
    if (typeof val === "string") return val.trim().length > 0;
    return isIntroAnswer(val);
  }).map((q) => ({
    id: q.id,
    ...INTRO_DISPLAY_TITLES[q.id],
    content: getIntroText(intro[q.id]),
    audioUrl: getIntroAudioUrl(intro[q.id]),
  }));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation row */}
      <div className="flex items-center justify-between mb-6">
        <a
          href="/profils"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux profils
        </a>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors px-3 py-1.5 border border-[var(--border-color)] rounded-lg hover:bg-[var(--card-bg)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {linkCopied ? "Lien copie !" : "Partager"}
        </button>
      </div>

      {/* Photo gallery - full width */}
      <ProfilePhotoGallery photos={photos} displayName={profile.display_name} />

      {/* Content: main + sidebar */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Left column: profile info */}
        <div className="space-y-8 min-w-0">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover shrink-0 ring-2 ring-[var(--border-color)]"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0 ring-2 ring-[var(--primary)]/20">
                  <span className="text-lg font-bold text-[var(--primary)]">
                    {initials}
                  </span>
                </div>
              )}
              <div className="min-w-0 pt-0.5">
                <h1 className="text-2xl font-bold text-[var(--foreground)] leading-tight flex items-center gap-2">
                  {profile.display_name}
                  {profile.is_verified && <VerificationBadge size="sm" />}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                  {demographicParts.length > 0 && (
                    <span className="text-sm text-[var(--foreground)]/70">
                      {demographicParts.join(" · ")}
                    </span>
                  )}
                  {profile.location && (
                    <span className="text-sm text-[var(--muted)] flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {profile.ai_summary && (
              <blockquote className="text-[var(--foreground)]/90 leading-relaxed italic border-l-3 border-[var(--primary)]/30 pl-4">
                {profile.ai_summary}
              </blockquote>
            )}

            {/* AI Tags */}
            {profile.ai_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.ai_tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 bg-[var(--primary)]/8 text-[var(--primary)] rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Separator */}
          <hr className="border-[var(--border-color)]" />

          {/* Introduction sections */}
          {introSections.length > 0 && (
            <div className="space-y-6">
              {introSections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wide mb-2 flex items-center gap-2">
                    <span className="text-base">{section.icon}</span>
                    {section.title}
                  </h3>
                  {section.audioUrl ? (
                    <audio
                      src={section.audioUrl}
                      controls
                      preload="metadata"
                      className="w-full"
                    />
                  ) : (
                    <p className="text-[var(--foreground)]/90 leading-relaxed">
                      {section.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Separator */}
          {questionnaireDetails.length > 0 && <hr className="border-[var(--border-color)]" />}

          {/* Questionnaire details */}
          {questionnaireDetails.length > 0 && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wide flex items-center gap-2">
                <span className="text-base">{"\u{1F50D}"}</span>
                Ce que {profile.display_name} recherche
              </h3>

              {/* Visual summary grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {display.budget_range && (
                  <div className="bg-[var(--surface)] rounded-xl p-3.5 text-center">
                    <p className="text-xs text-[var(--muted)] mb-0.5">Budget</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {display.budget_range}
                    </p>
                  </div>
                )}
                {display.community_size && (
                  <div className="bg-[var(--surface)] rounded-xl p-3.5 text-center">
                    <p className="text-xs text-[var(--muted)] mb-0.5">Communaut&eacute;</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {display.community_size}
                    </p>
                  </div>
                )}
                {display.preferred_regions.length > 0 && (
                  <div className="bg-[var(--surface)] rounded-xl p-3.5 text-center">
                    <p className="text-xs text-[var(--muted)] mb-0.5">R&eacute;gion</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {display.preferred_regions.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              {/* Values as pills */}
              {display.core_values.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--muted)] mb-1.5">Valeurs essentielles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {display.core_values.map((v, i) => (
                      <span
                        key={i}
                        className="text-sm px-3 py-1 bg-[var(--primary)]/8 text-[var(--primary)] rounded-full font-medium"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Q&A in collapsible section */}
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

          {/* Profile date */}
          <p className="text-xs text-[var(--muted)] pt-4 border-t border-[var(--border-color)]">
            Profil cr&eacute;&eacute; le{" "}
            {new Date(profile.created_at).toLocaleDateString("fr-BE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Right column: sticky contact card */}
        <div className="lg:sticky lg:top-6 space-y-4">
          {/* Verification CTA - only for own profile */}
          {user && user.id === profile.user_id && !profile.is_verified && (
            <VerificationCTA
              type="profile"
              targetId={profile.id}
              isVerified={profile.is_verified}
            />
          )}

          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 sm:p-6 shadow-[var(--card-shadow)] space-y-4">
            <h3 className="font-semibold text-[var(--foreground)]">
              Contacter {profile.display_name}
            </h3>

            {emailRevealed ? (
              <>
                <div className="flex items-center gap-2 p-3 bg-[var(--surface)] rounded-lg">
                  <svg className="w-4 h-4 text-[var(--muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a
                    href={`mailto:${profile.contact_email}`}
                    className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors font-medium truncate"
                  >
                    {profile.contact_email}
                  </a>
                  <button
                    onClick={copyEmail}
                    className="ml-auto text-xs px-2.5 py-1 border border-[var(--border-color)] text-[var(--muted)] rounded-md hover:bg-[var(--surface)] transition-colors shrink-0"
                  >
                    {copied ? "Copie !" : "Copier"}
                  </button>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  N&apos;h&eacute;sitez pas &agrave; envoyer un petit mot pour faire connaissance.
                </p>
                <a
                  href={`mailto:${profile.contact_email}`}
                  className="block w-full text-center px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Envoyer un email
                </a>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--muted)]">
                  {user
                    ? "Cliquez pour voir les coordonnees de contact."
                    : "Connectez-vous pour voir les coordonnees de contact."}
                </p>
                <button
                  onClick={handleContactClick}
                  className="w-full px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Voir les coordonn&eacute;es
                </button>
              </>
            )}
          </div>

          {/* Quick stats under contact card */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {display.budget_range && (
              <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3 text-center">
                <p className="text-xs text-[var(--muted)]">Budget</p>
                <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{display.budget_range}</p>
              </div>
            )}
            {profile.location && (
              <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3 text-center">
                <p className="text-xs text-[var(--muted)]">Localisation</p>
                <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{profile.location}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth prompt modal */}
      {showAuthPrompt && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAuthPrompt(false)}
        >
          <div
            className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Connectez-vous pour contacter
            </h3>
            <p className="text-sm text-[var(--muted)] mb-5">
              Pour prot&eacute;ger la vie priv&eacute;e des membres, les coordonn&eacute;es sont visibles uniquement apr&egrave;s connexion.
            </p>
            <AuthButton
              onAuthChange={(user) => {
                if (user) {
                  setShowAuthPrompt(false);
                  setEmailRevealed(true);
                }
              }}
            />
            <button
              onClick={() => setShowAuthPrompt(false)}
              className="mt-4 w-full text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-center"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
