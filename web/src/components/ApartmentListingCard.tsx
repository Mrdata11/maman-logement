"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ApartmentWithEval,
  ListingStatus,
  STATUS_CONFIG,
  PEB_RATING_COLORS,
} from "@/lib/types";
import { PlaceholderImage } from "./PlaceholderImage";

function getPublicationFreshness(dateStr: string | null): {
  label: string;
  color: string;
  daysAgo: number;
} | null {
  if (!dateStr) return null;
  const pubDate = new Date(dateStr);
  if (isNaN(pubDate.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - pubDate.getTime();
  const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysAgo <= 0) {
    return { label: "Aujourd'hui", color: "bg-emerald-100 text-emerald-800", daysAgo: 0 };
  } else if (daysAgo === 1) {
    return { label: "Hier", color: "bg-emerald-100 text-emerald-700", daysAgo };
  } else if (daysAgo <= 3) {
    return { label: `Il y a ${daysAgo}j`, color: "bg-emerald-50 text-emerald-700", daysAgo };
  } else if (daysAgo <= 7) {
    return { label: `Il y a ${daysAgo}j`, color: "bg-amber-50 text-amber-700", daysAgo };
  } else if (daysAgo <= 14) {
    return { label: `Il y a ${Math.floor(daysAgo / 7)} sem.`, color: "bg-orange-50 text-orange-600", daysAgo };
  } else if (daysAgo <= 30) {
    return { label: `Il y a ${Math.floor(daysAgo / 7)} sem.`, color: "bg-stone-100 text-stone-500", daysAgo };
  } else {
    const months = Math.floor(daysAgo / 30);
    return { label: `Il y a ${months} mois`, color: "bg-stone-100 text-stone-400", daysAgo };
  }
}

interface ApartmentListingCardProps {
  item: ApartmentWithEval;
  onStatusChange: (id: string, status: ListingStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onToggleCompare?: (id: string) => void;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isNew?: boolean;
  distance?: number | null;
}

export function ApartmentListingCard({
  item,
  onStatusChange,
  onNotesChange,
  onToggleCompare,
  isHighlighted,
  isSelected,
  isNew,
  distance,
}: ApartmentListingCardProps) {
  const { listing, evaluation, status, notes } = item;
  const [imgIndex, setImgIndex] = useState(0);

  const isFavorite = status === "favorite";
  const isArchived = status === "archived";
  const freshness = getPublicationFreshness(listing.date_published);

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

  return (
    <div
      className={`bg-[var(--card-bg)] border rounded-xl transition-all overflow-hidden ${
        isHighlighted
          ? "border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]"
          : isSelected
          ? "border-blue-400 shadow-sm"
          : "border-[var(--border-color)] hover:shadow-sm"
      }`}
    >
      {/* Image carousel */}
      {images.length > 0 ? (
        <div className="relative group aspect-[16/9] bg-[var(--surface)] overflow-hidden">
          <img
            src={images[imgIndex]}
            alt={listing.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />

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
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/50 text-white text-[10px]">
            {imgIndex + 1}/{maxVisible}
          </span>

          {/* Score badge overlay */}
          {evaluation && (
            <span
              className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold shadow ${
                evaluation.quality_score >= 70
                  ? "bg-emerald-500 text-white"
                  : evaluation.quality_score >= 40
                  ? "bg-amber-400 text-white"
                  : "bg-rose-500 text-white"
              }`}
            >
              {evaluation.quality_score}/100
            </span>
          )}
        </div>
      ) : (
        <PlaceholderImage className="aspect-[16/9]" />
      )}

      {/* Content */}
      <div className="p-3">
        {/* Price + key metrics row */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {listing.price_monthly && (
            <span className="text-base font-bold text-[var(--foreground)]">
              {listing.price_monthly.toLocaleString("fr-BE")} €/mois
            </span>
          )}
          {listing.charges_monthly && (
            <span className="text-xs text-[var(--muted)]">
              + {listing.charges_monthly.toLocaleString("fr-BE")} € charges
            </span>
          )}
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          {listing.bedrooms && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-800">
              {listing.bedrooms} ch.
            </span>
          )}
          {listing.surface_m2 && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800">
              {listing.surface_m2} m²
            </span>
          )}
          {listing.peb_rating && (
            <span
              className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                PEB_RATING_COLORS[listing.peb_rating] || "bg-gray-100 text-gray-800"
              }`}
            >
              PEB {listing.peb_rating}
            </span>
          )}
          {isNew && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
              Nouveau
            </span>
          )}
          {freshness && (
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${freshness.color}`}>
              {freshness.label}
            </span>
          )}
          {status !== "new" && (
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_CONFIG[status].color}`}>
              {STATUS_CONFIG[status].label}
            </span>
          )}
        </div>

        {/* Title */}
        <Link
          href={`/appartements/listing/${listing.id}`}
          className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)] line-clamp-1 block"
        >
          {listing.title}
        </Link>

        {/* Location + distance */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] mt-0.5">
          {listing.commune && <span>{listing.commune}</span>}
          {listing.postal_code && <span>({listing.postal_code})</span>}
          {distance !== null && distance !== undefined && (
            <span className="text-[var(--muted-light)]">
              · {distance.toFixed(1)} km d&apos;Ixelles
            </span>
          )}
        </div>

        {/* Tags */}
        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {listing.tags
              .filter(
                (t) =>
                  !t.match(/^\d+ chambre/) &&
                  !t.match(/^\d+ m²/) &&
                  t !== listing.commune &&
                  !t.match(/^\d+-\d+€$/) &&
                  !t.match(/^[<>] \d+€$/) &&
                  !t.match(/^Total ~/)
              )
              .slice(0, 6)
              .map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 bg-[var(--surface)] text-[var(--muted)] rounded-full"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}

        {/* AI Summary */}
        {evaluation && (
          <p className="mt-2 text-xs text-[var(--muted)] line-clamp-2">
            {evaluation.quality_summary}
          </p>
        )}

        {/* Notes preview */}
        {notes && (
          <div className="mt-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 line-clamp-1">
            {notes}
          </div>
        )}

        {/* Action buttons row */}
        <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-[var(--border-color)]">
          {/* Favorite */}
          <button
            onClick={() => onStatusChange(listing.id, isFavorite ? "new" : "favorite")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
              isFavorite
                ? "text-rose-600 bg-rose-50 hover:bg-rose-100"
                : "text-[var(--muted)] hover:text-rose-500 hover:bg-rose-50"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
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
            {isFavorite ? "Favori" : "Favori"}
          </button>

          {/* Compare */}
          {onToggleCompare && (
            <button
              onClick={() => onToggleCompare(listing.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                isSelected
                  ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                  : "text-[var(--muted)] hover:text-blue-500 hover:bg-blue-50"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Comparer
            </button>
          )}

          {/* Archive */}
          <button
            onClick={() => onStatusChange(listing.id, isArchived ? "new" : "archived")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
              isArchived
                ? "text-stone-600 bg-stone-100 hover:bg-stone-200"
                : "text-[var(--muted)] hover:text-stone-500 hover:bg-stone-50"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            {isArchived ? "Restaurer" : "Archiver"}
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Detail link */}
          <Link
            href={`/appartements/listing/${listing.id}`}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
          >
            Détail
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Source link */}
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
          >
            Immoweb
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
