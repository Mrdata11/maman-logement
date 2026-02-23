"use client";

import Link from "next/link";
import { ProfileCard as ProfileCardType } from "@/lib/profile-types";

interface ProfileCardProps {
  profile: ProfileCardType;
}

export function ProfileCard({ profile }: ProfileCardProps) {
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
  if (profile.gender) demographicParts.push(GENDER_LABELS[profile.gender] || profile.gender);
  if (profile.sexuality) demographicParts.push(profile.sexuality);

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-5 hover:shadow-md transition-shadow">
      {/* Header: avatar + name */}
      <div className="flex items-start gap-3 mb-3">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[var(--primary)]">
              {initials}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-[var(--foreground)] truncate">
            {profile.display_name}
          </h3>
          {demographicParts.length > 0 && (
            <p className="text-sm text-[var(--foreground)]/70">
              {demographicParts.join(" · ")}
            </p>
          )}
          {profile.location && (
            <p className="text-sm text-[var(--muted)] flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5 shrink-0"
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

      {/* Intro snippet - first person voice */}
      {profile.intro_snippet && (
        <p className="text-sm text-[var(--muted)] italic leading-relaxed mb-3 line-clamp-2">
          &laquo; {profile.intro_snippet} &raquo;
        </p>
      )}

      {/* AI Summary */}
      {profile.ai_summary && !profile.intro_snippet && (
        <p className="text-sm text-[var(--foreground)] leading-relaxed mb-3 line-clamp-3">
          {profile.ai_summary}
        </p>
      )}

      {/* Tags */}
      {profile.ai_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {profile.ai_tags.slice(0, 5).map((tag, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Quick info from questionnaire */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {profile.budget_range && (
          <span className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--muted)] rounded-full">
            {profile.budget_range}
          </span>
        )}
        {profile.preferred_regions.slice(0, 2).map((r, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--muted)] rounded-full"
          >
            {r}
          </span>
        ))}
        {profile.core_values.slice(0, 2).map((v, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--muted)] rounded-full"
          >
            {v}
          </span>
        ))}
      </div>

      {/* CTA */}
      <Link
        href={`/profils/${profile.id}`}
        className="block w-full text-center px-4 py-2.5 border border-[var(--primary)] text-[var(--primary)] rounded-xl text-sm font-medium hover:bg-[var(--primary)]/5 transition-colors"
      >
        D&eacute;couvrir {profile.display_name} &rarr;
      </Link>
    </div>
  );
}
