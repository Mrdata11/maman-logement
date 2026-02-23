"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ListingWithEval,
  ListingStatus,
  STATUS_CONFIG,
  CRITERIA_LABELS,
  CriteriaScores,
  LISTING_TYPE_LABELS,
} from "@/lib/types";
import { ScoreBar, ScoreBadge } from "./ScoreBar";
import { TagsPills } from "./TagsDisplay";

interface ListingPreviewProps {
  item: ListingWithEval;
  onClose: () => void;
  onStatusChange: (id: string, status: ListingStatus) => void;
  onNavigate: (direction: "prev" | "next") => void;
  currentIndex: number;
  totalCount: number;
  adjustedScore?: number;
}

export function ListingPreview({
  item,
  onClose,
  onStatusChange,
  onNavigate,
  currentIndex,
  totalCount,
  adjustedScore,
}: ListingPreviewProps) {
  const { listing, evaluation, tags, status } = item;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        onNavigate("prev");
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        onNavigate("next");
      }
    },
    [onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const score = adjustedScore ?? evaluation?.overall_score;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-[var(--card-bg)] shadow-2xl z-50 overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--card-bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3 z-10">
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--surface)] text-[var(--muted)]"
            title="Fermer (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate("prev")}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded-md hover:bg-[var(--surface)] text-[var(--muted)] disabled:opacity-30 disabled:cursor-not-allowed"
              title="Précédent"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-[var(--muted-light)] min-w-[60px] text-center">
              {currentIndex + 1} / {totalCount}
            </span>
            <button
              onClick={() => onNavigate("next")}
              disabled={currentIndex >= totalCount - 1}
              className="p-1.5 rounded-md hover:bg-[var(--surface)] text-[var(--muted)] disabled:opacity-30 disabled:cursor-not-allowed"
              title="Suivant"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex-1" />

          {/* Score */}
          {score !== undefined && <ScoreBadge score={score} />}

          {/* Status badge */}
          <span className={`text-xs px-2 py-0.5 rounded ${STATUS_CONFIG[status].color}`}>
            {STATUS_CONFIG[status].label}
          </span>

          {/* Open full page */}
          <Link
            href={`/listing/${listing.id}`}
            className="text-sm px-3 py-1.5 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)]"
          >
            Page complète
          </Link>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Images */}
          {listing.images.length > 0 && (
            <div className="mb-4 -mx-4 -mt-4">
              <div className="flex overflow-x-auto gap-1 scrollbar-hide">
                {listing.images.slice(0, 6).map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Image ${i + 1}`}
                      className="h-48 w-auto object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Title & meta */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {listing.listing_type && (
                <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)]">
                  {LISTING_TYPE_LABELS[listing.listing_type] || listing.listing_type}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
              {evaluation?.ai_title || listing.title}
            </h2>
            <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
              {listing.location && <span>{listing.location}</span>}
              {listing.province && listing.province !== listing.location && (
                <span>{listing.province}</span>
              )}
              {listing.price && (
                <span className="font-semibold text-[var(--foreground)]">
                  {listing.price}
                </span>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <a
              href={listing.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 border border-[var(--border-color)] text-[var(--foreground)] rounded-md hover:bg-[var(--surface)]"
            >
              Source originale
            </a>
            {(Object.keys(STATUS_CONFIG) as ListingStatus[])
              .filter((s) => s !== status && s !== "new")
              .slice(0, 4)
              .map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(listing.id, s)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${STATUS_CONFIG[s].color} border-transparent hover:opacity-80`}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
          </div>

          {/* AI Evaluation */}
          {evaluation && (
            <div className="mb-4 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                Évaluation IA
              </h3>
              <p className="text-sm text-[var(--foreground)] mb-3">
                {evaluation.ai_description || evaluation.match_summary}
              </p>

              <div className="grid gap-1.5 mb-3">
                {(
                  Object.entries(evaluation.criteria_scores) as [
                    keyof CriteriaScores,
                    number,
                  ][]
                ).map(([key, s]) => (
                  <ScoreBar key={key} score={s} max={10} label={CRITERIA_LABELS[key]} />
                ))}
              </div>

              {evaluation.highlights.length > 0 && (
                <div className="mb-2">
                  <div className="flex flex-wrap gap-1">
                    {evaluation.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {evaluation.concerns.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {evaluation.concerns.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {tags && (
            <div className="mb-4">
              <TagsPills tags={tags} />
            </div>
          )}

          {/* Contact */}
          {listing.contact && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-sm font-medium text-yellow-800">
                Contact :{" "}
              </span>
              <span className="text-sm text-yellow-900">
                {listing.contact}
              </span>
            </div>
          )}

          {/* Description */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              Description
            </h3>
            <div className="text-sm text-[var(--foreground)] leading-relaxed max-h-80 overflow-y-auto space-y-1.5">
              {listing.description.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed || trimmed === ',') return <div key={i} className="h-0.5" />;
                return (
                  <p key={i}>
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Meta */}
          <div className="text-xs text-[var(--muted-light)] pt-3 border-t border-[var(--border-light)]">
            <p>Source : {listing.source}</p>
            {listing.date_published && <p>Publié : {listing.date_published}</p>}
            <p>Scrapé : {listing.date_scraped}</p>
          </div>
        </div>
      </div>
    </>
  );
}
