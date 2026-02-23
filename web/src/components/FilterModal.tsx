"use client";

import { useEffect, useCallback } from "react";
import { UIFilterState, UITagFilters, LISTING_TYPE_LABELS, DEFAULT_UI_FILTERS, DEFAULT_TAG_FILTERS } from "@/lib/types";
import { TagFilterPanel, TagFilterCounts } from "./TagFilterPanel";
import {
  X,
  MapPin,
  Euro,
  RotateCcw,
} from "lucide-react";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiFilters: UIFilterState;
  onUiFiltersChange: (filters: UIFilterState) => void;
  availableProvinces: { value: string; count: number }[];
  availableListingTypes: { value: string; count: number }[];
  priceRange: { min: number; max: number };
  tagFilters: UITagFilters;
  onTagFiltersChange: (filters: UITagFilters) => void;
  availableTags: TagFilterCounts;
  resultCount: number;
  activeFilterCount: number;
}

const inputClass =
  "w-full px-4 py-3 border border-[var(--border-light)] rounded-2xl text-sm bg-[var(--surface)]/50 text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]/40 transition-all duration-200";

export function FilterModal({
  isOpen,
  onClose,
  uiFilters,
  onUiFiltersChange,
  availableProvinces,
  availableListingTypes,
  priceRange,
  tagFilters,
  onTagFiltersChange,
  availableTags,
  resultCount,
  activeFilterCount,
}: FilterModalProps) {
  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const toggleProvince = useCallback(
    (province: string) => {
      const next = uiFilters.provinces.includes(province)
        ? uiFilters.provinces.filter((p) => p !== province)
        : [...uiFilters.provinces, province];
      onUiFiltersChange({ ...uiFilters, provinces: next });
    },
    [uiFilters, onUiFiltersChange]
  );

  const toggleListingType = useCallback(
    (type: string) => {
      const next = uiFilters.listingTypes.includes(type)
        ? uiFilters.listingTypes.filter((t) => t !== type)
        : [...uiFilters.listingTypes, type];
      onUiFiltersChange({ ...uiFilters, listingTypes: next });
    },
    [uiFilters, onUiFiltersChange]
  );

  const handleReset = () => {
    onUiFiltersChange({ ...DEFAULT_UI_FILTERS });
    onTagFiltersChange({ ...DEFAULT_TAG_FILTERS });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-2xl sm:mx-4 max-h-[95vh] sm:max-h-[85vh] bg-[var(--card-bg)] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-modalIn overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[var(--border-light)] shrink-0 bg-[var(--card-bg)]">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--surface)] hover:bg-[var(--border-color)] transition-all duration-200"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-[var(--foreground)]" />
          </button>
          <h2 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">Filtres</h2>
          <div className="w-9" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-7 py-8 space-y-10 filter-scroll">

          {/* Localisation */}
          <section>
            <SectionHeader icon={<MapPin className="w-5 h-5" />} title="Localisation" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5">
              <fieldset>
                <div className="flex items-center justify-between mb-3">
                  <legend className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                    Province / Région
                  </legend>
                  {uiFilters.provinces.length > 0 && (
                    <button
                      onClick={() => onUiFiltersChange({ ...uiFilters, provinces: [] })}
                      className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                    >
                      Toutes
                    </button>
                  )}
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto filter-scroll rounded-2xl border border-[var(--border-light)] p-2 bg-[var(--surface)]/30">
                  {availableProvinces.map(({ value, count }) => (
                    <label
                      key={value}
                      className="flex items-center gap-3 text-sm text-[var(--foreground)] cursor-pointer hover:bg-[var(--surface)] px-3 py-2 rounded-xl transition-all duration-150"
                    >
                      <input
                        type="checkbox"
                        checked={uiFilters.provinces.includes(value)}
                        onChange={() => toggleProvince(value)}
                        className="filter-checkbox"
                      />
                      <span className="flex-1 font-medium">{value}</span>
                      <span className="text-xs text-[var(--muted-light)] bg-[var(--surface)] px-2 py-0.5 rounded-full font-medium">{count}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <div className="flex items-center justify-between mb-3">
                  <legend className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                    {"Type d'annonce"}
                  </legend>
                  {uiFilters.listingTypes.length > 0 && (
                    <button
                      onClick={() => onUiFiltersChange({ ...uiFilters, listingTypes: [] })}
                      className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                    >
                      Tous
                    </button>
                  )}
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto filter-scroll rounded-2xl border border-[var(--border-light)] p-2 bg-[var(--surface)]/30">
                  {availableListingTypes.map(({ value, count }) => (
                    <label
                      key={value}
                      className="flex items-center gap-3 text-sm text-[var(--foreground)] cursor-pointer hover:bg-[var(--surface)] px-3 py-2 rounded-xl transition-all duration-150"
                    >
                      <input
                        type="checkbox"
                        checked={uiFilters.listingTypes.includes(value)}
                        onChange={() => toggleListingType(value)}
                        className="filter-checkbox"
                      />
                      <span className="flex-1 font-medium">{LISTING_TYPE_LABELS[value] || value}</span>
                      <span className="text-xs text-[var(--muted-light)] bg-[var(--surface)] px-2 py-0.5 rounded-full font-medium">{count}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>

          {/* Prix & Score */}
          <section>
            <SectionHeader icon={<Euro className="w-5 h-5" />} title="Prix & Score" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5">
              <fieldset>
                <legend className="block text-sm font-semibold text-[var(--foreground)] mb-3 tracking-tight">
                  Fourchette de prix
                </legend>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    aria-label="Prix minimum"
                    value={uiFilters.priceMin ?? ""}
                    onChange={(e) =>
                      onUiFiltersChange({
                        ...uiFilters,
                        priceMin: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder={`Min (${priceRange.min}\u00A0\u20AC)`}
                    step={50}
                    min={0}
                    className={inputClass}
                  />
                  <span className="text-[var(--muted-light)] text-lg font-light" aria-hidden="true">{"\u2013"}</span>
                  <input
                    type="number"
                    aria-label="Prix maximum"
                    value={uiFilters.priceMax ?? ""}
                    onChange={(e) =>
                      onUiFiltersChange({
                        ...uiFilters,
                        priceMax: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder={`Max (${priceRange.max}\u00A0\u20AC)`}
                    step={50}
                    min={0}
                    className={inputClass}
                  />
                </div>
                <label className="flex items-center gap-3 mt-3 text-sm text-[var(--muted)] cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={uiFilters.includeNullPrice}
                    onChange={(e) =>
                      onUiFiltersChange({ ...uiFilters, includeNullPrice: e.target.checked })
                    }
                    className="filter-checkbox"
                  />
                  <span className="group-hover:text-[var(--foreground)] transition-colors">Inclure les annonces sans prix</span>

                </label>
              </fieldset>

              <fieldset>
                <label
                  htmlFor="modal-filter-score-min"
                  className="block text-sm font-semibold text-[var(--foreground)] mb-3 tracking-tight"
                >
                  Score minimum
                </label>
                <input
                  id="modal-filter-score-min"
                  type="number"
                  value={uiFilters.scoreMin ?? ""}
                  onChange={(e) =>
                    onUiFiltersChange({
                      ...uiFilters,
                      scoreMin: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="Score minimum (0-100)"
                  min={0}
                  max={100}
                  step={5}
                  className={inputClass}
                />
                <label className="flex items-center gap-3 mt-3 text-sm text-[var(--muted)] cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={uiFilters.includeUnscored}
                    onChange={(e) =>
                      onUiFiltersChange({ ...uiFilters, includeUnscored: e.target.checked })
                    }
                    className="filter-checkbox"
                  />
                  <span className="group-hover:text-[var(--foreground)] transition-colors">Inclure les annonces non évaluées</span>
                </label>
              </fieldset>
            </div>
          </section>

          {/* Tag Filters */}
          <TagFilterPanel
            filters={tagFilters}
            onChange={onTagFiltersChange}
            availableTags={availableTags}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-5 border-t border-[var(--border-light)] shrink-0 bg-[var(--card-bg)]">
          <button
            onClick={handleReset}
            className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
              activeFilterCount > 0
                ? "text-[var(--foreground)] hover:text-[var(--primary)]"
                : "text-[var(--muted-light)] cursor-default"
            }`}
            disabled={activeFilterCount === 0}
          >
            <RotateCcw className="w-4 h-4" />
            Tout effacer
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-[var(--primary)] text-white text-sm font-semibold rounded-2xl hover:bg-[var(--primary-hover)] transition-all duration-200 shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl hover:shadow-[var(--primary)]/30 active:scale-[0.98]"
          >
            Voir {resultCount} résultat{resultCount !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">{title}</h3>
    </div>
  );
}
