"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  QuestionDefinition,
  QuestionnaireAnswers,
} from "@/lib/questionnaire-types";
import {
  CreationProjectState,
  CREATION_STORAGE_KEY,
} from "@/lib/creation-questionnaire-types";
import { CREATION_STEPS } from "@/lib/creation-questionnaire-data";

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

function ProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex-1 flex items-center gap-1">
          <div
            className={`h-2 flex-1 rounded-full transition-colors ${
              i < currentStep
                ? "bg-[var(--primary)]"
                : i === currentStep
                  ? "bg-[var(--primary)]/70"
                  : "bg-[var(--border-color)]"
            }`}
          />
        </div>
      ))}
      <span className="text-xs text-[var(--muted)] shrink-0 ml-1">
        {currentStep + 1}/{totalSteps}
      </span>
    </div>
  );
}

// --- Main CreationQuestionnaire component ---

export function CreationQuestionnaire() {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [showComplete, setShowComplete] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const totalSteps = CREATION_STEPS.length;
  const step = CREATION_STEPS[currentStep];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CREATION_STORAGE_KEY);
      if (saved) {
        const parsed: CreationProjectState = JSON.parse(saved);
        if (!parsed.completedAt) {
          setAnswers(parsed.answers);
          setCurrentStep(parsed.currentStep);
        }
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const saveState = useCallback(
    (a: QuestionnaireAnswers, s: number, completed: boolean) => {
      const state: CreationProjectState = {
        answers: a,
        currentStep: s,
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
      router.push("/creer/apercu");
    }, 1500);
  };

  if (!loaded) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="text-[var(--muted-light)]">Chargement...</div>
      </div>
    );
  }

  if (showComplete) {
    return (
      <div className="max-w-md mx-auto py-16 text-center animate-fadeIn">
        <div className="w-16 h-16 mx-auto mb-4 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
          Votre projet est enregistr&eacute; !
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Redirection vers l&apos;aper&ccedil;u...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden">
        {/* Step title + progress */}
        <div className="px-6 pt-5 pb-4 border-b border-[var(--border-color)]/50">
          <h1 className="text-lg font-bold text-[var(--foreground)] mb-1">
            {step.title}
          </h1>
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        {/* Questions */}
        <div className="px-6 py-6">
          <div
            key={currentStep}
            className={direction === "forward" ? "animate-step-forward" : "animate-step-backward"}
          >
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
        <div className="px-6 py-4 border-t border-[var(--border-color)]/50 flex items-center justify-between bg-[var(--surface)]">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentStep === 0
                ? "text-[var(--muted-light)] cursor-not-allowed"
                : "text-[var(--muted)] hover:bg-[var(--surface)]"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Pr&eacute;c&eacute;dent
          </button>

          {currentStep < totalSteps - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              Suivant
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

      {/* Step overview */}
      <div className="mt-6 mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {CREATION_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                setDirection(i > currentStep ? "forward" : "backward");
                setCurrentStep(i);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === currentStep
                  ? "bg-[var(--primary)] text-white"
                  : i < currentStep
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface)]"
              }`}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
