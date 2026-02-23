import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { screeningSessionCreateSchema } from "@/lib/api-schemas";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const configId = request.nextUrl.searchParams.get("config_id");
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("screening_sessions")
    .select("*, screening_links(*)")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (configId) {
    query = query.eq("config_id", configId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des sessions." },
      { status: 500 }
    );
  }

  // Formater pour mettre le premier lien dans `link`
  const sessions = (data || []).map((s) => {
    const { screening_links, ...session } = s;
    return {
      ...session,
      link: screening_links?.[0] || null,
    };
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  let body;
  try {
    body = screeningSessionCreateSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Données invalides." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Vérifier que la config appartient à l'utilisateur
  const { data: config } = await supabase
    .from("screening_configs")
    .select("id")
    .eq("id", body.config_id)
    .eq("created_by", user.id)
    .single();

  if (!config) {
    return NextResponse.json(
      { error: "Configuration introuvable." },
      { status: 404 }
    );
  }

  // Créer la session
  const { data: session, error: sessionError } = await supabase
    .from("screening_sessions")
    .insert({
      config_id: body.config_id,
      candidate_name: body.candidate_name,
      candidate_email: body.candidate_email || null,
      status: "pending",
      created_by: user.id,
    })
    .select()
    .single();

  if (sessionError || !session) {
    console.error("Error creating session:", sessionError);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session." },
      { status: 500 }
    );
  }

  // Créer le lien (token généré par la DB via gen_random_bytes)
  const { data: link, error: linkError } = await supabase
    .from("screening_links")
    .insert({
      session_id: session.id,
    })
    .select()
    .single();

  if (linkError || !link) {
    console.error("Error creating link:", linkError);
    return NextResponse.json(
      { error: "Erreur lors de la génération du lien." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      session: { ...session, link },
    },
    { status: 201 }
  );
}
