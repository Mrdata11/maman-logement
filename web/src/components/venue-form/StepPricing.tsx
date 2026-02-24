"use client";

import type { VenueFormData } from "@/lib/venue-form/schema";

interface StepPricingProps {
  formData: Partial<VenueFormData>;
  onChange: (data: Partial<VenueFormData>) => void;
}

const CURRENCY_OPTIONS = [
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "Livre sterling (GBP)" },
  { value: "USD", label: "Dollar US (USD)" },
  { value: "CHF", label: "Franc suisse (CHF)" },
  { value: "THB", label: "Baht thailandais (THB)" },
  { value: "IDR", label: "Roupie indonesienne (IDR)" },
  { value: "INR", label: "Roupie indienne (INR)" },
  { value: "MAD", label: "Dirham marocain (MAD)" },
];

const CANCELLATION_OPTIONS = [
  { value: "flexible", label: "Flexible (remboursement jusqu'a 7j avant)" },
  { value: "moderate", label: "Moderee (remboursement jusqu'a 30j avant)" },
  { value: "strict", label: "Stricte (remboursement jusqu'a 60j avant)" },
  { value: "non_refundable", label: "Non remboursable" },
];

export function StepPricing({ formData, onChange }: StepPricingProps) {
  const updateField = (field: keyof VenueFormData, value: unknown) => {
    onChange({ ...formData, [field]: value });
  };

  const parseNumber = (value: string): number | null => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-[var(--foreground)] mb-1">
          Tarifs et conditions
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Indiquez vos tarifs et conditions de reservation.
        </p>
      </div>

      {/* Devise */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          Devise
        </label>
        <select
          value={formData.currency || "EUR"}
          onChange={(e) => updateField("currency", e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
        >
          {CURRENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Prix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Prix par personne / nuit
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step={1}
              value={formData.price_per_person_per_night ?? ""}
              onChange={(e) =>
                updateField(
                  "price_per_person_per_night",
                  parseNumber(e.target.value)
                )
              }
              placeholder="ex: 65"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">
              {formData.currency || "EUR"}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Prix lieu entier / jour
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step={1}
              value={formData.price_full_venue_per_day ?? ""}
              onChange={(e) =>
                updateField(
                  "price_full_venue_per_day",
                  parseNumber(e.target.value)
                )
              }
              placeholder="ex: 1500"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">
              {formData.currency || "EUR"}
            </span>
          </div>
        </div>
      </div>

      {/* Repas inclus */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Les repas sont-ils inclus dans le prix ?
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateField("meals_included_in_price", true)}
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              formData.meals_included_in_price === true
                ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
            }`}
          >
            Oui
          </button>
          <button
            type="button"
            onClick={() => updateField("meals_included_in_price", false)}
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              formData.meals_included_in_price === false
                ? "border-[#8B6F47] bg-[#8B6F47]/5 text-[#8B6F47]"
                : "border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--border-color)]"
            }`}
          >
            Non
          </button>
        </div>
      </div>

      {/* Acompte */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          Acompte requis
        </label>
        <input
          type="text"
          value={formData.deposit_required || ""}
          onChange={(e) => updateField("deposit_required", e.target.value || null)}
          placeholder="ex: 30% a la reservation"
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
        />
      </div>

      {/* Politique d'annulation */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
          Politique d&apos;annulation
        </label>
        <div className="space-y-2">
          {CANCELLATION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                formData.cancellation_policy === opt.value
                  ? "border-[#8B6F47] bg-[#8B6F47]/5"
                  : "border-[var(--border-light)] hover:border-[var(--border-color)]"
              }`}
            >
              <input
                type="radio"
                name="cancellation_policy"
                checked={formData.cancellation_policy === opt.value}
                onChange={() =>
                  updateField("cancellation_policy", opt.value)
                }
                className="w-4 h-4 text-[#8B6F47] border-[var(--input-border)] focus:ring-[#8B6F47]"
              />
              <span className="text-sm text-[var(--foreground)]">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Disponibilite saisonniere */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          Disponibilite saisonniere
        </label>
        <input
          type="text"
          value={formData.seasonal_availability || ""}
          onChange={(e) =>
            updateField("seasonal_availability", e.target.value || null)
          }
          placeholder="ex: Mai a Octobre, ou Toute l'annee"
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
        />
      </div>
    </div>
  );
}
