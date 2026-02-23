"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ListingWithEval,
  ListingStatus,
  STATUS_CONFIG,
  LISTING_TYPE_LABELS,
} from "@/lib/types";
import { TagsPills } from "./TagsDisplay";
import { PlaceholderImage } from "./PlaceholderImage";

interface ListingCardProps {
  item: ListingWithEval;
  onStatusChange: (id: string, status: ListingStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  personalScore?: { score: number; explanation: string } | null;
  isHighlighted?: boolean;
  distance?: number | null;
}

export function ListingCard({
  item,
  onStatusChange,
  onNotesChange,
  personalScore,
  isHighlighted = false,
  distance,
}: ListingCardProps) {
  const { listing, evaluation, tags, status, notes } = item;
  const isFaded = status === "archived" || status === "rejected";
  const isFavorite = status === "favorite";
  const [showNotes, setShowNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const images = listing.images;
  const maxVisible = Math.min(images.length, 8);

  const prevImg = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImgIndex((i) => (i - 1 + maxVisible) % maxVisible);
    },
    [maxVisible]
  );
  const nextImg = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImgIndex((i) => (i + 1) % maxVisible);
    },
    [maxVisible]
  );

  const handleNotesSave = () => {
    onNotesChange(listing.id, localNotes);
    setShowNotes(false);
  };

  return (
    <div
      className={`bg-[var(--card-bg)] rounded-xl border transition-all shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] flex flex-row ${
        isFaded ? "opacity-50" : ""
      } ${
        isHighlighted
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-lg"
          : "border-[var(--border-color)]"
      }`}
    >
      {/* Image carousel — côté gauche */}
      <div className="relative group w-56 sm:w-64 md:w-80 shrink-0 bg-[var(--surface)] overflow-hidden rounded-l-xl">
        {images.length > 0 ? (
          <>
            <Link href={`/listing/${listing.id}`} className="block h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[imgIndex]}
                alt={evaluation?.ai_title || listing.title}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </Link>

            {/* Navigation arrows */}
            {maxVisible > 1 && (
              <>
                <button
                  onClick={prevImg}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                  aria-label="Photo précédente"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImg}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                  aria-label="Photo suivante"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Dot indicators */}
            {maxVisible > 1 && (
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                {Array.from({ length: maxVisible }).map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImgIndex(i);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === imgIndex ? "bg-white w-3" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Image counter */}
            {maxVisible > 1 && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/50 text-white text-[10px]">
                {imgIndex + 1}/{maxVisible}
              </span>
            )}

          </>
        ) : (
          <PlaceholderImage className="w-full h-full" />
        )}
      </div>

      {/* Content — côté droit */}
      <div className="flex-1 min-w-0 p-5 overflow-hidden flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                {personalScore && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-lg font-semibold bg-violet-100 text-violet-700"
                    title={personalScore.explanation}
                  >
                    Mon score: {personalScore.score}
                  </span>
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
                <a
                  href={listing.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--primary)] hover:underline transition-colors"
                >
                  {listing.source}
                </a>
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
              {/* Notes icon */}
              <button
                onClick={() => {
                  setShowNotes(!showNotes);
                  setLocalNotes(notes);
                }}
                className={`p-1.5 rounded-full transition-colors ${
                  notes
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-[var(--muted-light)] hover:text-amber-400"
                }`}
                title={notes ? "Modifier la note" : "Ajouter une note"}
              >
                <svg className="w-5 h-5" fill={notes ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
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
                {evaluation.ai_description || evaluation.quality_summary}
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

          {/* Voir détail + Status row */}
          <div className="mt-2 flex items-center justify-between">
            <Link
              href={`/listing/${listing.id}`}
              className="text-sm text-[var(--muted)] underline hover:text-[var(--primary)] transition-colors"
            >
              Voir détail
            </Link>

            {/* Status menu */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="text-xs px-2.5 py-1 border border-[var(--border-color)] text-[var(--muted)] rounded-md hover:bg-[var(--surface)] inline-flex items-center gap-1 transition-colors"
              >
                Statut
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showStatusMenu && (
                <div className="absolute right-0 z-10 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[180px]">
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
  );
}
