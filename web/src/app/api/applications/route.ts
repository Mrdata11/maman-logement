import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// POST — Soumettre une candidature
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const body = await request.json();
  const { project_id, motivation } = body as {
    project_id?: string;
    motivation?: string;
  };

  if (!project_id) {
    return NextResponse.json(
      { error: "project_id est requis" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // V\u00e9rifier que l'utilisateur a un profil publi\u00e9
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, is_published")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Vous devez d'abord cr\u00e9er votre profil", code: "NO_PROFILE" },
      { status: 400 }
    );
  }

  if (!profile.is_published) {
    return NextResponse.json(
      { error: "Votre profil doit \u00eatre publi\u00e9 pour candidater", code: "PROFILE_NOT_PUBLISHED" },
      { status: 400 }
    );
  }

  // V\u00e9rifier que le projet existe
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", project_id)
    .eq("is_published", true)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: "Projet non trouv\u00e9" },
      { status: 404 }
    );
  }

  // V\u00e9rifier si d\u00e9j\u00e0 candidat\u00e9
  const { data: existing } = await supabase
    .from("applications")
    .select("id, status")
    .eq("profile_id", profile.id)
    .eq("project_id", project_id)
    .single();

  if (existing && existing.status !== "withdrawn") {
    return NextResponse.json(
      { error: "Vous avez d\u00e9j\u00e0 candidat\u00e9 pour ce projet", code: "ALREADY_APPLIED" },
      { status: 400 }
    );
  }

  // Cr\u00e9er ou mettre \u00e0 jour la candidature (si retir\u00e9e, on peut re-candidater)
  const { data: application, error: insertError } = await supabase
    .from("applications")
    .upsert(
      {
        profile_id: profile.id,
        project_id,
        status: "pending",
        motivation: motivation?.trim() || null,
        reviewer_notes: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,project_id" }
    )
    .select()
    .single();

  if (insertError) {
    console.error("Error creating application:", insertError);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la candidature" },
      { status: 500 }
    );
  }

  return NextResponse.json(application);
}

// GET — Mes candidatures
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const supabase = getSupabase();

  // Trouver le profil
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json([]);
  }

  const { data: applications, error } = await supabase
    .from("applications")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    );
  }

  // Charger les projets séparément (pas de FK applications→projects)
  const projectIds = (applications || [])
    .map((a: { project_id: string }) => a.project_id)
    .filter(Boolean);

  let projectsMap: Record<string, Record<string, unknown>> = {};
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, vision")
      .in("id", projectIds);

    if (projects) {
      for (const p of projects) {
        projectsMap[p.id] = p;
      }
    }
  }

  const applicationsWithProjects = (applications || []).map(
    (a: Record<string, unknown>) => ({
      ...a,
      projects: projectsMap[a.project_id as string] || null,
    })
  );

  return NextResponse.json(applicationsWithProjects);
}
