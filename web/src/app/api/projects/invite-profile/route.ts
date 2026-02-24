import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// POST — Inviter un profil dans un projet
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const body = await request.json();
  const { project_id, profile_id } = body;

  if (!project_id || !profile_id) {
    return NextResponse.json(
      { error: "project_id et profile_id requis" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Vérifier que le user est le créateur du projet
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id, name")
    .eq("id", project_id)
    .single();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json(
      { error: "Non autorisé" },
      { status: 403 }
    );
  }

  // Récupérer le profil cible
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_id, display_name, contact_email")
    .eq("id", profile_id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "Profil non trouvé" },
      { status: 404 }
    );
  }

  // Vérifier que le profil n'est pas déjà membre
  const { data: existingMember } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", project_id)
    .eq("profile_id", profile_id)
    .single();

  if (existingMember) {
    return NextResponse.json(
      { error: "Cette personne est déjà membre du projet" },
      { status: 409 }
    );
  }

  // Vérifier si une invitation pending existe déjà
  const { data: existingInvite } = await supabase
    .from("project_invitations")
    .select("id, status")
    .eq("project_id", project_id)
    .eq("profile_id", profile_id)
    .eq("status", "pending")
    .single();

  if (existingInvite) {
    return NextResponse.json(
      { error: "Une invitation est déjà en cours pour ce profil" },
      { status: 409 }
    );
  }

  // Créer l'invitation
  const { data: invitation, error: inviteError } = await supabase
    .from("project_invitations")
    .insert({
      project_id,
      profile_id,
      email: profile.contact_email || "",
      invited_by: user.id,
      status: "pending",
    })
    .select()
    .single();

  if (inviteError) {
    console.error("Error creating invitation:", inviteError);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'invitation" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: "invitation_sent",
    message: `Invitation envoyée à ${profile.display_name}`,
    invitation,
  });
}
