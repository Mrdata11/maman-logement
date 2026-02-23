import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { refineSchema } from "@/lib/api-schemas";

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
    body = refineSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Donn\u00e9es invalides." },
      { status: 400 }
    );
  }

  const { message, currentFilters } = body;

  const currentFiltersJson = JSON.stringify(currentFilters ?? {});

  const prompt = `Tu es un assistant qui aide \u00e0 affiner une recherche d'habitat group\u00e9 en Europe.

L'utilisateur a des filtres pour exclure/inclure des annonces.

## FILTRES ACTUELS
${currentFiltersJson}

## TYPES D'ANNONCES DISPONIBLES
- offre-location (Location)
- offre-vente (Vente)
- demande-location (Recherche location)
- demande-vente (Recherche achat)
- creation-groupe (Cr\u00e9ation de groupe)
- habitat-leger (Habitat l\u00e9ger)
- divers (Divers)

## MESSAGE DE L'UTILISATEUR
<user_input>
${message.slice(0, 1000)}
</user_input>

## INSTRUCTIONS
En fonction du message, ajuste les filtres.
R\u00e9ponds UNIQUEMENT avec un JSON valide, sans markdown ni texte autour, au format:
{"filters":{"listing_types_include":[],"listing_types_exclude":[],"locations_include":[],"locations_exclude":[],"max_price":null,"min_score":null,"keywords_include":[],"keywords_exclude":[]},"explanation":"Explication courte"}

R\u00e8gles:
- Ne change que ce qui est pertinent par rapport au message
- Garde les filtres inchang\u00e9s si le message ne les concerne pas
- Pour les filtres locations: utilise des noms de villes, provinces ou r\u00e9gions (Wallonie, Flandre, Bruxelles, Li\u00e8ge, Namur, France, Espagne, etc.)
- Pour listing_types_include/exclude: utilise les codes ci-dessus (offre-location, offre-vente, etc.)
- Pour keywords: utilise des mots simples en fran\u00e7ais qu'on pourrait trouver dans le titre ou la description
- max_price en euros (nombre entier ou null)
- min_score entre 0 et 100 (nombre entier ou null)
- Les tableaux vides [] signifient "pas de filtre" (tout est accept\u00e9)
- L'explication doit \u00eatre concise (1-2 phrases en fran\u00e7ais)
- R\u00e9ponds UNIQUEMENT avec le JSON`;

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
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error [refine]:", response.status, await response.text());
      return NextResponse.json(
        { error: "Erreur du service IA. Veuillez r\u00e9essayer." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content[0].text;

    const result = JSON.parse(text);

    const filters = {
      listing_types_include: result.filters?.listing_types_include ?? [],
      listing_types_exclude: result.filters?.listing_types_exclude ?? [],
      locations_include: result.filters?.locations_include ?? [],
      locations_exclude: result.filters?.locations_exclude ?? [],
      max_price: result.filters?.max_price ?? null,
      min_score: result.filters?.min_score ?? null,
      keywords_include: result.filters?.keywords_include ?? [],
      keywords_exclude: result.filters?.keywords_exclude ?? [],
    };

    return NextResponse.json({
      weights: {},
      filters,
      explanation: result.explanation,
    });
  } catch (error) {
    console.error("Route error [refine]:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
