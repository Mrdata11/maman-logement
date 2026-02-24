import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getAuthSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Vérifier que l'utilisateur est le créateur du projet
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.vision !== undefined) updates.vision = body.vision;
  if (body.name !== undefined) updates.name = body.name;
  if (body.answers !== undefined) updates.answers = body.answers;
  if (body.images !== undefined) updates.images = body.images;
  if (body.is_published !== undefined) updates.is_published = body.is_published;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("Erreur mise à jour projet:", JSON.stringify(error));
    return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
