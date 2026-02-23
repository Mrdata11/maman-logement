import { NextRequest, NextResponse } from "next/server";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";
import { ProfileIntroduction } from "@/lib/profile-types";
import { QuestionnaireAnswers } from "@/lib/questionnaire-types";

function formatQuestionnaireForPrompt(answers: QuestionnaireAnswers): string {
  const lines: string[] = [];
  for (const step of QUESTIONNAIRE_STEPS) {
    for (const q of step.questions) {
      const answer = answers[q.id];
      if (answer === undefined || answer === null) continue;

      let displayValue: string;
      if (Array.isArray(answer)) {
        const labels = answer
          .map((a) => q.options?.find((o) => o.id === a)?.label || a)
          .join(", ");
        displayValue = labels;
      } else if (typeof answer === "number" && q.sliderConfig) {
        displayValue = `${answer}${q.sliderConfig.unit || ""}`;
      } else if (typeof answer === "string" && q.options) {
        displayValue = q.options.find((o) => o.id === answer)?.label || answer;
      } else {
        displayValue = String(answer);
      }

      lines.push(`- ${q.text}: ${displayValue}`);
    }
  }
  return lines.join("\n");
}

function formatIntroductionForPrompt(intro: ProfileIntroduction): string {
  const sections: string[] = [];
  if (intro.whoAreYou) sections.push(`Qui suis-je: ${intro.whoAreYou}`);
  if (intro.whyGroupHousing)
    sections.push(`Pourquoi l'habitat groupe: ${intro.whyGroupHousing}`);
  if (intro.communityValues)
    sections.push(`Mes valeurs: ${intro.communityValues}`);
  if (intro.whatYouBring)
    sections.push(`Ce que j'apporte: ${intro.whatYouBring}`);
  if (intro.idealDay) sections.push(`Ma journee ideale: ${intro.idealDay}`);
  if (intro.additionalInfo)
    sections.push(`Informations supplementaires: ${intro.additionalInfo}`);
  return sections.join("\n");
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { questionnaireAnswers, introduction } = await request.json();

  const questionnaireText = formatQuestionnaireForPrompt(
    questionnaireAnswers || {}
  );
  const introText = formatIntroductionForPrompt(introduction || {});

  const prompt = `Tu es un assistant qui cree des resumes de profil pour des personnes cherchant un habitat groupe en Belgique.
A partir des informations suivantes, tu dois generer:
1. Un resume en 2-3 phrases qui donne envie de decouvrir cette personne (chaleureux, humain, engageant)
2. 5-8 tags courts (2-3 mots max chacun) qui resument les aspects cles du profil

## REPONSES AU QUESTIONNAIRE
${questionnaireText || "(aucune)"}

## PRESENTATION PERSONNELLE
${introText || "(aucune)"}

## REGLES
- Le resume doit etre a la 3eme personne ("Elle cherche...", "Il souhaite...")
- Le ton doit etre chaleureux et bienveillant
- Les tags doivent etre concis et utiles pour filtrer (ex: "Pres de Bruxelles", "Budget modeste", "Jardin partage", "Valeurs ecologiques")
- Ecris en francais

## FORMAT DE REPONSE
Reponds UNIQUEMENT avec un JSON valide:
{"summary": "<resume 2-3 phrases>", "tags": ["tag1", "tag2", ...]}`;

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
      summary: typeof result.summary === "string" ? result.summary : "",
      tags: Array.isArray(result.tags)
        ? result.tags.filter((t: unknown) => typeof t === "string").slice(0, 8)
        : [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to generate summary: ${error}` },
      { status: 500 }
    );
  }
}
