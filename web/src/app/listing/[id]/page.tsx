import { getListingById, getListingsWithEvals } from "@/lib/data";
import { CRITERIA_LABELS, CriteriaScores } from "@/lib/types";
import { ScoreBar } from "@/components/ScoreBar";
import { ListingDetailActions } from "@/components/ListingDetailActions";
import { ImageGallery } from "@/components/ImageGallery";
import { TagsDisplay } from "@/components/TagsDisplay";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getListingCoordinates,
  haversineDistance,
  DEFAULT_REFERENCE_POINT,
} from "@/lib/coordinates";

export function generateStaticParams() {
  const items = getListingsWithEvals();
  return items.map((item) => ({ id: item.listing.id }));
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

  // Calculate distance from Brussels
  const coords = getListingCoordinates(listing.location, listing.province);
  const distance = coords
    ? Math.round(haversineDistance(DEFAULT_REFERENCE_POINT, coords))
    : null;

  return (
    <div>
      <Link
        href="/"
        className="text-[var(--primary)] hover:opacity-80 text-sm mb-4 inline-flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour au dashboard
      </Link>

      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 sm:p-6 relative overflow-hidden">
        {/* Interactive action bar (client component) */}
        <ListingDetailActions listing={listing} evaluation={evaluation} />

        {/* Header */}
        <div className="mt-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            {evaluation?.ai_title || listing.title}
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 mt-2 text-sm text-[var(--muted)] flex-wrap">
            {listing.location && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.location}
              </span>
            )}
            {listing.province && listing.province !== listing.location && (
              <span>{listing.province}</span>
            )}
            {listing.price && (
              <span className="font-semibold text-[var(--foreground)] text-base">
                {listing.price}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)]">
              {listing.source}
            </span>
            {listing.country && listing.country !== "BE" && (
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)]">
                {listing.country === "FR" ? "🇫🇷 France" : listing.country === "ES" ? "🇪🇸 Espagne" : listing.country}
              </span>
            )}
            {listing.original_language === "es" && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                🇪🇸 Traduit de l&apos;espagnol
              </span>
            )}
            {listing.original_language === "en" && listing.country === "ES" && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                🇬🇧 Traduit de l&apos;anglais
              </span>
            )}
            {listing.date_published && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(listing.date_published).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
            {distance !== null && (
              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-xs font-medium">
                ~{distance} km de Bruxelles
              </span>
            )}
            {evaluation && (
              <a
                href="#evaluation"
                className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${
                  evaluation.overall_score >= 70
                    ? "bg-green-100 text-green-700"
                    : evaluation.overall_score >= 40
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-600"
                }`}
              >
                {evaluation.overall_score}/100
              </a>
            )}
          </div>
        </div>

        {/* Images with lightbox */}
        {listing.images.length > 0 && (
          <div className="mb-6">
            <ImageGallery images={listing.images} title={listing.title} />
          </div>
        )}

        {/* AI Evaluation */}
        {evaluation && (
          <div id="evaluation" className="mb-6 rounded-xl border border-[var(--border-color)] overflow-hidden scroll-mt-16">
            {/* Section header */}
            <div className="bg-[var(--surface)] px-5 py-3 flex items-center gap-2.5 border-b border-[var(--border-color)]">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Evaluation IA
              </h2>
            </div>

            <div className="p-5 space-y-4">
              {/* Match analysis (how it fits the criteria) */}
              <div className="flex items-start gap-3 bg-amber-50/70 rounded-lg p-3.5 border border-amber-200/60">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <div>
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Analyse de correspondance</span>
                  <p className="text-sm text-amber-900 leading-relaxed mt-1">{evaluation.match_summary}</p>
                </div>
              </div>

              {/* Criteria scores in a distinct sub-section */}
              <div className="bg-[var(--surface)] rounded-lg p-4">
                <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
                  Scores par critere
                </h3>
                <div className="grid gap-2.5">
                  {(
                    Object.entries(evaluation.criteria_scores) as [
                      keyof CriteriaScores,
                      number,
                    ][]
                  ).map(([key, score]) => (
                    <ScoreBar
                      key={key}
                      score={score}
                      max={10}
                      label={CRITERIA_LABELS[key]}
                    />
                  ))}
                </div>
              </div>

              {/* Highlights & Concerns side by side */}
              {(evaluation.highlights.length > 0 || evaluation.concerns.length > 0) && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {evaluation.highlights.length > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <h3 className="text-sm font-semibold text-emerald-800 mb-2.5 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Points forts
                      </h3>
                      <ul className="space-y-1.5">
                        {evaluation.highlights.map((h, i) => (
                          <li key={i} className="text-sm text-emerald-900 flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-px shrink-0">+</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.concerns.length > 0 && (
                    <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                      <h3 className="text-sm font-semibold text-rose-800 mb-2.5 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Points d&apos;attention
                      </h3>
                      <ul className="space-y-1.5">
                        {evaluation.concerns.map((c, i) => (
                          <li key={i} className="text-sm text-rose-900 flex items-start gap-2">
                            <span className="text-rose-400 font-bold mt-px shrink-0">-</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Structured tags */}
        {tags && (
          <div className="mb-6">
            <TagsDisplay tags={tags} />
          </div>
        )}

        {/* Contact */}
        {listing.contact && (
          <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-yellow-800">
                Contact :{" "}
              </span>
              <span className="text-sm text-yellow-900 font-mono">
                {listing.contact}
              </span>
            </div>
          </div>
        )}

        {/* AI summary (conversational overview, placed above raw description) */}
        {evaluation?.ai_description && (
          <div className="mb-6 p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-light)]">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resume IA
            </h2>
            <p className="text-[var(--foreground)] leading-relaxed">{evaluation.ai_description}</p>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Description complete
          </h2>
          <div className="prose prose-sm max-w-none text-[var(--foreground)] space-y-2">
            {listing.description.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed || trimmed === ',') return <div key={i} className="h-1" />;
              return (
                <p key={i} className="leading-relaxed">
                  {trimmed}
                </p>
              );
            })}
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-[var(--muted-light)] mt-6 pt-4 border-t border-[var(--border-light)]">
          <p>ID: {listing.id}</p>
          {listing.date_published && <p>Publie : {listing.date_published}</p>}
          <p>Scrape : {listing.date_scraped}</p>
          {evaluation && <p>Evalue : {evaluation.date_evaluated}</p>}
        </div>
      </div>
    </div>
  );
}
