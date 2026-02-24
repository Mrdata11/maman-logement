import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { verificationStartSchema } from "@/lib/api-schemas";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  let body;
  try {
    body = verificationStartSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Données invalides." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Vérifier que l'utilisateur possède le profil
  if (body.type === "profile") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, user_id, is_verified, display_name")
      .eq("id", body.target_id)
      .single();

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Profil introuvable ou non autorisé." },
        { status: 403 }
      );
    }

    if (profile.is_verified) {
      return NextResponse.json(
        { error: "Ce profil est déjà vérifié." },
        { status: 409 }
      );
    }
  }

  // Vérifier qu'il n'y a pas déjà un screening en cours
  const { data: existingSession } = await supabase
    .from("screening_sessions")
    .select("id, status")
    .eq("verification_type", body.type)
    .eq("verification_target_id", body.target_id)
    .in("status", ["pending", "in_progress"])
    .single();

  if (existingSession) {
    // Récupérer le lien existant
    const { data: existingLink } = await supabase
      .from("screening_links")
      .select("token")
      .eq("session_id", existingSession.id)
      .single();

    if (existingLink) {
      return NextResponse.json({
        token: existingLink.token,
        sessionId: existingSession.id,
        existing: true,
      });
    }
  }

  // Récupérer la config système correspondante
  const configTitle =
    body.type === "profile" ? "Vérification Profil" : "Vérification Projet";

  const { data: config } = await supabase
    .from("screening_configs")
    .select("id")
    .eq("is_system", true)
    .eq("title", configTitle)
    .single();

  if (!config) {
    return NextResponse.json(
      { error: "Configuration de vérification non trouvée. Contactez l'administrateur." },
      { status: 500 }
    );
  }

  // Récupérer le nom du candidat
  let candidateName = "Utilisateur";
  if (body.type === "profile") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", body.target_id)
      .single();
    if (profile) candidateName = profile.display_name;
  }

  // Créer la session de vérification
  const { data: session, error: sessionError } = await supabase
    .from("screening_sessions")
    .insert({
      config_id: config.id,
      candidate_name: candidateName,
      candidate_email: user.email || null,
      status: "pending",
      created_by: user.id,
      verification_type: body.type,
      verification_target_id: body.target_id,
    })
    .select()
    .single();

  if (sessionError || !session) {
    console.error("Error creating verification session:", sessionError);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session." },
      { status: 500 }
    );
  }

  // Créer le lien
  const { data: link, error: linkError } = await supabase
    .from("screening_links")
    .insert({ session_id: session.id })
    .select()
    .single();

  if (linkError || !link) {
    console.error("Error creating verification link:", linkError);
    return NextResponse.json(
      { error: "Erreur lors de la génération du lien." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    token: link.token,
    sessionId: session.id,
    existing: false,
  });
}
