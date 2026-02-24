/**
 * Module serveur pour envoyer des emails via l'API Gmail REST.
 * Utilise un refresh token OAuth2 pour obtenir un access token.
 * Aucune dependance sur googleapis npm — uniquement fetch.
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

// Cache du token pour eviter de re-demander a chaque envoi
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Echange le refresh token contre un access token valide.
 */
export async function getAccessToken(): Promise<string> {
  // Retourner le token cache s'il est encore valide (marge de 60s)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Variables Gmail manquantes: NEXT_PUBLIC_GOOGLE_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN"
    );
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors du rafraichissement du token Gmail: ${error}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedAccessToken!;
}

/**
 * Encode une chaine en base64url (RFC 4648).
 */
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Encode un sujet en RFC 2047 UTF-8 base64 pour les en-tetes MIME.
 */
function encodeRfc2047(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

/**
 * Envoie un seul email via l'API Gmail.
 */
export async function sendEmail({
  to,
  subject,
  body,
  fromName,
}: {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
}): Promise<void> {
  const accessToken = await getAccessToken();

  // Recuperer l'email de l'expediteur depuis le profil Gmail
  const profileRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!profileRes.ok) {
    throw new Error("Impossible de recuperer le profil Gmail");
  }
  const profile = await profileRes.json();
  const fromEmail = profile.emailAddress;

  const fromHeader = fromName
    ? `"${fromName}" <${fromEmail}>`
    : fromEmail;

  const message = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${encodeRfc2047(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ].join("\r\n");

  const raw = toBase64Url(message);

  const response = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { error?: { message?: string } }).error?.message ||
        `Erreur Gmail: ${response.status}`
    );
  }
}

/**
 * Envoie un lot d'emails avec un delai entre chaque envoi pour respecter les limites de taux.
 * @param emails - Liste des emails a envoyer
 * @param delayMs - Delai entre chaque envoi (defaut: 2000ms)
 * @returns Nombre d'emails envoyes avec succes et nombre d'echecs
 */
export async function sendBatch(
  emails: Array<{ to: string; subject: string; body: string; fromName?: string }>,
  delayMs = 2000
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < emails.length; i++) {
    try {
      await sendEmail(emails[i]);
      sent++;
    } catch (err) {
      failed++;
      errors.push(
        `${emails[i].to}: ${err instanceof Error ? err.message : "Erreur inconnue"}`
      );
    }

    // Delai entre les envois sauf apres le dernier
    if (i < emails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { sent, failed, errors };
}
