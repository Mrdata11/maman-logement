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
import { TagsPills } from "./TagsDisplay";

interface ListingCardProps {
  item: ListingWithEval;
  onStatusChange: (id: string, status: ListingStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onToggleCompare?: (id: string) => void;
  adjustedScore?: number;
  isHighlighted?: boolean;
  isSelected?: boolean;
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
  distance,
}: ListingCardProps) {
  const { listing, evaluation, tags, status, notes } = item;
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
      className={`bg-[var(--card-bg)] rounded-xl border p-4 transition-all shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] ${
        isFaded ? "opacity-50" : ""
      } ${
        isHighlighted
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-lg"
          : "border-[var(--border-color)]"
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Image thumbnail */}
        <div className="shrink-0">
          {listing.images.length > 0 ? (
            <Link href={`/listing/${listing.id}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listing.images[0]}
                alt=""
                loading="lazy"
                className="w-full h-[160px] sm:w-[130px] sm:h-[90px] object-cover rounded-lg border border-[var(--border-color)] hover:opacity-90 transition-opacity"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </Link>
          ) : (
            <div className="w-full h-[120px] sm:w-[130px] sm:h-[90px] rounded-lg border border-[var(--border-color)] bg-[var(--surface)] flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[var(--muted-light)]"
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
                {evaluation && (
                  <div className="flex items-center gap-1">
                    <ScoreBadge
                      score={adjustedScore ?? evaluation.overall_score}
                    />
                    {scoreDiff !== undefined && scoreDiff !== 0 && (
                      <span
                        className={`text-xs font-semibold ${
                          scoreDiff > 0 ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        {scoreDiff > 0 ? "+" : ""}
                        {scoreDiff}
                      </span>
                    )}
                  </div>
                )}
                {listing.listing_type && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)]">
                    {LISTING_TYPE_LABELS[listing.listing_type] ||
                      listing.listing_type}
                  </span>
                )}
                {status !== "new" && status !== "favorite" && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${STATUS_CONFIG[status].color}`}
                  >
                    {STATUS_CONFIG[status].label}
                  </span>
                )}
                {listing.country && listing.country !== "BE" && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)]">
                    {listing.country === "FR" ? "🇫🇷 France" : listing.country === "ES" ? "🇪🇸 Espagne" : listing.country}
                  </span>
                )}
                {listing.original_language === "es" && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    🇪🇸 Traduit
                  </span>
                )}
                {distance !== null && distance !== undefined && (
                  <span className="text-xs px-2 py-0.5 rounded bg-sky-50 text-sky-700">
                    ~{Math.round(distance)} km
                  </span>
                )}
              </div>

              {/* Title */}
              <Link
                href={`/listing/${listing.id}`}
                className="text-lg font-semibold text-[var(--foreground)] hover:text-[var(--primary)] line-clamp-2"
              >
                {evaluation?.ai_title || listing.title}
              </Link>

              {/* Location, price, source */}
              <div className="flex items-center gap-2 sm:gap-3 mt-1 text-sm text-[var(--muted)] flex-wrap">
                {listing.location && <span>{listing.location}</span>}
                {listing.province &&
                  listing.province !== listing.location && (
                    <span>{listing.province}</span>
                  )}
                {listing.price && (
                  <span className="font-semibold text-[var(--foreground)]">
                    {listing.price}
                  </span>
                )}
                <span>{listing.source}</span>
                {listing.date_published && (
                  <span className="text-[var(--muted-light)]">
                    {new Date(listing.date_published).toLocaleDateString("fr-BE", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>

            {/* Favorite + Compare buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() =>
                  onStatusChange(
                    listing.id,
                    isFavorite ? "new" : "favorite"
                  )
                }
                className={`p-1.5 rounded-full transition-colors ${
                  isFavorite
                    ? "text-rose-500 hover:text-rose-600"
                    : "text-[var(--muted-light)] hover:text-rose-400"
                }`}
                title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <svg
                  className="w-5 h-5"
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
                <div className="relative group">
                  <button
                    onClick={() => onToggleCompare(listing.id)}
                    className={`p-1.5 rounded transition-colors text-xs font-medium ${
                      isSelected
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H5a2 2 0 00-2 2v10a2 2 0 002 2h4a2 2 0 002-2V7a2 2 0 00-2-2zm10 0h-4a2 2 0 00-2 2v10a2 2 0 002 2h4a2 2 0 002-2V7a2 2 0 00-2-2z" />
                    </svg>
                  </button>
                  <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-white bg-[var(--foreground)] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {isSelected ? "Retirer de la comparaison" : "Comparer"}
                  </span>
                </div>
              )}
              {/* Archive toggle */}
              <button
                onClick={() =>
                  onStatusChange(
                    listing.id,
                    isFaded ? "new" : "archived"
                  )
                }
                className={`p-1.5 rounded-full transition-colors ${
                  isFaded
                    ? "text-stone-500 hover:text-stone-600"
                    : "text-[var(--muted-light)] hover:text-stone-500"
                }`}
                title={isFaded ? "Désarchiver" : "Archiver"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
            </div>
          </div>

          {/* AI Summary */}
          {evaluation && (
            <div className="mt-2">
              <p className="text-sm text-[var(--foreground)] line-clamp-3">
                {evaluation.ai_description || evaluation.match_summary}
              </p>
            </div>
          )}

          {!evaluation && (
            <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">
              {listing.description.slice(0, 200)}...
            </p>
          )}

          {/* Tags pills */}
          {tags && <TagsPills tags={tags} />}

          {/* Notes preview */}
          {notes && !showNotes && (
            <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 line-clamp-1">
              {notes}
            </div>
          )}

          {/* Actions row */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Link
              href={`/listing/${listing.id}`}
              className="text-sm px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] min-h-[44px] inline-flex items-center"
            >
              Voir detail
            </Link>
            <a
              href={listing.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-4 py-2 border border-[var(--border-color)] text-[var(--muted)] rounded-lg hover:bg-[var(--surface)] min-h-[44px] inline-flex items-center"
            >
              Source
            </a>

            {/* Notes toggle */}
            <button
              onClick={() => {
                setShowNotes(!showNotes);
                setLocalNotes(notes);
              }}
              className={`text-sm px-3 py-2 border rounded-lg transition-colors min-h-[44px] inline-flex items-center ${
                notes
                  ? "border-amber-300 text-amber-700 hover:bg-amber-50:bg-amber-900/20"
                  : "border-[var(--border-color)] text-[var(--muted)] hover:bg-[var(--surface)]"
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
                className="text-sm px-3 py-2 border border-[var(--border-color)] text-[var(--muted)] rounded-lg hover:bg-[var(--surface)] min-h-[44px] inline-flex items-center"
              >
                Changer statut
                <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showStatusMenu && (
                <div className="absolute z-10 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[180px]">
                  {(Object.keys(STATUS_CONFIG) as ListingStatus[])
                    .filter((s) => s !== status && s !== "archived" && s !== "rejected")
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          onStatusChange(listing.id, s);
                          setShowStatusMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface)] flex items-center gap-2"
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
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder="Tes impressions, questions, points importants..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleNotesSave}
                  className="text-sm px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 min-h-[44px]"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-sm px-3 py-2 text-[var(--muted)] hover:text-[var(--foreground)]"
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
