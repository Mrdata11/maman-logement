import { NextRequest, NextResponse } from "next/server";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire-data";

// Build the full question schema for the prompt (done once at module level)
function buildQuestionsSchema(): string {
  return QUESTIONNAIRE_STEPS.map((step) => {
    const questionsDesc = step.questions
      .map((q) => {
        let desc = `- ${q.id} (${q.type}): "${q.text}"`;
        if (q.options) {
          desc += `\n  Options: ${q.options.map((o) => `${o.id}="${o.label}"`).join(", ")}`;
        }
        if (q.maxSelections) {
          desc += `\n  Max selections: ${q.maxSelections}`;
        }
        if (q.sliderConfig) {
          const s = q.sliderConfig;
          desc += `\n  Slider: ${s.min}-${s.max} (pas de ${s.step}${s.unit ? ", unite: " + s.unit : ""})`;
        }
        return desc;
      })
      .join("\n");
    return `### ${step.title}\n${questionsDesc}`;
  }).join("\n\n");
}

// Build a lookup map for validation
function buildQuestionMap() {
  const map = new Map<string, (typeof QUESTIONNAIRE_STEPS)[0]["questions"][0]>();
  for (const step of QUESTIONNAIRE_STEPS) {
    for (const q of step.questions) {
      map.set(q.id, q);
    }
  }
  return map;
}

const questionsSchema = buildQuestionsSchema();
const questionMap = buildQuestionMap();

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { transcript } = await request.json();

  if (!transcript || typeof transcript !== "string" || transcript.trim().length < 10) {
    return NextResponse.json(
      { error: "Le texte est trop court pour etre analyse." },
      { status: 400 }
    );
  }

  const prompt = `Tu es un assistant qui analyse un message vocal d'une personne cherchant un habitat groupe en Belgique.
A partir de sa description libre, tu dois extraire des reponses structurees pour un questionnaire de 29 questions.

## QUESTIONNAIRE COMPLET
${questionsSchema}

## TRANSCRIPT DE LA PERSONNE
"${transcript}"

## REGLES D'EXTRACTION
- Pour chaque question, determine si le transcript contient une information pertinente.
- Pour "single_choice": renvoie l'id de l'option la plus proche. Si aucune info, omets la cle.
- Pour "multi_choice": renvoie un tableau d'ids d'options mentionnees. Si aucune info, omets la cle.
- Pour "open_text": renvoie le texte pertinent extrait/resume. Si rien de pertinent, omets la cle.
- Pour "slider": renvoie un nombre dans la plage valide. Si aucune info, omets la cle.
- N'invente PAS de reponses. Si l'information n'est pas dans le transcript, n'inclus pas cette question.
- Sois genereux dans l'interpretation : "je veux etre pres de Bruxelles" -> brussels_proximity: "very_close"
- Le transcript peut etre informel, avec des hesitations, des repetitions, etc.

## FORMAT DE REPONSE
Reponds UNIQUEMENT avec un JSON valide au format:
{"answers": {<questionId>: <value>, ...}, "coverage": <nombre de questions couvertes>, "summary": "<resume en 1-2 phrases de ce que la personne cherche>"}`;

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
        max_tokens: 1500,
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

    // Validate answers against the actual question definitions
    const validatedAnswers: Record<string, string | string[] | number> = {};
    for (const [questionId, value] of Object.entries(result.answers)) {
      const question = questionMap.get(questionId);
      if (!question) continue;

      if (question.type === "single_choice" && typeof value === "string") {
        const validIds = new Set(question.options?.map((o) => o.id) ?? []);
        if (validIds.has(value)) {
          validatedAnswers[questionId] = value;
        }
      } else if (question.type === "multi_choice" && Array.isArray(value)) {
        const validIds = new Set(question.options?.map((o) => o.id) ?? []);
        const filtered = (value as string[]).filter((v) => validIds.has(v));
        if (filtered.length > 0) {
          validatedAnswers[questionId] = question.maxSelections
            ? filtered.slice(0, question.maxSelections)
            : filtered;
        }
      } else if (question.type === "open_text" && typeof value === "string") {
        if (value.trim().length > 0) {
          validatedAnswers[questionId] = value.trim();
        }
      } else if (question.type === "slider" && typeof value === "number" && question.sliderConfig) {
        const clamped = Math.max(
          question.sliderConfig.min,
          Math.min(question.sliderConfig.max, Math.round(value / question.sliderConfig.step) * question.sliderConfig.step)
        );
        validatedAnswers[questionId] = clamped;
      }
    }

    return NextResponse.json({
      answers: validatedAnswers,
      coverage: Object.keys(validatedAnswers).length,
      summary: typeof result.summary === "string" ? result.summary : "",
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to process voice questionnaire: ${error}` },
      { status: 500 }
    );
  }
}
