import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { generateEmailSchema } from "@/lib/api-schemas";

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
    body = generateEmailSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Donn\u00e9es invalides." },
      { status: 400 }
    );
  }

  const { listing, evaluation, userProfile } = body;

  const listingContext = `
ANNONCE: ${listing.title}
LIEU: ${listing.location || "Non precise"} ${listing.province ? `(${listing.province})` : ""}
PRIX: ${listing.price || "Non precise"}
TYPE: ${listing.listing_type || "Non precise"}
CONTACT: ${listing.contact || "Non disponible"}
SOURCE: ${listing.source_url}

DESCRIPTION:
${listing.description.slice(0, 3000)}
`;

  const evalContext = evaluation
    ? `
EVALUATION (score: ${evaluation.quality_score}/100):
- Resume: ${evaluation.quality_summary}
- Points forts: ${(evaluation.highlights ?? []).join(", ")}
- Points d'attention: ${(evaluation.concerns ?? []).join(", ")}
`
    : "";

  const userName = userProfile?.name || "";
  const userContext = userProfile?.context || "";

  const systemPrompt = `Tu es un assistant qui redige des emails de premier contact pour des annonces d'habitat groupe en Europe.

PROFIL DE L'EXPEDITEUR:
${userName ? `- Prenom: ${userName}` : "- Prenom: non specifie (ne pas signer avec un prenom)"}
${userContext ? `- Contexte personnel: ${userContext.slice(0, 1000)}` : "- Pas de contexte personnel fourni"}

ANNONCE CIBLE:
${listingContext}
${evalContext}

CONSIGNES POUR L'EMAIL:
- Redige un email court (8-15 lignes) et chaleureux de premier contact
- Commence par "Bonjour" (ajouter le nom du contact si visible dans l'annonce)
- Presente brievement qui est l'expediteur en s'appuyant sur son contexte personnel
- Exprime un interet sincere et specifique pour CETTE annonce (mentionne des elements concrets de la description)
- Pose 2-3 questions pertinentes basees sur ce qui manque dans l'annonce ou sur les points d'attention de l'evaluation
- Termine poliment en proposant un echange telephonique ou une visite
- ${userName ? `Signe avec "${userName}"` : "Termine par une formule de politesse sans signature nominative"}
- Ton: chaleureux, authentique, pas trop formel. Cette personne cherche une communaute, pas un appartement classique
- N'ecris QUE le corps de l'email, sans objet, sans "Objet:", sans explications autour
- Ne mets pas de crochets [...] ou de placeholders - ecris un email pret a envoyer`;

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
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content:
              "Redige l'email de premier contact pour cette annonce.",
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error [generate-email]:", response.status, await response.text());
      return NextResponse.json(
        { error: "Erreur du service IA. Veuillez r\u00e9essayer." },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ email: data.content[0].text });
  } catch (error) {
    console.error("Route error [generate-email]:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
