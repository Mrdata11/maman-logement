"use client";

import { CREATION_STEPS } from "@/lib/creation-questionnaire-data";
import { QuestionnaireAnswers } from "@/lib/questionnaire-types";

interface CreationLivePreviewProps {
  answers: QuestionnaireAnswers;
}

function getOptionLabel(questionId: string, optionId: string): string {
  for (const step of CREATION_STEPS) {
    const q = step.questions.find((q) => q.id === questionId);
    if (q?.options) {
      const opt = q.options.find((o) => o.id === optionId);
      if (opt) return opt.label;
    }
  }
  return optionId;
}

export function CreationLivePreview({ answers }: CreationLivePreviewProps) {
  const totalFields = CREATION_STEPS.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredFields = Object.keys(answers).length;
  const completionPercent = Math.round((answeredFields / totalFields) * 100);

  const projectName = answers.project_name as string | undefined;
  const projectVision = answers.project_vision as string | undefined;

  // Extract badges
  const regions = Array.isArray(answers.project_region)
    ? (answers.project_region as string[]).filter((r) => r !== "not_decided")
    : [];

  const settingType =
    typeof answers.setting_type === "string" && answers.setting_type !== "not_decided"
      ? getOptionLabel("setting_type", answers.setting_type)
      : null;

  const projectStage =
    typeof answers.project_stage === "string"
      ? getOptionLabel("project_stage", answers.project_stage)
      : null;

  const values = Array.isArray(answers.community_values)
    ? (answers.community_values as string[]).slice(0, 3)
    : [];

  const plannedUnits =
    typeof answers.planned_units === "number" ? answers.planned_units : null;

  const hasSomeData = answeredFields > 0;

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-color)]/50 bg-[var(--surface)]/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">
            Aper&ccedil;u en direct
          </span>
          <span className="text-xs text-[var(--primary)] font-medium">
            {completionPercent}%
          </span>
        </div>
        <div className="mt-1.5 h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Mini project card preview */}
      <div className="p-4">
        {hasSomeData ? (
          <div className="space-y-3">
            {/* Project name */}
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-sm leading-tight">
                {projectName || (
                  <span className="text-[var(--muted-light)] italic">Nom du projet...</span>
                )}
              </h3>
              {projectVision && (
                <p className="text-xs text-[var(--muted)] italic mt-1 line-clamp-2 leading-relaxed">
                  &laquo; {projectVision} &raquo;
                </p>
              )}
            </div>

            {/* Badges */}
            {(projectStage || regions.length > 0 || settingType || plannedUnits || values.length > 0) && (
              <div className="flex flex-wrap gap-1">
                {projectStage && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {projectStage}
                  </span>
                )}
                {regions.slice(0, 2).map((r) => (
                  <span
                    key={r}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700"
                  >
                    {getOptionLabel("project_region", r)}
                  </span>
                ))}
                {settingType && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">
                    {settingType}
                  </span>
                )}
                {plannedUnits && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
                    {plannedUnits} logements
                  </span>
                )}
                {values.map((v) => (
                  <span
                    key={v}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700"
                  >
                    {getOptionLabel("community_values", v)}
                  </span>
                ))}
              </div>
            )}

            {/* Completion checklist */}
            <div className="pt-2 border-t border-[var(--border-color)]/50 space-y-1.5">
              {CREATION_STEPS.map((step) => {
                const stepAnswered = step.questions.filter((q) => answers[q.id] !== undefined).length;
                const isComplete = stepAnswered === step.questions.length;
                const hasAny = stepAnswered > 0;
                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                      isComplete
                        ? "bg-[var(--primary)]"
                        : hasAny
                          ? "bg-[var(--primary)]/30"
                          : "bg-[var(--border-color)]"
                    }`}>
                      {isComplete && (
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs ${
                      isComplete ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                    }`}>
                      {step.title}
                    </span>
                    <span className="text-[10px] text-[var(--muted-light)] ml-auto">
                      {stepAnswered}/{step.questions.length}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-10 h-10 mx-auto mb-2 bg-[var(--surface)] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--muted-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Votre projet appara&icirc;tra ici au fur et &agrave; mesure
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
