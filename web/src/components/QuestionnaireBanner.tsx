"use client";

import { useState, useEffect } from "react";
import { QuestionnaireState } from "@/lib/questionnaire-types";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";

const BANNER_DISMISSED_KEY = "questionnaire_banner_dismissed";

interface QuestionnaireBannerProps {
  state: QuestionnaireState | null;
  matchCount?: number;
  questionnaireSummary?: string[];
  onReset?: () => void;
  onClearFilters?: () => void;
  onStartVoice?: () => void;
}

export function QuestionnaireBanner({ state, matchCount, questionnaireSummary, onReset, onClearFilters, onStartVoice }: QuestionnaireBannerProps) {
  const isCompleted = state?.completedAt != null;
  const hasStarted = state !== null && Object.keys(state.answers).length > 0;
  const totalSteps = QUESTIONNAIRE_STEPS.length;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(BANNER_DISMISSED_KEY)) setDismissed(true);
  }, []);

  // Completed state: unified bar with match count + profile summary
  if (isCompleted) {
    const hasSummary = questionnaireSummary && questionnaireSummary.length > 0;
    return (
      <div className="mb-6 px-5 py-4 bg-emerald-50 border border-emerald-300 rounded-xl print:hidden">
        {/* Top row: match count + actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-emerald-800">
              {matchCount !== undefined
                ? `${matchCount} annonce${matchCount !== 1 ? "s" : ""} correspond${matchCount !== 1 ? "ent" : ""} à ton profil`
                : "Ton profil de recherche est rempli"
              }
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/questionnaire"
              className="text-sm px-3 py-1.5 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors font-medium"
            >
              Modifier
            </a>
            {onClearFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm px-3 py-1.5 text-[var(--muted)] hover:bg-[var(--surface)] rounded-md transition-colors"
              >
                Tout voir
              </button>
            )}
            {onReset && (
              <button
                onClick={onReset}
                className="text-sm px-3 py-1.5 text-[var(--muted)] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
        {/* Profile creation CTA */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-200">
          <a
            href="/profils/creer"
            className="text-xs text-emerald-700 hover:text-emerald-900 transition-colors font-medium"
          >
            Cr&eacute;e ton profil pour &ecirc;tre trouv&eacute;(e) par des projets &rarr;
          </a>
        </div>
        {/* Bottom row: profile summary pills */}
        {hasSummary && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-200">
            <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-xs font-medium text-emerald-700">Ton profil :</span>
            <div className="flex flex-wrap gap-1.5">
              {questionnaireSummary!.map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Started but not finished
  if (hasStarted) {
    const stepLabel = state!.currentStep + 1;
    return (
      <div className="mb-6 p-5 bg-gradient-to-r from-[var(--surface)] to-emerald-50/30 border border-[var(--primary)]/30 rounded-xl print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[var(--foreground)] text-sm">
              Tu as commencé le questionnaire -- envie de continuer ?
            </p>
            <p className="text-xs text-[var(--primary)] mt-0.5">
              Cela nous aide à te montrer les annonces les plus pertinentes.
            </p>
          </div>
          <a
            href="/questionnaire"
            className="shrink-0 ml-3 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Continuer (étape {stepLabel}/{totalSteps})
          </a>
        </div>
      </div>
    );
  }

  // Not started: compact inline banner, dismissible
  if (dismissed) return null;

  return (
    <div className="mb-4 px-4 py-3 bg-gradient-to-r from-[var(--surface)] to-emerald-50/30 border border-[var(--primary)]/30 rounded-xl print:hidden">
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Personnalise tes résultats
          </p>
          <p className="text-xs text-[var(--muted)] mt-0.5 hidden sm:block">
            Questionnaire rapide pour affiner les annonces selon tes critères.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/questionnaire"
            className="px-3.5 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Commencer
          </a>
          <button
            onClick={() => {
              setDismissed(true);
              localStorage.setItem(BANNER_DISMISSED_KEY, "true");
            }}
            className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
