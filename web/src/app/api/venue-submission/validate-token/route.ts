import { NextRequest, NextResponse } from "next/server";
import { getOutreachData } from "@/lib/outreach/data";

/**
 * GET /api/venue-submission/validate-token?token=xxx
 * Valide un token de formulaire d'inscription.
 * Endpoint public (pas d'auth) — la validation se fait par le token.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { valid: false, error: "Token manquant." },
      { status: 400 }
    );
  }

  const data = getOutreachData();
  const contact = data.contacts.find((c) => c.form_token === token);

  if (!contact) {
    return NextResponse.json({ valid: false });
  }

  // Verifier que le formulaire n'a pas deja ete soumis
  if (contact.status === "form_submitted") {
    return NextResponse.json({
      valid: false,
      error: "Ce formulaire a deja ete soumis.",
    });
  }

  return NextResponse.json({
    valid: true,
    venue_name: contact.venue_name,
    venue_id: contact.venue_id,
  });
}
