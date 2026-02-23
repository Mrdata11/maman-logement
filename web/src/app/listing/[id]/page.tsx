import { getListingById, getListingsWithEvals } from "@/lib/data";
import { ListingDetailActions } from "@/components/ListingDetailActions";
import { ImageGallery } from "@/components/ImageGallery";
import { TagsDisplay } from "@/components/TagsDisplay";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getListingCoordinates,
  haversineDistance,
  EUROPE_CENTER,
} from "@/lib/coordinates";
import { LISTING_TYPE_LABELS } from "@/lib/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://maman-logement.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = getListingById(id);
  if (!item) {
    return { title: "Annonce introuvable" };
  }

  const { listing, evaluation } = item;
  const title = evaluation?.ai_title || listing.title;
  const description =
    evaluation?.ai_description ||
    evaluation?.quality_summary ||
    listing.description.slice(0, 160);
  const firstImage =
    listing.images.length > 0 ? listing.images[0] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/listing/${listing.id}`,
      type: "article",
      ...(firstImage && {
        images: [
          {
            url: firstImage,
            alt: title,
          },
        ],
      }),
    },
    twitter: {
      card: firstImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(firstImage && { images: [firstImage] }),
    },
  };
}

export function generateStaticParams() {
  const items = getListingsWithEvals();
  return items.map((item) => ({ id: item.listing.id }));
}

function ScoreRing({ score }: { score: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70
      ? "text-emerald-500"
      : score >= 40
        ? "text-amber-500"
        : "text-red-400";
  const bgColor =
    score >= 70
      ? "text-emerald-100"
      : score >= 40
        ? "text-amber-100"
        : "text-red-100";

  return (
    <div className="relative w-12 h-12 shrink-0" title={`Score : ${score}/100`}>
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="4"
          className={`stroke-current ${bgColor}`}
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`stroke-current ${color} transition-all duration-500`}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${color}`}>
        {score}
      </span>
    </div>
  );
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getListingById(id);
  if (!item) return notFound();

  const { listing, evaluation, tags } = item;

  const coords = getListingCoordinates(listing.location, listing.province);
  const distance = coords
    ? Math.round(haversineDistance(EUROPE_CENTER, coords))
    : null;

  const title = evaluation?.ai_title || listing.title;
  const description =
    evaluation?.ai_description ||
    evaluation?.quality_summary ||
    listing.description.slice(0, 160);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing",
        name: title,
        description,
        url: `${BASE_URL}/listing/${listing.id}`,
        ...(listing.images.length > 0 && { image: listing.images[0] }),
        ...(listing.date_published && { datePublished: listing.date_published }),
        ...(listing.location && {
          address: {
            "@type": "PostalAddress",
            addressLocality: listing.location,
            ...(listing.province && { addressRegion: listing.province }),
            ...(listing.country && { addressCountry: listing.country }),
          },
        }),
        ...(listing.price_amount && {
          offers: {
            "@type": "Offer",
            price: listing.price_amount,
            priceCurrency: "EUR",
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Accueil",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Habitats",
            item: `${BASE_URL}/habitats`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: title,
            item: `${BASE_URL}/listing/${listing.id}`,
          },
        ],
      },
    ],
  };

  // Build key facts for the sidebar
  const keyFacts: { icon: React.ReactNode; label: string; value: string }[] = [];

  if (listing.price) {
    keyFacts.push({
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Prix",
      value: listing.price,
    });
  }

  if (listing.location) {
    keyFacts.push({
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: "Localisation",
      value: [listing.location, listing.province !== listing.location ? listing.province : null].filter(Boolean).join(", "),
    });
  }

  if (distance !== null) {
    keyFacts.push({
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      label: "Distance",
      value: `~${distance} km de Bruxelles`,
    });
  }

  if (listing.listing_type) {
    keyFacts.push({
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      label: "Type",
      value: LISTING_TYPE_LABELS[listing.listing_type] || listing.listing_type,
    });
  }

  if (tags?.environment) {
    const envLabels: Record<string, string> = { rural: "Rural", urban: "Urbain", suburban: "Periurbain" };
    keyFacts.push({
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Cadre",
      value: envLabels[tags.environment] || tags.environment,
    });
  }

  if (tags?.group_size) {
    keyFacts.push({
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      label: "Groupe",
      value: `${tags.group_size} personne${tags.group_size > 1 ? "s" : ""}`,
    });
  }

  return (
    <article className="max-w-6xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back navigation */}
      <Link
        href="/"
        className="text-[var(--muted)] hover:text-[var(--primary)] text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </Link>

      {/* Main card */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-[var(--card-shadow)]">

        {/* Action bar (sticky) */}
        <div className="px-4 sm:px-6">
          <ListingDetailActions listing={listing} evaluation={evaluation} />
        </div>

        {/* Hero: Title + Score */}
        <div className="px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] leading-tight">
                {title}
              </h1>

              {/* Location + date line */}
              <div className="flex items-center gap-2 mt-2 text-sm text-[var(--muted)] flex-wrap">
                {listing.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {listing.location}
                    {listing.province && listing.province !== listing.location && (
                      <span className="text-[var(--muted-light)]">· {listing.province}</span>
                    )}
                  </span>
                )}
                {listing.country && listing.country !== "BE" && (
                  <span className="text-sm" title={listing.country === "FR" ? "France" : listing.country === "ES" ? "Espagne" : listing.country}>
                    {listing.country === "FR" ? "\u{1F1EB}\u{1F1F7}" : listing.country === "ES" ? "\u{1F1EA}\u{1F1F8}" : listing.country}
                  </span>
                )}
                {listing.price && (
                  <span className="font-semibold text-[var(--foreground)]">
                    {listing.price}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--muted)]">
                  {listing.source}
                </span>
              </div>
            </div>

            {/* Score ring */}
            {evaluation && (
              <a href="#insights" className="hover:scale-105 transition-transform">
                <ScoreRing score={evaluation.quality_score} />
              </a>
            )}
          </div>
        </div>

        {/* Image gallery */}
        {listing.images.length > 0 && (
          <div className="px-4 sm:px-6 pb-4">
            <ImageGallery images={listing.images} title={listing.title} />
          </div>
        )}

        {/* Content area: two-column on desktop */}
        <div className="px-4 sm:px-6 pb-6">
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Main content (2/3) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Summary paragraph (from AI, but presented as editorial) */}
              {evaluation?.ai_description && (
                <p className="text-[var(--foreground)] leading-relaxed text-[15px]">
                  {evaluation.ai_description}
                </p>
              )}

              {/* Highlights & Concerns — presented as natural insights */}
              {evaluation && (evaluation.highlights.length > 0 || evaluation.concerns.length > 0) && (
                <div id="insights" className="grid sm:grid-cols-2 gap-3 scroll-mt-20">
                  {evaluation.highlights.length > 0 && (
                    <div className="rounded-xl bg-emerald-50/80 p-4 border border-emerald-200/60">
                      <h3 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Points forts
                      </h3>
                      <ul className="space-y-1.5">
                        {evaluation.highlights.map((h, i) => (
                          <li key={i} className="text-sm text-emerald-900 flex items-start gap-2">
                            <span className="text-emerald-400 mt-1 shrink-0">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                            </span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.concerns.length > 0 && (
                    <div className="rounded-xl bg-amber-50/80 p-4 border border-amber-200/60">
                      <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Points d&apos;attention
                      </h3>
                      <ul className="space-y-1.5">
                        {evaluation.concerns.map((c, i) => (
                          <li key={i} className="text-sm text-amber-900 flex items-start gap-2">
                            <span className="text-amber-400 mt-1 shrink-0">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                            </span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Match analysis — subtle callout */}
              {evaluation?.quality_summary && (
                <div className="flex items-start gap-3 rounded-lg p-3.5 bg-[var(--surface)] border border-[var(--border-light)]">
                  <svg className="w-4 h-4 text-[var(--primary)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <p className="text-sm text-[var(--foreground)] leading-relaxed">{evaluation.quality_summary}</p>
                </div>
              )}

              {/* Tags — shown open by default */}
              {tags && (
                <TagsDisplay tags={tags} defaultOpen />
              )}

              {/* Full description */}
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">
                  Description
                </h2>
                <div className="prose prose-sm max-w-none text-[var(--foreground)]/85 space-y-2">
                  {listing.description.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === ',') return <div key={i} className="h-1" />;
                    return (
                      <p key={i} className="leading-relaxed text-[14px]">
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar (1/3) */}
            <div className="space-y-4">

              {/* Key facts card */}
              {keyFacts.length > 0 && (
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)]/50 p-4">
                  <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
                    En bref
                  </h3>
                  <dl className="space-y-3">
                    {keyFacts.map((fact, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-[var(--primary)] mt-0.5 shrink-0">{fact.icon}</span>
                        <div className="min-w-0">
                          <dt className="text-xs text-[var(--muted)]">{fact.label}</dt>
                          <dd className="text-sm font-medium text-[var(--foreground)] break-words">{fact.value}</dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Contact */}
              {listing.contact && (
                <div className="rounded-xl border border-[var(--border-color)] p-4 bg-[var(--card-bg)]">
                  <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
                    Contact
                  </h3>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--primary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {listing.contact.includes("@") ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      )}
                    </svg>
                    <span className="text-sm text-[var(--foreground)] font-mono break-all">
                      {listing.contact}
                    </span>
                  </div>
                </div>
              )}

              {/* Publication date */}
              {listing.date_published && (
                <div className="rounded-xl border border-[var(--border-color)] p-4 bg-[var(--card-bg)]">
                  <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
                    Publication
                  </h3>
                  <p className="text-sm text-[var(--foreground)]">
                    {new Date(listing.date_published).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  {distance !== null && (
                    <p className="text-xs text-[var(--muted)] mt-1">
                      ~{distance} km de Bruxelles
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Minimal metadata footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-[var(--border-light)] bg-[var(--surface)]/30">
          <div className="flex items-center gap-4 text-xs text-[var(--muted-light)]">
            <span>Ref: {listing.id.slice(0, 8)}</span>
            {listing.date_scraped && <span>Mis a jour: {listing.date_scraped}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
