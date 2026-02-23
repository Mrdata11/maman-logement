"use client";

import { QuestionnaireState } from "@/lib/questionnaire-types";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";

interface QuestionnaireBannerProps {
  state: QuestionnaireState | null;
  matchCount?: number;
  onReset?: () => void;
}

export function QuestionnaireBanner({ state, matchCount, onReset }: QuestionnaireBannerProps) {
  const isCompleted = state?.completedAt != null;
  const hasStarted = state !== null && Object.keys(state.answers).length > 0;
  const totalSteps = QUESTIONNAIRE_STEPS.length;

  // Completed state: compact bar with match count
  if (isCompleted) {
    return (
      <div className="mb-4 px-4 py-3 bg-[var(--surface)] border border-[var(--primary)]/30 rounded-xl flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-[var(--primary)]">
            {matchCount !== undefined
              ? `${matchCount} annonce${matchCount !== 1 ? "s" : ""} correspond${matchCount !== 1 ? "ent" : ""} a ton profil`
              : "Ton profil de recherche est rempli"
            }
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/questionnaire"
            className="text-sm px-3 py-1.5 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-md transition-colors font-medium"
          >
            Modifier mes reponses
          </a>
          {onReset && (
            <button
              onClick={onReset}
              className="text-sm px-3 py-1.5 text-[var(--muted)] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Annuler mes reponses
            </button>
          )}
        </div>
      </div>
    );
  }

  // Started but not finished
  if (hasStarted) {
    const stepLabel = state!.currentStep + 1;
    return (
      <div className="mb-4 p-4 bg-gradient-to-r from-[var(--surface)] to-emerald-50/30 border border-[var(--primary)]/30 rounded-xl print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[var(--foreground)] text-sm">
              Tu as commence le questionnaire -- envie de continuer ?
            </p>
            <p className="text-xs text-[var(--primary)] mt-0.5">
              Cela nous aide a te montrer les annonces les plus pertinentes.
            </p>
          </div>
          <a
            href="/questionnaire"
            className="shrink-0 ml-3 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Continuer (etape {stepLabel}/{totalSteps})
          </a>
        </div>
      </div>
    );
  }

  // Not started: prominent banner
  return (
    <div className="mb-4 p-5 bg-gradient-to-r from-[var(--surface)] to-emerald-50/30 border border-[var(--primary)]/30 rounded-xl print:hidden">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-[var(--foreground)]">
            Bienvenue ! Prenons quelques minutes pour comprendre ce que tu recherches.
          </h3>
          <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">
            Un petit questionnaire en 6 etapes pour que les annonces correspondent vraiment a ce que tu cherches dans l&apos;habitat groupe.
          </p>
          <a
            href="/questionnaire"
            className="mt-3 px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors inline-flex items-center gap-2"
          >
            Commencer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
