// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: { type: string }) => void;
          }) => {
            requestAccessToken: (overrides?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
}

export interface GmailAuth {
  accessToken: string;
  email: string;
  expiresAt: number;
}

const GMAIL_AUTH_KEY = "gmail_auth";

export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Impossible de charger Google Identity Services"));
    document.head.appendChild(script);
  });
}

export function getStoredAuth(): GmailAuth | null {
  try {
    const stored = sessionStorage.getItem(GMAIL_AUTH_KEY);
    if (!stored) return null;
    const auth: GmailAuth = JSON.parse(stored);
    // Clear 15 minutes before expiry for safety margin
    if (auth.expiresAt < Date.now() + 15 * 60 * 1000) {
      sessionStorage.removeItem(GMAIL_AUTH_KEY);
      return null;
    }
    return auth;
  } catch {
    return null;
  }
}

export function storeAuth(auth: GmailAuth): void {
  sessionStorage.setItem(GMAIL_AUTH_KEY, JSON.stringify(auth));
}

export function clearAuth(): void {
  sessionStorage.removeItem(GMAIL_AUTH_KEY);
}

export async function requestGmailAccess(
  clientId: string
): Promise<GmailAuth> {
  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/gmail.send email",
      callback: async (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        try {
          const userInfo = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            { headers: { Authorization: `Bearer ${response.access_token}` } }
          );
          const userData = await userInfo.json();

          const auth: GmailAuth = {
            accessToken: response.access_token,
            email: userData.email,
            expiresAt: Date.now() + response.expires_in * 1000,
          };
          storeAuth(auth);
          resolve(auth);
        } catch (err) {
          reject(err);
        }
      },
      error_callback: (error) => {
        reject(new Error(`Erreur Google: ${error.type}`));
      },
    });

    // prompt: '' means use the default (consent if needed, otherwise silent)
    client.requestAccessToken({ prompt: "" });
  });
}

function toBase64Url(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function encodeRfc2047(text: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

export async function sendGmailEmail({
  accessToken,
  to,
  from,
  fromName,
  subject,
  body,
}: {
  accessToken: string;
  to: string;
  from: string;
  fromName?: string;
  subject: string;
  body: string;
}): Promise<void> {
  const fromHeader = fromName ? `"${fromName}" <${from}>` : from;

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

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 401) {
      clearAuth();
      throw new Error("SESSION_EXPIRED");
    }
    throw new Error(
      error.error?.message || "Erreur lors de l'envoi via Gmail"
    );
  }
}
