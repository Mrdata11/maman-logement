"use client";

import { useCallback } from "react";
import {
  RetreatFilterState,
  DEFAULT_RETREAT_FILTERS,
  COUNTRY_LABELS,
  COUNTRY_FLAGS,
  SETTING_LABELS,
  STYLE_LABELS,
  ACTIVITY_SPACE_LABELS,
  MEAL_SERVICE_LABELS,
  CUISINE_LABELS,
  SERVICE_LABELS,
  SUITABLE_FOR_LABELS,
  ACCOMMODATION_LABELS,
  OUTDOOR_SPACE_LABELS,
} from "@/lib/retreats/types";
import { countActiveFilters } from "@/lib/retreats/filters";

interface RetreatFilterPanelProps {
  filters: RetreatFilterState;
  onChange: (filters: RetreatFilterState) => void;
  availableCountries: string[];
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Record<string, string>;
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{label}</h4>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(options).map(([value, display]) => {
          const isActive = selected.includes(value);
          return (
            <button
              key={value}
              onClick={() =>
                onChange(
                  isActive
                    ? selected.filter((v) => v !== value)
                    : [...selected, value]
                )
              }
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                isActive
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {display}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RetreatFilterPanel({
  filters,
  onChange,
  availableCountries,
}: RetreatFilterPanelProps) {
  const activeCount = countActiveFilters(filters);

  const updateFilter = useCallback(
    <K extends keyof RetreatFilterState>(key: K, value: RetreatFilterState[K]) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange]
  );

  const reset = useCallback(() => {
    onChange({ ...DEFAULT_RETREAT_FILTERS });
  }, [onChange]);

  // Build country options from available data
  const countryOptions: Record<string, string> = {};
  for (const code of availableCountries) {
    const flag = COUNTRY_FLAGS[code] || "";
    const name = COUNTRY_LABELS[code] || code;
    countryOptions[code] = `${flag} ${name}`;
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-gray-900">
          Filtres {activeCount > 0 && <span className="text-xs font-normal text-gray-500">({activeCount} actifs)</span>}
        </h3>
        {activeCount > 0 && (
          <button onClick={reset} className="text-xs text-gray-500 hover:text-gray-700 underline">
            R\u00e9initialiser
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher un lieu..."
          value={filters.searchText}
          onChange={(e) => updateFilter("searchText", e.target.value)}
          className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      {/* Country */}
      {Object.keys(countryOptions).length > 0 && (
        <CheckboxGroup
          label="Pays"
          options={countryOptions}
          selected={filters.countries}
          onChange={(v) => updateFilter("countries", v)}
        />
      )}

      {/* Capacity */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Capacit\u00e9 du groupe</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.capacityMin ?? ""}
            onChange={(e) => updateFilter("capacityMin", e.target.value ? Number(e.target.value) : null)}
            className="w-20 text-sm border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <span className="text-gray-400 self-center">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.capacityMax ?? ""}
            onChange={(e) => updateFilter("capacityMax", e.target.value ? Number(e.target.value) : null)}
            className="w-20 text-sm border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <span className="text-xs text-gray-400 self-center">pers.</span>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Budget (EUR/pers/nuit)</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin ?? ""}
            onChange={(e) => updateFilter("priceMin", e.target.value ? Number(e.target.value) : null)}
            className="w-20 text-sm border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <span className="text-gray-400 self-center">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax ?? ""}
            onChange={(e) => updateFilter("priceMax", e.target.value ? Number(e.target.value) : null)}
            className="w-20 text-sm border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <span className="text-xs text-gray-400 self-center">EUR</span>
        </div>
      </div>

      {/* Setting */}
      <CheckboxGroup
        label="Cadre"
        options={SETTING_LABELS}
        selected={filters.settings}
        onChange={(v) => updateFilter("settings", v)}
      />

      {/* Style */}
      <CheckboxGroup
        label="Style"
        options={STYLE_LABELS}
        selected={filters.styles}
        onChange={(v) => updateFilter("styles", v)}
      />

      {/* Activity spaces */}
      <CheckboxGroup
        label="Espaces de pratique"
        options={ACTIVITY_SPACE_LABELS}
        selected={filters.activitySpaces}
        onChange={(v) => updateFilter("activitySpaces", v)}
      />

      {/* Suitable for */}
      <CheckboxGroup
        label="Adapt\u00e9 pour"
        options={SUITABLE_FOR_LABELS}
        selected={filters.suitableFor}
        onChange={(v) => updateFilter("suitableFor", v)}
      />

      {/* Meal service */}
      <CheckboxGroup
        label="Restauration"
        options={MEAL_SERVICE_LABELS}
        selected={filters.mealServices}
        onChange={(v) => updateFilter("mealServices", v)}
      />

      {/* Cuisine */}
      <CheckboxGroup
        label="Options cuisine"
        options={CUISINE_LABELS}
        selected={filters.cuisineOptions}
        onChange={(v) => updateFilter("cuisineOptions", v)}
      />

      {/* Accommodation */}
      <CheckboxGroup
        label="H\u00e9bergement"
        options={ACCOMMODATION_LABELS}
        selected={filters.accommodationTypes}
        onChange={(v) => updateFilter("accommodationTypes", v)}
      />

      {/* Outdoor spaces */}
      <CheckboxGroup
        label="Espaces ext\u00e9rieurs"
        options={OUTDOOR_SPACE_LABELS}
        selected={filters.outdoorSpaces}
        onChange={(v) => updateFilter("outdoorSpaces", v)}
      />

      {/* Services */}
      <CheckboxGroup
        label="Services"
        options={SERVICE_LABELS}
        selected={filters.services}
        onChange={(v) => updateFilter("services", v)}
      />

      {/* Score minimum */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Score minimum</h4>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={filters.scoreMin ?? 0}
          onChange={(e) => {
            const val = Number(e.target.value);
            updateFilter("scoreMin", val > 0 ? val : null);
          }}
          className="w-full"
        />
        <div className="text-xs text-gray-500 text-right">
          {filters.scoreMin ? `${filters.scoreMin}+` : "Tous"}
        </div>
      </div>
    </div>
  );
}
