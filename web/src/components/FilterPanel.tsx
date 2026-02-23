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
  children?: React.ReactNode;
}

export function FilterPanel({
  filters,
  onChange,
  onReset,
  availableProvinces,
  availableListingTypes,
  priceRange,
  children,
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
    <div className="mb-6 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4">
      {/* Text search */}
      <div className="mb-4">
        <label
          htmlFor="filter-search"
          className="block text-sm font-medium text-[var(--foreground)] mb-1"
        >
          Recherche
        </label>
        <input
          id="filter-search"
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Rechercher dans les titres et descriptions..."
          className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md text-sm bg-[var(--input-bg)] text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Province / Region */}
        <fieldset>
          <div className="flex items-center justify-between mb-2">
            <legend className="text-sm font-medium text-[var(--foreground)]">
              Province / Région
            </legend>
            {filters.provinces.length > 0 && (
              <button
                onClick={() => onChange({ ...filters, provinces: [] })}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                Toutes
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {availableProvinces.map(({ value, count }) => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer hover:bg-[var(--surface)] px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.provinces.includes(value)}
                  onChange={() => toggleProvince(value)}
                  className="rounded border-[var(--input-border)] accent-[var(--primary)]"
                />
                <span className="flex-1">{value}</span>
                <span className="text-xs text-[var(--muted-light)]">
                  {count}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Listing type */}
        <fieldset>
          <div className="flex items-center justify-between mb-2">
            <legend className="text-sm font-medium text-[var(--foreground)]">
              {"Type d'annonce"}
            </legend>
            {filters.listingTypes.length > 0 && (
              <button
                onClick={() => onChange({ ...filters, listingTypes: [] })}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                Tous
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {availableListingTypes.map(({ value, count }) => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer hover:bg-[var(--surface)] px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.listingTypes.includes(value)}
                  onChange={() => toggleListingType(value)}
                  className="rounded border-[var(--input-border)] accent-[var(--primary)]"
                />
                <span className="flex-1">
                  {LISTING_TYPE_LABELS[value] || value}
                </span>
                <span className="text-xs text-[var(--muted-light)]">
                  {count}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Price range */}
        <fieldset>
          <legend className="block text-sm font-medium text-[var(--foreground)] mb-2">
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
              className="w-full px-2 py-1.5 border border-[var(--input-border)] rounded-md text-sm bg-[var(--input-bg)] text-[var(--foreground)] placeholder-[var(--muted-light)]"
            />
            <span className="text-[var(--muted-light)]" aria-hidden="true">
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
              className="w-full px-2 py-1.5 border border-[var(--input-border)] rounded-md text-sm bg-[var(--input-bg)] text-[var(--foreground)] placeholder-[var(--muted-light)]"
            />
          </div>
          <label className="flex items-center gap-2 mt-2 text-sm text-[var(--muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={filters.includeNullPrice}
              onChange={(e) =>
                onChange({ ...filters, includeNullPrice: e.target.checked })
              }
              className="rounded border-[var(--input-border)] accent-[var(--primary)]"
            />
            Inclure les annonces sans prix
          </label>
        </fieldset>

        {/* Score minimum */}
        <fieldset>
          <label
            htmlFor="filter-score-min"
            className="block text-sm font-medium text-[var(--foreground)] mb-2"
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
            className="w-full px-2 py-1.5 border border-[var(--input-border)] rounded-md text-sm bg-[var(--input-bg)] text-[var(--foreground)] placeholder-[var(--muted-light)]"
          />
          <label className="flex items-center gap-2 mt-2 text-sm text-[var(--muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={filters.includeUnscored}
              onChange={(e) =>
                onChange({ ...filters, includeUnscored: e.target.checked })
              }
              className="rounded border-[var(--input-border)] accent-[var(--primary)]"
            />
            {"Inclure les annonces non évaluées"}
          </label>
        </fieldset>
      </div>

      {/* Tag filters (passed as children) */}
      {children}

      {/* Reset button */}
      {hasActiveFilters && (
        <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
          <span className="text-sm text-[var(--muted)]">
            Filtres actifs
          </span>
          <button
            onClick={onReset}
            className="text-sm px-3 py-1.5 border border-[var(--border-color)] text-[var(--muted)] rounded-md hover:bg-[var(--surface)] transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
