import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { getOutreachData } from "@/lib/outreach/data";

/**
 * GET /api/outreach/stats
 * Retourne les statistiques agregees de toutes les campagnes.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const data = getOutreachData();
  const contacts = data.contacts;

  const stats = {
    total_campaigns: data.campaigns.length,
    active_campaigns: data.campaigns.filter((c) => c.status === "active")
      .length,
    total_contacts: contacts.length,
    pending: contacts.filter((c) => c.status === "pending").length,
    sent: contacts.filter((c) => c.status === "sent").length,
    opened: contacts.filter((c) => c.status === "opened").length,
    replied: contacts.filter((c) => c.status === "replied").length,
    bounced: contacts.filter((c) => c.status === "bounced").length,
    form_submitted: contacts.filter((c) => c.status === "form_submitted")
      .length,
    // Taux (en pourcentage)
    send_rate:
      contacts.length > 0
        ? Math.round(
            (contacts.filter((c) => c.status !== "pending").length /
              contacts.length) *
              100
          )
        : 0,
    open_rate:
      contacts.filter((c) => c.status !== "pending").length > 0
        ? Math.round(
            (contacts.filter(
              (c) =>
                c.status === "opened" ||
                c.status === "replied" ||
                c.status === "form_submitted"
            ).length /
              contacts.filter((c) => c.status !== "pending").length) *
              100
          )
        : 0,
    reply_rate:
      contacts.filter((c) => c.status !== "pending").length > 0
        ? Math.round(
            (contacts.filter(
              (c) => c.status === "replied" || c.status === "form_submitted"
            ).length /
              contacts.filter((c) => c.status !== "pending").length) *
              100
          )
        : 0,
    form_rate:
      contacts.filter((c) => c.status !== "pending").length > 0
        ? Math.round(
            (contacts.filter((c) => c.status === "form_submitted").length /
              contacts.filter((c) => c.status !== "pending").length) *
              100
          )
        : 0,
  };

  return NextResponse.json({ stats });
}
