"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ListingWithEval,
  ListingStatus,
  STATUS_CONFIG,
  LISTING_TYPE_LABELS,
} from "@/lib/types";
import { ScoreBadge } from "./ScoreBar";

interface ListingCardProps {
  item: ListingWithEval;
  onStatusChange: (id: string, status: ListingStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onToggleCompare?: (id: string) => void;
  adjustedScore?: number;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isNew?: boolean;
  distance?: number | null;
}

export function ListingCard({
  item,
  onStatusChange,
  onNotesChange,
  onToggleCompare,
  adjustedScore,
  isHighlighted = false,
  isSelected = false,
  isNew = false,
  distance,
}: ListingCardProps) {
  const { listing, evaluation, status, notes } = item;
  const isFaded = status === "archived" || status === "rejected";
  const isFavorite = status === "favorite";
  const originalScore = evaluation?.overall_score;
  const scoreDiff =
    adjustedScore !== undefined && originalScore !== undefined
      ? adjustedScore - originalScore
      : undefined;

  const [showNotes, setShowNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleNotesSave = () => {
    onNotesChange(listing.id, localNotes);
    setShowNotes(false);
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border p-4 transition-all ${
        isFaded ? "opacity-50" : ""
      } ${
        isFavorite
          ? "border-pink-300 dark:border-pink-700 ring-1 ring-pink-200 dark:ring-pink-800"
          : isHighlighted
            ? "border-blue-500 ring-2 ring-blue-500/30 shadow-lg"
            : "border-gray-200 dark:border-slate-700"
      }`}
    >
      <div className="flex gap-3">
        {/* Image thumbnail */}
        <div className="shrink-0">
          {listing.images.length > 0 ? (
            <Link href={`/listing/${listing.id}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listing.images[0]}
                alt=""
                loading="lazy"
                className="w-[120px] h-[80px] object-cover rounded-md border border-gray-200 dark:border-slate-600 hover:opacity-90 transition-opacity"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </Link>
          ) : (
            <div className="w-[120px] h-[80px] rounded-md border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-300 dark:text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                {isNew && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold animate-pulse">
                    NEW
                  </span>
                )}
                {evaluation && (
                  <div className="flex items-center gap-1">
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
                    {LISTING_TYPE_LABELS[listing.listing_type] ||
                      listing.listing_type}
                  </span>
                )}
                {evaluation?.availability_status && evaluation.availability_status !== "unknown" && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    evaluation.availability_status === "likely_available"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                  }`}>
                    {evaluation.availability_status === "likely_available" ? "Dispo probable" : "Peut-etre expire"}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded ${STATUS_CONFIG[status].color}`}
                >
                  {STATUS_CONFIG[status].label}
                </span>
                {distance !== null && distance !== undefined && (
                  <span className="text-xs px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                    ~{Math.round(distance)} km
                  </span>
                )}
              </div>

              {/* Title */}
              <Link
                href={`/listing/${listing.id}`}
                className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
              >
                {listing.title}
              </Link>

              {/* Location, price, source */}
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                {listing.location && <span>{listing.location}</span>}
                {listing.province &&
                  listing.province !== listing.location && (
                    <span>{listing.province}</span>
                  )}
                {listing.price && (
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {listing.price}
                  </span>
                )}
                <span>{listing.source}</span>
              </div>
            </div>

            {/* Favorite + Compare buttons */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                onClick={() =>
                  onStatusChange(
                    listing.id,
                    isFavorite ? "new" : "favorite"
                  )
                }
                className={`p-2 rounded-full transition-colors ${
                  isFavorite
                    ? "text-pink-500 hover:text-pink-600 bg-pink-50 dark:bg-pink-900/30"
                    : "text-gray-300 dark:text-slate-500 hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                }`}
                title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <svg
                  className="w-6 h-6"
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
              {onToggleCompare && (
                <button
                  onClick={() => onToggleCompare(listing.id)}
                  className={`p-1.5 rounded transition-colors text-xs font-medium ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600"
                  }`}
                  title={isSelected ? "Retirer de la comparaison" : "Comparer"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* AI Summary */}
          {evaluation && (
            <div className="mt-2">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {evaluation.match_summary}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
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

          {/* Notes preview */}
          {notes && !showNotes && (
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-800 line-clamp-1">
              {notes}
            </div>
          )}

          {/* Actions row */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Link
              href={`/listing/${listing.id}`}
              className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Voir detail
            </Link>
            <a
              href={listing.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Source
            </a>

            {/* Notes toggle */}
            <button
              onClick={() => {
                setShowNotes(!showNotes);
                setLocalNotes(notes);
              }}
              className={`text-sm px-3 py-1.5 border rounded-md transition-colors ${
                notes
                  ? "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  : "border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
              }`}
              title="Notes"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {notes ? "Notes" : "Ajouter note"}
            </button>

            {/* Status menu */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="text-sm px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Changer statut
                <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showStatusMenu && (
                <div className="absolute z-10 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 min-w-[180px]">
                  {(Object.keys(STATUS_CONFIG) as ListingStatus[])
                    .filter((s) => s !== status)
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          onStatusChange(listing.id, s);
                          setShowStatusMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${STATUS_CONFIG[s].color}`}
                        >
                          {STATUS_CONFIG[s].label}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes editor */}
          {showNotes && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder="Tes impressions, questions, points importants..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-amber-300 dark:border-amber-700 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleNotesSave}
                  className="text-sm px-3 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-sm px-3 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
