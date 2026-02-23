"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { UIFilterState, LISTING_TYPE_LABELS } from "@/lib/types";

interface FilterPanelProps {
  filters: UIFilterState;
  onChange: (filters: UIFilterState) => void;
  onReset: () => void;
  availableProvinces: { value: string; count: number }[];
  availableListingTypes: { value: string; count: number }[];
  priceRange: { min: number; max: number };
}

export function FilterPanel({
  filters,
  onChange,
  onReset,
  availableProvinces,
  availableListingTypes,
  priceRange,
}: FilterPanelProps) {
  // Debounced text search - use refs to avoid stale closures
  const [localSearch, setLocalSearch] = useState(filters.searchText);
  const filtersRef = useRef(filters);
  const onChangeRef = useRef(onChange);
  filtersRef.current = filters;
  onChangeRef.current = onChange;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filtersRef.current.searchText) {
        onChangeRef.current({ ...filtersRef.current, searchText: localSearch });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Sync when external reset happens
  useEffect(() => {
    setLocalSearch(filters.searchText);
  }, [filters.searchText]);

  const toggleProvince = useCallback(
    (province: string) => {
      const next = filters.provinces.includes(province)
        ? filters.provinces.filter((p) => p !== province)
        : [...filters.provinces, province];
      onChange({ ...filters, provinces: next });
    },
    [filters, onChange]
  );

  const toggleListingType = useCallback(
    (type: string) => {
      const next = filters.listingTypes.includes(type)
        ? filters.listingTypes.filter((t) => t !== type)
        : [...filters.listingTypes, type];
      onChange({ ...filters, listingTypes: next });
    },
    [filters, onChange]
  );

  const hasActiveFilters =
    filters.searchText.trim() !== "" ||
    filters.provinces.length > 0 ||
    filters.listingTypes.length > 0 ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.scoreMin !== null;

  return (
    <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      {/* Text search */}
      <div className="mb-4">
        <label
          htmlFor="filter-search"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Recherche
        </label>
        <input
          id="filter-search"
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Rechercher dans les titres et descriptions..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Province / Region */}
        <fieldset>
          <div className="flex items-center justify-between mb-2">
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Province / Région
            </legend>
            {filters.provinces.length > 0 && (
              <button
                onClick={() => onChange({ ...filters, provinces: [] })}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Toutes
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {availableProvinces.map(({ value, count }) => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.provinces.includes(value)}
                  onChange={() => toggleProvince(value)}
                  className="rounded border-gray-300 dark:border-slate-600 accent-blue-600"
                />
                <span className="flex-1">{value}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {count}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Listing type */}
        <fieldset>
          <div className="flex items-center justify-between mb-2">
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {"Type d'annonce"}
            </legend>
            {filters.listingTypes.length > 0 && (
              <button
                onClick={() => onChange({ ...filters, listingTypes: [] })}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Tous
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {availableListingTypes.map(({ value, count }) => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.listingTypes.includes(value)}
                  onChange={() => toggleListingType(value)}
                  className="rounded border-gray-300 dark:border-slate-600 accent-blue-600"
                />
                <span className="flex-1">
                  {LISTING_TYPE_LABELS[value] || value}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {count}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Price range */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fourchette de prix
          </legend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              aria-label="Prix minimum"
              value={filters.priceMin ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  priceMin: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder={`Min (${priceRange.min}€)`}
              step={50}
              min={0}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <span className="text-gray-400" aria-hidden="true">
              —
            </span>
            <input
              type="number"
              aria-label="Prix maximum"
              value={filters.priceMax ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  priceMax: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder={`Max (${priceRange.max}€)`}
              step={50}
              min={0}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.includeNullPrice}
              onChange={(e) =>
                onChange({ ...filters, includeNullPrice: e.target.checked })
              }
              className="rounded border-gray-300 dark:border-slate-600 accent-blue-600"
            />
            Inclure les annonces sans prix
          </label>
        </fieldset>

        {/* Score minimum */}
        <fieldset>
          <label
            htmlFor="filter-score-min"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Score minimum
          </label>
          <input
            id="filter-score-min"
            type="number"
            value={filters.scoreMin ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                scoreMin: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder="Score minimum (0-100)"
            min={0}
            max={100}
            step={5}
            className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.includeUnscored}
              onChange={(e) =>
                onChange({ ...filters, includeUnscored: e.target.checked })
              }
              className="rounded border-gray-300 dark:border-slate-600 accent-blue-600"
            />
            {"Inclure les annonces non évaluées"}
          </label>
        </fieldset>
      </div>

      {/* Reset button */}
      {hasActiveFilters && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Filtres actifs
          </span>
          <button
            onClick={onReset}
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
