import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const body = await request.json();
  const { invite_token } = body as { invite_token?: string };

  if (!invite_token) {
    return NextResponse.json(
      { error: "invite_token est requis" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Trouver le projet par token
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("invite_token", invite_token)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: "Lien d'invitation invalide ou expiré" },
      { status: 404 }
    );
  }

  // Vérifier que l'utilisateur a un profil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Vous devez d'abord créer votre profil", code: "NO_PROFILE" },
      { status: 400 }
    );
  }

  // Ajouter comme membre
  const { error: insertError } = await supabase
    .from("project_members")
    .upsert(
      {
        project_id: project.id,
        profile_id: profile.id,
        role: "member",
      },
      { onConflict: "project_id,profile_id" }
    );

  if (insertError) {
    console.error("Error joining project:", insertError);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription au projet" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    project_id: project.id,
    project_name: project.name,
  });
}
