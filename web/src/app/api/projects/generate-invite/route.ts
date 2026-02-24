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
  const { project_id } = body as { project_id?: string };

  if (!project_id) {
    return NextResponse.json(
      { error: "project_id est requis" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Vérifier que l'utilisateur est le créateur du projet
  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", project_id)
    .single();

  if (fetchError || !project) {
    return NextResponse.json(
      { error: "Projet non trouvé" },
      { status: 404 }
    );
  }

  if (project.user_id !== user.id) {
    return NextResponse.json(
      { error: "Vous n'êtes pas le créateur de ce projet" },
      { status: 403 }
    );
  }

  // Générer un token d'invitation unique
  const invite_token = crypto.randomUUID().slice(0, 8);

  const { error: updateError } = await supabase
    .from("projects")
    .update({ invite_token })
    .eq("id", project_id);

  if (updateError) {
    console.error("Error generating invite token:", updateError);
    return NextResponse.json(
      { error: "Erreur lors de la génération du lien" },
      { status: 500 }
    );
  }

  const baseUrl = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";
  const invite_url = `${baseUrl}/rejoindre/${invite_token}`;

  return NextResponse.json({ invite_token, invite_url });
}
