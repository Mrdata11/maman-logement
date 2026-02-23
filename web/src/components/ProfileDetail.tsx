"use client";

import { useState } from "react";
import {
  Profile,
  PROFILE_VOICE_QUESTIONS,
  deriveProfileCardData,
} from "@/lib/profile-types";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";

interface ProfileDetailProps {
  profile: Profile;
}

export function ProfileDetail({ profile }: ProfileDetailProps) {
  const [copied, setCopied] = useState(false);
  const intro = profile.introduction;
  const display = deriveProfileCardData(profile.questionnaire_answers);

  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.contact_email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        displayValue = q.options.find((o) => o.id === answer)?.label || answer;
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
    title: q.question,
    content: intro[q.id],
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
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
        Retour &agrave; la librairie
      </a>

      {/* Header card */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8">
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

      {/* Introduction sections */}
      {introSections.length > 0 && (
        <div className="space-y-4">
          {introSections.map((section, i) => (
            <div
              key={i}
              className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-5"
            >
              <h3 className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wide mb-2">
                {section.title}
              </h3>
              <p className="text-[var(--foreground)] leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Questionnaire details */}
      {questionnaireDetails.length > 0 && (
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-5">
          <h3 className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wide mb-4">
            Ce que je recherche
          </h3>
          <div className="grid gap-3">
            {/* Quick summary pills first */}
            <div className="flex flex-wrap gap-1.5 pb-3 border-b border-[var(--border-color)]">
              {display.budget_range && (
                <span className="text-xs px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium">
                  {display.budget_range}
                </span>
              )}
              {display.preferred_regions.map((r, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium"
                >
                  {r}
                </span>
              ))}
              {display.community_size && (
                <span className="text-xs px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium">
                  {display.community_size}
                </span>
              )}
              {display.core_values.map((v, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium"
                >
                  {v}
                </span>
              ))}
            </div>

            {/* Detailed answers */}
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
        </div>
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
    </div>
  );
}
