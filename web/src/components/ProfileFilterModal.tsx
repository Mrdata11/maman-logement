"use client";

import { useEffect, useCallback } from "react";
import {
  ProfileUIFilters,
  ProfileTagFilters,
  ProfileFilterCounts,
  DEFAULT_PROFILE_UI_FILTERS,
  DEFAULT_PROFILE_TAG_FILTERS,
  PROFILE_LABELS,
} from "@/lib/profile-filter-types";
import { ProfileTagFilterPanel } from "./ProfileTagFilterPanel";
import { CheckboxGroup } from "./TagFilterPanel";
import {
  X,
  MapPin,
  RotateCcw,
} from "lucide-react";

interface ProfileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiFilters: ProfileUIFilters;
  onUiFiltersChange: (filters: ProfileUIFilters) => void;
  tagFilters: ProfileTagFilters;
  onTagFiltersChange: (filters: ProfileTagFilters) => void;
  availableCounts: ProfileFilterCounts;
  resultCount: number;
  activeFilterCount: number;
}

const inputClass =
  "w-full px-4 py-3 border border-[var(--border-light)] rounded-2xl text-sm bg-[var(--surface)]/50 text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]/40 transition-all duration-200";

export function ProfileFilterModal({
  isOpen,
  onClose,
  uiFilters,
  onUiFiltersChange,
  tagFilters,
  onTagFiltersChange,
  availableCounts,
  resultCount,
  activeFilterCount,
}: ProfileFilterModalProps) {
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

  const toggleRegion = useCallback(
    (region: string) => {
      const next = uiFilters.regions.includes(region)
        ? uiFilters.regions.filter((r) => r !== region)
        : [...uiFilters.regions, region];
      onUiFiltersChange({ ...uiFilters, regions: next });
    },
    [uiFilters, onUiFiltersChange]
  );

  const toggleGender = useCallback(
    (gender: string) => {
      const next = uiFilters.genders.includes(gender)
        ? uiFilters.genders.filter((g) => g !== gender)
        : [...uiFilters.genders, gender];
      onUiFiltersChange({ ...uiFilters, genders: next });
    },
    [uiFilters, onUiFiltersChange]
  );

  const toggleCommunitySize = useCallback(
    (size: string) => {
      const next = uiFilters.communitySize.includes(size)
        ? uiFilters.communitySize.filter((s) => s !== size)
        : [...uiFilters.communitySize, size];
      onUiFiltersChange({ ...uiFilters, communitySize: next });
    },
    [uiFilters, onUiFiltersChange]
  );

  const handleReset = () => {
    onUiFiltersChange({ ...DEFAULT_PROFILE_UI_FILTERS });
    onTagFiltersChange({ ...DEFAULT_PROFILE_TAG_FILTERS });
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

          {/* Personne & Localisation */}
          <section>
            <SectionHeader icon={<MapPin className="w-5 h-5" />} title="Personne & Localisation" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5">
              <CheckboxGroup
                title="Région préférée"
                items={availableCounts.regions}
                selected={uiFilters.regions}
                labelMap={PROFILE_LABELS.regions}
                onToggle={toggleRegion}
                onClear={() => onUiFiltersChange({ ...uiFilters, regions: [] })}
              />
              <CheckboxGroup
                title="Genre"
                items={availableCounts.genders}
                selected={uiFilters.genders}
                labelMap={PROFILE_LABELS.genders}
                onToggle={toggleGender}
                onClear={() => onUiFiltersChange({ ...uiFilters, genders: [] })}
              />

              <fieldset>
                <legend className="block text-sm font-semibold text-[var(--foreground)] mb-3 tracking-tight">
                  Tranche d&apos;âge
                </legend>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    aria-label="Âge minimum"
                    value={uiFilters.ageMin ?? ""}
                    onChange={(e) =>
                      onUiFiltersChange({
                        ...uiFilters,
                        ageMin: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="Min"
                    min={18}
                    max={120}
                    className={inputClass}
                  />
                  <span className="text-[var(--muted-light)] text-lg font-light" aria-hidden="true">{"–"}</span>
                  <input
                    type="number"
                    aria-label="Âge maximum"
                    value={uiFilters.ageMax ?? ""}
                    onChange={(e) =>
                      onUiFiltersChange({
                        ...uiFilters,
                        ageMax: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="Max"
                    min={18}
                    max={120}
                    className={inputClass}
                  />
                </div>
              </fieldset>

              <CheckboxGroup
                title="Taille de communauté"
                items={availableCounts.communitySize}
                selected={uiFilters.communitySize}
                labelMap={PROFILE_LABELS.communitySize}
                onToggle={toggleCommunitySize}
                onClear={() => onUiFiltersChange({ ...uiFilters, communitySize: [] })}
              />
            </div>
          </section>

          {/* Tag Filters */}
          <ProfileTagFilterPanel
            filters={tagFilters}
            onChange={onTagFiltersChange}
            availableCounts={availableCounts}
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
