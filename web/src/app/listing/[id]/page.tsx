import { getListingById, getListingsWithEvals } from "@/lib/data";
import { CRITERIA_LABELS, CriteriaScores } from "@/lib/types";
import { ScoreBar, ScoreBadge } from "@/components/ScoreBar";
import { ListingChat } from "@/components/ListingChat";
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

  const { listing, evaluation } = item;

  // Calculate distance from Brussels
  const coords = getListingCoordinates(listing.location, listing.province);
  const distance = coords
    ? Math.round(haversineDistance(DEFAULT_REFERENCE_POINT, coords))
    : null;

  return (
    <div>
      <Link
        href="/"
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm mb-4 inline-block"
      >
        &larr; Retour au dashboard
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {listing.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              {listing.location && <span>{listing.location}</span>}
              {listing.province && listing.province !== listing.location && (
                <span>{listing.province}</span>
              )}
              {listing.price && (
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {listing.price}
                </span>
              )}
              <span>{listing.source}</span>
              {distance !== null && (
                <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-medium">
                  ~{distance} km de Bruxelles
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {evaluation && <ScoreBadge score={evaluation.overall_score} />}
            {evaluation?.availability_status && evaluation.availability_status !== "unknown" && (
              <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                evaluation.availability_status === "likely_available"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
              }`}>
                {evaluation.availability_status === "likely_available" ? "Disponibilite probable" : "Peut-etre expire"}
              </span>
            )}
            {evaluation?.data_quality_score !== undefined && (
              <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                evaluation.data_quality_score >= 7
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                  : evaluation.data_quality_score >= 4
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              }`}>
                Qualite donnees: {evaluation.data_quality_score}/10
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Voir l&apos;annonce originale
          </a>
          {listing.contact && (
            <a
              href={
                listing.contact.includes("@")
                  ? `mailto:${listing.contact}`
                  : `tel:${listing.contact.replace(/\s/g, "")}`
              }
              className="text-sm px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {listing.contact.includes("@") ? "Envoyer un email" : "Appeler"}
            </a>
          )}
        </div>

        {/* AI Evaluation */}
        {evaluation && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Evaluation IA
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{evaluation.match_summary}</p>

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
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Points forts :
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {evaluation.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {evaluation.concerns.length > 0 && (
              <div>
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  Points d&apos;attention :
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {evaluation.concerns.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact */}
        {listing.contact && (
          <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
              Contact :{" "}
            </span>
            <span className="text-sm text-yellow-900 dark:text-yellow-300">{listing.contact}</span>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Description complete
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {listing.description}
          </div>
        </div>

        {/* Images with lightbox-style grid */}
        {listing.images.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Images
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {listing.images.map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Image ${i + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-slate-700 group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* AI Chat */}
        <div className="mb-6">
          <ListingChat listing={listing} evaluation={evaluation} />
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
          <p>ID: {listing.id}</p>
          {listing.date_published && <p>Publie : {listing.date_published}</p>}
          <p>Scrape : {listing.date_scraped}</p>
          {evaluation && <p>Evalue : {evaluation.date_evaluated}</p>}
        </div>
      </div>
    </div>
  );
}
