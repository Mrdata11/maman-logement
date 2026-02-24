"use client";

import {
  MEAL_SERVICE_LABELS,
  CUISINE_LABELS,
  KITCHEN_TYPE_LABELS,
  KITCHEN_EQUIPMENT_LABELS,
} from "@/lib/retreats/types";
import type { VenueFormData } from "@/lib/venue-form/schema";

interface StepDiningProps {
  formData: Partial<VenueFormData>;
  onChange: (data: Partial<VenueFormData>) => void;
}

export function StepDining({ formData, onChange }: StepDiningProps) {
  const updateField = (field: keyof VenueFormData, value: unknown) => {
    onChange({ ...formData, [field]: value });
  };

  const toggleArrayItem = (
    field: "cuisine_options" | "kitchen_equipment",
    item: string
  ) => {
    const current = (formData[field] as string[]) || [];
    const next = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    updateField(field, next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-[var(--foreground)] mb-1">
          Restauration
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Decrivez les options de restauration disponibles.
        </p>
      </div>

      {/* Service de repas */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Service de repas
        </label>
        <div className="space-y-2">
          {Object.entries(MEAL_SERVICE_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                formData.meal_service === key
                  ? "border-[#8B6F47] bg-[#8B6F47]/5"
                  : "border-[var(--border-light)] hover:border-[var(--border-color)]"
              }`}
            >
              <input
                type="radio"
                name="meal_service"
                checked={formData.meal_service === key}
                onChange={() => updateField("meal_service", key)}
                className="w-4 h-4 text-[#8B6F47] border-[var(--input-border)] focus:ring-[#8B6F47]"
              />
              <span className="text-sm text-[var(--foreground)]">{label}</span>
            </label>
          ))}
          <label
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
              formData.meal_service === null || formData.meal_service === undefined
                ? "border-[var(--border-light)]"
                : "border-[var(--border-light)] hover:border-[var(--border-color)]"
            }`}
          >
            <input
              type="radio"
              name="meal_service"
              checked={!formData.meal_service}
              onChange={() => updateField("meal_service", null)}
              className="w-4 h-4 text-[#8B6F47] border-[var(--input-border)] focus:ring-[#8B6F47]"
            />
            <span className="text-sm text-[var(--muted)]">
              Non renseigne
            </span>
          </label>
        </div>
      </div>

      {/* Options de cuisine */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Options de cuisine proposees
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(CUISINE_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                (formData.cuisine_options || []).includes(key)
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                  : "border-[var(--border-light)] hover:border-[var(--border-color)]"
              }`}
            >
              <input
                type="checkbox"
                checked={(formData.cuisine_options || []).includes(key)}
                onChange={() => toggleArrayItem("cuisine_options", key)}
                className="sr-only"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Acces cuisine */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Les groupes ont-ils acces a la cuisine ?
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateField("kitchen_access", true)}
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              formData.kitchen_access === true
                ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
            }`}
          >
            Oui
          </button>
          <button
            type="button"
            onClick={() => updateField("kitchen_access", false)}
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              formData.kitchen_access === false
                ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
            }`}
          >
            Non
          </button>
        </div>
      </div>

      {/* Type de cuisine */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Type de cuisine
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(KITCHEN_TYPE_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                formData.kitchen_type === key
                  ? "border-[#8B6F47] bg-[#8B6F47]/5"
                  : "border-[var(--border-light)] hover:border-[var(--border-color)]"
              }`}
            >
              <input
                type="radio"
                name="kitchen_type"
                checked={formData.kitchen_type === key}
                onChange={() => updateField("kitchen_type", key)}
                className="w-4 h-4 text-[#8B6F47] border-[var(--input-border)] focus:ring-[#8B6F47]"
              />
              <span className="text-sm text-[var(--foreground)]">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Equipement cuisine */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Equipement cuisine
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(KITCHEN_EQUIPMENT_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                (formData.kitchen_equipment || []).includes(key)
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                  : "border-[var(--border-light)] hover:border-[var(--border-color)]"
              }`}
            >
              <input
                type="checkbox"
                checked={(formData.kitchen_equipment || []).includes(key)}
                onChange={() => toggleArrayItem("kitchen_equipment", key)}
                className="sr-only"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
