"use client";

import Link from "next/link";
import { ListingWithEval, LISTING_TYPE_LABELS } from "@/lib/types";
import { ScoreBadge } from "./ScoreBar";
import { TagsPills } from "./TagsDisplay";

interface ListingCardCompactProps {
  item: ListingWithEval;
}

export function ListingCardCompact({ item }: ListingCardCompactProps) {
  const { listing, evaluation, tags } = item;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative h-[180px] bg-[var(--surface)]">
        {listing.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.images[0]}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[var(--muted-light)]"
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
        {/* Score badge overlay */}
        {evaluation && (
          <div className="absolute top-2 right-2">
            <ScoreBadge score={evaluation.quality_score} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {listing.listing_type && (
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)]">
              {LISTING_TYPE_LABELS[listing.listing_type] || listing.listing_type}
            </span>
          )}
          {listing.country && listing.country !== "BE" && (
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)]">
              {listing.country === "FR"
                ? "\uD83C\uDDEB\uD83C\uDDF7 France"
                : listing.country === "ES"
                  ? "\uD83C\uDDEA\uD83C\uDDF8 Espagne"
                  : listing.country}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] line-clamp-2 transition-colors">
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
      </div>
    </Link>
  );
}
