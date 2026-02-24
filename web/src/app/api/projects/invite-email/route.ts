import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// POST — Inviter un cohabitant par email
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const body = await request.json();
  const { project_id, email } = body;

  if (!project_id || !email) {
    return NextResponse.json(
      { error: "project_id et email requis" },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Email invalide" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Vérifier que le user est le créateur du projet
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id, name, invite_token")
    .eq("id", project_id)
    .single();

  if (projectError || !project) {
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

  // Vérifier si une invitation existe déjà pour cet email
  const { data: existing } = await supabase
    .from("project_invitations")
    .select("id, status")
    .eq("project_id", project_id)
    .eq("email", email.toLowerCase())
    .single();

  if (existing && existing.status === "pending") {
    return NextResponse.json(
      { error: "Une invitation est déjà en cours pour cet email" },
      { status: 409 }
    );
  }

  // Vérifier si un profil avec cet email existe déjà
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, user_id, display_name")
    .eq("contact_email", email.toLowerCase())
    .single();

  if (existingProfile) {
    // Vérifier s'il est déjà membre
    const { data: existingMember } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", project_id)
      .eq("profile_id", existingProfile.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "Cette personne est déjà membre du projet" },
        { status: 409 }
      );
    }

    // Ajouter directement comme membre
    const { error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id,
        profile_id: existingProfile.id,
        role: "member",
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json(
        { error: "Erreur lors de l'ajout du membre" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "added_directly",
      message: `${existingProfile.display_name} a été ajouté(e) au projet`,
      profile: existingProfile,
    });
  }

  // Créer une invitation en attente
  const { data: invitation, error: inviteError } = await supabase
    .from("project_invitations")
    .upsert(
      {
        project_id,
        email: email.toLowerCase(),
        invited_by: user.id,
        status: "pending",
      },
      { onConflict: "project_id,email" }
    )
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
    message: `Invitation envoyée à ${email}`,
    invitation,
  });
}
