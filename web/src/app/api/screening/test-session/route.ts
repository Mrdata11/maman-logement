import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const { questions, tone, duration, project_name } = body;
  if (!questions?.length || !project_name) {
    return NextResponse.json({ error: "Questions et nom du projet requis." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Créer une config temporaire de test
  const formattedQuestions = (questions as string[]).map((q, i) => ({
    id: `test_q_${i}`,
    text: q,
    required: true,
    order: i,
  }));

  const { data: config, error: configError } = await supabase
    .from("screening_configs")
    .insert({
      title: `Test - ${project_name}`,
      description: `Test de pré-sélection IA (ton: ${tone || "bienveillant"}, durée: ${duration || 15}min)`,
      questions: formattedQuestions,
      voice_id: "cgSgspJ2msm6clMCkdW9",
      language: "fr",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (configError || !config) {
    console.error("Error creating test screening config:", configError);
    return NextResponse.json(
      { error: "Erreur lors de la création de la configuration de test." },
      { status: 500 }
    );
  }

  // Créer la session de test
  const candidateName = user.user_metadata?.full_name || user.email || "Admin";

  const { data: session, error: sessionError } = await supabase
    .from("screening_sessions")
    .insert({
      config_id: config.id,
      candidate_name: candidateName,
      candidate_email: user.email || null,
      status: "pending",
      created_by: user.id,
      verification_type: "test",
    })
    .select()
    .single();

  if (sessionError || !session) {
    console.error("Error creating test session:", sessionError);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de test." },
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
    console.error("Error creating test link:", linkError);
    return NextResponse.json(
      { error: "Erreur lors de la génération du lien de test." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    token: link.token,
    sessionId: session.id,
  });
}
