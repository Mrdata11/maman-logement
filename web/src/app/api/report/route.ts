import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { reportSchema } from "@/lib/api-schemas";

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
    body = reportSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Donn\u00e9es invalides." },
      { status: 400 }
    );
  }

  const { listings } = body;

  const listingsSummary = listings
    .map(
      (item, i) =>
        `${i + 1}. "${item.listing.title}"
   - Lieu: ${item.listing.location || item.listing.province || "?"}
   - Prix: ${item.listing.price || "?"}
   - Score IA: ${item.evaluation?.quality_score ?? "N/A"}/100
   - Resume: ${item.evaluation?.quality_summary || "Pas d'evaluation"}
   - Points forts: ${item.evaluation?.highlights?.join(", ") || "-"}
   - Preoccupations: ${item.evaluation?.concerns?.join(", ") || "-"}
   - Notes perso: ${item.notes || "Aucune"}
   - Statut: ${item.status}`
    )
    .join("\n\n");

  const prompt = `Tu es un assistant bienveillant qui aide les gens a trouver leur habitat groupe ideal en Europe.

Voici ses criteres principaux:
- Communaute d'environ 50 personnes, mature et fonctionnelle
- Valeurs: respect, bienveillance, solidarite
- Projets communs (potager, ateliers, etc.)
- Grande salle pour la biodanza (180-250m2)
- Loyer 500-750 euros charges comprises
- Studio ou petit appartement
- Esprit biodanseur/spirituel
- Proche Bruxelles (30-45 min)
- Repas communautaires 1-2x/semaine

Voici sa shortlist de ${listings.length} annonces:

<user_input>
${listingsSummary.slice(0, 10000)}
</user_input>

Genere un RAPPORT DE DECISION structure en francais avec:

1. **Resume executif** (2-3 phrases): vue d'ensemble de la shortlist
2. **Top 3 recommandations** classees par ordre de pertinence, avec pour chacune:
   - Pourquoi c'est un bon choix
   - Les points a verifier absolument
   - Conseil d'action (contacter, visiter, etc.)
3. **Tableau comparatif rapide**: pour chaque annonce, une ligne avec emoji (coeur/check/warning) + verdict en 1 phrase
4. **Prochaines etapes** suggerees: que faire maintenant?

Sois chaleureux, concret et actionnable. N'hesite pas a dire si une annonce ne semble pas ideale.`;

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
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error [report]:", response.status, await response.text());
      return NextResponse.json(
        { error: "Erreur du service IA. Veuillez r\u00e9essayer." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content[0].text;

    return NextResponse.json({ report: text });
  } catch (error) {
    console.error("Route error [report]:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
