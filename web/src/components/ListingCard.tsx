"use client";

import Link from "next/link";
import { ListingWithEval, ListingStatus } from "@/lib/types";
import { ScoreBadge } from "./ScoreBar";

const STATUS_LABELS: Record<ListingStatus, string> = {
  new: "Nouveau",
  archived: "Archiv\u00e9",
  in_discussion: "En discussion",
  favorite: "Favori",
};

const STATUS_COLORS: Record<ListingStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  archived: "bg-gray-100 text-gray-500",
  in_discussion: "bg-purple-100 text-purple-800",
  favorite: "bg-pink-100 text-pink-800",
};

const TYPE_LABELS: Record<string, string> = {
  "offre-location": "Location",
  "offre-vente": "Vente",
  "demande-location": "Recherche location",
  "demande-vente": "Recherche achat",
  "creation-groupe": "Cr\u00e9ation de groupe",
  "habitat-leger": "Habitat l\u00e9ger",
  divers: "Divers",
};

export function ListingCard({
  item,
  onStatusChange,
}: {
  item: ListingWithEval;
  onStatusChange: (id: string, status: ListingStatus) => void;
}) {
  const { listing, evaluation, status } = item;
  const isArchived = status === "archived";

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 transition-opacity ${isArchived ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {evaluation && <ScoreBadge score={evaluation.overall_score} />}
            {listing.listing_type && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                {TYPE_LABELS[listing.listing_type] || listing.listing_type}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>

          <Link
            href={`/listing/${listing.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
          >
            {listing.title}
          </Link>

          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            {listing.location && <span>{listing.location}</span>}
            {listing.province && listing.province !== listing.location && (
              <span>{listing.province}</span>
            )}
            {listing.price && (
              <span className="font-medium text-gray-700">{listing.price}</span>
            )}
            <span>{listing.source}</span>
          </div>
        </div>
      </div>

      {evaluation && (
        <div className="mt-3">
          <p className="text-sm text-gray-700">{evaluation.match_summary}</p>

          <div className="mt-2 flex flex-wrap gap-1">
            {evaluation.highlights.map((h, i) => (
              <span
                key={i}
                className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded"
              >
                {h}
              </span>
            ))}
            {evaluation.concerns.slice(0, 2).map((c, i) => (
              <span
                key={i}
                className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {!evaluation && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
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
          className="text-sm px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Source originale
        </a>

        {status !== "archived" ? (
          <button
            onClick={() => onStatusChange(listing.id, "archived")}
            className="text-sm px-3 py-1.5 border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50"
          >
            Archiver
          </button>
        ) : (
          <button
            onClick={() => onStatusChange(listing.id, "new")}
            className="text-sm px-3 py-1.5 border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50"
          >
            {"D\u00e9sarchiver"}
          </button>
        )}

        {status !== "in_discussion" ? (
          <button
            onClick={() => onStatusChange(listing.id, "in_discussion")}
            className="text-sm px-3 py-1.5 border border-purple-300 text-purple-700 rounded-md hover:bg-purple-50"
          >
            En discussion
          </button>
        ) : (
          <button
            onClick={() => onStatusChange(listing.id, "new")}
            className="text-sm px-3 py-1.5 border border-purple-300 text-purple-700 rounded-md hover:bg-purple-50"
          >
            Retirer discussion
          </button>
        )}
      </div>
    </div>
  );
}
