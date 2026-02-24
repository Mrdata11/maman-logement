"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  QuestionDefinition,
  QuestionnaireAnswers,
} from "@/lib/questionnaire-types";
import {
  CreationProjectState,
  CREATION_STORAGE_KEY,
} from "@/lib/creation-questionnaire-types";
import { CREATION_STEPS, STEP_ENCOURAGEMENTS } from "@/lib/creation-questionnaire-data";

// --- Flatten questions into a single list ---

interface FlatQuestion {
  stepIndex: number;
  stepId: string;
  stepTitle: string;
  questionIndexInStep: number;
  question: QuestionDefinition;
}

function flattenQuestions(): FlatQuestion[] {
  const result: FlatQuestion[] = [];
  CREATION_STEPS.forEach((step, stepIndex) => {
    step.questions.forEach((question, questionIndexInStep) => {
      result.push({
        stepIndex,
        stepId: step.id,
        stepTitle: step.title,
        questionIndexInStep,
        question,
      });
    });
  });
  return result;
}

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
          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${
            value === opt.id
              ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--foreground)]"
              : "border-[var(--border-color)] hover:border-[var(--primary)]/50 text-[var(--foreground)]"
          }`}
        >
          <span className="flex items-center gap-3">
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
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
            {opt.label}
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
        <p className="text-xs text-[var(--muted)] mb-1">
          {selected.length}/{question.maxSelections} s&eacute;lectionn&eacute;e{question.maxSelections > 1 ? "s" : ""}
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
            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${
              isSelected
                ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--foreground)]"
                : isDisabled
                  ? "border-[var(--border-color)]/50 text-[var(--muted-light)] cursor-not-allowed"
                  : "border-[var(--border-color)] hover:border-[var(--primary)]/50 text-[var(--foreground)]"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 ${
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
              {opt.label}
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
  onSubmit,
}: {
  question: QuestionDefinition;
  value: string | undefined;
  onChange: (val: string) => void;
  onSubmit: () => void;
}) {
  return (
    <textarea
      rows={4}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          onSubmit();
        }
      }}
      placeholder={question.placeholder}
      className="w-full px-4 py-3 border-2 border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] placeholder-[var(--muted-light)] focus:outline-none focus:border-[var(--primary)] resize-none transition-colors"
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
    <div className="space-y-3">
      <div className="text-center">
        <span className="text-2xl font-bold text-[var(--primary)]">
          {current}
          {config.unit ?? ""}
        </span>
      </div>
      <div className="px-2">
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
        <div className="flex justify-between mt-1">
          {Object.entries(config.labels).map(([pos, label]) => (
            <span
              key={pos}
              className="text-[11px] text-[var(--muted)]"
              style={{
                position: "relative",
                left: `${((Number(pos) - config.min) / (config.max - config.min)) * 100 - 50}%`,
                width: "0",
                whiteSpace: "nowrap",
                textAlign: "center",
                display: "inline-block",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Main CreationQuestionnaire component ---

interface CreationQuestionnaireProps {
  onAnswersChange?: (answers: QuestionnaireAnswers) => void;
}

export function CreationQuestionnaire({ onAnswersChange }: CreationQuestionnaireProps) {
  const router = useRouter();
  const flatQuestions = useMemo(() => flattenQuestions(), []);
  const totalQuestions = flatQuestions.length;

  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [showComplete, setShowComplete] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = flatQuestions[currentIndex];
  const prevStepIndex = currentIndex > 0 ? flatQuestions[currentIndex - 1].stepIndex : -1;

  // Convert flat index to step index for persistence
  const currentStepIndex = current.stepIndex;

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CREATION_STORAGE_KEY);
      if (saved) {
        const parsed: CreationProjectState = JSON.parse(saved);
        if (!parsed.completedAt) {
          setAnswers(parsed.answers);
          onAnswersChange?.(parsed.answers);
          // Restore position: find the flat index for the saved step
          const savedStep = parsed.currentStep;
          const idx = flatQuestions.findIndex((fq) => fq.stepIndex === savedStep);
          if (idx >= 0) setCurrentIndex(idx);
        }
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, [flatQuestions]);

  // Save state
  const saveState = useCallback(
    (a: QuestionnaireAnswers, stepIdx: number, completed: boolean) => {
      const state: CreationProjectState = {
        answers: a,
        currentStep: stepIdx,
        completedAt: completed ? new Date().toISOString() : null,
        lastEditedAt: new Date().toISOString(),
        version: 1,
        inputMethod: "manual",
      };
      localStorage.setItem(CREATION_STORAGE_KEY, JSON.stringify(state));
    },
    []
  );

  useEffect(() => {
    if (loaded) {
      saveState(answers, currentStepIndex, false);
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [answers, currentStepIndex, loaded, saveState]);

  // Cleanup auto-advance timer
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  const updateAnswer = (questionId: string, value: string | string[] | number) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      onAnswersChange?.(next);
      return next;
    });
  };

  const goToIndex = useCallback((idx: number) => {
    setDirection(idx > currentIndex ? "forward" : "backward");
    setCurrentIndex(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      const nextIdx = currentIndex + 1;
      const nextFq = flatQuestions[nextIdx];

      // Check if we're crossing a step boundary
      if (nextFq.stepIndex !== current.stepIndex) {
        const key = `${current.stepId}->${nextFq.stepId}`;
        const msg = STEP_ENCOURAGEMENTS[key];
        if (msg) {
          setEncouragement(msg);
          setTimeout(() => setEncouragement(null), 2500);
        }
      }

      setDirection("forward");
      setCurrentIndex(nextIdx);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentIndex, totalQuestions, flatQuestions, current]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection("backward");
      setCurrentIndex(currentIndex - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentIndex]);

  const handleFinish = () => {
    saveState(answers, currentStepIndex, true);
    setShowComplete(true);
    setTimeout(() => {
      router.push("/creer/apercu");
    }, 1500);
  };

  // Handle single choice with auto-advance
  const handleSingleChoiceChange = useCallback((questionId: string, value: string) => {
    updateAnswer(questionId, value);

    // Auto-advance after 400ms
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        goNext();
      }
    }, 400);
  }, [currentIndex, totalQuestions, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in textarea
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA") return;

      if (e.key === "Enter") {
        e.preventDefault();
        if (currentIndex < totalQuestions - 1) {
          goNext();
        } else {
          handleFinish();
        }
      } else if (e.key === "Escape" && currentIndex > 0) {
        goPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, totalQuestions, goNext, goPrev]);

  // Progress percentage
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  // Count answered questions
  const answeredCount = Object.keys(answers).length;

  if (!loaded) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="text-[var(--muted-light)]">Chargement...</div>
      </div>
    );
  }

  if (showComplete) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative success-icon-container" style={{ opacity: 0 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-20 h-20 rounded-full border-2 border-[var(--primary)] success-ring"
                style={{ opacity: 0 }}
              />
            </div>
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <span className="success-sparkle" style={{ opacity: 0 }} />
            <svg width="64" height="64" viewBox="0 0 52 52">
              <circle
                className="success-circle-fill"
                cx="26" cy="26" r="25"
                fill="var(--primary)"
              />
              <circle
                className="success-circle-svg"
                cx="26" cy="26" r="25"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                className="success-check-svg"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 27l6 6 16-16"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2 success-text-1">
          Questionnaire termin&eacute; !
        </h2>
        <p className="text-sm text-[var(--muted)] success-text-2">
          Redirection vers l&apos;aper&ccedil;u...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Encouragement toast */}
      {encouragement && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <div className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {encouragement}
          </div>
        </div>
      )}

      <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden">
        {/* Header: step label + progress */}
        <div className="px-6 pt-5 pb-4 border-b border-[var(--border-color)]/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full">
                {current.stepTitle}
              </span>
              <span className="text-xs text-[var(--muted)]">
                {currentIndex + 1} / {totalQuestions}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-xs transition-opacity duration-300 ${
                showSaved ? "opacity-100 text-[var(--primary)]" : "opacity-0"
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Sauvegard&eacute;
            </span>
          </div>
          {/* Continuous progress bar */}
          <div className="h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="px-6 py-8 min-h-[280px] flex items-start">
          <div
            key={currentIndex}
            className={`w-full ${direction === "forward" ? "animate-step-forward" : "animate-step-backward"}`}
          >
            <label className="block text-base sm:text-lg font-semibold text-[var(--foreground)] mb-6 leading-snug">
              {current.question.text}
              {current.question.required === false && (
                <span className="text-xs font-normal text-[var(--muted)] ml-2">
                  (optionnel)
                </span>
              )}
            </label>

            {current.question.type === "single_choice" && (
              <QuestionSingleChoice
                question={current.question}
                value={answers[current.question.id] as string | undefined}
                onChange={(v) => handleSingleChoiceChange(current.question.id, v)}
              />
            )}

            {current.question.type === "multi_choice" && (
              <QuestionMultiChoice
                question={current.question}
                value={answers[current.question.id] as string[] | undefined}
                onChange={(v) => updateAnswer(current.question.id, v)}
              />
            )}

            {current.question.type === "open_text" && (
              <div className="space-y-2">
                <QuestionOpenText
                  question={current.question}
                  value={answers[current.question.id] as string | undefined}
                  onChange={(v) => updateAnswer(current.question.id, v)}
                  onSubmit={currentIndex < totalQuestions - 1 ? goNext : handleFinish}
                />
                <p className="text-[11px] text-[var(--muted-light)]">
                  Ctrl+Entr&eacute;e pour continuer
                </p>
              </div>
            )}

            {current.question.type === "slider" && (
              <QuestionSlider
                question={current.question}
                value={answers[current.question.id] as number | undefined}
                onChange={(v) => updateAnswer(current.question.id, v)}
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-[var(--border-color)]/50 flex items-center justify-between bg-[var(--surface)]">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentIndex === 0
                ? "text-[var(--muted-light)] cursor-not-allowed"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Pr&eacute;c&eacute;dent</span>
          </button>

          {/* Answered count */}
          <span className="text-xs text-[var(--muted)]">
            {answeredCount} r&eacute;ponse{answeredCount !== 1 ? "s" : ""}
          </span>

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              <span className="hidden sm:inline">Suivant</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              Terminer
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Step overview pills */}
      <div className="mt-6 mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {CREATION_STEPS.map((s, i) => {
            const firstQuestionIdx = flatQuestions.findIndex((fq) => fq.stepIndex === i);
            const isCurrentStep = currentStepIndex === i;
            const isPastStep = currentStepIndex > i;
            return (
              <button
                key={s.id}
                onClick={() => goToIndex(firstQuestionIdx)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isCurrentStep
                    ? "bg-[var(--primary)] text-white"
                    : isPastStep
                      ? "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
                      : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {isPastStep && (
                  <svg className="w-3 h-3 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {s.title}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
