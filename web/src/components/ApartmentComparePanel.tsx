"use client";

import { ApartmentWithEval, APARTMENT_CRITERIA_LABELS, ApartmentCriteriaScores, PEB_RATING_COLORS } from "@/lib/types";
import { ScoreBar } from "./ScoreBar";

interface ApartmentComparePanelProps {
  items: ApartmentWithEval[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

export function ApartmentComparePanel({ items, onClose, onRemove }: ApartmentComparePanelProps) {
  if (items.length === 0) return null;

  const criteriaKeys = Object.keys(APARTMENT_CRITERIA_LABELS) as (keyof ApartmentCriteriaScores)[];

  // Find best per-criteria
  const bestPerCriteria = new Map<string, string>();
  for (const key of criteriaKeys) {
    let bestId = "";
    let bestScore = -1;
    for (const item of items) {
      const score = item.evaluation?.criteria_scores[key] ?? -1;
      if (score > bestScore) {
        bestScore = score;
        bestId = item.listing.id;
      }
    }
    if (bestId) bestPerCriteria.set(key, bestId);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--card-bg)] border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            Comparaison ({items.length} appartements)
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--muted)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Compare table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-[var(--card-bg)] px-4 py-3 text-left text-xs font-medium text-[var(--muted)] w-48">
                  Critère
                </th>
                {items.map((item) => (
                  <th key={item.listing.id} className="px-4 py-3 text-center min-w-[200px]">
                    <div className="space-y-1">
                      {item.listing.images[0] && (
                        <img
                          src={item.listing.images[0]}
                          alt=""
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="font-semibold text-[var(--foreground)] text-xs line-clamp-2">
                        {item.listing.title}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {item.listing.commune}
                      </div>
                      {item.listing.price_monthly && (
                        <div className="text-xs font-bold text-blue-700">
                          {item.listing.price_monthly.toLocaleString("fr-BE")} €/mois
                        </div>
                      )}
                      {item.evaluation && (
                        <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          item.evaluation.overall_score >= 70 ? "bg-emerald-100 text-emerald-800" :
                          item.evaluation.overall_score >= 40 ? "bg-amber-100 text-amber-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {item.evaluation.overall_score}/100
                        </div>
                      )}
                      <button
                        onClick={() => onRemove(item.listing.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Retirer
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Quick info rows */}
              <tr className="border-t border-[var(--border-color)]">
                <td className="sticky left-0 bg-[var(--card-bg)] px-4 py-2 text-xs font-medium text-[var(--muted)]">Chambres</td>
                {items.map((item) => (
                  <td key={item.listing.id} className="px-4 py-2 text-center font-medium">
                    {item.listing.bedrooms ?? "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-[var(--border-color)]">
                <td className="sticky left-0 bg-[var(--card-bg)] px-4 py-2 text-xs font-medium text-[var(--muted)]">Surface</td>
                {items.map((item) => (
                  <td key={item.listing.id} className="px-4 py-2 text-center">
                    {item.listing.surface_m2 ? `${item.listing.surface_m2} m²` : "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-[var(--border-color)]">
                <td className="sticky left-0 bg-[var(--card-bg)] px-4 py-2 text-xs font-medium text-[var(--muted)]">PEB</td>
                {items.map((item) => (
                  <td key={item.listing.id} className="px-4 py-2 text-center">
                    {item.listing.peb_rating ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${PEB_RATING_COLORS[item.listing.peb_rating] || ""}`}>
                        {item.listing.peb_rating}
                      </span>
                    ) : "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-[var(--border-color)]">
                <td className="sticky left-0 bg-[var(--card-bg)] px-4 py-2 text-xs font-medium text-[var(--muted)]">Équipements</td>
                {items.map((item) => (
                  <td key={item.listing.id} className="px-4 py-2 text-center text-xs">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {item.listing.has_balcony && <span className="px-1.5 py-0.5 bg-[var(--surface)] rounded">Balcon</span>}
                      {item.listing.has_terrace && <span className="px-1.5 py-0.5 bg-[var(--surface)] rounded">Terrasse</span>}
                      {item.listing.has_parking && <span className="px-1.5 py-0.5 bg-[var(--surface)] rounded">Parking</span>}
                      {item.listing.has_elevator && <span className="px-1.5 py-0.5 bg-[var(--surface)] rounded">Ascenseur</span>}
                      {item.listing.has_garden && <span className="px-1.5 py-0.5 bg-[var(--surface)] rounded">Jardin</span>}
                    </div>
                  </td>
                ))}
              </tr>

              {/* AI Criteria scores */}
              <tr>
                <td colSpan={items.length + 1} className="px-4 py-2 text-xs font-bold text-[var(--foreground)] bg-[var(--surface)]">
                  Évaluation AI par critère
                </td>
              </tr>
              {criteriaKeys.map((key) => (
                <tr key={key} className="border-t border-[var(--border-color)]">
                  <td className="sticky left-0 bg-[var(--card-bg)] px-4 py-2 text-xs text-[var(--muted)]">
                    {APARTMENT_CRITERIA_LABELS[key]}
                  </td>
                  {items.map((item) => {
                    const score = item.evaluation?.criteria_scores[key];
                    const isBest = bestPerCriteria.get(key) === item.listing.id;
                    return (
                      <td
                        key={item.listing.id}
                        className={`px-4 py-2 ${isBest ? "bg-emerald-50" : ""}`}
                      >
                        {score !== undefined ? (
                          <ScoreBar score={score} max={10} />
                        ) : (
                          <span className="text-[var(--muted-light)] text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Highlights & Concerns */}
              <tr className="border-t border-[var(--border-color)]">
                <td className="sticky left-0 bg-[var(--card-bg)] px-4 py-2 text-xs font-medium text-[var(--muted)]">Points forts</td>
                {items.map((item) => (
                  <td key={item.listing.id} className="px-4 py-2">
                    <div className="space-y-1">
                      {item.evaluation?.highlights.map((h, i) => (
                        <span key={i} className="block text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {h}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="border-t border-[var(--border-color)]">
                <td className="sticky left-0 bg-[var(--card-bg)] px-4 py-2 text-xs font-medium text-[var(--muted)]">Points faibles</td>
                {items.map((item) => (
                  <td key={item.listing.id} className="px-4 py-2">
                    <div className="space-y-1">
                      {item.evaluation?.concerns.map((c, i) => (
                        <span key={i} className="block text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
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
  );
}
