import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { CREATION_STEPS } from "@/lib/creation-questionnaire-data";
import { ProjectDetail } from "@/components/ProjectDetail";
import { ApplyButton } from "@/components/ApplyButton";
import type { ProjectWithMembers } from "@/lib/project-types";

export const revalidate = 60;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

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

async function getProject(id: string) {
  const supabase = getSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      project_members (
        id, project_id, profile_id, role, joined_at,
        profiles (
          id, display_name, avatar_url, location, age, gender,
          ai_summary, ai_tags, is_verified, created_at
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !project) return null;
  return project as unknown as ProjectWithMembers;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return { title: "Projet non trouvé" };

  return {
    title: `${project.name} — Habitat groupé`,
    description: project.vision || `Projet d'habitat groupé : ${project.name}`,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) notFound();

  const answers = project.answers || {};

  // Grouper les réponses par étape
  const stepSections = CREATION_STEPS.map((step) => {
    const stepAnswers = step.questions
      .filter((q) => answers[q.id] !== undefined)
      .map((q) => ({
        id: q.id,
        question: q.text,
        answer: formatAnswer(q.id, answers[q.id]),
      }));
    return { id: step.id, title: step.title, answers: stepAnswers };
  }).filter((s) => s.answers.length > 0);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* En-tête du projet */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 mb-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
              <svg
                className="w-7 h-7 text-[var(--primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {project.name}
            </h1>
            {project.vision && (
              <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed italic max-w-md mx-auto">
                &laquo; {project.vision} &raquo;
              </p>
            )}
            <div className="mt-4">
              <ApplyButton
                projectId={project.id}
                projectName={project.name}
              />
            </div>
          </div>

          {/* Détails du projet */}
          {stepSections.length > 0 && (
            <div className="space-y-6">
              {stepSections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-sm font-semibold text-[var(--primary)] mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />
                    {section.title}
                  </h3>
                  <div className="space-y-2 ml-4">
                    {section.answers.map((a) => (
                      <div
                        key={a.id}
                        className="flex flex-col sm:flex-row sm:gap-2"
                      >
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
          )}
        </div>

        {/* Section membres + actions (client component) */}
        <ProjectDetail
          project={project}
          members={project.project_members || []}
        />
      </div>
    </div>
  );
}
