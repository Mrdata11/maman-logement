"use client";

import { useState, useEffect, useCallback } from "react";
import { FormProgress } from "./FormProgress";
import { StepBasicInfo } from "./StepBasicInfo";
import { StepSpaces } from "./StepSpaces";
import { StepDining } from "./StepDining";
import { StepPricing } from "./StepPricing";
import { StepPhotos } from "./StepPhotos";
import { StepPolicies } from "./StepPolicies";
import { INITIAL_FORM_DATA } from "@/lib/venue-form/types";
import { stepBasicInfoSchema, type VenueFormData } from "@/lib/venue-form/schema";
import Link from "next/link";

interface VenueFormWizardProps {
  token: string;
  venueId?: string;
  venueName?: string;
}

const TOTAL_STEPS = 6;

export function VenueFormWizard({ token, venueId, venueName }: VenueFormWizardProps) {
  const storageKey = `venue_form_${token}`;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<VenueFormData>>(() => {
    // Essayer de restaurer depuis localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...INITIAL_FORM_DATA, ...parsed.formData };
        }
      } catch {
        // Ignorer les erreurs de parsing
      }
    }
    return { ...INITIAL_FORM_DATA, name: venueName || "" };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sauvegarder dans localStorage a chaque changement d'etape
  const saveToLocalStorage = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ formData, currentStep })
        );
      } catch {
        // localStorage peut etre plein ou indisponible
      }
    }
  }, [formData, currentStep, storageKey]);

  useEffect(() => {
    saveToLocalStorage();
  }, [currentStep, saveToLocalStorage]);

  // Restaurer l'etape depuis localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.currentStep) {
            setCurrentStep(parsed.currentStep);
          }
        }
      } catch {
        // Ignorer
      }
    }
  }, [storageKey]);

  const handleChange = (data: Partial<VenueFormData>) => {
    setFormData(data);
    // Effacer les erreurs quand l'utilisateur modifie
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  const validateCurrentStep = (): boolean => {
    if (currentStep === 1) {
      const result = stepBasicInfoSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          if (!fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
        return false;
      }
    }
    // Les autres etapes sont optionnelles
    setErrors({});
    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    saveToLocalStorage();
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    saveToLocalStorage();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/venue-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la soumission.");
      }

      setIsSubmitted(true);
      // Nettoyer le localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
    } catch (err) {
      setErrors({
        _form:
          err instanceof Error
            ? err.message
            : "Une erreur est survenue. Veuillez reessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ecran de confirmation
  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="font-serif text-2xl font-bold text-[var(--foreground)] mb-3">
          Merci pour votre inscription !
        </h2>
        <p className="text-[var(--muted)] max-w-md mx-auto mb-8">
          Nous avons bien recu les informations concernant{" "}
          <strong>{formData.name || venueName || "votre lieu"}</strong>. Notre
          equipe va verifier les donnees et creer votre fiche dans l&apos;annuaire.
          Vous recevrez un email de confirmation.
        </p>
        <Link
          href="/inscription-lieu"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B6F47] text-white rounded-lg hover:bg-[#705A39] transition-colors font-medium"
        >
          Retour a la page d&apos;information
        </Link>
      </div>
    );
  }

  return (
    <div>
      <FormProgress currentStep={currentStep} />

      <div className="bg-[var(--card-bg)] rounded-xl p-6 sm:p-8 shadow-[var(--card-shadow)]">
        {/* Contenu de l'etape */}
        {currentStep === 1 && (
          <StepBasicInfo
            formData={formData}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {currentStep === 2 && (
          <StepSpaces formData={formData} onChange={handleChange} />
        )}
        {currentStep === 3 && (
          <StepDining formData={formData} onChange={handleChange} />
        )}
        {currentStep === 4 && (
          <StepPricing formData={formData} onChange={handleChange} />
        )}
        {currentStep === 5 && (
          <StepPhotos formData={formData} onChange={handleChange} />
        )}
        {currentStep === 6 && (
          <StepPolicies formData={formData} onChange={handleChange} />
        )}

        {/* Erreur globale */}
        {errors._form && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors._form}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-light)]">
          <button
            type="button"
            onClick={goBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentStep === 1
                ? "text-[var(--muted-light)] cursor-not-allowed"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Precedent
          </button>

          <span className="text-xs text-[var(--muted)]">
            {currentStep} / {TOTAL_STEPS}
          </span>

          {currentStep < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#8B6F47] text-white rounded-lg hover:bg-[#705A39] transition-colors text-sm font-medium"
            >
              Suivant
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#8B6F47] text-white rounded-lg hover:bg-[#705A39] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                <>
                  Envoyer l&apos;inscription
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Note sauvegarde automatique */}
      <p className="text-center text-xs text-[var(--muted-light)] mt-4">
        Vos reponses sont sauvegardees automatiquement dans votre navigateur.
        {venueId && (
          <span className="block mt-1">
            Ref: {venueId}
          </span>
        )}
      </p>
    </div>
  );
}
