import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import {
  getOutreachData,
  saveOutreachData,
  generateFormToken,
} from "@/lib/outreach/data";
import { Campaign, OutreachContact } from "@/lib/outreach/types";
import { getRetreatVenues } from "@/lib/retreats/data";

/**
 * GET /api/outreach/campaigns
 * Retourne toutes les campagnes avec leurs statistiques calculees.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const data = getOutreachData();

  // Recalculer les stats pour chaque campagne
  const campaigns = data.campaigns.map((campaign) => {
    const contacts = data.contacts.filter(
      (c) => c.campaign_id === campaign.id
    );
    return {
      ...campaign,
      stats: {
        total: contacts.length,
        sent: contacts.filter((c) => c.status !== "pending").length,
        opened: contacts.filter((c) => c.status === "opened").length,
        replied: contacts.filter((c) => c.status === "replied").length,
        bounced: contacts.filter((c) => c.status === "bounced").length,
        form_submitted: contacts.filter((c) => c.status === "form_submitted")
          .length,
      },
    };
  });

  return NextResponse.json({ campaigns });
}

/**
 * POST /api/outreach/campaigns
 * Cree une nouvelle campagne et y ajoute les contacts correspondant aux filtres.
 * Body: { name: string, target_filter: { countries?, regions?, categories? }, email_template_id?: string }
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  let body: {
    name?: string;
    target_filter?: Campaign["target_filter"];
    email_template_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requete invalide." },
      { status: 400 }
    );
  }

  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: "Le nom de la campagne est requis." },
      { status: 400 }
    );
  }

  const data = getOutreachData();
  const filter = body.target_filter || {};

  // Creer la campagne
  const campaign: Campaign = {
    id: generateFormToken(),
    name: body.name.trim(),
    created_at: new Date().toISOString(),
    status: "draft",
    target_filter: filter,
    email_template_id: body.email_template_id || "",
    stats: {
      total: 0,
      sent: 0,
      opened: 0,
      replied: 0,
      bounced: 0,
      form_submitted: 0,
    },
  };

  // Filtrer les lieux correspondants et creer des contacts
  const venues = getRetreatVenues();
  const existingContactVenueIds = new Set(
    data.contacts.map((c) => c.venue_id)
  );

  const newContacts: OutreachContact[] = [];

  for (const venue of venues) {
    // Sauter les lieux sans email
    if (!venue.contact_email) continue;

    // Sauter les lieux deja contactes dans une autre campagne
    if (existingContactVenueIds.has(venue.id)) continue;

    // Appliquer les filtres
    if (
      filter.countries &&
      filter.countries.length > 0 &&
      (!venue.country || !filter.countries.includes(venue.country))
    ) {
      continue;
    }

    if (
      filter.regions &&
      filter.regions.length > 0 &&
      (!venue.region ||
        !filter.regions.some((r) =>
          venue.region!.toLowerCase().includes(r.toLowerCase())
        ))
    ) {
      continue;
    }

    newContacts.push({
      venue_id: venue.id,
      venue_name: venue.name,
      email: venue.contact_email,
      status: "pending",
      campaign_id: campaign.id,
      sent_at: null,
      opened_at: null,
      replied_at: null,
      form_token: generateFormToken(),
      follow_up_count: 0,
      next_follow_up_at: null,
      notes: "",
    });
  }

  campaign.stats.total = newContacts.length;
  data.campaigns.push(campaign);
  data.contacts.push(...newContacts);
  saveOutreachData(data);

  return NextResponse.json({ campaign, contacts_added: newContacts.length });
}
