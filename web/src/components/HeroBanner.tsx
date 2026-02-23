"use client";

import { useState, useEffect } from "react";

const HERO_DISMISSED_KEY = "hero_dismissed";

interface HeroBannerProps {
  alwaysVisible?: boolean;
  listingCount?: number;
}

export function HeroBanner({ alwaysVisible = false, listingCount = 0 }: HeroBannerProps) {
  const [dismissed, setDismissed] = useState(!alwaysVisible);

  useEffect(() => {
    if (alwaysVisible) return;
    const wasDismissed = localStorage.getItem(HERO_DISMISSED_KEY);
    if (!wasDismissed) {
      setDismissed(false);
    }
  }, [alwaysVisible]);

  const handleDismiss = () => {
    localStorage.setItem(HERO_DISMISSED_KEY, "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  /* ── Homepage : full-bleed dark hero ── */
  if (alwaysVisible) {
    return (
      <section className="-mx-4 sm:-mx-6 -mt-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1E2E1E] via-[#2C432C] to-[#3D5A3D]">
          {/* Texture de points subtile */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative px-4 sm:px-6 py-20 sm:py-24 md:py-32 max-w-6xl mx-auto">
            <h1 className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] font-extrabold text-white leading-[1.05] tracking-tight">
              Vivre ensemble,
              <br />
              autrement.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-xl leading-relaxed">
              {listingCount > 0 ? `${listingCount}+` : "Des centaines de"} habitats group&eacute;s, &eacute;colieux et coop&eacute;ratives en Europe &mdash; tri&eacute;s et &eacute;valu&eacute;s par IA.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <a
                href="/questionnaire"
                className="inline-flex items-center gap-2.5 px-7 py-4 bg-white text-[#1E2E1E] rounded-xl text-base font-bold hover:bg-white/90 transition-colors shadow-lg shadow-black/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Trouver mon lieu &mdash; 5 min
              </a>
              <a
                href="/habitats"
                className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-white/40"
              >
                ou parcourir toutes les annonces
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── Autres pages : carte compacte, dismissible ── */
  return (
    <div className="mb-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm overflow-hidden">
      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            Trouvez votre habitat group&eacute;
          </h2>
          <button
            onClick={handleDismiss}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors whitespace-nowrap shrink-0"
          >
            Fermer
          </button>
        </div>
        <p className="text-[var(--muted)] text-sm sm:text-base mb-5 max-w-2xl">
          R&eacute;pondez au questionnaire pour d&eacute;couvrir les projets qui correspondent &agrave; vos crit&egrave;res.
        </p>
        <a
          href="/questionnaire"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-hover)] transition-colors"
        >
          Commencer
        </a>
      </div>
    </div>
  );
}
