"use client";

import { useState } from "react";
import { ListingTags, TAG_LABELS } from "@/lib/types";

function TagPill({ label }: { label: string }) {
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--surface)] text-[var(--muted)]">
      {label}
    </span>
  );
}

function BooleanBadge({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean | null;
  trueLabel: string;
  falseLabel: string;
}) {
  if (value === null) return null;
  return <TagPill label={value ? trueLabel : falseLabel} />;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
        {title}
      </h4>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function TagsDisplay({ tags }: { tags: ListingTags }) {
  const [open, setOpen] = useState(false);

  const hasComposition =
    tags.group_size !== null ||
    tags.age_range.length > 0 ||
    tags.has_children !== null ||
    tags.family_types.length > 0;

  const hasHousing =
    tags.surface_m2 !== null ||
    tags.num_bedrooms !== null ||
    tags.unit_type !== null ||
    tags.furnished !== null ||
    tags.accessible_pmr !== null;

  const hasCommunityLife =
    tags.shared_meals !== null ||
    tags.has_charter !== null ||
    tags.governance !== null;

  const hasSetting =
    tags.environment !== null ||
    tags.near_nature !== null ||
    tags.near_transport !== null;

  const hasPets = tags.pets_allowed !== null || tags.pet_details.length > 0;

  const isEmpty =
    !hasComposition &&
    tags.project_types.length === 0 &&
    !hasPets &&
    !hasHousing &&
    tags.shared_spaces.length === 0 &&
    tags.values.length === 0 &&
    !hasCommunityLife &&
    !hasSetting;

  if (isEmpty) return null;

  return (
    <div className="rounded-xl border border-[var(--border-color)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 bg-[var(--surface)] hover:bg-[var(--surface)]/80 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-[var(--muted)] flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Tags extraits
        </span>
        <svg
          className={`w-4 h-4 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-3">
          {/* Composition */}
          {hasComposition && (
            <Section title="Composition">
              {tags.group_size !== null && (
                <TagPill label={`${tags.group_size} personne${tags.group_size > 1 ? "s" : ""}`} />
              )}
              {tags.age_range.map((a) => (
                <TagPill key={a} label={TAG_LABELS.age_range[a] || a} />
              ))}
              {tags.family_types.map((f) => (
                <TagPill key={f} label={TAG_LABELS.family_types[f] || f} />
              ))}
              <BooleanBadge value={tags.has_children} trueLabel="Enfants" falseLabel="Sans enfants" />
            </Section>
          )}

          {/* Type de projet */}
          {tags.project_types.length > 0 && (
            <Section title="Type de projet">
              {tags.project_types.map((t) => (
                <TagPill key={t} label={TAG_LABELS.project_types[t] || t} />
              ))}
            </Section>
          )}

          {/* Animaux */}
          {hasPets && (
            <Section title="Animaux">
              <BooleanBadge value={tags.pets_allowed} trueLabel="Animaux accept\u00e9s" falseLabel="Pas d'animaux" />
              {tags.pet_details.map((p) => (
                <TagPill key={p} label={TAG_LABELS.pet_details[p] || p} />
              ))}
            </Section>
          )}

          {/* Logement */}
          {hasHousing && (
            <Section title="Logement">
              {tags.unit_type && (
                <TagPill label={TAG_LABELS.unit_type[tags.unit_type] || tags.unit_type} />
              )}
              {tags.surface_m2 !== null && (
                <TagPill label={`${tags.surface_m2} m\u00b2`} />
              )}
              {tags.num_bedrooms !== null && (
                <TagPill label={`${tags.num_bedrooms} chambre${tags.num_bedrooms > 1 ? "s" : ""}`} />
              )}
              <BooleanBadge value={tags.furnished} trueLabel="Meubl\u00e9" falseLabel="Non meubl\u00e9" />
              <BooleanBadge value={tags.accessible_pmr} trueLabel="Accessible PMR" falseLabel="Non accessible PMR" />
            </Section>
          )}

          {/* Espaces partagés */}
          {tags.shared_spaces.length > 0 && (
            <Section title="Espaces partag\u00e9s">
              {tags.shared_spaces.map((s) => (
                <TagPill key={s} label={TAG_LABELS.shared_spaces[s] || s} />
              ))}
            </Section>
          )}

          {/* Valeurs */}
          {tags.values.length > 0 && (
            <Section title="Valeurs">
              {tags.values.map((v) => (
                <TagPill key={v} label={TAG_LABELS.values[v] || v} />
              ))}
            </Section>
          )}

          {/* Vie communautaire */}
          {hasCommunityLife && (
            <Section title="Vie communautaire">
              {tags.shared_meals && (
                <TagPill label={`Repas ${TAG_LABELS.shared_meals[tags.shared_meals] || tags.shared_meals}`} />
              )}
              <BooleanBadge value={tags.has_charter} trueLabel="Charte" falseLabel="Pas de charte" />
              {tags.governance && (
                <TagPill label={TAG_LABELS.governance[tags.governance] || tags.governance} />
              )}
            </Section>
          )}

          {/* Cadre */}
          {hasSetting && (
            <Section title="Cadre">
              {tags.environment && (
                <TagPill label={TAG_LABELS.environment[tags.environment] || tags.environment} />
              )}
              <BooleanBadge value={tags.near_nature} trueLabel="Proche nature" falseLabel="Pas proche nature" />
              <BooleanBadge value={tags.near_transport} trueLabel="Proche transports" falseLabel="Loin transports" />
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

/** Compact version for cards and preview panels */
export function TagsPills({ tags }: { tags: ListingTags }) {
  const pills: string[] = [];

  // Environment
  if (tags.environment) {
    pills.push(TAG_LABELS.environment[tags.environment] || tags.environment);
  }

  // Project types (max 2)
  for (const t of tags.project_types.slice(0, 2)) {
    pills.push(TAG_LABELS.project_types[t] || t);
  }

  // Top values (max 2)
  for (const v of tags.values.slice(0, 2)) {
    pills.push(TAG_LABELS.values[v] || v);
  }

  // Pets
  if (tags.pets_allowed === true) {
    pills.push("Animaux OK");
  } else if (tags.pets_allowed === false) {
    pills.push("Pas d'animaux");
  }

  // Group size
  if (tags.group_size !== null) {
    pills.push(`${tags.group_size} pers.`);
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {pills.slice(0, 5).map((label, i) => (
        <span
          key={i}
          className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
