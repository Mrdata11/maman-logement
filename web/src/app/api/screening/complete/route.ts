import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { screeningCompleteSchema } from "@/lib/api-schemas";
import { createClient } from "@supabase/supabase-js";
import { getConversationDetails } from "@/lib/screening/elevenlabs";

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
    body = screeningCompleteSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Données invalides." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Vérifier que la session appartient à l'utilisateur
  const { data: session } = await supabase
    .from("screening_sessions")
    .select("*, screening_configs(*)")
    .eq("id", body.session_id)
    .eq("created_by", user.id)
    .single();

  if (!session) {
    return NextResponse.json(
      { error: "Session introuvable." },
      { status: 404 }
    );
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

      const summaryPrompt = `Tu es un assistant RH qui analyse un entretien de pré-sélection pour un projet d'habitat groupé.

## CONTEXTE
Projet : ${config?.title || "Non spécifié"}
Candidat(e) : ${session.candidate_name}

## TRANSCRIPT DE L'ENTRETIEN
${transcriptText}

## CONSIGNES
Produis un résumé structuré de l'entretien en 3-5 paragraphes courts :
1. Impression générale et motivation du candidat
2. Expérience et compétences pertinentes
3. Valeurs et compatibilité avec le projet
4. Points d'attention ou questions à approfondir
5. Recommandation (positif / neutre / à creuser)

Reste factuel et bienveillant. Ce résumé sera lu par le porteur du projet.`;

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
            max_tokens: 1500,
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
    const { data: updated, error } = await supabase
      .from("screening_sessions")
      .update({
        conversation_id: body.conversation_id,
        status: "completed",
        transcript: conversationData.transcript,
        ai_summary: aiSummary,
        duration_seconds: durationSeconds,
        completed_at: new Date().toISOString(),
      })
      .eq("id", body.session_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating session:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour de la session." },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("Error completing screening:", error);
    return NextResponse.json(
      { error: "Erreur lors de la finalisation de l'entretien." },
      { status: 502 }
    );
  }
}
