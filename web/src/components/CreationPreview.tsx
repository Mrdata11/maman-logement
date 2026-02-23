"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuestionnaireAnswers } from "@/lib/questionnaire-types";
import {
  CreationProjectState,
  CREATION_STORAGE_KEY,
} from "@/lib/creation-questionnaire-types";
import { CREATION_STEPS } from "@/lib/creation-questionnaire-data";

function formatAnswer(
  questionId: string,
  value: string | string[] | number
): string {
  for (const step of CREATION_STEPS) {
    const q = step.questions.find((q) => q.id === questionId);
    if (!q) continue;
    if (Array.isArray(value)) {
      return value
        .map((v) => q.options?.find((o) => o.id === v)?.label || v)
        .join(", ");
    }
    if (typeof value === "number" && q.sliderConfig) {
      return `${value}${q.sliderConfig.unit || ""}`;
    }
    if (typeof value === "string" && q.options) {
      return q.options.find((o) => o.id === value)?.label || value;
    }
    return String(value);
  }
  return String(value);
}

function getQuestionText(questionId: string): string {
  for (const step of CREATION_STEPS) {
    const q = step.questions.find((q) => q.id === questionId);
    if (q) return q.text;
  }
  return questionId;
}

export function CreationPreview() {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CREATION_STORAGE_KEY);
      if (raw) {
        const state: CreationProjectState = JSON.parse(raw);
        if (Object.keys(state.answers).length > 0) {
          setAnswers(state.answers);
          return;
        }
      }
    } catch {}
    // No data, redirect back
    router.push("/creer");
  }, [router]);

  const handleSave = () => {
    // Already saved in localStorage — mark as confirmed
    setSaved(true);
  };

  const handleReset = () => {
    localStorage.removeItem(CREATION_STORAGE_KEY);
    router.push("/creer");
  };

  if (!answers) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="text-[var(--muted-light)]">Chargement...</div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="max-w-md mx-auto py-16 text-center animate-fadeIn">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
          Votre projet est enregistr&eacute; !
        </h2>
        <p className="text-[var(--muted)] mb-8 leading-relaxed">
          Votre projet d&apos;habitat group&eacute; a &eacute;t&eacute; sauvegard&eacute;.
          Bient&ocirc;t, les personnes int&eacute;ress&eacute;es pourront le d&eacute;couvrir et vous contacter.
        </p>
        <div className="flex justify-center gap-3">
          <a
            href="/"
            className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Retour &agrave; l&apos;accueil
          </a>
          <button
            onClick={() => {
              setSaved(false);
            }}
            className="px-5 py-2.5 border border-[var(--border-color)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition-colors"
          >
            Revoir le projet
          </button>
        </div>
      </div>
    );
  }

  // Group answers by step
  const stepSections = CREATION_STEPS.map((step) => {
    const stepAnswers = step.questions
      .filter((q) => answers[q.id] !== undefined)
      .map((q) => ({
        id: q.id,
        question: q.text,
        answer: formatAnswer(q.id, answers[q.id]),
      }));
    return { ...step, answers: stepAnswers };
  }).filter((s) => s.answers.length > 0);

  // Extract key fields for the header card
  const projectName = answers.project_name as string | undefined;
  const projectVision = answers.project_vision as string | undefined;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push("/creer")}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
      </div>

      {/* Project header card */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 mb-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">
            {projectName || "Votre projet d\u2019habitat group\u00e9"}
          </h1>
          {projectVision && (
            <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed italic max-w-md mx-auto">
              &laquo; {projectVision} &raquo;
            </p>
          )}
        </div>

        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">
          Aper&ccedil;u du projet
        </h2>

        <div className="space-y-6">
          {stepSections.map((section) => (
            <div key={section.id}>
              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />
                {section.title}
              </h3>
              <div className="space-y-2 ml-4">
                {section.answers.map((a) => (
                  <div key={a.id} className="flex flex-col sm:flex-row sm:gap-2">
                    <span className="text-xs text-[var(--muted)] shrink-0 sm:w-48">
                      {a.question}
                    </span>
                    <span className="text-sm text-[var(--foreground)] font-medium">
                      {a.answer}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Unanswered fields notice */}
        {(() => {
          const totalFields = CREATION_STEPS.reduce((sum, s) => sum + s.questions.length, 0);
          const answeredFields = Object.keys(answers).length;
          const missing = totalFields - answeredFields;
          if (missing > 0) {
            return (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-sm text-amber-800">
                  {missing} champ{missing > 1 ? "s" : ""} non renseign&eacute;{missing > 1 ? "s" : ""}.
                  Vous pouvez les compl&eacute;ter en modifiant le questionnaire.
                </p>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <button
          onClick={handleSave}
          className="flex-1 px-5 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Enregistrer le projet
        </button>
        <button
          onClick={() => {
            // Keep data, go back to questionnaire to edit
            const raw = localStorage.getItem(CREATION_STORAGE_KEY);
            if (raw) {
              const state: CreationProjectState = JSON.parse(raw);
              state.completedAt = null;
              state.currentStep = 0;
              localStorage.setItem(CREATION_STORAGE_KEY, JSON.stringify(state));
            }
            router.push("/creer");
          }}
          className="flex-1 px-5 py-3 border border-[var(--border-color)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Modifier
        </button>
        <button
          onClick={handleReset}
          className="px-5 py-3 text-[var(--muted)] hover:text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Recommencer
        </button>
      </div>
    </div>
  );
}
