"use client";

import { COUNTRY_LABELS } from "@/lib/retreats/types";
import type { VenueFormData } from "@/lib/venue-form/schema";

interface StepBasicInfoProps {
  formData: Partial<VenueFormData>;
  onChange: (data: Partial<VenueFormData>) => void;
  errors: Record<string, string>;
}

export function StepBasicInfo({ formData, onChange, errors }: StepBasicInfoProps) {
  const updateField = (field: keyof VenueFormData, value: unknown) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-[var(--foreground)] mb-1">
          Informations de base
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Presentez votre lieu avec ses coordonnees principales.
        </p>
      </div>

      {/* Nom */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          Nom du lieu <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name || ""}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="ex: Mas des Oliviers"
          className={`w-full px-3 py-2.5 rounded-lg border ${
            errors.name ? "border-red-400" : "border-[var(--input-border)]"
          } bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors`}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Decrivez votre lieu, son ambiance, ses particularites..."
          rows={5}
          className={`w-full px-3 py-2.5 rounded-lg border ${
            errors.description
              ? "border-red-400"
              : "border-[var(--input-border)]"
          } bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors resize-y`}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>

      {/* Pays */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          Pays <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.country || ""}
          onChange={(e) => updateField("country", e.target.value)}
          className={`w-full px-3 py-2.5 rounded-lg border ${
            errors.country ? "border-red-400" : "border-[var(--input-border)]"
          } bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors`}
        >
          <option value="">Selectionnez un pays</option>
          {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
        {errors.country && (
          <p className="text-red-500 text-xs mt-1">{errors.country}</p>
        )}
      </div>

      {/* Region / Ville */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Region
          </label>
          <input
            type="text"
            value={formData.region || ""}
            onChange={(e) => updateField("region", e.target.value)}
            placeholder="ex: Provence-Alpes-Cote d'Azur"
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Ville
          </label>
          <input
            type="text"
            value={formData.city || ""}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="ex: Gordes"
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
          />
        </div>
      </div>

      {/* Site web */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          Site web
        </label>
        <input
          type="url"
          value={formData.website || ""}
          onChange={(e) => updateField("website", e.target.value)}
          placeholder="https://www.votre-lieu.com"
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
        />
      </div>

      {/* Email / Telephone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Email de contact <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.contact_email || ""}
            onChange={(e) => updateField("contact_email", e.target.value)}
            placeholder="contact@votre-lieu.com"
            className={`w-full px-3 py-2.5 rounded-lg border ${
              errors.contact_email
                ? "border-red-400"
                : "border-[var(--input-border)]"
            } bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors`}
          />
          {errors.contact_email && (
            <p className="text-red-500 text-xs mt-1">
              {errors.contact_email}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Telephone
          </label>
          <input
            type="tel"
            value={formData.contact_phone || ""}
            onChange={(e) => updateField("contact_phone", e.target.value)}
            placeholder="+33 6 12 34 56 78"
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
