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
  adjustedScores: Map<string, number>;
  onClose: () => void;
  onRemove: (id: string) => void;
}

export function ComparePanel({
  items,
  adjustedScores,
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Comparaison ({items.length} annonces)
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
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
                  <th className="text-left p-2 w-48 text-gray-500 dark:text-gray-400 font-medium sticky left-0 bg-white dark:bg-slate-900">
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
                            className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 line-clamp-2"
                          >
                            {item.listing.title}
                          </Link>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {item.listing.location && (
                              <span>{item.listing.location}</span>
                            )}
                            {item.listing.price && (
                              <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                                {item.listing.price}
                              </span>
                            )}
                          </div>
                          {/* Overall score */}
                          {item.evaluation && (
                            <div className="mt-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                  (adjustedScores.get(item.listing.id) ?? item.evaluation.overall_score) >= 70
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                    : (adjustedScores.get(item.listing.id) ?? item.evaluation.overall_score) >= 40
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                                }`}
                              >
                                {adjustedScores.get(item.listing.id) ??
                                  item.evaluation.overall_score}
                                /100
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onRemove(item.listing.id)}
                          className="shrink-0 p-1 text-gray-300 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
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
                <tr className="border-t border-gray-100 dark:border-slate-800">
                  <td className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 sticky left-0 bg-white dark:bg-slate-900">
                    Resume IA
                  </td>
                  {items.map((item) => (
                    <td
                      key={item.listing.id}
                      className="p-2 text-xs text-gray-600 dark:text-gray-400"
                    >
                      {item.evaluation?.match_summary ?? "Pas d'evaluation"}
                    </td>
                  ))}
                </tr>

                {/* Criteria rows */}
                {criteriaKeys.map((key) => (
                  <tr
                    key={key}
                    className="border-t border-gray-100 dark:border-slate-800"
                  >
                    <td className="p-2 text-xs font-medium text-gray-600 dark:text-gray-400 sticky left-0 bg-white dark:bg-slate-900">
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
                          className={`p-2 ${isBest ? "bg-green-50 dark:bg-green-900/10" : ""}`}
                        >
                          {item.evaluation ? (
                            <ScoreBar score={score} max={10} />
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Highlights row */}
                <tr className="border-t border-gray-200 dark:border-slate-700">
                  <td className="p-2 text-xs font-medium text-green-700 dark:text-green-400 sticky left-0 bg-white dark:bg-slate-900">
                    Points forts
                  </td>
                  {items.map((item) => (
                    <td key={item.listing.id} className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {item.evaluation?.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Concerns row */}
                <tr className="border-t border-gray-100 dark:border-slate-800">
                  <td className="p-2 text-xs font-medium text-red-700 dark:text-red-400 sticky left-0 bg-white dark:bg-slate-900">
                    Points d&apos;attention
                  </td>
                  {items.map((item) => (
                    <td key={item.listing.id} className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {item.evaluation?.concerns.map((c, i) => (
                          <span
                            key={i}
                            className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded"
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
