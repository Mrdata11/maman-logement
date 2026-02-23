"use client";

import {
  ListingWithEval,
  CRITERIA_LABELS,
  CriteriaScores,
} from "@/lib/types";
import { ScoreBar } from "./ScoreBar";
import Link from "next/link";

interface ComparePanelProps {
  items: ListingWithEval[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

export function ComparePanel({
  items,
  onClose,
  onRemove,
}: ComparePanelProps) {
  if (items.length === 0) return null;

  const criteriaKeys = Object.keys(CRITERIA_LABELS) as (keyof CriteriaScores)[];

  // Find best score per criterion
  const bestPerCriteria: Record<string, string> = {};
  for (const key of criteriaKeys) {
    let bestId = "";
    let bestScore = -1;
    for (const item of items) {
      const score = item.evaluation?.criteria_scores[key] ?? 0;
      if (score > bestScore) {
        bestScore = score;
        bestId = item.listing.id;
      }
    }
    bestPerCriteria[key] = bestId;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] w-full max-w-6xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            Comparaison ({items.length} annonces)
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--muted-light)] hover:text-[var(--foreground)] rounded-full hover:bg-[var(--surface)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-auto flex-1 p-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              {/* Listing headers */}
              <thead>
                <tr>
                  <th className="text-left p-2 w-48 text-[var(--muted)] font-medium sticky left-0 bg-[var(--card-bg)]">
                    Critere
                  </th>
                  {items.map((item) => (
                    <th
                      key={item.listing.id}
                      className="p-2 min-w-[200px] text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {/* Thumbnail */}
                          {item.listing.images.length > 0 && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.listing.images[0]}
                              alt=""
                              className="w-full h-20 object-cover rounded-md mb-2"
                            />
                          )}
                          <Link
                            href={`/listing/${item.listing.id}`}
                            className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)] line-clamp-2"
                          >
                            {item.listing.title}
                          </Link>
                          <div className="text-xs text-[var(--muted)] mt-1">
                            {item.listing.location && (
                              <span>{item.listing.location}</span>
                            )}
                            {item.listing.price && (
                              <span className="ml-2 font-medium text-[var(--foreground)]">
                                {item.listing.price}
                              </span>
                            )}
                          </div>
                          {/* Quality score */}
                          {item.evaluation && (
                            <div className="mt-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                  item.evaluation.quality_score >= 70
                                    ? "bg-green-100 text-green-800"
                                    : item.evaluation.quality_score >= 40
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.evaluation.quality_score}
                                /100
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onRemove(item.listing.id)}
                          className="shrink-0 p-1 text-[var(--muted-light)] hover:text-red-500"
                          title="Retirer de la comparaison"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Summary row */}
                <tr className="border-t border-[var(--border-color)]/50">
                  <td className="p-2 text-xs font-medium text-[var(--muted)] sticky left-0 bg-[var(--card-bg)]">
                    Resume IA
                  </td>
                  {items.map((item) => (
                    <td
                      key={item.listing.id}
                      className="p-2 text-xs text-[var(--muted)]"
                    >
                      {item.evaluation?.match_summary ?? "Pas d'evaluation"}
                    </td>
                  ))}
                </tr>

                {/* Criteria rows */}
                {criteriaKeys.map((key) => (
                  <tr
                    key={key}
                    className="border-t border-[var(--border-color)]/50"
                  >
                    <td className="p-2 text-xs font-medium text-[var(--muted)] sticky left-0 bg-[var(--card-bg)]">
                      {CRITERIA_LABELS[key]}
                    </td>
                    {items.map((item) => {
                      const score =
                        item.evaluation?.criteria_scores[key] ?? 0;
                      const isBest =
                        bestPerCriteria[key] === item.listing.id &&
                        score > 0;
                      return (
                        <td
                          key={item.listing.id}
                          className={`p-2 ${isBest ? "bg-green-50" : ""}`}
                        >
                          {item.evaluation ? (
                            <ScoreBar score={score} max={10} />
                          ) : (
                            <span className="text-xs text-[var(--muted-light)]">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Highlights row */}
                <tr className="border-t border-[var(--border-color)]">
                  <td className="p-2 text-xs font-medium text-green-700 sticky left-0 bg-[var(--card-bg)]">
                    Points forts
                  </td>
                  {items.map((item) => (
                    <td key={item.listing.id} className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {item.evaluation?.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Concerns row */}
                <tr className="border-t border-[var(--border-color)]/50">
                  <td className="p-2 text-xs font-medium text-red-700 sticky left-0 bg-[var(--card-bg)]">
                    Points d&apos;attention
                  </td>
                  {items.map((item) => (
                    <td key={item.listing.id} className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {item.evaluation?.concerns.map((c, i) => (
                          <span
                            key={i}
                            className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
