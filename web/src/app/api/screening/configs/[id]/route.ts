import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { screeningConfigUpdateSchema } from "@/lib/api-schemas";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("screening_configs")
    .select("*")
    .eq("id", id)
    .eq("created_by", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Configuration introuvable." },
      { status: 404 }
    );
  }

  return NextResponse.json({ config: data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;

  let body;
  try {
    body = screeningConfigUpdateSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Données invalides." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Si les questions changent, on invalide l'agent caché
  const updateData: Record<string, unknown> = {
    ...body,
    updated_at: new Date().toISOString(),
  };
  if (body.questions) {
    updateData.elevenlabs_agent_id = null;
  }

  const { data, error } = await supabase
    .from("screening_configs")
    .update(updateData)
    .eq("id", id)
    .eq("created_by", user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour." },
      { status: 500 }
    );
  }

  return NextResponse.json({ config: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("screening_configs")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Erreur lors de la suppression." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
