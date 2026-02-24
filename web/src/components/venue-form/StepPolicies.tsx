"use client";

import {
  ALCOHOL_POLICY_LABELS,
  SMOKING_POLICY_LABELS,
  NOISE_LEVEL_LABELS,
  LANGUAGE_LABELS,
  SERVICE_LABELS,
  SUITABLE_FOR_LABELS,
  SPECIALIZED_EQUIPMENT_LABELS,
} from "@/lib/retreats/types";
import type { VenueFormData } from "@/lib/venue-form/schema";

interface StepPoliciesProps {
  formData: Partial<VenueFormData>;
  onChange: (data: Partial<VenueFormData>) => void;
}

export function StepPolicies({ formData, onChange }: StepPoliciesProps) {
  const updateField = (field: keyof VenueFormData, value: unknown) => {
    onChange({ ...formData, [field]: value });
  };

  const toggleArrayItem = (
    field:
      | "languages_spoken"
      | "services"
      | "suitable_for"
      | "specialized_equipment",
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
          Regles, services et details
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Derniers details pour completer le profil de votre lieu.
        </p>
      </div>

      {/* Politique alcool */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Politique concernant l&apos;alcool
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ALCOHOL_POLICY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => updateField("alcohol_policy", key)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                formData.alcohol_policy === key
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47] font-medium"
                  : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Enfants / Accessibilite / Animaux */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
            Enfants bienvenus ?
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateField("children_welcome", true)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                formData.children_welcome === true
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47] font-medium"
                  : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
              }`}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => updateField("children_welcome", false)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                formData.children_welcome === false
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47] font-medium"
                  : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
              }`}
            >
              Non
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
            Accessible PMR ?
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateField("accessible", true)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                formData.accessible === true
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47] font-medium"
                  : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
              }`}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => updateField("accessible", false)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                formData.accessible === false
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47] font-medium"
                  : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
              }`}
            >
              Non
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
            Animaux acceptes ?
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateField("pets_allowed", true)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                formData.pets_allowed === true
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47] font-medium"
                  : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
              }`}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => updateField("pets_allowed", false)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                formData.pets_allowed === false
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47] font-medium"
                  : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
              }`}
            >
              Non
            </button>
          </div>
        </div>
      </div>

      {/* Politique tabac */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Politique tabac
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SMOKING_POLICY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => updateField("smoking_policy", key)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                formData.smoking_policy === key
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47] font-medium"
                  : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Niveau sonore */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Niveau sonore de l&apos;environnement
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(NOISE_LEVEL_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => updateField("noise_level", key)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                formData.noise_level === key
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47] font-medium"
                  : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Ceremonies */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Ceremonies autorisees (encens, bougies, rituels) ?
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateField("ceremonies_allowed", true)}
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              formData.ceremonies_allowed === true
                ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
            }`}
          >
            Oui
          </button>
          <button
            type="button"
            onClick={() => updateField("ceremonies_allowed", false)}
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              formData.ceremonies_allowed === false
                ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
            }`}
          >
            Non
          </button>
        </div>
      </div>

      {/* Langues parlees */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Langues parlees par l&apos;equipe
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                (formData.languages_spoken || []).includes(key)
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                  : "border-[var(--border-light)] hover:border-[var(--border-color)]"
              }`}
            >
              <input
                type="checkbox"
                checked={(formData.languages_spoken || []).includes(key)}
                onChange={() => toggleArrayItem("languages_spoken", key)}
                className="sr-only"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Services fournis */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Services fournis
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(SERVICE_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                (formData.services || []).includes(key)
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                  : "border-[var(--border-light)] hover:border-[var(--border-color)]"
              }`}
            >
              <input
                type="checkbox"
                checked={(formData.services || []).includes(key)}
                onChange={() => toggleArrayItem("services", key)}
                className="sr-only"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Types de retraites adaptes */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Types de retraites adaptes
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(SUITABLE_FOR_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                (formData.suitable_for || []).includes(key)
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                  : "border-[var(--border-light)] hover:border-[var(--border-color)]"
              }`}
            >
              <input
                type="checkbox"
                checked={(formData.suitable_for || []).includes(key)}
                onChange={() => toggleArrayItem("suitable_for", key)}
                className="sr-only"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Equipement specialise */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Equipement specialise disponible
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(SPECIALIZED_EQUIPMENT_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                (formData.specialized_equipment || []).includes(key)
                  ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                  : "border-[var(--border-light)] hover:border-[var(--border-color)]"
              }`}
            >
              <input
                type="checkbox"
                checked={(formData.specialized_equipment || []).includes(key)}
                onChange={() => toggleArrayItem("specialized_equipment", key)}
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
