"use client";

import { FORM_STEPS } from "@/lib/venue-form/types";

interface FormProgressProps {
  currentStep: number;
}

export function FormProgress({ currentStep }: FormProgressProps) {
  return (
    <div className="mb-8">
      {/* Barre de progression */}
      <div className="flex items-center gap-1 mb-4">
        {FORM_STEPS.map((step) => (
          <div key={step.number} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                step.number <= currentStep
                  ? "bg-[#8B6F47]"
                  : "bg-[var(--border-light)]"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Labels des etapes */}
      <div className="hidden sm:flex items-start gap-1">
        {FORM_STEPS.map((step) => (
          <div key={step.number} className="flex-1 text-center">
            <div
              className={`text-xs font-medium transition-colors ${
                step.number === currentStep
                  ? "text-[#8B6F47]"
                  : step.number < currentStep
                    ? "text-[var(--muted)]"
                    : "text-[var(--muted-light)]"
              }`}
            >
              {step.label}
            </div>
          </div>
        ))}
      </div>

      {/* Etape courante (mobile) */}
      <div className="sm:hidden text-center">
        <span className="text-sm font-medium text-[#8B6F47]">
          Etape {currentStep} sur {FORM_STEPS.length} :{" "}
          {FORM_STEPS[currentStep - 1]?.label}
        </span>
      </div>
    </div>
  );
}
