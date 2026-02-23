"use client";

import Link from "next/link";
import { ListingWithEval, ListingStatus, LISTING_TYPE_LABELS } from "@/lib/types";
import { ScoreBadge } from "./ScoreBar";

const STATUS_LABELS: Record<ListingStatus, string> = {
  new: "Nouveau",
  archived: "Archivé",
  in_discussion: "En discussion",
  favorite: "Favori",
};

const STATUS_COLORS: Record<ListingStatus, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  archived: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  in_discussion: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  favorite: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

export function ListingCard({
  item,
  onStatusChange,
  adjustedScore,
  isHighlighted = false,
}: {
  item: ListingWithEval;
  onStatusChange: (id: string, status: ListingStatus) => void;
  adjustedScore?: number;
  isHighlighted?: boolean;
}) {
  const { listing, evaluation, status } = item;
  const isArchived = status === "archived";
  const originalScore = evaluation?.overall_score;
  const scoreDiff =
    adjustedScore !== undefined && originalScore !== undefined
      ? adjustedScore - originalScore
      : undefined;

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border p-4 transition-all ${isArchived ? "opacity-50" : ""} ${isHighlighted ? "border-blue-500 ring-2 ring-blue-500/30 shadow-lg" : "border-gray-200 dark:border-slate-700"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {evaluation && (
              <div className="flex items-center gap-1.5">
                <ScoreBadge
                  score={adjustedScore ?? evaluation.overall_score}
                />
                {scoreDiff !== undefined && scoreDiff !== 0 && (
                  <span
                    className={`text-xs font-semibold ${
                      scoreDiff > 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {scoreDiff > 0 ? "+" : ""}
                    {scoreDiff}
                  </span>
                )}
              </div>
            )}
            {listing.listing_type && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                {LISTING_TYPE_LABELS[listing.listing_type] || listing.listing_type}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>

          <Link
            href={`/listing/${listing.id}`}
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
          >
            {listing.title}
          </Link>

          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            {listing.location && <span>{listing.location}</span>}
            {listing.province && listing.province !== listing.location && (
              <span>{listing.province}</span>
            )}
            {listing.price && (
              <span className="font-medium text-gray-700 dark:text-gray-300">{listing.price}</span>
            )}
            <span>{listing.source}</span>
          </div>
        </div>
      </div>

      {evaluation && (
        <div className="mt-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">{evaluation.match_summary}</p>

          <div className="mt-2 flex flex-wrap gap-1">
            {evaluation.highlights.map((h, i) => (
              <span
                key={i}
                className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded"
              >
                {h}
              </span>
            ))}
            {evaluation.concerns.slice(0, 2).map((c, i) => (
              <span
                key={i}
                className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {!evaluation && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {listing.description.slice(0, 200)}...
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Link
          href={`/listing/${listing.id}`}
          className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {"Voir d\u00e9tail"}
        </Link>
        <a
          href={listing.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700"
        >
          Source originale
        </a>

        {status !== "archived" ? (
          <button
            onClick={() => onStatusChange(listing.id, "archived")}
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Archiver
          </button>
        ) : (
          <button
            onClick={() => onStatusChange(listing.id, "new")}
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            {"D\u00e9sarchiver"}
          </button>
        )}

        {status !== "in_discussion" ? (
          <button
            onClick={() => onStatusChange(listing.id, "in_discussion")}
            className="text-sm px-3 py-1.5 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/30"
          >
            En discussion
          </button>
        ) : (
          <button
            onClick={() => onStatusChange(listing.id, "new")}
            className="text-sm px-3 py-1.5 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/30"
          >
            Retirer discussion
          </button>
        )}
      </div>
    </div>
  );
}
