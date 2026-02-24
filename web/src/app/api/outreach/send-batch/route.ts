import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { getOutreachData, saveOutreachData } from "@/lib/outreach/data";
import { getRetreatVenueById } from "@/lib/retreats/data";
import { sendEmail } from "@/lib/outreach/gmail-server";

/**
 * POST /api/outreach/send-batch
 * Envoie un lot d'emails pour les contacts en attente d'une campagne.
 * Body: { campaign_id: string, max_count?: number }
 * Genere chaque email via Claude, l'envoie via Gmail, met a jour le statut.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Service IA non configure (ANTHROPIC_API_KEY manquante)." },
      { status: 503 }
    );
  }

  let body: { campaign_id?: string; max_count?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requete invalide." },
      { status: 400 }
    );
  }

  if (!body.campaign_id) {
    return NextResponse.json(
      { error: "campaign_id est requis." },
      { status: 400 }
    );
  }

  const maxCount = Math.min(body.max_count || 50, 50);
  const data = getOutreachData();

  // Trouver les contacts en attente pour cette campagne
  const pendingContacts = data.contacts.filter(
    (c) => c.campaign_id === body.campaign_id && c.status === "pending"
  );

  const batch = pendingContacts.slice(0, maxCount);

  if (batch.length === 0) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      message: "Aucun contact en attente pour cette campagne.",
    });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://maman-logement.vercel.app";

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < batch.length; i++) {
    const contact = batch[i];
    const formUrl = `${baseUrl}/inscription-lieu/${contact.form_token}`;

    try {
      // Recuperer les infos du lieu pour generer un email personnalise
      const venueData = getRetreatVenueById(contact.venue_id);
      const venue = venueData?.venue;

      // Generer l'email via Claude
      const emailResponse = await fetch(
        `${baseUrl}/api/outreach/generate-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            venue_id: contact.venue_id,
            venue_name: contact.venue_name,
            venue_description: venue?.description || "",
            venue_website: venue?.website || "",
            form_url: formUrl,
          }),
        }
      );

      let emailBody: string;
      let emailSubject: string;

      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        emailBody = emailData.email;
        emailSubject = emailData.subject;
      } else {
        // Fallback: email generique
        emailSubject = `Rejoignez notre annuaire de lieux de retraite`;
        emailBody = `Bonjour,\n\nNous constituons un annuaire en ligne gratuit de lieux de retraite pour les organisateurs de yoga, meditation et bien-etre.\n\nVotre lieu "${contact.venue_name}" a retenu notre attention et nous serions ravis de l'inclure dans notre repertoire.\n\nL'inscription est gratuite et prend quelques minutes :\n${formUrl}\n\nN'hesitez pas a nous contacter si vous avez des questions.\n\nCordialement,\nL'equipe Retraites`;
      }

      // Envoyer via Gmail
      await sendEmail({
        to: contact.email,
        subject: emailSubject,
        body: emailBody,
        fromName: "L'equipe Retraites",
      });

      // Mettre a jour le statut
      const contactIndex = data.contacts.findIndex(
        (c) =>
          c.venue_id === contact.venue_id &&
          c.campaign_id === contact.campaign_id
      );
      if (contactIndex !== -1) {
        data.contacts[contactIndex].status = "sent";
        data.contacts[contactIndex].sent_at = new Date().toISOString();
      }

      sent++;
    } catch (err) {
      failed++;
      errors.push(
        `${contact.venue_name} (${contact.email}): ${err instanceof Error ? err.message : "Erreur inconnue"}`
      );
    }

    // Delai de 2 secondes entre chaque envoi
    if (i < batch.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Sauvegarder les donnees mises a jour
  saveOutreachData(data);

  // Mettre a jour le statut de la campagne si necessaire
  const campaignIndex = data.campaigns.findIndex(
    (c) => c.id === body.campaign_id
  );
  if (campaignIndex !== -1 && data.campaigns[campaignIndex].status === "draft") {
    data.campaigns[campaignIndex].status = "active";
    saveOutreachData(data);
  }

  return NextResponse.json({ sent, failed, errors });
}
