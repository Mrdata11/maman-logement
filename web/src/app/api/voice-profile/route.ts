import { NextRequest, NextResponse } from "next/server";
import { PROFILE_VOICE_QUESTIONS } from "@/lib/profile-types";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { voiceProfileSchema } from "@/lib/api-schemas";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Service IA non configur\u00e9." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = voiceProfileSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Donn\u00e9es invalides." },
      { status: 400 }
    );
  }

  const { transcript, questionId } = body;

  const question = PROFILE_VOICE_QUESTIONS.find((q) => q.id === questionId);
  if (!question) {
    return NextResponse.json(
      { error: "Question non trouvee." },
      { status: 400 }
    );
  }

  const prompt = `Tu es un assistant qui aide a mettre en forme la reponse vocale d'une personne pour son profil d'habitat groupe.

La personne a repondu a cette question : "${question.question}"
Contexte de la question : ${question.helpText}

## TRANSCRIPT VOCAL
<user_input>
${transcript.slice(0, 5000)}
</user_input>

## REGLES
- Nettoie le texte : supprime les hesitations ("euh", "hm"), les repetitions, les faux departs
- Garde le ton personnel et authentique de la personne (premiere personne)
- Corrige la grammaire et la ponctuation
- Ne change PAS le sens ni n'ajoute d'information
- Si le transcript est deja propre, renvoie-le tel quel
- Le resultat doit etre un texte fluide et agreable a lire

## FORMAT DE REPONSE
Reponds UNIQUEMENT avec un JSON valide:
{"cleanedText": "<texte nettoye>"}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error [voice-profile]:", response.status, await response.text());
      return NextResponse.json(
        { error: "Erreur du service IA. Veuillez r\u00e9essayer." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content[0].text;
    const result = JSON.parse(text);

    return NextResponse.json({
      cleanedText:
        typeof result.cleanedText === "string"
          ? result.cleanedText
          : transcript.trim(),
    });
  } catch (error) {
    console.error("Route error [voice-profile]:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
