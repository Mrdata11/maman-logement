"use client";

import { useState, useEffect, useRef } from "react";
import {
  Profile,
  PROFILE_VOICE_QUESTIONS,
  ProfileIntroduction,
  deriveProfileCardData,
} from "@/lib/profile-types";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";

interface ProfileDetailProps {
  profile: Profile;
}

const INTRO_SECTION_META: Record<
  keyof ProfileIntroduction,
  { icon: string; tinted: boolean }
> = {
  whoAreYou: { icon: "\u{1F64B}", tinted: false },
  whyGroupHousing: { icon: "\u{1F3E1}", tinted: true },
  communityValues: { icon: "\u{1F49A}", tinted: false },
  whatYouBring: { icon: "\u{1F381}", tinted: true },
  idealDay: { icon: "\u{2600}\uFE0F", tinted: false },
  additionalInfo: { icon: "\u{1F4AC}", tinted: true },
};

export function ProfileDetail({ profile }: ProfileDetailProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showFloatingContact, setShowFloatingContact] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const intro = profile.introduction;
  const display = deriveProfileCardData(profile.questionnaire_answers);

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

  // Floating contact bar visibility
  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFloatingContact(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

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
  const introSections = PROFILE_VOICE_QUESTIONS.filter(
    (q) => intro[q.id]?.trim()
  ).map((q) => ({
    id: q.id,
    title: q.question,
    content: intro[q.id],
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Navigation row */}
      <div className="flex items-center justify-between">
        <a
          href="/profils"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour aux profils
        </a>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors px-3 py-1.5 border border-[var(--border-color)] rounded-lg"
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
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          {linkCopied ? "Lien copi\u00e9 !" : "Partager"}
        </button>
      </div>

      {/* Header card */}
      <div
        ref={headerRef}
        className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8"
      >
        <div className="flex items-start gap-4 mb-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-[var(--primary)]">
                {initials}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {profile.display_name}
            </h1>
            {demographicParts.length > 0 && (
              <p className="text-sm text-[var(--foreground)]/70 mt-0.5">
                {demographicParts.join(" \u00B7 ")}
              </p>
            )}
            {profile.location && (
              <p className="text-[var(--muted)] flex items-center gap-1 mt-0.5">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {profile.location}
              </p>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {profile.ai_summary && (
          <p className="text-[var(--foreground)] leading-relaxed italic mb-4">
            &laquo; {profile.ai_summary} &raquo;
          </p>
        )}

        {/* AI Tags */}
        {profile.ai_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
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

        {/* Contact email */}
        <div className="flex items-center gap-2 p-3 bg-[var(--surface)] rounded-lg">
          <svg
            className="w-4 h-4 text-[var(--muted)] shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <a
            href={`mailto:${profile.contact_email}`}
            className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors font-medium"
          >
            {profile.contact_email}
          </a>
          <button
            onClick={copyEmail}
            className="ml-auto text-xs px-2.5 py-1 border border-[var(--border-color)] text-[var(--muted)] rounded-md hover:bg-[var(--card-bg)] transition-colors"
          >
            {copied ? "Copi\u00e9 !" : "Copier"}
          </button>
        </div>
      </div>

      {/* Introduction sections - varied visual treatment */}
      {introSections.length > 0 && (
        <div className="space-y-4">
          {introSections.map((section, i) => {
            const meta = INTRO_SECTION_META[section.id] || {
              icon: "\u{1F4DD}",
              tinted: false,
            };
            const isFirst = i === 0;

            return (
              <div
                key={section.id}
                className={`rounded-xl border border-[var(--border-color)] ${
                  isFirst ? "p-6" : "p-5"
                } ${meta.tinted ? "bg-[var(--primary)]/5" : "bg-[var(--card-bg)]"}`}
              >
                <div
                  className={`flex items-start gap-2.5 ${isFirst ? "mb-3" : "mb-2"}`}
                >
                  <span className={isFirst ? "text-2xl" : "text-xl"}>
                    {meta.icon}
                  </span>
                  <h3
                    className={
                      isFirst
                        ? "text-base font-semibold text-[var(--foreground)]"
                        : "text-sm font-semibold text-[var(--primary)] uppercase tracking-wide"
                    }
                  >
                    {section.title}
                  </h3>
                </div>
                <p
                  className={`text-[var(--foreground)] leading-relaxed ${isFirst ? "text-base" : ""}`}
                >
                  {section.content}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Questionnaire details - improved with visual summary */}
      {questionnaireDetails.length > 0 && (
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-5 space-y-5">
          <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
            <span className="text-xl">{"\u{1F50D}"}</span>
            Ce que {profile.display_name} recherche
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
                <p className="text-xs text-[var(--muted)]">
                  Communaut&eacute;
                </p>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {display.community_size}
                </p>
              </div>
            )}
            {display.preferred_regions.length > 0 && (
              <div className="bg-[var(--surface)] rounded-lg p-3 text-center">
                <p className="text-xs text-[var(--muted)]">
                  R&eacute;gion
                </p>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {display.preferred_regions.join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* Values as pills */}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
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

      {/* Bottom contact CTA */}
      <div className="bg-[var(--primary)]/5 rounded-xl border border-[var(--primary)]/20 p-6 text-center space-y-3">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          {profile.display_name} t&apos;int&eacute;resse ?
        </p>
        <p className="text-sm text-[var(--muted)]">
          N&apos;h&eacute;site pas &agrave; envoyer un petit mot pour faire
          connaissance.
        </p>
        <a
          href={`mailto:${profile.contact_email}`}
          className="inline-block px-6 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          Contacter {profile.display_name}
        </a>
      </div>

      {/* Profile date */}
      <p className="text-xs text-[var(--muted)] text-center pb-16">
        Profil cr&eacute;&eacute; le{" "}
        {new Date(profile.created_at).toLocaleDateString("fr-BE", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      {/* Floating contact bar */}
      {showFloatingContact && (
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)] border-t border-[var(--border-color)] p-3 shadow-lg z-40 animate-slideUp">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--muted)] truncate">
              Envie de contacter {profile.display_name} ?
            </span>
            <a
              href={`mailto:${profile.contact_email}`}
              className="shrink-0 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              Envoyer un email
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
