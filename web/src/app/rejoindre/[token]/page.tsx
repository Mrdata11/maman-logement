import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { JoinProjectFlow } from "@/components/JoinProjectFlow";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getSupabase();

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("invite_token", token)
    .single();

  if (!project) return { title: "Invitation invalide" };

  return {
    title: `Rejoindre ${project.name}`,
    description: `Vous avez été invité(e) à rejoindre le projet d'habitat groupé "${project.name}"`,
  };
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, vision")
    .eq("invite_token", token)
    .single();

  if (error || !project) notFound();

  // Compter les membres
  const { count } = await supabase
    .from("project_members")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--primary)]"
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

          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
            Vous &ecirc;tes invit&eacute;(e)&nbsp;!
          </h1>
          <p className="text-sm text-[var(--muted)] mb-1">
            Rejoignez le projet d&apos;habitat group&eacute;
          </p>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            {project.name}
          </h2>
          {project.vision && (
            <p className="text-sm text-[var(--muted)] italic mb-4 leading-relaxed">
              &laquo; {project.vision} &raquo;
            </p>
          )}

          {(count ?? 0) > 0 && (
            <p className="text-xs text-[var(--muted)] mb-6">
              {count} membre{(count ?? 0) > 1 ? "s" : ""} dans ce projet
            </p>
          )}

          <JoinProjectFlow
            inviteToken={token}
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </div>
    </div>
  );
}
