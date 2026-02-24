import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getOutreachData, saveOutreachData } from "@/lib/outreach/data";
import { venueFormSchema } from "@/lib/venue-form/schema";

/**
 * POST /api/venue-submission
 * Sauvegarde une soumission de formulaire d'inscription de lieu.
 * Endpoint public (pas d'auth) — la validation se fait par le token.
 * Body: { token: string, formData: object }
 */
export async function POST(request: NextRequest) {
  let body: { token?: string; formData?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requete invalide." },
      { status: 400 }
    );
  }

  const { token, formData } = body;

  if (!token) {
    return NextResponse.json(
      { error: "Token manquant." },
      { status: 400 }
    );
  }

  // Valider le token
  const outreachData = getOutreachData();
  const contact = outreachData.contacts.find((c) => c.form_token === token);

  if (!contact) {
    return NextResponse.json(
      { error: "Token invalide." },
      { status: 403 }
    );
  }

  if (contact.status === "form_submitted") {
    return NextResponse.json(
      { error: "Ce formulaire a deja ete soumis." },
      { status: 409 }
    );
  }

  // Valider les donnees du formulaire
  const validation = venueFormSchema.safeParse(formData);
  if (!validation.success) {
    const issues = validation.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    return NextResponse.json(
      { error: "Donnees invalides.", details: issues },
      { status: 400 }
    );
  }

  // Sauvegarder la soumission dans un fichier JSON
  const submissionsDir = findSubmissionsDir();
  fs.mkdirSync(submissionsDir, { recursive: true });

  const submissionFile = path.join(
    submissionsDir,
    `${contact.venue_id}.json`
  );

  const submission = {
    venue_id: contact.venue_id,
    venue_name: contact.venue_name,
    campaign_id: contact.campaign_id,
    token,
    submitted_at: new Date().toISOString(),
    data: validation.data,
  };

  fs.writeFileSync(submissionFile, JSON.stringify(submission, null, 2), "utf-8");

  // Mettre a jour le statut du contact
  const contactIndex = outreachData.contacts.findIndex(
    (c) => c.form_token === token
  );
  if (contactIndex !== -1) {
    outreachData.contacts[contactIndex].status = "form_submitted";
  }
  saveOutreachData(outreachData);

  return NextResponse.json({
    success: true,
    message: "Inscription enregistree avec succes.",
  });
}

/**
 * Trouve ou cree le repertoire de soumissions.
 */
function findSubmissionsDir(): string {
  const candidates = [
    path.join(process.cwd(), "..", "data", "retreats", "submissions"),
    path.join(process.cwd(), "data", "retreats", "submissions"),
  ];
  for (const dir of candidates) {
    const parent = path.dirname(dir);
    if (fs.existsSync(parent)) {
      return dir;
    }
  }
  return candidates[0];
}
