import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// POST — Accepter ou décliner une invitation
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const body = await request.json();
  const { invitation_id, action } = body;

  if (!invitation_id || !["accept", "decline"].includes(action)) {
    return NextResponse.json(
      { error: "invitation_id et action (accept|decline) requis" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Récupérer le profil du user
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, contact_email")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "Profil non trouvé" },
      { status: 404 }
    );
  }

  // Récupérer l'invitation
  const { data: invitation } = await supabase
    .from("project_invitations")
    .select("*")
    .eq("id", invitation_id)
    .eq("status", "pending")
    .single();

  if (!invitation) {
    return NextResponse.json(
      { error: "Invitation non trouvée ou déjà traitée" },
      { status: 404 }
    );
  }

  // Vérifier que l'invitation concerne bien ce user
  const isForMe =
    invitation.profile_id === profile.id ||
    (invitation.email && invitation.email === profile.contact_email);

  if (!isForMe) {
    return NextResponse.json(
      { error: "Cette invitation ne vous concerne pas" },
      { status: 403 }
    );
  }

  if (action === "accept") {
    // Ajouter comme membre du projet
    const { error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id: invitation.project_id,
        profile_id: profile.id,
        role: "member",
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json(
        { error: "Erreur lors de l'ajout au projet" },
        { status: 500 }
      );
    }

    // Mettre à jour le statut de l'invitation
    await supabase
      .from("project_invitations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", invitation_id);

    return NextResponse.json({
      status: "accepted",
      message: "Vous avez rejoint le projet !",
      project_id: invitation.project_id,
    });
  } else {
    // Décliner
    await supabase
      .from("project_invitations")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", invitation_id);

    return NextResponse.json({
      status: "declined",
      message: "Invitation déclinée",
    });
  }
}
