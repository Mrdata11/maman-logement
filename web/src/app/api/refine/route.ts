import { NextRequest, NextResponse } from "next/server";

const CRITERIA_DESCRIPTIONS: Record<string, string> = {
  community_size_and_maturity:
    "Taille & maturit\u00e9 de la communaut\u00e9 (~50 personnes)",
  values_alignment: "Valeurs (respect, bienveillance, solidarit\u00e9)",
  common_projects: "Projets communs (potager, \u00e9picerie, ateliers...)",
  large_hall_biodanza: "Grande salle biodanza (180-250m\u00b2)",
  rental_price: "Loyer (500-750\u20ac charges comprises)",
  unit_type: "Type de logement (studio/1 chambre)",
  parking: "Parking voiture + moto",
  spiritual_alignment: "Esprit biodanseur / spirituel",
  charter_openness: "Charte & ouverture au monde",
  community_meals: "Repas & activit\u00e9s communautaires",
  location_brussels: "Proximit\u00e9 Bruxelles (30-45 min)",
  near_hospital: "Proximit\u00e9 h\u00f4pital soins palliatifs p\u00e9diatriques",
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { message, currentWeights, currentFilters } = await request.json();

  const criteriaList = Object.entries(CRITERIA_DESCRIPTIONS)
    .map(
      ([key, desc]) =>
        `- ${key}: ${desc} (poids actuel: ${currentWeights[key] ?? 1.0})`
    )
    .join("\n");

  const currentFiltersJson = JSON.stringify(currentFilters ?? {});

  const prompt = `Tu es un assistant qui aide \u00e0 affiner une recherche d'habitat group\u00e9 en Belgique.

L'utilisateur a 12 crit\u00e8res de recherche avec des poids (multiplicateur d'importance), ET des filtres pour exclure/inclure des annonces.

## CRIT\u00c8RES ET POIDS ACTUELS
Un poids de 1.0 = importance normale, 2.0 = double importance, 0.1 = quasi ignor\u00e9.
${criteriaList}

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
"${message}"

## INSTRUCTIONS
En fonction du message, ajuste les poids ET/OU les filtres.
R\u00e9ponds UNIQUEMENT avec un JSON valide, sans markdown ni texte autour, au format:
{"weights":{"community_size_and_maturity":1.0,"values_alignment":1.0,"common_projects":1.0,"large_hall_biodanza":1.0,"rental_price":1.0,"unit_type":1.0,"parking":1.0,"spiritual_alignment":1.0,"charter_openness":1.0,"community_meals":1.0,"location_brussels":1.0,"near_hospital":1.0},"filters":{"listing_types_include":[],"listing_types_exclude":[],"locations_include":[],"locations_exclude":[],"max_price":null,"min_score":null,"keywords_include":[],"keywords_exclude":[]},"explanation":"Explication courte"}

R\u00e8gles:
- Ne change que ce qui est pertinent par rapport au message
- Garde les poids et filtres inchang\u00e9s si le message ne les concerne pas
- Poids entre 0.0 et 5.0
- Pour les filtres locations: utilise des noms de villes, provinces ou r\u00e9gions belges (Wallonie, Flandre, Bruxelles, Li\u00e8ge, Namur, etc.)
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
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Anthropic API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.content[0].text;

    const result = JSON.parse(text);

    // Ensure filters has all expected fields with defaults
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
      weights: result.weights,
      filters,
      explanation: result.explanation,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to process refinement: ${error}` },
      { status: 500 }
    );
  }
}
