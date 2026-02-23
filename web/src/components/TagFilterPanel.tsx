"use client";

import { useCallback } from "react";
import { UITagFilters, TAG_LABELS } from "@/lib/types";

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
}

function CheckboxGroup({
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
      <div className="flex items-center justify-between mb-1.5">
        <legend className="text-sm font-medium text-gray-700">
          {title}
        </legend>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-blue-600 hover:underline"
          >
            Tous
          </button>
        )}
      </div>
      <div className="space-y-0.5 max-h-36 overflow-y-auto">
        {items.map(({ value, count }) => (
          <label
            key={value}
            className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50:bg-slate-700 px-2 py-0.5 rounded"
          >
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
              className="rounded border-gray-300 accent-blue-600"
            />
            <span className="flex-1 truncate">
              {labelMap[value] || value}
            </span>
            <span className="text-xs text-gray-400">
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
      <legend className="text-sm font-medium text-gray-700 mb-1.5">
        {title}
      </legend>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(null)}
          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
            value === null
              ? "bg-blue-600 text-white border-blue-600"
              : "border-gray-300 text-gray-600 hover:bg-gray-50:bg-slate-700"
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => onChange(true)}
          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
            value === true
              ? "bg-green-600 text-white border-green-600"
              : "border-gray-300 text-gray-600 hover:bg-gray-50:bg-slate-700"
          }`}
        >
          Oui ({counts.yes})
        </button>
        <button
          onClick={() => onChange(false)}
          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
            value === false
              ? "bg-red-600 text-white border-red-600"
              : "border-gray-300 text-gray-600 hover:bg-gray-50:bg-slate-700"
          }`}
        >
          Non ({counts.no})
        </button>
      </div>
    </fieldset>
  );
}

export function TagFilterPanel({
  filters,
  onChange,
  availableTags,
}: TagFilterPanelProps) {
  const toggleIn = useCallback(
    (key: keyof Pick<UITagFilters, "projectTypes" | "environments" | "sharedSpaces" | "valuesTags" | "sharedMeals" | "unitTypes">, value: string) => {
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
    availableTags.hasCharter.yes > 0;

  if (!hasAnyData) return null;

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Filtres avances
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <CheckboxGroup
          title="Espaces partages"
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

        <CheckboxGroup
          title="Repas partages"
          items={availableTags.sharedMeals}
          selected={filters.sharedMeals}
          labelMap={TAG_LABELS.shared_meals}
          onToggle={(v) => toggleIn("sharedMeals", v)}
          onClear={() => onChange({ ...filters, sharedMeals: [] })}
        />

        <CheckboxGroup
          title="Type de logement"
          items={availableTags.unitTypes}
          selected={filters.unitTypes}
          labelMap={TAG_LABELS.unit_type}
          onToggle={(v) => toggleIn("unitTypes", v)}
          onClear={() => onChange({ ...filters, unitTypes: [] })}
        />

        <TriStateFilter
          title="Animaux acceptes"
          value={filters.petsAllowed}
          counts={availableTags.petsAllowed}
          onChange={(v) => onChange({ ...filters, petsAllowed: v })}
        />

        <TriStateFilter
          title="Enfants"
          value={filters.hasChildren}
          counts={availableTags.hasChildren}
          onChange={(v) => onChange({ ...filters, hasChildren: v })}
        />

        <TriStateFilter
          title="Charte existante"
          value={filters.hasCharter}
          counts={availableTags.hasCharter}
          onChange={(v) => onChange({ ...filters, hasCharter: v })}
        />

        {/* Bedrooms min */}
        <fieldset>
          <label
            htmlFor="tag-min-bedrooms"
            className="block text-sm font-medium text-gray-700 mb-1.5"
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
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-400"
          />
        </fieldset>

        {/* Surface range */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-1.5">
            Surface (m2)
          </legend>
          <div className="flex items-center gap-2">
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
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-400"
            />
            <span className="text-gray-400" aria-hidden="true">—</span>
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
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-400"
            />
          </div>
        </fieldset>
      </div>
    </div>
  );
}
