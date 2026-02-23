import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { screeningConfigCreateSchema } from "@/lib/api-schemas";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("screening_configs")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching screening configs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des configurations." },
      { status: 500 }
    );
  }

  return NextResponse.json({ configs: data });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  let body;
  try {
    body = screeningConfigCreateSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Données invalides." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("screening_configs")
    .insert({
      title: body.title,
      description: body.description || null,
      questions: body.questions,
      voice_id: body.voice_id || "cgSgspJ2msm6clMCkdW9",
      language: body.language || "fr",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating screening config:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la configuration." },
      { status: 500 }
    );
  }

  return NextResponse.json({ config: data }, { status: 201 });
}
