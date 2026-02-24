"use client";

import Link from "next/link";
import { ApplyButton } from "@/components/ApplyButton";
import { CREATION_STEPS } from "@/lib/creation-questionnaire-data";

interface ProjectCardData {
  id: string;
  name: string;
  vision: string | null;
  answers: Record<string, string | string[] | number>;
  created_at: string;
  member_count: number;
}

interface ProjectCardProps {
  project: ProjectCardData;
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

export type { ProjectCardData };

export function ProjectCard({ project }: ProjectCardProps) {
  const { answers } = project;

  // Extraire les badges
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

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-5 sm:p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link href={`/projets/${project.id}`} className="min-w-0 flex-1 group">
          <h3 className="font-bold text-[var(--foreground)] text-base leading-tight group-hover:text-[var(--primary)] transition-colors line-clamp-1">
            {project.name || "Projet sans nom"}
          </h3>
        </Link>
        <div className="flex items-center gap-1 text-xs text-[var(--muted)] shrink-0">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {project.member_count} membre{project.member_count > 1 ? "s" : ""}
        </div>
      </div>

      {/* Vision */}
      {project.vision && (
        <Link href={`/projets/${project.id}`}>
          <p className="text-sm text-[var(--muted)] italic line-clamp-2 mb-3 leading-relaxed">
            &laquo; {project.vision} &raquo;
          </p>
        </Link>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {projectStage && (
          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {projectStage}
          </span>
        )}
        {regions.slice(0, 2).map((r) => (
          <span
            key={r}
            className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700"
          >
            {getOptionLabel("project_region", r)}
          </span>
        ))}
        {settingType && (
          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
            {settingType}
          </span>
        )}
        {plannedUnits && (
          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
            {plannedUnits} logements
          </span>
        )}
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700"
          >
            {getOptionLabel("community_values", v)}
          </span>
        ))}
      </div>

      {/* Footer: date + candidater */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-light)]">
        <span className="text-xs text-[var(--muted-light)]">
          Cr\u00e9\u00e9 le{" "}
          {new Date(project.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        <ApplyButton
          projectId={project.id}
          projectName={project.name || "ce projet"}
          compact
        />
      </div>
    </div>
  );
}
