import { NextRequest, NextResponse } from "next/server";
import { verificationCompleteSchema } from "@/lib/api-schemas";
import { createClient } from "@supabase/supabase-js";
import { getConversationDetails } from "@/lib/screening/elevenlabs";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  // Route appelée par le ScreeningCallInterface après l'appel
  // Pas d'auth stricte car le candidat n'est pas forcément connecté dans le contexte du call

  let body;
  try {
    body = verificationCompleteSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Données invalides." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Récupérer la session
  const { data: session } = await supabase
    .from("screening_sessions")
    .select("*, screening_configs(*)")
    .eq("id", body.session_id)
    .single();

  if (!session) {
    return NextResponse.json(
      { error: "Session introuvable." },
      { status: 404 }
    );
  }

  if (session.status === "completed") {
    return NextResponse.json({ session, alreadyCompleted: true });
  }

  try {
    // Récupérer le transcript d'ElevenLabs
    const conversationData = await getConversationDetails(body.conversation_id);

    // Générer le résumé IA via Anthropic
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let aiSummary: string | null = null;

    if (apiKey && conversationData.transcript.length > 0) {
      const config = session.screening_configs;
      const transcriptText = conversationData.transcript
        .map(
          (t) =>
            `${t.role === "user" ? "CANDIDAT" : "IA"}: ${t.message}`
        )
        .join("\n");

      const isProfile = session.verification_type === "profile";
      const summaryPrompt = isProfile
        ? `Tu analyses un entretien de vérification d'identité pour un profil communautaire sur une plateforme d'habitat groupé.

## CONTEXTE
Candidat(e) : ${session.candidate_name}

## TRANSCRIPT
${transcriptText}

## CONSIGNES
Produis un résumé court (2-3 paragraphes) :
1. Présentation et authenticité de la personne
2. Motivations et situation
3. Impression générale

Reste factuel et bienveillant.`
        : `Tu analyses un entretien de vérification pour un projet d'habitat groupé.

## CONTEXTE
Porteur de projet : ${session.candidate_name}

## TRANSCRIPT
${transcriptText}

## CONSIGNES
Produis un résumé court (2-3 paragraphes) :
1. Nature et avancement du projet
2. Gouvernance et accueil
3. Impression générale sur la crédibilité du projet

Reste factuel et bienveillant.`;

      const aiResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1000,
            messages: [{ role: "user", content: summaryPrompt }],
          }),
        }
      );

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        aiSummary = aiData.content?.[0]?.text || null;
      }
    }

    // Calculer la durée
    const lastEntry =
      conversationData.transcript[conversationData.transcript.length - 1];
    const durationSeconds = lastEntry?.timestamp
      ? Math.ceil(lastEntry.timestamp)
      : null;

    // Mettre à jour la session
    await supabase
      .from("screening_sessions")
      .update({
        conversation_id: body.conversation_id,
        status: "completed",
        transcript: conversationData.transcript,
        ai_summary: aiSummary,
        duration_seconds: durationSeconds,
        completed_at: new Date().toISOString(),
      })
      .eq("id", body.session_id);

    // Marquer le profil/projet comme vérifié
    if (session.verification_type === "profile" && session.verification_target_id) {
      await supabase
        .from("profiles")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_session_id: session.id,
        })
        .eq("id", session.verification_target_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing verification:", error);
    return NextResponse.json(
      { error: "Erreur lors de la finalisation de la vérification." },
      { status: 502 }
    );
  }
}
