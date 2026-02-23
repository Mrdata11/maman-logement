import { getListingsWithEvals } from "@/lib/data";
import { HeroBanner } from "@/components/HeroBanner";
import { ListingCardCompact } from "@/components/ListingCardCompact";
import { HomepageProfiles } from "@/components/HomepageProfiles";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://maman-logement.vercel.app";

export const metadata: Metadata = {
  title: "Cohabitat Europe — Trouvez votre habitat groupé en Europe",
  description:
    "Plateforme de recherche d’habitats groupés en Europe. Annonces évaluées par IA, profils communautaires, questionnaire personnalisé et outils de mise en relation.",
  openGraph: {
    title: "Cohabitat Europe — Trouvez votre habitat groupé en Europe",
    description:
      "Plateforme de recherche d’habitats groupés en Europe. Annonces évaluées par IA, profils communautaires et outils de mise en relation.",
    url: BASE_URL,
    type: "website",
  },
};

export default function Home() {
  const items = getListingsWithEvals();
  const topListings = items
    .filter((item) => item.evaluation !== null && !item.evaluation.ai_title?.includes("⚠"))
    .sort(
      (a, b) =>
        (b.evaluation?.quality_score ?? 0) -
        (a.evaluation?.quality_score ?? 0)
    )
    .slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "Cohabitat Europe",
        url: BASE_URL,
        logo: `${BASE_URL}/logo_alt_living.png`,
        description:
          "Plateforme de recherche d’habitats groupés en Europe. Annonces évaluées par IA et profils communautaires.",
      },
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "Cohabitat Europe",
        publisher: { "@id": `${BASE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${BASE_URL}/habitats?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebPage",
        "@id": `${BASE_URL}/#webpage`,
        url: BASE_URL,
        name: "Cohabitat Europe — Trouvez votre habitat groupé en Europe",
        isPartOf: { "@id": `${BASE_URL}/#website` },
        about: { "@id": `${BASE_URL}/#organization` },
        description:
          "Plateforme de recherche d’habitats groupés en Europe. Annonces évaluées par IA, profils communautaires et outils de mise en relation.",
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero full-bleed ── */}
      <HeroBanner alwaysVisible listingCount={items.length} />

      {/* ── Sélection IA : top listings ── */}
      <section className="mt-16 sm:mt-20 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
<h2 className="text-2xl font-bold text-[var(--foreground)]">
              Les projets les mieux notés
            </h2>
          </div>
          <Link
            href="/habitats"
            className="text-sm font-medium text-[var(--primary)] hover:underline whitespace-nowrap shrink-0"
          >
            Tout voir →
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {topListings.map((item) => (
            <ListingCardCompact key={item.listing.id} item={item} />
          ))}
        </div>
      </section>

      {/* ── Profils : section full-bleed fond chaud ── */}
      <section className="-mx-4 sm:-mx-6 mt-16 sm:mt-20">
        <div className="bg-[var(--surface)] border-y border-[var(--border-color)] px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">
                  Communauté
                </p>
                <h2 className="text-2xl font-bold text-[var(--foreground)]">
                  Ils cherchent un lieu, comme vous
                </h2>
              </div>
              <Link
                href="/profils"
                className="text-sm font-medium text-[var(--primary)] hover:underline whitespace-nowrap shrink-0"
              >
                Tout voir →
              </Link>
            </div>
            <HomepageProfiles />
            <div className="mt-8 text-center">
              <Link
                href="/profils/creer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--border-color)] text-[var(--foreground)] rounded-xl text-sm font-medium hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors bg-[var(--card-bg)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Créer mon profil et rejoindre la communauté
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final full-bleed dark ── */}
      <section className="-mx-4 sm:-mx-6 -mb-8">
        <div className="bg-[var(--foreground)] px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Vous n&apos;êtes pas seul·e
            </h2>
            <p className="text-white/60 mb-10 max-w-md mx-auto leading-relaxed">
              Des centaines de personnes cherchent un lieu de vie partagé en Europe. Rejoignez-les.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/questionnaire"
                className="px-7 py-3.5 bg-white text-[var(--foreground)] rounded-xl font-bold hover:bg-white/90 transition-colors"
              >
                Commencer ma recherche
              </Link>
              <Link
                href="/creer"
                className="px-7 py-3.5 border border-white/30 text-white/80 rounded-xl font-medium hover:bg-white/10 hover:text-white transition-colors"
              >
                Proposer un projet
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
