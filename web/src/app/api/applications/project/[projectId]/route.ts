import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET — Candidatures pour un projet (visible par le cr\u00e9ateur)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { projectId } = await params;
  const supabase = getSupabase();

  // V\u00e9rifier que le user est le cr\u00e9ateur du projet
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: "Projet non trouv\u00e9" },
      { status: 404 }
    );
  }

  if (project.user_id !== user.id) {
    return NextResponse.json(
      { error: "Vous n'\u00eates pas le cr\u00e9ateur de ce projet" },
      { status: 403 }
    );
  }

  // Récupérer les candidatures
  const { data: applications, error } = await supabase
    .from("applications")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching project applications:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    );
  }

  // Charger les profils séparément (pas de FK applications→profiles)
  const profileIds = (applications || [])
    .map((a: { profile_id: string }) => a.profile_id)
    .filter(Boolean);

  let profilesMap: Record<string, Record<string, unknown>> = {};
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, location, age, gender, sexuality, ai_summary, ai_tags, is_verified, questionnaire_answers, introduction, created_at")
      .in("id", profileIds);

    if (profiles) {
      for (const p of profiles) {
        profilesMap[p.id] = p;
      }
    }
  }

  const applicationsWithProfiles = (applications || []).map(
    (a: Record<string, unknown>) => ({
      ...a,
      profiles: profilesMap[a.profile_id as string] || null,
    })
  );

  return NextResponse.json(applicationsWithProfiles);
}
