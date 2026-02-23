"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  RetreatVenueWithEval,
  VenueStatus,
  VENUE_STATUS_CONFIG,
  COUNTRY_LABELS,
  COUNTRY_FLAGS,
  SETTING_LABELS,
  STYLE_LABELS,
  ACTIVITY_SPACE_LABELS,
  SUITABLE_FOR_LABELS,
  LANGUAGE_FLAGS,
} from "@/lib/retreats/types";
import { prioritizePhotos } from "@/lib/image-utils";

interface RetreatVenueCardProps {
  item: RetreatVenueWithEval;
  onStatusChange: (id: string, status: VenueStatus) => void;
  onToggleCompare?: (id: string) => void;
  isSelected?: boolean;
}

export function RetreatVenueCard({
  item,
  onStatusChange,
  onToggleCompare,
  isSelected,
}: RetreatVenueCardProps) {
  const { venue, evaluation, tags } = item;
  const [imgError, setImgError] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const isFavorite = item.status === "favorite";
  const images = prioritizePhotos(venue.images);
  const maxVisible = Math.min(images.length, 6);

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

  const toggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onStatusChange(venue.id, isFavorite ? "new" : "favorite");
    },
    [venue.id, isFavorite, onStatusChange]
  );

  const scoreColor =
    evaluation && evaluation.overall_score >= 80
      ? "bg-emerald-500"
      : evaluation && evaluation.overall_score >= 60
        ? "bg-amber-500"
        : "bg-rose-400";

  const countryLabel = venue.country ? COUNTRY_LABELS[venue.country] || venue.country : null;
  const countryFlag = venue.country ? COUNTRY_FLAGS[venue.country] || "" : "";

  const displayTitle = evaluation?.ai_title || venue.name;
  const displayDescription = evaluation?.ai_description || venue.description;

  const priceDisplay = venue.price_per_person_per_night
    ? `${venue.price_per_person_per_night}${venue.price_per_person_per_night_max && venue.price_per_person_per_night_max !== venue.price_per_person_per_night ? `-${venue.price_per_person_per_night_max}` : ""} ${venue.currency || "EUR"}/pers/nuit`
    : venue.price_full_venue_per_day
      ? `${venue.price_full_venue_per_day} ${venue.currency || "EUR"}/jour (lieu entier)`
      : null;

  const capacityDisplay =
    venue.capacity_min && venue.capacity_max
      ? `${venue.capacity_min}-${venue.capacity_max} pers.`
      : venue.capacity_max
        ? `max ${venue.capacity_max} pers.`
        : null;

  return (
    <Link
      href={`/retraites/${venue.id}`}
      className={`block rounded-lg border bg-white overflow-hidden transition-shadow hover:shadow-md ${
        isSelected ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image section */}
        <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-gray-100">
          {images.length > 0 && !imgError ? (
            <img
              src={images[imgIndex]}
              alt={venue.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              Pas de photo
            </div>
          )}

          {/* Image navigation */}
          {maxVisible > 1 && (
            <>
              <button
                onClick={prevImg}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-gray-700 hover:bg-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={nextImg}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-gray-700 hover:bg-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {Array.from({ length: maxVisible }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${i === imgIndex ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Score badge */}
          {evaluation && (
            <div className={`absolute top-2 left-2 ${scoreColor} text-white text-xs font-bold px-2 py-1 rounded`}>
              {evaluation.overall_score}
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={toggleFavorite}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white"
          >
            <svg
              className={`w-5 h-5 ${isFavorite ? "text-rose-500 fill-rose-500" : "text-gray-500"}`}
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Content section */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-1">
              {displayTitle}
            </h3>
            {onToggleCompare && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleCompare(venue.id);
                }}
                className={`flex-shrink-0 w-5 h-5 rounded border ${
                  isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                } flex items-center justify-center`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                )}
              </button>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>
              {countryFlag} {venue.city}{venue.region ? `, ${venue.region}` : ""}{countryLabel ? ` - ${countryLabel}` : ""}
            </span>
          </div>

          {/* Key badges */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {capacityDisplay && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {capacityDisplay}
              </span>
            )}
            {priceDisplay && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                {priceDisplay}
              </span>
            )}
            {venue.num_practice_spaces && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                {venue.num_practice_spaces} espace{venue.num_practice_spaces > 1 ? "s" : ""} de pratique
              </span>
            )}
            {venue.meal_service && venue.meals_included_in_price && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                Repas inclus
              </span>
            )}
            {venue.rating_average && (
              <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                <svg className="w-3 h-3 fill-amber-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {venue.rating_average} ({venue.rating_count})
              </span>
            )}
            {venue.languages_spoken && venue.languages_spoken.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-600">
                {venue.languages_spoken.map(l => LANGUAGE_FLAGS[l] || l).join(" ")}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {displayDescription}
          </p>

          {/* Tags row */}
          <div className="flex flex-wrap gap-1">
            {venue.setting.slice(0, 2).map((s) => (
              <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {SETTING_LABELS[s] || s}
              </span>
            ))}
            {venue.style.slice(0, 2).map((s) => (
              <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {STYLE_LABELS[s] || s}
              </span>
            ))}
            {venue.activity_spaces.slice(0, 2).map((s) => (
              <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                {ACTIVITY_SPACE_LABELS[s] || s}
              </span>
            ))}
            {venue.suitable_for.slice(0, 3).map((s) => (
              <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-teal-50 text-teal-600">
                {SUITABLE_FOR_LABELS[s] || s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
