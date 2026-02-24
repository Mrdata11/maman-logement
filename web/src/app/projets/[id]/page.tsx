import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { CREATION_STEPS } from "@/lib/creation-questionnaire-data";
import { ProjectDetail } from "@/components/ProjectDetail";
import { ProjectViewTracker } from "@/components/ProjectViewTracker";
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

export interface StepSection {
  id: string;
  title: string;
  answers: { id: string; question: string; answer: string }[];
}

async function getProject(id: string) {
  const supabase = getSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) return null;

  const { data: members } = await supabase
    .from("project_members")
    .select("id, project_id, profile_id, role, joined_at")
    .eq("project_id", id);

  const profileIds = (members || []).map((m: { profile_id: string }) => m.profile_id).filter(Boolean);
  let profilesMap: Record<string, Record<string, unknown>> = {};

  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, location, age, gender, ai_summary, ai_tags, is_verified, created_at")
      .in("id", profileIds);

    if (profiles) {
      for (const p of profiles) {
        profilesMap[p.id] = p;
      }
    }
  }

  const membersWithProfiles = (members || []).map((m: Record<string, unknown>) => ({
    ...m,
    profiles: profilesMap[m.profile_id as string] || null,
  }));

  return { ...project, project_members: membersWithProfiles } as unknown as ProjectWithMembers;
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

  const stepSections: StepSection[] = CREATION_STEPS.map((step) => {
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
      <ProjectViewTracker projectId={project.id} />
      <ProjectDetail
        project={project}
        members={project.project_members || []}
        stepSections={stepSections}
      />
    </div>
  );
}
