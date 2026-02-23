"use client";

import { useState, useEffect } from "react";

const HERO_DISMISSED_KEY = "hero_dismissed";

export function HeroBanner() {
  const [dismissed, setDismissed] = useState(true); // default hidden to avoid flash

  useEffect(() => {
    const wasDismissed = localStorage.getItem(HERO_DISMISSED_KEY);
    if (!wasDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(HERO_DISMISSED_KEY, "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="mb-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm overflow-hidden">
      <div className="px-6 py-8 sm:px-8 sm:py-10">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-3">
            Trouvez votre habitat group&eacute;
          </h2>
          <p className="text-[var(--muted)] text-base sm:text-lg mb-8 leading-relaxed">
            Maman Logement rassemble les annonces d&apos;habitats group&eacute;s en Belgique et en Europe, et les &eacute;value automatiquement selon vos crit&egrave;res personnels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <a
            href="/questionnaire"
            className="group flex items-start gap-3 p-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)] hover:bg-[var(--surface)] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)] bg-opacity-10 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-[var(--foreground)] text-sm group-hover:text-[var(--primary)] transition-colors">
                Chercher un lieu
              </div>
              <div className="text-xs text-[var(--muted)] mt-0.5">
                R&eacute;pondez au questionnaire pour personnaliser vos r&eacute;sultats
              </div>
            </div>
          </a>

          <a
            href="/profils/creer"
            className="group flex items-start gap-3 p-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)] hover:bg-[var(--surface)] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)] bg-opacity-10 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-[var(--foreground)] text-sm group-hover:text-[var(--primary)] transition-colors">
                Cr&eacute;er mon profil
              </div>
              <div className="text-xs text-[var(--muted)] mt-0.5">
                Pr&eacute;sentez-vous pour rencontrer d&apos;autres chercheurs
              </div>
            </div>
          </a>

          <a
            href="/creer"
            className="group flex items-start gap-3 p-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)] bg-opacity-10 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-[var(--foreground)] text-sm group-hover:text-[var(--accent)] transition-colors">
                Proposer un projet
              </div>
              <div className="text-xs text-[var(--muted)] mt-0.5">
                Lancez votre habitat group&eacute; et trouvez des membres
              </div>
            </div>
          </a>
        </div>

        <button
          onClick={handleDismiss}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Ne plus afficher
        </button>
      </div>
    </div>
  );
}
