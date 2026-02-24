import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";

/**
 * POST /api/outreach/generate-email
 * Genere un email personnalise d'invitation pour un lieu de retraite via Claude Haiku.
 * Body: { venue_id, venue_name, venue_description, venue_website?, form_url }
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Service IA non configure." },
      { status: 503 }
    );
  }

  let body: {
    venue_id?: string;
    venue_name?: string;
    venue_description?: string;
    venue_website?: string;
    form_url?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Donnees invalides." },
      { status: 400 }
    );
  }

  if (!body.venue_name || !body.form_url) {
    return NextResponse.json(
      { error: "venue_name et form_url sont requis." },
      { status: 400 }
    );
  }

  const systemPrompt = `Tu es un assistant qui redige des emails de prospection chaleureux et professionnels pour inviter des proprietaires de lieux de retraite a rejoindre un annuaire en ligne gratuit.

CONTEXTE DE LA PLATEFORME:
- Annuaire gratuit de lieux de retraite pour organisateurs de yoga, meditation, bien-etre
- L'objectif est de connecter les proprietaires de lieux avec les organisateurs de retraites
- L'inscription est gratuite et sans engagement
- Le proprietaire peut remplir un formulaire pour decrire son lieu en detail

INFORMATIONS SUR LE LIEU:
- Nom: ${body.venue_name}
${body.venue_description ? `- Description: ${body.venue_description.slice(0, 2000)}` : ""}
${body.venue_website ? `- Site web: ${body.venue_website}` : ""}

LIEN DU FORMULAIRE D'INSCRIPTION:
${body.form_url}

CONSIGNES:
- Redige un email court (10-15 lignes) chaleureux et communautaire
- Commence par "Bonjour" (ajouter le nom du lieu si pertinent)
- Explique brievement la plateforme (annuaire gratuit pour lieux de retraites)
- Si une description ou un site web est fourni, mentionne des elements specifiques du lieu qui t'ont interesse
- Explique les avantages: visibilite aupres d'organisateurs qualifies, inscription gratuite, profil detaille
- Inclus le lien du formulaire d'inscription de maniere naturelle
- Termine par une invitation a echanger si besoin
- Ton: chaleureux, authentique, professionnel mais pas corporate
- N'ecris QUE le corps de l'email, sans objet, sans "Objet:", sans explications autour
- Ne mets pas de crochets [...] ou de placeholders - ecris un email pret a envoyer
- Signe "L'equipe Retraites"`;

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
              "Redige l'email d'invitation pour ce lieu de retraite.",
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        "Anthropic API error [outreach/generate-email]:",
        response.status,
        await response.text()
      );
      return NextResponse.json(
        { error: "Erreur du service IA. Veuillez reessayer." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const email = data.content[0].text;

    // Generer aussi un objet d'email
    const subjectPrompt = `Genere un objet d'email court (max 60 caracteres) pour un email d'invitation a un annuaire de lieux de retraite. Le lieu s'appelle "${body.venue_name}". L'objet doit etre engageant, pas trop commercial. Retourne uniquement l'objet, rien d'autre.`;

    const subjectResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 100,
          messages: [{ role: "user", content: subjectPrompt }],
        }),
      }
    );

    let subject = `Invitation: rejoignez notre annuaire de lieux de retraite`;
    if (subjectResponse.ok) {
      const subjectData = await subjectResponse.json();
      subject = subjectData.content[0].text.trim();
    }

    return NextResponse.json({ email, subject });
  } catch (error) {
    console.error("Route error [outreach/generate-email]:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
