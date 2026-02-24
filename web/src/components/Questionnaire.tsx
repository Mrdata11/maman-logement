"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  QuestionDefinition,
  QuestionnaireAnswers,
  QuestionnaireState,
  QUESTIONNAIRE_STORAGE_KEY,
} from "@/lib/questionnaire-types";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";

// --- Sub-components for each question type ---

function QuestionSingleChoice({
  question,
  value,
  onChange,
}: {
  question: QuestionDefinition;
  value: string | undefined;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      {question.options?.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm leading-snug ${
            value === opt.id
              ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--foreground)]"
              : "border-[var(--border-color)] hover:border-[var(--primary)]/40 text-[var(--foreground)]"
          }`}
        >
          <span className="flex items-center gap-3">
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                value === opt.id
                  ? "border-[var(--primary)] bg-[var(--primary)]"
                  : "border-[var(--border-color)]"
              }`}
            >
              {value === opt.id && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
            <span>{opt.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function QuestionMultiChoice({
  question,
  value,
  onChange,
}: {
  question: QuestionDefinition;
  value: string[] | undefined;
  onChange: (val: string[]) => void;
}) {
  const selected = value ?? [];
  const maxReached = question.maxSelections ? selected.length >= question.maxSelections : false;

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (!maxReached) {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-2">
      {question.maxSelections && (
        <p className="text-xs text-[var(--muted)] mb-2">
          {selected.length}/{question.maxSelections} sélectionnée{question.maxSelections > 1 ? "s" : ""}
        </p>
      )}
      {question.options?.map((opt) => {
        const isSelected = selected.includes(opt.id);
        const isDisabled = !isSelected && maxReached;
        return (
          <button
            key={opt.id}
            onClick={() => toggle(opt.id)}
            disabled={isDisabled}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm leading-snug ${
              isSelected
                ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--foreground)]"
                : isDisabled
                  ? "border-[var(--border-color)]/50 text-[var(--muted-light)] cursor-not-allowed opacity-50"
                  : "border-[var(--border-color)] hover:border-[var(--primary)]/40 text-[var(--foreground)]"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-[var(--border-color)]"
                }`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span>{opt.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function QuestionOpenText({
  question,
  value,
  onChange,
}: {
  question: QuestionDefinition;
  value: string | undefined;
  onChange: (val: string) => void;
}) {
  return (
    <textarea
      rows={4}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder}
      className="w-full px-4 py-3 border-2 border-[var(--border-color)] rounded-xl text-sm bg-[var(--input-bg)] placeholder-[var(--muted-light)] focus:outline-none focus:border-[var(--primary)] resize-none transition-colors"
    />
  );
}

function QuestionSlider({
  question,
  value,
  onChange,
}: {
  question: QuestionDefinition;
  value: number | undefined;
  onChange: (val: number) => void;
}) {
  const config = question.sliderConfig!;
  const current = value ?? config.defaultValue;
  const percentage = ((current - config.min) / (config.max - config.min)) * 100;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <span className="text-3xl font-bold text-[var(--primary)]">
          {current}
          {config.unit ?? ""}
        </span>
      </div>
      <div className="px-1">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          className="questionnaire-slider w-full"
          style={{
            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, var(--border-color) ${percentage}%, var(--border-color) 100%)`,
          }}
        />
        <div className="flex justify-between mt-2 px-0.5">
          {Object.entries(config.labels).map(([pos, label]) => (
            <span
              key={pos}
              className="text-[11px] text-[var(--muted)] text-center"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Progress bar ---

function ProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i < currentStep
              ? "bg-[var(--primary)]"
              : i === currentStep
                ? "bg-[var(--primary)]/60"
                : "bg-[var(--border-color)]"
          }`}
        />
      ))}
    </div>
  );
}

// --- Main Questionnaire component (full page) ---

export function Questionnaire() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [showComplete, setShowComplete] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [previouslyCompleted, setPreviouslyCompleted] = useState(false);

  const totalSteps = QUESTIONNAIRE_STEPS.length;
  const step = QUESTIONNAIRE_STEPS[currentStep];

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
      if (saved) {
        const parsed: QuestionnaireState = JSON.parse(saved);
        setAnswers(parsed.answers);
        setCurrentStep(parsed.currentStep);
        if (parsed.completedAt) setPreviouslyCompleted(true);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Save to localStorage whenever answers or step change
  const saveState = useCallback(
    (a: QuestionnaireAnswers, s: number, completed: boolean) => {
      const existing = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
      let existingCompletedAt: string | null = null;
      if (existing) {
        try {
          existingCompletedAt = JSON.parse(existing).completedAt ?? null;
        } catch { /* ignore */ }
      }
      const state: QuestionnaireState = {
        answers: a,
        currentStep: s,
        completedAt: completed
          ? existingCompletedAt ?? new Date().toISOString()
          : existingCompletedAt,
        lastEditedAt: new Date().toISOString(),
        version: 1,
      };
      localStorage.setItem(QUESTIONNAIRE_STORAGE_KEY, JSON.stringify(state));
    },
    []
  );

  useEffect(() => {
    if (loaded) {
      saveState(answers, currentStep, false);
    }
  }, [answers, currentStep, loaded, saveState]);

  const updateAnswer = (questionId: string, value: string | string[] | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setDirection("forward");
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setDirection("backward");
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFinish = () => {
    saveState(answers, currentStep, true);
    setShowComplete(true);
    setTimeout(() => {
      router.push(returnTo || "/");
    }, 2000);
  };

  if (!loaded) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="text-[var(--muted-light)]">Chargement...</div>
      </div>
    );
  }

  if (showComplete) {
    return (
      <div className="max-w-md mx-auto py-20 text-center animate-fadeIn px-4">
        <div className="w-16 h-16 mx-auto mb-5 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
          Merci !
        </h2>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          {returnTo
            ? "Ton questionnaire est enregistré. Tu vas être redirigée vers la création de ton profil."
            : "Ton profil de recherche est enregistré. Tu vas être redirigée vers les annonces."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Back to dashboard link */}
      <div className="mb-5">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux annonces
        </a>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      {/* Step counter */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-[var(--muted)]">
          Étape {currentStep + 1} sur {totalSteps}
        </p>
        {previouslyCompleted && (
          <span className="text-xs text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-full font-medium">
            Modification
          </span>
        )}
      </div>

      {/* Card */}
      <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--border-color)]">
        {/* Questions */}
        <div className="p-6">
          <div
            key={currentStep}
            className={direction === "forward" ? "animate-step-forward" : "animate-step-backward"}
          >
            {/* Step title */}
            <h1 className="text-lg font-bold text-[var(--foreground)] mb-2">
              {step.title}
            </h1>
            <p className="text-sm text-[var(--muted)] mb-8 leading-relaxed">
              {step.subtitle}
            </p>

            <div className="space-y-8">
              {step.questions.map((q) => (
                <div key={q.id}>
                  <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
                    {q.text}
                  </label>

                  {q.type === "single_choice" && (
                    <QuestionSingleChoice
                      question={q}
                      value={answers[q.id] as string | undefined}
                      onChange={(v) => updateAnswer(q.id, v)}
                    />
                  )}

                  {q.type === "multi_choice" && (
                    <QuestionMultiChoice
                      question={q}
                      value={answers[q.id] as string[] | undefined}
                      onChange={(v) => updateAnswer(q.id, v)}
                    />
                  )}

                  {q.type === "open_text" && (
                    <QuestionOpenText
                      question={q}
                      value={answers[q.id] as string | undefined}
                      onChange={(v) => updateAnswer(q.id, v)}
                    />
                  )}

                  {q.type === "slider" && (
                    <QuestionSlider
                      question={q}
                      value={answers[q.id] as number | undefined}
                      onChange={(v) => updateAnswer(q.id, v)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-[var(--border-color)]/50 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentStep === 0
                ? "text-[var(--muted-light)] cursor-not-allowed"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Précédent
          </button>

          {currentStep < totalSteps - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors shadow-sm"
            >
              Suivant
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors shadow-sm"
            >
              Terminer
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Step overview (clickable navigation) */}
      <div className="mt-6 mb-8">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {QUESTIONNAIRE_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                setDirection(i > currentStep ? "forward" : "backward");
                setCurrentStep(i);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === currentStep
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : i < currentStep
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
