import { NextRequest, NextResponse } from "next/server";
import { screeningAgentSchema } from "@/lib/api-schemas";
import { getAuthenticatedClient } from "@/lib/api-auth";
import {
  createScreeningAgent,
  getConversationToken,
} from "@/lib/screening/elevenlabs";

export async function POST(request: NextRequest) {
  // Route validée par token — utilise le client authentifié si disponible

  let body;
  try {
    body = screeningAgentSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Token invalide." },
      { status: 400 }
    );
  }

  const { supabase } = await getAuthenticatedClient();

  // Vérifier le lien
  const { data: link } = await supabase
    .from("screening_links")
    .select("*, screening_sessions(*, screening_configs(*))")
    .eq("token", body.token)
    .single();

  if (!link) {
    return NextResponse.json(
      { error: "Lien introuvable." },
      { status: 404 }
    );
  }

  // Vérifier expiration
  if (new Date(link.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Ce lien a expiré. Veuillez contacter l'organisateur." },
      { status: 410 }
    );
  }

  // Vérifier si déjà utilisé et session terminée
  const session = link.screening_sessions;
  if (!session) {
    return NextResponse.json(
      { error: "Session introuvable." },
      { status: 404 }
    );
  }

  if (session.status === "completed") {
    return NextResponse.json(
      { error: "Cet entretien a déjà été réalisé." },
      { status: 410 }
    );
  }

  const config = session.screening_configs;
  if (!config) {
    return NextResponse.json(
      { error: "Configuration introuvable." },
      { status: 404 }
    );
  }

  try {
    // Créer ou réutiliser l'agent ElevenLabs
    let agentId = config.elevenlabs_agent_id;

    if (!agentId) {
      const agent = await createScreeningAgent({
        title: config.title,
        questions: config.questions,
        language: config.language || "fr",
        voice_id: config.voice_id || "cgSgspJ2msm6clMCkdW9",
        candidateName: session.candidate_name,
      });
      agentId = agent.agent_id;

      // Cache l'agent_id sur la config
      await supabase
        .from("screening_configs")
        .update({ elevenlabs_agent_id: agentId })
        .eq("id", config.id);
    }

    // Obtenir un token signé pour le WebRTC
    const signedUrl = await getConversationToken(agentId);

    // Marquer le lien comme utilisé et la session en cours
    await supabase
      .from("screening_links")
      .update({ used_at: new Date().toISOString() })
      .eq("id", link.id);

    await supabase
      .from("screening_sessions")
      .update({
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    return NextResponse.json({
      signedUrl,
      agentId,
      sessionId: session.id,
      candidateName: session.candidate_name,
      configTitle: config.title,
      isVerification: !!session.verification_type,
    });
  } catch (error) {
    console.error("Error setting up screening agent:", error);
    return NextResponse.json(
      { error: "Erreur lors de la préparation de l'entretien vocal." },
      { status: 502 }
    );
  }
}
