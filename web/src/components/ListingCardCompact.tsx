"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ListingWithEval, LISTING_TYPE_LABELS } from "@/lib/types";
import { TagsPills } from "./TagsDisplay";
import { PlaceholderImage } from "./PlaceholderImage";
import { prioritizePhotos } from "@/lib/image-utils";

interface ListingCardCompactProps {
  item: ListingWithEval;
}

export function ListingCardCompact({ item }: ListingCardCompactProps) {
  const { listing, evaluation, tags } = item;
  const [imgIndex, setImgIndex] = useState(0);

  const images = prioritizePhotos(listing.images);
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
    <div className="group/card bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden hover:shadow-md transition-shadow flex flex-col sm:flex-row">
      {/* Image carousel */}
      <div className="relative group aspect-[16/9] sm:aspect-auto sm:w-56 md:w-64 shrink-0 bg-[var(--surface)]">
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
      <Link href={`/listing/${listing.id}`} className="block p-4 flex-1 min-w-0">
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {listing.listing_type && (
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)]">
              {LISTING_TYPE_LABELS[listing.listing_type] || listing.listing_type}
            </span>
          )}
          {listing.country && listing.country !== "BE" && (
            <span className="text-sm" title={listing.country === "FR" ? "France" : listing.country === "ES" ? "Espagne" : listing.country}>
              {listing.country === "FR" ? "🇫🇷" : listing.country === "ES" ? "🇪🇸" : listing.country}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[var(--foreground)] group-hover/card:text-[var(--primary)] line-clamp-2 transition-colors">
          {evaluation?.ai_title || listing.title}
        </h3>

        {/* Location + price */}
        <div className="flex items-center gap-2 mt-1 text-sm text-[var(--muted)] flex-wrap">
          {listing.location && <span>{listing.location}</span>}
          {listing.price && (
            <span className="font-semibold text-[var(--foreground)]">
              {listing.price}
            </span>
          )}
        </div>

        {/* AI description */}
        {evaluation && (
          <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">
            {evaluation.ai_description || evaluation.quality_summary}
          </p>
        )}

        {/* Tags */}
        {tags && <TagsPills tags={tags} />}
      </Link>
    </div>
  );
}
