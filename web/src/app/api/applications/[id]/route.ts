import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// PATCH — Modifier le statut d'une candidature
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const { status, reviewer_notes } = body as {
    status?: string;
    reviewer_notes?: string;
  };

  if (!status) {
    return NextResponse.json(
      { error: "status est requis" },
      { status: 400 }
    );
  }

  const validStatuses = ["accepted", "rejected", "withdrawn"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Statut invalide" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Récupérer la candidature
  const { data: application, error: fetchError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !application) {
    return NextResponse.json(
      { error: "Candidature non trouvée" },
      { status: 404 }
    );
  }

  // Récupérer le projet séparément (pas de FK applications→projects)
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", application.project_id)
    .single();

  // Vérifier le profil du user
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const isApplicant = profile && application.profile_id === profile.id;
  const isCreator = project?.user_id === user.id;

  // Le candidat ne peut que retirer
  if (isApplicant && status === "withdrawn") {
    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "Vous ne pouvez retirer qu'une candidature en attente" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: "withdrawn", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Erreur lors du retrait" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }

  // Le cr\u00e9ateur peut accepter ou refuser
  if (isCreator && (status === "accepted" || status === "rejected")) {
    const updateData: Record<string, string> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (reviewer_notes !== undefined) {
      updateData.reviewer_notes = reviewer_notes;
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Erreur lors de la mise \u00e0 jour" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "Action non autoris\u00e9e" },
    { status: 403 }
  );
}
