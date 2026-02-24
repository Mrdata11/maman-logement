import { createClient } from "@supabase/supabase-js";
import { ProjectsListing } from "@/components/ProjectsListing";
import type { ProjectCardData } from "@/components/ProjectCard";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Projets d\u2019habitat group\u00e9 \u2014 L\u2019Annuaire .0",
  description:
    "D\u00e9couvrez les projets d\u2019habitat group\u00e9 en Belgique et candidatez pour rejoindre une communaut\u00e9.",
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getProjects(): Promise<ProjectCardData[]> {
  const supabase = getSupabase();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, vision, answers, created_at, project_members(count)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !projects) return [];

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    vision: p.vision,
    answers: p.answers || {},
    created_at: p.created_at,
    member_count:
      (p.project_members as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));
}

export default async function ProjetsPage() {
  const projects = await getProjects();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* En-t\u00eate */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2">
            Projets d&apos;habitat group&eacute;
          </h1>
          <p className="text-sm text-[var(--muted)] max-w-lg mx-auto">
            D&eacute;couvrez les projets de communaut&eacute;s en Belgique et
            envoyez votre candidature pour rejoindre celle qui vous correspond.
          </p>
        </div>

        {/* Listing */}
        <ProjectsListing projects={projects} />

        {/* CTA cr\u00e9er un projet */}
        <div className="mt-12 text-center bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">
            Vous portez un projet ?
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Cr&eacute;ez votre fiche projet pour recevoir des candidatures de
            personnes motiv&eacute;es.
          </p>
          <a
            href="/creer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Cr&eacute;er un projet
          </a>
        </div>
      </div>
    </div>
  );
}
