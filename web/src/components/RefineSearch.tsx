"use client";

import { useState } from "react";
import {
  RefinementFilters,
  RefinementEntry,
} from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  "offre-location": "Location",
  "offre-vente": "Vente",
  "demande-location": "Recherche location",
  "demande-vente": "Recherche achat",
  "creation-groupe": "Création de groupe",
  "habitat-leger": "Habitat léger",
  divers: "Divers",
};

interface RefineSearchProps {
  filters: RefinementFilters;
  history: RefinementEntry[];
  onRefine: (
    filters: RefinementFilters,
    entry: RefinementEntry
  ) => void;
  onUndo: () => void;
  onReset: () => void;
}

export function RefineSearch({
  filters,
  history,
  onRefine,
  onUndo,
  onReset,
}: RefineSearchProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          currentFilters: filters,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors du traitement");
      }

      const data = await response.json();

      const entry: RefinementEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        userMessage: input,
        explanation: data.explanation,
        weightsBefore: {},
        weightsAfter: {},
        filtersBefore: { ...filters },
        filtersAfter: data.filters,
      };

      onRefine(data.filters, entry);
      setInput("");
    } catch {
      setError(
        "Erreur lors du traitement. Vérifie ta connexion et réessaie."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isRefined = history.length > 0;

  const getFilterChanges = (
    before: RefinementFilters,
    after: RefinementFilters
  ): string[] => {
    const changes: string[] = [];

    if (JSON.stringify(after.listing_types_include) !== JSON.stringify(before.listing_types_include)) {
      if (after.listing_types_include.length > 0) {
        changes.push(`Types inclus: ${after.listing_types_include.map((t) => TYPE_LABELS[t] || t).join(", ")}`);
      } else if (before.listing_types_include.length > 0) {
        changes.push("Filtre types inclus retiré");
      }
    }

    if (JSON.stringify(after.listing_types_exclude) !== JSON.stringify(before.listing_types_exclude)) {
      if (after.listing_types_exclude.length > 0) {
        changes.push(`Types exclus: ${after.listing_types_exclude.map((t) => TYPE_LABELS[t] || t).join(", ")}`);
      } else if (before.listing_types_exclude.length > 0) {
        changes.push("Filtre types exclus retiré");
      }
    }

    if (JSON.stringify(after.locations_include) !== JSON.stringify(before.locations_include)) {
      if (after.locations_include.length > 0) {
        changes.push(`Lieux: ${after.locations_include.join(", ")}`);
      } else if (before.locations_include.length > 0) {
        changes.push("Filtre lieux retiré");
      }
    }

    if (JSON.stringify(after.locations_exclude) !== JSON.stringify(before.locations_exclude)) {
      if (after.locations_exclude.length > 0) {
        changes.push(`Lieux exclus: ${after.locations_exclude.join(", ")}`);
      } else if (before.locations_exclude.length > 0) {
        changes.push("Filtre lieux exclus retiré");
      }
    }

    if (after.max_price !== before.max_price) {
      changes.push(after.max_price !== null ? `Prix max: ${after.max_price}€` : "Filtre prix max retiré");
    }

    if (after.min_score !== before.min_score) {
      changes.push(after.min_score !== null ? `Score min: ${after.min_score}/100` : "Filtre score min retiré");
    }

    if (JSON.stringify(after.keywords_include) !== JSON.stringify(before.keywords_include)) {
      if (after.keywords_include.length > 0) {
        changes.push(`Mots-clés requis: ${after.keywords_include.join(", ")}`);
      } else if (before.keywords_include.length > 0) {
        changes.push("Filtre mots-clés requis retiré");
      }
    }

    if (JSON.stringify(after.keywords_exclude) !== JSON.stringify(before.keywords_exclude)) {
      if (after.keywords_exclude.length > 0) {
        changes.push(`Mots-clés exclus: ${after.keywords_exclude.join(", ")}`);
      } else if (before.keywords_exclude.length > 0) {
        changes.push("Filtre mots-clés exclus retiré");
      }
    }

    return changes;
  };

  const activeFilterCount = [
    filters.listing_types_include.length > 0,
    filters.listing_types_exclude.length > 0,
    filters.locations_include.length > 0,
    filters.locations_exclude.length > 0,
    filters.max_price !== null,
    filters.min_score !== null,
    filters.keywords_include.length > 0,
    filters.keywords_exclude.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
        <label className="block text-lg font-semibold text-amber-900 mb-1">
          Peaufiner la recherche
        </label>
        <p className="text-sm text-amber-700 mb-3">
          Dis-moi ce qui est important pour toi. Je filtre les annonces qui ne
          correspondent pas.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Ex: Que des locations en Wallonie, max 800€, avec un jardin..."
            className="flex-1 px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {isLoading ? "Analyse..." : "Peaufiner"}
          </button>
        </div>

        {isLoading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-700">
            <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full" />
            <span>Je filtre les annonces selon tes critères...</span>
          </div>
        )}

        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

        {isRefined && !isLoading && (
          <div className="mt-3 space-y-2">
            {activeFilterCount > 0 && (
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">
                {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""} actif{activeFilterCount > 1 ? "s" : ""}
              </span>
            )}

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.listing_types_include.length > 0 && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                    Types: {filters.listing_types_include.map((t) => TYPE_LABELS[t] || t).join(", ")}
                  </span>
                )}
                {filters.locations_include.length > 0 && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                    Lieux: {filters.locations_include.join(", ")}
                  </span>
                )}
                {filters.max_price !== null && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                    Max {filters.max_price}&euro;
                  </span>
                )}
                {filters.min_score !== null && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                    Score min {filters.min_score}/100
                  </span>
                )}
                {filters.keywords_include.length > 0 && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                    Avec: {filters.keywords_include.join(", ")}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-amber-700 underline hover:text-amber-900">
                {showHistory ? "Masquer l'historique" : "Voir l'historique"}
              </button>
              <button onClick={onUndo} className="text-xs text-amber-700 underline hover:text-amber-900">
                Annuler le dernier
              </button>
              <button onClick={onReset} className="text-xs text-red-600 underline hover:text-red-800">
                Tout réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>

      {showHistory && history.length > 0 && (
        <div className="mt-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Historique des ajustements</h3>
          <div className="space-y-3">
            {[...history].reverse().map((entry) => {
              const filterChanges = getFilterChanges(entry.filtersBefore, entry.filtersAfter);
              return (
                <div key={entry.id} className="border-l-2 border-amber-300 pl-3 py-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">&laquo; {entry.userMessage} &raquo;</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{entry.explanation}</p>
                  {filterChanges.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {filterChanges.map((change, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">{change}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-[var(--muted-light)] mt-1">{new Date(entry.timestamp).toLocaleString("fr-BE")}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
