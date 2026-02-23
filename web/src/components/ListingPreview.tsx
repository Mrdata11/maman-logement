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
  const { listing, evaluation, status } = item;

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
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-slate-800 shadow-2xl z-50 overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3 z-10">
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
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
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Précédent"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-500 min-w-[60px] text-center">
              {currentIndex + 1} / {totalCount}
            </span>
            <button
              onClick={() => onNavigate("next")}
              disabled={currentIndex >= totalCount - 1}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
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
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                  {LISTING_TYPE_LABELS[listing.listing_type] || listing.listing_type}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {listing.title}
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              {listing.location && <span>{listing.location}</span>}
              {listing.province && listing.province !== listing.location && (
                <span>{listing.province}</span>
              )}
              {listing.price && (
                <span className="font-semibold text-gray-700 dark:text-gray-300">
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
              className="text-sm px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700"
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
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Évaluation IA
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {evaluation.match_summary}
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
                        className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded"
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
                      className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact */}
          {listing.contact && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                Contact :{" "}
              </span>
              <span className="text-sm text-yellow-900 dark:text-yellow-300">
                {listing.contact}
              </span>
            </div>
          )}

          {/* Description */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Description
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {listing.description}
            </div>
          </div>

          {/* Meta */}
          <div className="text-xs text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p>Source : {listing.source}</p>
            {listing.date_published && <p>Publié : {listing.date_published}</p>}
            <p>Scrapé : {listing.date_scraped}</p>
          </div>
        </div>
      </div>
    </>
  );
}
