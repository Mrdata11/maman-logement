"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slideUp">
      <div className="max-w-xl mx-auto bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-[var(--muted)] flex-1">
          Ce site utilise uniquement des cookies techniques n&eacute;cessaires &agrave; son fonctionnement (authentification).
          Aucun tra&ccedil;age publicitaire.{" "}
          <a href="/mentions-legales" className="text-[var(--primary)] hover:underline">
            En savoir plus
          </a>
        </p>
        <button
          onClick={accept}
          className="shrink-0 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          Compris
        </button>
      </div>
    </div>
  );
}
