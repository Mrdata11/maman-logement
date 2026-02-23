"use client";

import Link from "next/link";
import { ApartmentWithEval, ListingStatus, STATUS_CONFIG, PEB_RATING_COLORS, APARTMENT_CRITERIA_LABELS, ApartmentCriteriaScores } from "@/lib/types";

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

  const isFavorite = status === "favorite";

  return (
    <div
      className={`p-4 bg-[var(--card-bg)] border rounded-xl transition-all ${
        isHighlighted
          ? "border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]"
          : isSelected
          ? "border-blue-400 shadow-sm"
          : "border-[var(--border-color)] hover:shadow-sm"
      }`}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="shrink-0 w-28 h-28 rounded-lg overflow-hidden bg-[var(--surface)]">
          {listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--muted-light)]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Score badge */}
            {evaluation && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  evaluation.overall_score >= 70
                    ? "bg-emerald-100 text-emerald-800"
                    : evaluation.overall_score >= 40
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {evaluation.overall_score}/100
              </span>
            )}

            {/* Price badge */}
            {listing.price_monthly && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {listing.price_monthly.toLocaleString("fr-BE")} €/mois
              </span>
            )}

            {/* Bedrooms */}
            {listing.bedrooms && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                {listing.bedrooms} ch.
              </span>
            )}

            {/* Surface */}
            {listing.surface_m2 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                {listing.surface_m2} m²
              </span>
            )}

            {/* PEB */}
            {listing.peb_rating && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PEB_RATING_COLORS[listing.peb_rating] || "bg-gray-100 text-gray-800"}`}>
                PEB {listing.peb_rating}
              </span>
            )}

            {/* New badge */}
            {isNew && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                Nouveau
              </span>
            )}

            {/* Status badge */}
            {status !== "new" && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[status].color}`}>
                {STATUS_CONFIG[status].label}
              </span>
            )}
          </div>

          {/* Title */}
          <Link
            href={`/appartements/listing/${listing.id}`}
            className="text-base font-semibold text-[var(--foreground)] hover:text-[var(--primary)] line-clamp-1"
          >
            {listing.title}
          </Link>

          {/* Location + distance */}
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-0.5">
            {listing.commune && (
              <span>{listing.commune}</span>
            )}
            {listing.postal_code && (
              <span>({listing.postal_code})</span>
            )}
            {distance !== null && distance !== undefined && (
              <span className="text-[var(--muted-light)]">
                · {distance.toFixed(1)} km d&apos;Ixelles
              </span>
            )}
            {listing.charges_monthly && (
              <span className="text-[var(--muted-light)]">
                · Charges: {listing.charges_monthly}€
              </span>
            )}
          </div>

          {/* Amenity icons row */}
          <div className="flex items-center gap-2 mt-1.5 text-[var(--muted)]">
            {listing.has_balcony && (
              <span className="text-xs px-1.5 py-0.5 bg-[var(--surface)] rounded" title="Balcon">
                Balcon
              </span>
            )}
            {listing.has_terrace && (
              <span className="text-xs px-1.5 py-0.5 bg-[var(--surface)] rounded" title="Terrasse">
                Terrasse
              </span>
            )}
            {listing.has_parking && (
              <span className="text-xs px-1.5 py-0.5 bg-[var(--surface)] rounded" title="Parking">
                Parking
              </span>
            )}
            {listing.has_elevator && (
              <span className="text-xs px-1.5 py-0.5 bg-[var(--surface)] rounded" title="Ascenseur">
                Ascenseur
              </span>
            )}
            {listing.furnished && (
              <span className="text-xs px-1.5 py-0.5 bg-[var(--surface)] rounded" title="Meublé">
                Meublé
              </span>
            )}
            {listing.has_garden && (
              <span className="text-xs px-1.5 py-0.5 bg-[var(--surface)] rounded" title="Jardin">
                Jardin
              </span>
            )}
          </div>

          {/* AI Summary */}
          {evaluation && (
            <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">
              {evaluation.match_summary}
            </p>
          )}

          {/* Notes preview */}
          {notes && (
            <div className="mt-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 line-clamp-1">
              {notes}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          {/* Favorite toggle */}
          <button
            onClick={() => onStatusChange(listing.id, isFavorite ? "new" : "favorite")}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite
                ? "text-rose-500 bg-rose-50 hover:bg-rose-100"
                : "text-[var(--muted-light)] hover:text-rose-400 hover:bg-rose-50"
            }`}
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <svg className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Compare toggle */}
          {onToggleCompare && (
            <button
              onClick={() => onToggleCompare(listing.id)}
              className={`p-1.5 rounded-lg transition-colors text-xs ${
                isSelected
                  ? "text-blue-600 bg-blue-50"
                  : "text-[var(--muted-light)] hover:text-blue-400 hover:bg-blue-50"
              }`}
              title="Comparer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          )}

          {/* Link to detail */}
          <Link
            href={`/appartements/listing/${listing.id}`}
            className="p-1.5 rounded-lg text-[var(--muted-light)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
            title="Voir détail"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>

          {/* Source link */}
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-[var(--muted-light)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            title="Voir sur Immoweb"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
