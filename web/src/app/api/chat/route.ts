import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { chatSchema } from "@/lib/api-schemas";

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
    body = chatSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Donn\u00e9es invalides." },
      { status: 400 }
    );
  }

  const { message, listing, evaluation, conversationHistory } = body;

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
EVALUATION IA (score qualite: ${evaluation.quality_score}/100):
- Resume: ${evaluation.quality_summary}
- Points forts: ${evaluation.highlights?.join(", ") || "Aucun"}
- Points d'attention: ${evaluation.concerns?.join(", ") || "Aucun"}
`
    : "Pas d'evaluation IA disponible pour cette annonce.";

  const systemPrompt = `Tu es un assistant chaleureux et bienveillant qui aide les gens a trouver leur habitat groupe ideal en Europe. Tu reponds toujours en francais, de maniere claire et concise.

Tu as acces aux details de l'annonce suivante:
${listingContext}
${evalContext}

Aide l'utilisateur a:
- Comprendre les details de l'annonce
- Identifier les points importants a verifier
- Preparer des questions pour une visite ou un contact
- Evaluer si ca correspond a ses besoins personnels

Sois honnete si des informations manquent. Garde tes reponses concises (2-4 phrases max sauf si on te demande plus).`;

  const messages = [];
  if (conversationHistory && Array.isArray(conversationHistory)) {
    for (const msg of conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  messages.push({ role: "user", content: message.slice(0, 2000) });

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
      console.error("Anthropic API error [chat]:", response.status, await response.text());
      return NextResponse.json(
        { error: "Erreur du service IA. Veuillez r\u00e9essayer." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content[0].text;

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Route error [chat]:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
