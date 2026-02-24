"use client";

import {
  ACCOMMODATION_LABELS,
  ACTIVITY_SPACE_LABELS,
  OUTDOOR_SPACE_LABELS,
} from "@/lib/retreats/types";
import type { VenueFormData } from "@/lib/venue-form/schema";

interface StepSpacesProps {
  formData: Partial<VenueFormData>;
  onChange: (data: Partial<VenueFormData>) => void;
}

export function StepSpaces({ formData, onChange }: StepSpacesProps) {
  const updateField = (field: keyof VenueFormData, value: unknown) => {
    onChange({ ...formData, [field]: value });
  };

  const toggleArrayItem = (
    field: "accommodation_types" | "activity_spaces" | "outdoor_spaces",
    item: string
  ) => {
    const current = (formData[field] as string[]) || [];
    const next = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    updateField(field, next);
  };

  const parseNumber = (value: string): number | null => {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  };

  const parseFloat2 = (value: string): number | null => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-[var(--foreground)] mb-1">
          Espaces et capacite
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Decrivez les espaces disponibles dans votre lieu.
        </p>
      </div>

      {/* Capacite */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Capacite d&apos;accueil
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">
              Minimum
            </label>
            <input
              type="number"
              min={1}
              value={formData.capacity_min ?? ""}
              onChange={(e) =>
                updateField("capacity_min", parseNumber(e.target.value))
              }
              placeholder="ex: 10"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">
              Maximum
            </label>
            <input
              type="number"
              min={1}
              value={formData.capacity_max ?? ""}
              onChange={(e) =>
                updateField("capacity_max", parseNumber(e.target.value))
              }
              placeholder="ex: 30"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">
              Chambres
            </label>
            <input
              type="number"
              min={0}
              value={formData.num_rooms ?? ""}
              onChange={(e) =>
                updateField("num_rooms", parseNumber(e.target.value))
              }
              placeholder="ex: 12"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">
              Lits
            </label>
            <input
              type="number"
              min={0}
              value={formData.num_beds ?? ""}
              onChange={(e) =>
                updateField("num_beds", parseNumber(e.target.value))
              }
              placeholder="ex: 20"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Types d'hebergement */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Types d&apos;hebergement
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(ACCOMMODATION_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                (formData.accommodation_types || []).includes(key)
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                  : "border-[var(--border-light)] hover:border-[var(--border-color)]"
              }`}
            >
              <input
                type="checkbox"
                checked={(formData.accommodation_types || []).includes(key)}
                onChange={() => toggleArrayItem("accommodation_types", key)}
                className="sr-only"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Espaces d'activite */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Espaces d&apos;activite
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(ACTIVITY_SPACE_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                (formData.activity_spaces || []).includes(key)
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                  : "border-[var(--border-light)] hover:border-[var(--border-color)]"
              }`}
            >
              <input
                type="checkbox"
                checked={(formData.activity_spaces || []).includes(key)}
                onChange={() => toggleArrayItem("activity_spaces", key)}
                className="sr-only"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Espaces exterieurs */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Espaces exterieurs
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(OUTDOOR_SPACE_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                (formData.outdoor_spaces || []).includes(key)
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                  : "border-[var(--border-light)] hover:border-[var(--border-color)]"
              }`}
            >
              <input
                type="checkbox"
                checked={(formData.outdoor_spaces || []).includes(key)}
                onChange={() => toggleArrayItem("outdoor_spaces", key)}
                className="sr-only"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Espace de pratique principal */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Espace de pratique principal
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">
              Capacite (personnes)
            </label>
            <input
              type="number"
              min={1}
              value={formData.main_practice_space_capacity ?? ""}
              onChange={(e) =>
                updateField(
                  "main_practice_space_capacity",
                  parseNumber(e.target.value)
                )
              }
              placeholder="ex: 25"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">
              Surface (m2)
            </label>
            <input
              type="number"
              min={1}
              step={0.5}
              value={formData.main_practice_space_m2 ?? ""}
              onChange={(e) =>
                updateField(
                  "main_practice_space_m2",
                  parseFloat2(e.target.value)
                )
              }
              placeholder="ex: 80"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
