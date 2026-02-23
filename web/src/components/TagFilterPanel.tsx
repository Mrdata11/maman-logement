"use client";

import { useCallback, useState } from "react";
import { UITagFilters, TAG_LABELS } from "@/lib/types";
import {
  Building2,
  Home,
  Users,
  Handshake,
  PawPrint,
  TreePine,
  ChevronDown,
} from "lucide-react";

interface TagFilterPanelProps {
  filters: UITagFilters;
  onChange: (filters: UITagFilters) => void;
  availableTags: TagFilterCounts;
}

export interface TagFilterCounts {
  projectTypes: { value: string; count: number }[];
  environments: { value: string; count: number }[];
  sharedSpaces: { value: string; count: number }[];
  values: { value: string; count: number }[];
  sharedMeals: { value: string; count: number }[];
  unitTypes: { value: string; count: number }[];
  petsAllowed: { yes: number; no: number };
  hasChildren: { yes: number; no: number };
  hasCharter: { yes: number; no: number };
  ageRange: { value: string; count: number }[];
  familyTypes: { value: string; count: number }[];
  petDetails: { value: string; count: number }[];
  governance: { value: string; count: number }[];
  furnished: { yes: number; no: number };
  accessiblePmr: { yes: number; no: number };
  nearNature: { yes: number; no: number };
  nearTransport: { yes: number; no: number };
  availabilityStatus: { value: string; count: number }[];
}

const AVAILABILITY_LABELS: Record<string, string> = {
  likely_available: "Probablement disponible",
  possibly_expired: "Peut-être expiré",
  unknown: "Inconnu",
};

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-[var(--border-light)] pb-8 mb-8 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full group"
      >
        <span className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)]/15">
            {icon}
          </div>
          <span className="text-base font-bold text-[var(--foreground)] tracking-tight">{title}</span>
        </span>
        <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center group-hover:bg-[var(--border-color)] transition-all duration-200">
          <ChevronDown
            className={`w-4 h-4 text-[var(--muted)] transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-5 overflow-hidden transition-all duration-300 ease-out ${
          open ? "mt-5 max-h-[2000px] opacity-100" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

export function CheckboxGroup({
  title,
  items,
  selected,
  labelMap,
  onToggle,
  onClear,
}: {
  title: string;
  items: { value: string; count: number }[];
  selected: string[];
  labelMap: Record<string, string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <fieldset>
      <div className="flex items-center justify-between mb-3">
        <legend className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
          {title}
        </legend>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
          >
            Tous
          </button>
        )}
      </div>
      <div className="space-y-1 max-h-44 overflow-y-auto filter-scroll rounded-2xl border border-[var(--border-light)] p-2 bg-[var(--surface)]/30">
        {items.map(({ value, count }) => (
          <label
            key={value}
            className="flex items-center gap-3 text-sm text-[var(--foreground)] cursor-pointer hover:bg-[var(--surface)] px-3 py-2 rounded-xl transition-all duration-150"
          >
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
              className="filter-checkbox"
            />
            <span className="flex-1 truncate font-medium">
              {labelMap[value] || value}
            </span>
            <span className="text-xs text-[var(--muted-light)] bg-[var(--surface)] px-2 py-0.5 rounded-full font-medium">
              {count}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TriStateFilter({
  title,
  value,
  counts,
  onChange,
}: {
  title: string;
  value: boolean | null;
  counts: { yes: number; no: number };
  onChange: (value: boolean | null) => void;
}) {
  if (counts.yes === 0 && counts.no === 0) return null;

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-[var(--foreground)] mb-3 tracking-tight">
        {title}
      </legend>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(null)}
          className={`text-sm px-4 py-2 rounded-xl border-2 transition-all duration-200 font-medium ${
            value === null
              ? "bg-[var(--foreground)] text-[var(--card-bg)] border-[var(--foreground)] shadow-md"
              : "border-[var(--border-light)] text-[var(--muted)] hover:bg-[var(--surface)] hover:border-[var(--border-color)]"
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => onChange(true)}
          className={`text-sm px-4 py-2 rounded-xl border-2 transition-all duration-200 font-medium ${
            value === true
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
              : "border-[var(--border-light)] text-[var(--muted)] hover:bg-[var(--surface)] hover:border-[var(--border-color)]"
          }`}
        >
          Oui ({counts.yes})
        </button>
        <button
          onClick={() => onChange(false)}
          className={`text-sm px-4 py-2 rounded-xl border-2 transition-all duration-200 font-medium ${
            value === false
              ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20"
              : "border-[var(--border-light)] text-[var(--muted)] hover:bg-[var(--surface)] hover:border-[var(--border-color)]"
          }`}
        >
          Non ({counts.no})
        </button>
      </div>
    </fieldset>
  );
}

export const inputClass = "w-full px-4 py-3 border border-[var(--border-light)] rounded-2xl text-sm bg-[var(--surface)]/50 text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]/40 transition-all duration-200";

type MultiSelectKey =
  | "projectTypes" | "environments" | "sharedSpaces" | "valuesTags"
  | "sharedMeals" | "unitTypes" | "ageRange" | "familyTypes"
  | "petDetails" | "governance" | "availabilityStatus";

export function TagFilterPanel({
  filters,
  onChange,
  availableTags,
}: TagFilterPanelProps) {
  const toggleIn = useCallback(
    (key: MultiSelectKey, value: string) => {
      const current = filters[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChange({ ...filters, [key]: next });
    },
    [filters, onChange]
  );

  const hasAnyData =
    availableTags.projectTypes.length > 0 ||
    availableTags.environments.length > 0 ||
    availableTags.sharedSpaces.length > 0 ||
    availableTags.values.length > 0 ||
    availableTags.sharedMeals.length > 0 ||
    availableTags.unitTypes.length > 0 ||
    availableTags.petsAllowed.yes > 0 ||
    availableTags.petsAllowed.no > 0 ||
    availableTags.hasChildren.yes > 0 ||
    availableTags.hasCharter.yes > 0 ||
    availableTags.ageRange.length > 0 ||
    availableTags.familyTypes.length > 0 ||
    availableTags.petDetails.length > 0 ||
    availableTags.governance.length > 0 ||
    availableTags.furnished.yes > 0 || availableTags.furnished.no > 0 ||
    availableTags.accessiblePmr.yes > 0 || availableTags.accessiblePmr.no > 0 ||
    availableTags.nearNature.yes > 0 || availableTags.nearNature.no > 0 ||
    availableTags.nearTransport.yes > 0 || availableTags.nearTransport.no > 0 ||
    availableTags.availabilityStatus.length > 0;

  if (!hasAnyData) return null;

  return (
    <div>
      <CollapsibleSection title="Type de projet & Cadre" icon={<Building2 className="w-5 h-5" />} defaultOpen={true}>
        <CheckboxGroup
          title="Type de projet"
          items={availableTags.projectTypes}
          selected={filters.projectTypes}
          labelMap={TAG_LABELS.project_types}
          onToggle={(v) => toggleIn("projectTypes", v)}
          onClear={() => onChange({ ...filters, projectTypes: [] })}
        />
        <CheckboxGroup
          title="Cadre"
          items={availableTags.environments}
          selected={filters.environments}
          labelMap={TAG_LABELS.environment}
          onToggle={(v) => toggleIn("environments", v)}
          onClear={() => onChange({ ...filters, environments: [] })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Logement" icon={<Home className="w-5 h-5" />} defaultOpen={true}>
        <CheckboxGroup
          title="Type de logement"
          items={availableTags.unitTypes}
          selected={filters.unitTypes}
          labelMap={TAG_LABELS.unit_type}
          onToggle={(v) => toggleIn("unitTypes", v)}
          onClear={() => onChange({ ...filters, unitTypes: [] })}
        />

        <fieldset>
          <label
            htmlFor="tag-min-bedrooms"
            className="block text-sm font-semibold text-[var(--foreground)] mb-3 tracking-tight"
          >
            Chambres (min)
          </label>
          <input
            id="tag-min-bedrooms"
            type="number"
            value={filters.minBedrooms ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                minBedrooms: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder="Min"
            min={0}
            max={20}
            className={inputClass}
          />
        </fieldset>

        <fieldset>
          <legend className="block text-sm font-semibold text-[var(--foreground)] mb-3 tracking-tight">
            Surface (m²)
          </legend>
          <div className="flex items-center gap-3">
            <input
              type="number"
              aria-label="Surface minimum"
              value={filters.minSurface ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minSurface: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Min"
              min={0}
              step={10}
              className={inputClass}
            />
            <span className="text-[var(--muted-light)] text-lg font-light" aria-hidden="true">{"–"}</span>
            <input
              type="number"
              aria-label="Surface maximum"
              value={filters.maxSurface ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  maxSurface: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Max"
              min={0}
              step={10}
              className={inputClass}
            />
          </div>
        </fieldset>

        <TriStateFilter
          title="Meublé"
          value={filters.furnished}
          counts={availableTags.furnished}
          onChange={(v) => onChange({ ...filters, furnished: v })}
        />

        <TriStateFilter
          title="Accessible PMR"
          value={filters.accessiblePmr}
          counts={availableTags.accessiblePmr}
          onChange={(v) => onChange({ ...filters, accessiblePmr: v })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Communauté" icon={<Users className="w-5 h-5" />} defaultOpen={false}>
        <CheckboxGroup
          title="Tranche d'âge"
          items={availableTags.ageRange}
          selected={filters.ageRange}
          labelMap={TAG_LABELS.age_range}
          onToggle={(v) => toggleIn("ageRange", v)}
          onClear={() => onChange({ ...filters, ageRange: [] })}
        />

        <CheckboxGroup
          title="Types de ménages"
          items={availableTags.familyTypes}
          selected={filters.familyTypes}
          labelMap={TAG_LABELS.family_types}
          onToggle={(v) => toggleIn("familyTypes", v)}
          onClear={() => onChange({ ...filters, familyTypes: [] })}
        />

        <fieldset>
          <legend className="block text-sm font-semibold text-[var(--foreground)] mb-3 tracking-tight">
            Taille du groupe
          </legend>
          <div className="flex items-center gap-3">
            <input
              type="number"
              aria-label="Taille minimum"
              value={filters.minGroupSize ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minGroupSize: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Min"
              min={1}
              className={inputClass}
            />
            <span className="text-[var(--muted-light)] text-lg font-light" aria-hidden="true">{"–"}</span>
            <input
              type="number"
              aria-label="Taille maximum"
              value={filters.maxGroupSize ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  maxGroupSize: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Max"
              min={1}
              className={inputClass}
            />
          </div>
        </fieldset>

        <TriStateFilter
          title="Enfants"
          value={filters.hasChildren}
          counts={availableTags.hasChildren}
          onChange={(v) => onChange({ ...filters, hasChildren: v })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Vie communautaire" icon={<Handshake className="w-5 h-5" />} defaultOpen={false}>
        <CheckboxGroup
          title="Repas partagés"
          items={availableTags.sharedMeals}
          selected={filters.sharedMeals}
          labelMap={TAG_LABELS.shared_meals}
          onToggle={(v) => toggleIn("sharedMeals", v)}
          onClear={() => onChange({ ...filters, sharedMeals: [] })}
        />

        <CheckboxGroup
          title="Espaces partagés"
          items={availableTags.sharedSpaces}
          selected={filters.sharedSpaces}
          labelMap={TAG_LABELS.shared_spaces}
          onToggle={(v) => toggleIn("sharedSpaces", v)}
          onClear={() => onChange({ ...filters, sharedSpaces: [] })}
        />

        <CheckboxGroup
          title="Valeurs"
          items={availableTags.values}
          selected={filters.valuesTags}
          labelMap={TAG_LABELS.values}
          onToggle={(v) => toggleIn("valuesTags", v)}
          onClear={() => onChange({ ...filters, valuesTags: [] })}
        />

        <TriStateFilter
          title="Charte existante"
          value={filters.hasCharter}
          counts={availableTags.hasCharter}
          onChange={(v) => onChange({ ...filters, hasCharter: v })}
        />

        <CheckboxGroup
          title="Gouvernance"
          items={availableTags.governance}
          selected={filters.governance}
          labelMap={TAG_LABELS.governance}
          onToggle={(v) => toggleIn("governance", v)}
          onClear={() => onChange({ ...filters, governance: [] })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Animaux" icon={<PawPrint className="w-5 h-5" />} defaultOpen={false}>
        <TriStateFilter
          title="Animaux acceptés"
          value={filters.petsAllowed}
          counts={availableTags.petsAllowed}
          onChange={(v) => onChange({ ...filters, petsAllowed: v })}
        />

        <CheckboxGroup
          title="Type d'animaux"
          items={availableTags.petDetails}
          selected={filters.petDetails}
          labelMap={TAG_LABELS.pet_details}
          onToggle={(v) => toggleIn("petDetails", v)}
          onClear={() => onChange({ ...filters, petDetails: [] })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Environnement & Accès" icon={<TreePine className="w-5 h-5" />} defaultOpen={false}>
        <TriStateFilter
          title="Proche nature"
          value={filters.nearNature}
          counts={availableTags.nearNature}
          onChange={(v) => onChange({ ...filters, nearNature: v })}
        />

        <TriStateFilter
          title="Proche transports"
          value={filters.nearTransport}
          counts={availableTags.nearTransport}
          onChange={(v) => onChange({ ...filters, nearTransport: v })}
        />

        <CheckboxGroup
          title="Disponibilité"
          items={availableTags.availabilityStatus}
          selected={filters.availabilityStatus}
          labelMap={AVAILABILITY_LABELS}
          onToggle={(v) => toggleIn("availabilityStatus", v)}
          onClear={() => onChange({ ...filters, availabilityStatus: [] })}
        />
      </CollapsibleSection>
    </div>
  );
}
