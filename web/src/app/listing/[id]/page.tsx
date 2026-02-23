import { getListingById, getListingsWithEvals } from "@/lib/data";
import { CRITERIA_LABELS, CriteriaScores } from "@/lib/types";
import { ScoreBar, ScoreBadge } from "@/components/ScoreBar";
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

      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 relative overflow-hidden">
        {/* Interactive action bar (client component) */}
        <ListingDetailActions listing={listing} evaluation={evaluation} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mt-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {listing.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-[var(--muted)] flex-wrap">
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
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {evaluation && <ScoreBadge score={evaluation.overall_score} />}
            {evaluation?.availability_status && evaluation.availability_status !== "unknown" && (
              <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                evaluation.availability_status === "likely_available"
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}>
                {evaluation.availability_status === "likely_available" ? "Disponibilite probable" : "Peut-etre expire"}
              </span>
            )}
            {evaluation?.data_quality_score !== undefined && (
              <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                evaluation.data_quality_score >= 7
                  ? "bg-purple-100 text-purple-700"
                  : evaluation.data_quality_score >= 4
                    ? "bg-[var(--surface)] text-[var(--muted)]"
                    : "bg-red-100 text-red-600"
              }`}>
                Qualite donnees: {evaluation.data_quality_score}/10
              </span>
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
          <div className="mb-6 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Evaluation IA
            </h2>
            <p className="text-[var(--foreground)] mb-4">{evaluation.match_summary}</p>

            <div className="grid gap-2 mb-4">
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

            {evaluation.highlights.length > 0 && (
              <div className="mb-2">
                <span className="text-sm font-medium text-green-700">
                  Points forts :
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {evaluation.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {evaluation.concerns.length > 0 && (
              <div>
                <span className="text-sm font-medium text-red-700">
                  Points d&apos;attention :
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {evaluation.concerns.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
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

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Description complete
          </h2>
          <div className="prose prose-sm max-w-none text-[var(--foreground)] whitespace-pre-wrap">
            {listing.description}
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
