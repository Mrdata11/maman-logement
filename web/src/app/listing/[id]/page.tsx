import { getListingById, getListingsWithEvals } from "@/lib/data";
import { CRITERIA_LABELS, CriteriaScores } from "@/lib/types";
import { ScoreBar, ScoreBadge } from "@/components/ScoreBar";
import { notFound } from "next/navigation";
import Link from "next/link";

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

  return (
    <div>
      <Link
        href="/"
        className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
      >
        &larr; Retour au dashboard
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {listing.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              {listing.location && <span>{listing.location}</span>}
              {listing.province && listing.province !== listing.location && (
                <span>{listing.province}</span>
              )}
              {listing.price && (
                <span className="font-medium text-gray-700">
                  {listing.price}
                </span>
              )}
              <span>{listing.source}</span>
            </div>
          </div>
          {evaluation && <ScoreBadge score={evaluation.overall_score} />}
        </div>

        {/* Source link */}
        <a
          href={listing.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-6"
        >
          Voir l&apos;annonce originale
        </a>

        {/* AI Evaluation */}
        {evaluation && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              &Eacute;valuation IA
            </h2>
            <p className="text-gray-700 mb-4">{evaluation.match_summary}</p>

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

        {/* Contact */}
        {listing.contact && (
          <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <span className="text-sm font-medium text-yellow-800">
              Contact :{" "}
            </span>
            <span className="text-sm text-yellow-900">{listing.contact}</span>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Description compl&egrave;te
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {listing.description}
          </div>
        </div>

        {/* Images */}
        {listing.images.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Images
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {listing.images.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Image ${i + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">
          <p>ID: {listing.id}</p>
          {listing.date_published && <p>Publi&eacute; : {listing.date_published}</p>}
          <p>Scrap&eacute; : {listing.date_scraped}</p>
          {evaluation && <p>&Eacute;valu&eacute; : {evaluation.date_evaluated}</p>}
        </div>
      </div>
    </div>
  );
}
