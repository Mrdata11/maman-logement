import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { message, listing, evaluation, conversationHistory } = await request.json();

  const listingContext = `
ANNONCE: ${listing.title}
LIEU: ${listing.location || "Non precis\u00e9"} ${listing.province ? `(${listing.province})` : ""}
PRIX: ${listing.price || "Non precis\u00e9"}
TYPE: ${listing.listing_type || "Non precis\u00e9"}
CONTACT: ${listing.contact || "Non disponible"}
SOURCE: ${listing.source_url}

DESCRIPTION:
${listing.description.slice(0, 3000)}
`;

  const evalContext = evaluation
    ? `
EVALUATION IA (score global: ${evaluation.overall_score}/100):
- Resume: ${evaluation.match_summary}
- Points forts: ${evaluation.highlights.join(", ")}
- Points d'attention: ${evaluation.concerns.join(", ")}
- Scores detailles: ${Object.entries(evaluation.criteria_scores)
        .map(([k, v]) => `${k}: ${v}/10`)
        .join(", ")}
`
    : "Pas d'evaluation IA disponible pour cette annonce.";

  const systemPrompt = `Tu es un assistant chaleureux et bienveillant qui aide une maman a trouver son habitat groupe ideal en Belgique. Tu reponds toujours en francais, de maniere claire et concise.

Tu as acces aux details de l'annonce suivante:
${listingContext}
${evalContext}

Aide-la a:
- Comprendre les details de l'annonce
- Identifier les points importants a verifier
- Preparer des questions pour une visite ou un contact
- Evaluer si ca correspond a ses besoins (biodanza, communaute ~50 personnes, 500-750 euros, proche Bruxelles)

Sois honnete si des informations manquent. Garde tes reponses concises (2-4 phrases max sauf si on te demande plus).`;

  // Build messages array with conversation history
  const messages = [];
  if (conversationHistory && Array.isArray(conversationHistory)) {
    for (const msg of conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  messages.push({ role: "user", content: message });

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
        max_tokens: 1000,
        system: systemPrompt,
        messages,
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

    return NextResponse.json({ response: text });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to process chat: ${error}` },
      { status: 500 }
    );
  }
}
