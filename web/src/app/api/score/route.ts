import { NextRequest, NextResponse } from "next/server";

const BATCH_SIZE = 10;

interface ListingSummary {
  id: string;
  title: string;
  description: string;
  location: string | null;
  country: string | null;
  price: string | null;
  listing_type: string | null;
  tags_summary: string;
}

interface ScoreResult {
  listing_id: string;
  score: number;
  explanation: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Service IA non configur\u00e9." },
      { status: 503 }
    );
  }

  let body: { criteria: string; listings: ListingSummary[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Donn\u00e9es invalides." },
      { status: 400 }
    );
  }

  const { criteria, listings } = body;

  if (!criteria || criteria.length < 10) {
    return NextResponse.json(
      { error: "Les crit\u00e8res doivent contenir au moins 10 caract\u00e8res." },
      { status: 400 }
    );
  }

  if (!listings || listings.length === 0) {
    return NextResponse.json({ results: [] });
  }

  // Process in batches
  const allResults: ScoreResult[] = [];

  for (let i = 0; i < listings.length; i += BATCH_SIZE) {
    const batch = listings.slice(i, i + BATCH_SIZE);
    const batchResults = await scoreBatch(apiKey, criteria, batch);
    allResults.push(...batchResults);
  }

  return NextResponse.json({ results: allResults });
}

async function scoreBatch(
  apiKey: string,
  criteria: string,
  listings: ListingSummary[]
): Promise<ScoreResult[]> {
  const listingsText = listings
    .map(
      (l, idx) =>
        `[${idx + 1}] ID: ${l.id}
Titre: ${l.title}
Lieu: ${l.location || "Non pr\u00e9cis\u00e9"}${l.country ? ` (${l.country})` : ""}
Prix: ${l.price || "Non pr\u00e9cis\u00e9"}
Type: ${l.listing_type || "Non pr\u00e9cis\u00e9"}
Tags: ${l.tags_summary || "Aucun"}
Description: ${l.description.slice(0, 500)}`
    )
    .join("\n\n---\n\n");

  const systemPrompt = `Tu es un assistant qui evalue la compatibilite entre des annonces d'habitat groupe et les criteres personnels d'un utilisateur.

Tu dois attribuer un score de 0 a 100 a chaque annonce:
- 80-100: Correspond tres bien aux criteres
- 60-79: Bonne correspondance partielle
- 40-59: Correspondance moyenne
- 20-39: Faible correspondance
- 0-19: Ne correspond pas

Reponds UNIQUEMENT avec un tableau JSON valide. Pas de texte avant ou apres.
Format: [{"listing_id": "...", "score": N, "explanation": "..."}]
L'explication doit etre courte (1 phrase max, en francais).`;

  const userPrompt = `CRITERES DE L'UTILISATEUR:
${criteria}

ANNONCES A EVALUER:
${listingsText}

Evalue chaque annonce selon les criteres. Reponds avec le tableau JSON uniquement.`;

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
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error [score]:", response.status);
      return listings.map((l) => ({
        listing_id: l.id,
        score: 0,
        explanation: "Erreur lors de l'\u00e9valuation",
      }));
    }

    const data = await response.json();
    const text = data.content[0].text.trim();

    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Could not parse score response:", text.slice(0, 200));
      return listings.map((l) => ({
        listing_id: l.id,
        score: 0,
        explanation: "Erreur de parsing",
      }));
    }

    const results: ScoreResult[] = JSON.parse(jsonMatch[0]);
    return results;
  } catch (error) {
    console.error("Score batch error:", error);
    return listings.map((l) => ({
      listing_id: l.id,
      score: 0,
      explanation: "Erreur technique",
    }));
  }
}
