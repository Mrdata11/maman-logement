import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { listings } = await request.json();

  if (!listings || !Array.isArray(listings) || listings.length === 0) {
    return NextResponse.json(
      { error: "No listings provided" },
      { status: 400 }
    );
  }

  const listingsSummary = listings
    .map(
      (item: {
        listing: { title: string; location: string | null; province: string | null; price: string | null };
        evaluation: { overall_score: number; match_summary: string; highlights: string[]; concerns: string[] } | null;
        notes: string;
        status: string;
      }, i: number) =>
        `${i + 1}. "${item.listing.title}"
   - Lieu: ${item.listing.location || item.listing.province || "?"}
   - Prix: ${item.listing.price || "?"}
   - Score IA: ${item.evaluation?.overall_score ?? "N/A"}/100
   - Resume: ${item.evaluation?.match_summary || "Pas d'evaluation"}
   - Points forts: ${item.evaluation?.highlights?.join(", ") || "-"}
   - Preoccupations: ${item.evaluation?.concerns?.join(", ") || "-"}
   - Notes perso: ${item.notes || "Aucune"}
   - Statut: ${item.status}`
    )
    .join("\n\n");

  const prompt = `Tu es un assistant bienveillant qui aide une maman a trouver son habitat groupe ideal en Belgique.

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

${listingsSummary}

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
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Anthropic API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.content[0].text;

    return NextResponse.json({ report: text });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to generate report: ${error}` },
      { status: 500 }
    );
  }
}
