import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { getOutreachData, saveOutreachData } from "@/lib/outreach/data";
import { OutreachContact } from "@/lib/outreach/types";

/**
 * GET /api/outreach/contacts?campaignId=xxx
 * Retourne les contacts d'une campagne.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const campaignId = request.nextUrl.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json(
      { error: "Le parametre campaignId est requis." },
      { status: 400 }
    );
  }

  const data = getOutreachData();
  const contacts = data.contacts.filter((c) => c.campaign_id === campaignId);

  return NextResponse.json({ contacts });
}

/**
 * PATCH /api/outreach/contacts
 * Met a jour le statut d'un contact.
 * Body: { venue_id: string, campaign_id: string, status: string, notes?: string }
 */
export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  let body: {
    venue_id?: string;
    campaign_id?: string;
    status?: OutreachContact["status"];
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requete invalide." },
      { status: 400 }
    );
  }

  if (!body.venue_id || !body.campaign_id) {
    return NextResponse.json(
      { error: "venue_id et campaign_id sont requis." },
      { status: 400 }
    );
  }

  const data = getOutreachData();
  const contactIndex = data.contacts.findIndex(
    (c) => c.venue_id === body.venue_id && c.campaign_id === body.campaign_id
  );

  if (contactIndex === -1) {
    return NextResponse.json(
      { error: "Contact non trouve." },
      { status: 404 }
    );
  }

  const contact = data.contacts[contactIndex];

  if (body.status) {
    contact.status = body.status;
    // Mettre a jour les timestamps selon le statut
    const now = new Date().toISOString();
    if (body.status === "sent" && !contact.sent_at) {
      contact.sent_at = now;
    }
    if (body.status === "opened" && !contact.opened_at) {
      contact.opened_at = now;
    }
    if (body.status === "replied" && !contact.replied_at) {
      contact.replied_at = now;
    }
  }

  if (body.notes !== undefined) {
    contact.notes = body.notes;
  }

  data.contacts[contactIndex] = contact;
  saveOutreachData(data);

  return NextResponse.json({ contact });
}
