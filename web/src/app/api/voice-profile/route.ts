import { NextRequest, NextResponse } from "next/server";
import { PROFILE_VOICE_QUESTIONS } from "@/lib/profile-types";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { transcript, questionId } = await request.json();

  if (
    !transcript ||
    typeof transcript !== "string" ||
    transcript.trim().length < 5
  ) {
    return NextResponse.json(
      { error: "Le texte est trop court." },
      { status: 400 }
    );
  }

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
"${transcript}"

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
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Anthropic API error: ${errorText}` },
        { status: response.status }
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
    return NextResponse.json(
      { error: `Failed to process voice: ${error}` },
      { status: 500 }
    );
  }
}
