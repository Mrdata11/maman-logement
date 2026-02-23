"use client";

import {
  SearchProfile,
  RefinementWeights,
  RefinementFilters,
  DEFAULT_WEIGHTS,
  DEFAULT_FILTERS,
} from "@/lib/types";

const PRESET_PROFILES: SearchProfile[] = [
  {
    id: "explore",
    name: "Tout explorer",
    description: "Voir toutes les annonces sans filtre",
    weights: { ...DEFAULT_WEIGHTS },
    filters: { ...DEFAULT_FILTERS },
  },
  {
    id: "spiritual",
    name: "Communaute spirituelle",
    description: "Biodanza, valeurs, repas communautaires",
    weights: {
      ...DEFAULT_WEIGHTS,
      spiritual_alignment: 3.0,
      values_alignment: 2.5,
      community_meals: 2.5,
      large_hall_biodanza: 2.5,
      common_projects: 2.0,
      charter_openness: 2.0,
    },
    filters: { ...DEFAULT_FILTERS },
  },
  {
    id: "budget",
    name: "Petit budget Wallonie",
    description: "Max 750 euros, en Wallonie",
    weights: {
      ...DEFAULT_WEIGHTS,
      rental_price: 3.0,
      unit_type: 2.0,
    },
    filters: {
      ...DEFAULT_FILTERS,
      max_price: 750,
      listing_types_include: ["offre-location"],
      locations_exclude: ["Flandre"],
    },
  },
  {
    id: "proximity",
    name: "Proche Bruxelles",
    description: "30-45 min de Bruxelles",
    weights: {
      ...DEFAULT_WEIGHTS,
      location_brussels: 3.0,
      near_hospital: 2.0,
    },
    filters: {
      ...DEFAULT_FILTERS,
      locations_include: ["Bruxelles", "Brabant Wallon"],
    },
  },
];

interface SearchProfilesProps {
  activeProfileId: string | null;
  onApply: (weights: RefinementWeights, filters: RefinementFilters, profileId: string | null) => void;
}

export function SearchProfiles({ activeProfileId, onApply }: SearchProfilesProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-1">
        Profils :
      </span>
      {PRESET_PROFILES.map((profile) => (
        <button
          key={profile.id}
          onClick={() => {
            if (activeProfileId === profile.id) {
              // Deselect = back to default
              onApply({ ...DEFAULT_WEIGHTS }, { ...DEFAULT_FILTERS }, null);
            } else {
              onApply(profile.weights, profile.filters, profile.id);
            }
          }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            activeProfileId === profile.id
              ? "bg-amber-600 text-white shadow-md"
              : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-400"
          }`}
          title={profile.description}
        >
          {profile.name}
        </button>
      ))}
    </div>
  );
}
