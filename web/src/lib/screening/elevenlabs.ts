import type { ScreeningQuestion, TranscriptEntry } from "./types";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

function getApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY non configuré");
  return key;
}

export async function createScreeningAgent(config: {
  title: string;
  questions: ScreeningQuestion[];
  language: string;
  voice_id: string;
  candidateName: string;
}): Promise<{ agent_id: string }> {
  const systemPrompt = buildScreeningSystemPrompt(config);

  const response = await fetch(`${ELEVENLABS_API_BASE}/convai/agents/create`, {
    method: "POST",
    headers: {
      "xi-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `Screening: ${config.title} - ${config.candidateName}`.slice(
        0,
        100
      ),
      conversation_config: {
        agent: {
          prompt: {
            prompt: systemPrompt,
          },
          first_message: `Bonjour ${config.candidateName} ! Je suis l'assistant vocal du projet "${config.title}". Je vais vous poser quelques questions pour mieux vous connaître. Êtes-vous prêt(e) à commencer ?`,
          language: config.language,
        },
        tts: {
          model_id: "eleven_flash_v2_5",
          voice_id: config.voice_id,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("ElevenLabs create agent error:", response.status, text);
    throw new Error("Erreur lors de la création de l'agent vocal");
  }

  return response.json();
}

export async function getConversationToken(
  agentId: string
): Promise<string> {
  const response = await fetch(
    `${ELEVENLABS_API_BASE}/convai/conversation/get_signed_url?agent_id=${agentId}`,
    {
      headers: { "xi-api-key": getApiKey() },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("ElevenLabs token error:", response.status, text);
    throw new Error("Erreur lors de la génération du token de conversation");
  }

  const data = await response.json();
  return data.signed_url;
}

export async function getConversationDetails(
  conversationId: string
): Promise<{
  transcript: TranscriptEntry[];
  status: string;
  analysis: Record<string, unknown> | null;
}> {
  const response = await fetch(
    `${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`,
    {
      headers: { "xi-api-key": getApiKey() },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("ElevenLabs conversation error:", response.status, text);
    throw new Error("Erreur lors de la récupération de la conversation");
  }

  const data = await response.json();

  const transcript: TranscriptEntry[] = (data.transcript || []).map(
    (entry: { role: string; message: string; time_in_call_secs?: number }) => ({
      role: entry.role === "user" ? "user" : "agent",
      message: entry.message,
      timestamp: entry.time_in_call_secs,
    })
  );

  return {
    transcript,
    status: data.status || "unknown",
    analysis: data.analysis || null,
  };
}

function buildScreeningSystemPrompt(config: {
  title: string;
  questions: ScreeningQuestion[];
  candidateName: string;
}): string {
  const questionsText = config.questions
    .sort((a, b) => a.order - b.order)
    .map((q, i) => {
      let line = `${i + 1}. ${q.text}`;
      if (q.followUp) line += `\n   [Relance si nécessaire : ${q.followUp}]`;
      if (q.required) line += ` (obligatoire)`;
      return line;
    })
    .join("\n");

  return `Tu es un assistant vocal chaleureux et professionnel qui mène un entretien de pré-sélection pour le projet "${config.title}".

## TON RÔLE
- Tu parles en français, de manière naturelle et bienveillante.
- Tu poses les questions une par une, dans l'ordre.
- Tu écoutes attentivement les réponses et tu peux poser des questions de relance si la réponse est trop vague.
- Tu ne juges pas les réponses. Tu es là pour recueillir des informations.
- Tu gardes un ton conversationnel, pas un interrogatoire.
- Tu fais des transitions naturelles entre les questions.

## QUESTIONS À POSER (dans l'ordre)
${questionsText}

## RÈGLES
- Pose TOUTES les questions obligatoires.
- Si le candidat semble mal à l'aise, rassure-le.
- À la fin de toutes les questions, remercie le candidat et dis-lui qu'il recevra un retour prochainement.
- Ne réponds JAMAIS à des questions techniques sur le projet, dis que le porteur de projet pourra y répondre.
- Si le candidat essaie de changer de sujet, ramène-le poliment aux questions.
- Garde tes interventions courtes (2-3 phrases max).`;
}
