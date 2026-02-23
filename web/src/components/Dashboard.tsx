"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ListingWithEval,
  ListingStatus,
  RefinementWeights,
  RefinementFilters,
  RefinementEntry,
  DEFAULT_WEIGHTS,
  DEFAULT_FILTERS,
  UIFilterState,
  DEFAULT_UI_FILTERS,
  LISTING_TYPE_LABELS,
  calculateRefinedScore,
  applyRefinementFilters,
} from "@/lib/types";
import { ListingCard } from "./ListingCard";
import { RefineSearch } from "./RefineSearch";
import { FilterPanel } from "./FilterPanel";
import { ListingsMapWrapper } from "./ListingsMapWrapper";

type FilterType = "all" | "new" | "in_discussion" | "archived";
type SortType = "score" | "date" | "price";
type ViewMode = "list" | "map" | "split";

const REFINEMENT_STORAGE_KEY = "refinement_state";

export function Dashboard({
  initialItems,
}: {
  initialItems: ListingWithEval[];
}) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("score");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [uiFilters, setUiFilters] = useState<UIFilterState>({ ...DEFAULT_UI_FILTERS });
  const [showFilters, setShowFilters] = useState(false);

  // Refinement state
  const [weights, setWeights] = useState<RefinementWeights>({
    ...DEFAULT_WEIGHTS,
  });
  const [filters, setFilters] = useState<RefinementFilters>({
    ...DEFAULT_FILTERS,
  });
  const [history, setHistory] = useState<RefinementEntry[]>([]);

  // Sync items when initialItems prop changes (async data loading)
  useEffect(() => {
    if (initialItems.length > 0) {
      setItems(initialItems);
    }
  }, [initialItems]);

  // Load refinement state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REFINEMENT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.weights) setWeights(parsed.weights);
        if (parsed.filters) setFilters(parsed.filters);
        if (parsed.history) setHistory(parsed.history);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save refinement state to localStorage
  const saveRefinementState = useCallback(
    (w: RefinementWeights, f: RefinementFilters, h: RefinementEntry[]) => {
      localStorage.setItem(
        REFINEMENT_STORAGE_KEY,
        JSON.stringify({ weights: w, filters: f, history: h })
      );
    },
    []
  );

  const isRefined = history.length > 0;

  // Calculate adjusted scores
  const adjustedScores = useMemo(() => {
    if (!isRefined) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const item of items) {
      if (item.evaluation) {
        map.set(
          item.listing.id,
          calculateRefinedScore(item.evaluation.criteria_scores, weights)
        );
      }
    }
    return map;
  }, [items, weights, isRefined]);

  // Get unique sources
  const sources = useMemo(() => {
    const s = new Set(items.map((item) => item.listing.source));
    return Array.from(s);
  }, [items]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: items.filter((i) => i.status !== "archived").length,
      new: items.filter((i) => i.status === "new").length,
      in_discussion: items.filter((i) => i.status === "in_discussion").length,
      archived: items.filter((i) => i.status === "archived").length,
    };
  }, [items]);

  // Available provinces with counts
  const availableProvinces = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const p = item.listing.province;
      if (p) map.set(p, (map.get(p) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // Available listing types with counts
  const availableListingTypes = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const t = item.listing.listing_type;
      if (t) map.set(t, (map.get(t) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // Price range for input hints
  const priceRange = useMemo(() => {
    const prices = items
      .map((i) => i.listing.price_amount)
      .filter((p): p is number => p !== null);
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 2000,
    };
  }, [items]);

  // Active UI filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (uiFilters.searchText.trim()) count++;
    if (uiFilters.provinces.length > 0) count++;
    if (uiFilters.listingTypes.length > 0) count++;
    if (uiFilters.priceMin !== null || uiFilters.priceMax !== null) count++;
    if (uiFilters.scoreMin !== null) count++;
    return count;
  }, [uiFilters]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...items];

    // Status filter
    if (filter === "all") {
      result = result.filter((i) => i.status !== "archived");
    } else {
      result = result.filter((i) => i.status === filter);
    }

    // Source filter
    if (sourceFilter !== "all") {
      result = result.filter((i) => i.listing.source === sourceFilter);
    }

    // Refinement filters
    if (isRefined) {
      result = result.filter((item) =>
        applyRefinementFilters(
          item,
          filters,
          adjustedScores.get(item.listing.id)
        )
      );
    }

    // UI filters - text search
    if (uiFilters.searchText.trim()) {
      const query = uiFilters.searchText.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.listing.title.toLowerCase().includes(query) ||
          i.listing.description.toLowerCase().includes(query)
      );
    }

    // UI filters - provinces
    if (uiFilters.provinces.length > 0) {
      result = result.filter(
        (i) =>
          i.listing.province !== null &&
          uiFilters.provinces.includes(i.listing.province)
      );
    }

    // UI filters - listing types
    if (uiFilters.listingTypes.length > 0) {
      result = result.filter(
        (i) =>
          i.listing.listing_type !== null &&
          uiFilters.listingTypes.includes(i.listing.listing_type)
      );
    }

    // UI filters - price range
    if (uiFilters.priceMin !== null || uiFilters.priceMax !== null) {
      result = result.filter((i) => {
        if (i.listing.price_amount === null) return uiFilters.includeNullPrice;
        if (
          uiFilters.priceMin !== null &&
          i.listing.price_amount < uiFilters.priceMin
        )
          return false;
        if (
          uiFilters.priceMax !== null &&
          i.listing.price_amount > uiFilters.priceMax
        )
          return false;
        return true;
      });
    }

    // UI filters - score minimum
    if (uiFilters.scoreMin !== null) {
      result = result.filter((i) => {
        const score = isRefined
          ? (adjustedScores.get(i.listing.id) ??
              i.evaluation?.overall_score ??
              null)
          : (i.evaluation?.overall_score ?? null);
        if (score === null) return uiFilters.includeUnscored;
        return score >= uiFilters.scoreMin!;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sort === "score") {
        const sa = isRefined
          ? (adjustedScores.get(a.listing.id) ??
            a.evaluation?.overall_score ??
            -1)
          : (a.evaluation?.overall_score ?? -1);
        const sb = isRefined
          ? (adjustedScores.get(b.listing.id) ??
            b.evaluation?.overall_score ??
            -1)
          : (b.evaluation?.overall_score ?? -1);
        return sb - sa;
      }
      if (sort === "date") {
        const da = a.listing.date_scraped || "";
        const db = b.listing.date_scraped || "";
        return db.localeCompare(da);
      }
      if (sort === "price") {
        const pa = a.listing.price_amount ?? Infinity;
        const pb = b.listing.price_amount ?? Infinity;
        return pa - pb;
      }
      return 0;
    });

    return result;
  }, [items, filter, sort, sourceFilter, isRefined, adjustedScores, filters, uiFilters]);

  const handleStatusChange = (id: string, newStatus: ListingStatus) => {
    setItems((prev) =>
      prev.map((item) =>
        item.listing.id === id ? { ...item, status: newStatus } : item
      )
    );
    // Save to localStorage
    const savedStates = JSON.parse(
      localStorage.getItem("listing_states") || "{}"
    );
    savedStates[id] = newStatus;
    localStorage.setItem("listing_states", JSON.stringify(savedStates));
  };

  // Load states from localStorage on mount
  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("listing_states") || "{}"
    );
    if (Object.keys(saved).length > 0) {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          status: (saved[item.listing.id] as ListingStatus) || item.status,
        }))
      );
    }
  }, []);

  // Refinement handlers
  const handleRefine = (
    newWeights: RefinementWeights,
    newFilters: RefinementFilters,
    entry: RefinementEntry
  ) => {
    setWeights(newWeights);
    setFilters(newFilters);
    const newHistory = [...history, entry];
    setHistory(newHistory);
    saveRefinementState(newWeights, newFilters, newHistory);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastEntry = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    const restoredWeights = lastEntry.weightsBefore;
    const restoredFilters = lastEntry.filtersBefore;
    setWeights(restoredWeights);
    setFilters(restoredFilters);
    setHistory(newHistory);
    saveRefinementState(restoredWeights, restoredFilters, newHistory);
  };

  const handleReset = () => {
    setWeights({ ...DEFAULT_WEIGHTS });
    setFilters({ ...DEFAULT_FILTERS });
    setHistory([]);
    localStorage.removeItem(REFINEMENT_STORAGE_KEY);
  };

  return (
    <div>
      {/* Paufini la recherche */}
      <RefineSearch
        weights={weights}
        filters={filters}
        history={history}
        onRefine={handleRefine}
        onUndo={handleUndo}
        onReset={handleReset}
      />

      {/* Stats */}
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {items.length} annonces au total &middot;{" "}
        {items.filter((i) => i.evaluation).length}{" "}
        {"\u00e9valu\u00e9es par l'IA"}
        {isRefined && (
          <span className="ml-2 text-amber-600 font-medium">
            &middot; Classement paufin\u00e9 ({filtered.length} r\u00e9sultats)
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["all", `Actifs (${counts.all})`],
            ["new", `Nouveaux (${counts.new})`],
            ["in_discussion", `En discussion (${counts.in_discussion})`],
            ["archived", `Archiv\u00e9s (${counts.archived})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === key
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort, source filter, and view toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortType)}
          className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-gray-300"
        >
          <option value="score">
            {isRefined ? "Trier par score paufin\u00e9" : "Trier par score"}
          </option>
          <option value="date">Trier par date</option>
          <option value="price">Trier par prix</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-gray-300"
        >
          <option value="all">Toutes les sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg ml-auto">
          {(
            [
              ["list", "Liste"],
              ["map", "Carte"],
              ["split", "Les deux"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === "split" ? "hidden md:block" : ""
              } ${
                viewMode === mode
                  ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter toggle + result count */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm transition-colors ${
            showFilters || activeFilterCount > 0
              ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filtres avancés
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {activeFilterCount}
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtered.length} annonce{filtered.length !== 1 ? "s" : ""}{" "}
          {filtered.length !== 1 ? "correspondent" : "correspond"}
        </span>
      </div>

      {/* Collapsible filter panel */}
      {showFilters && (
        <FilterPanel
          filters={uiFilters}
          onChange={setUiFilters}
          onReset={() => setUiFilters({ ...DEFAULT_UI_FILTERS })}
          availableProvinces={availableProvinces}
          availableListingTypes={availableListingTypes}
          priceRange={priceRange}
        />
      )}

      {/* Content: list, map, or split */}
      <div
        className={
          viewMode === "split" ? "flex gap-4" : ""
        }
      >
        {/* Listing grid */}
        {(viewMode === "list" || viewMode === "split") && (
          <div
            className={
              viewMode === "split"
                ? "w-1/2 overflow-y-auto max-h-[calc(100vh-220px)] space-y-4 pr-2"
                : "space-y-4"
            }
          >
            {filtered.map((item) => (
              <div
                key={item.listing.id}
                onMouseEnter={() => setHoveredListingId(item.listing.id)}
                onMouseLeave={() => setHoveredListingId(null)}
              >
                <ListingCard
                  item={item}
                  onStatusChange={handleStatusChange}
                  adjustedScore={adjustedScores.get(item.listing.id)}
                  isHighlighted={hoveredListingId === item.listing.id}
                />
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Aucune annonce ne correspond aux filtres
                s&eacute;lectionn&eacute;s.
              </div>
            )}
          </div>
        )}

        {/* Map */}
        {(viewMode === "map" || viewMode === "split") && (
          <div
            className={
              viewMode === "split"
                ? "w-1/2 sticky top-4 h-[calc(100vh-220px)]"
                : "h-[calc(100vh-220px)]"
            }
          >
            <ListingsMapWrapper
              items={filtered}
              hoveredListingId={hoveredListingId}
              onMarkerHover={setHoveredListingId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
