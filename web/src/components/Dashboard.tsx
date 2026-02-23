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
  calculateRefinedScore,
  applyRefinementFilters,
} from "@/lib/types";
import {
  haversineDistance,
  getListingCoordinates,
  DEFAULT_REFERENCE_POINT,
} from "@/lib/coordinates";
import { ListingCard } from "./ListingCard";
import { RefineSearch } from "./RefineSearch";
import { FilterPanel } from "./FilterPanel";
import { ListingsMapWrapper } from "./ListingsMapWrapper";
import { ListingPreview } from "./ListingPreview";
import { ComparePanel } from "./ComparePanel";
import { SearchProfiles } from "./SearchProfiles";
import { ScoreBadge } from "./ScoreBar";

type FilterType = "all" | "new" | "favorite" | "active" | "in_discussion" | "archived";
type SortType = "score" | "date" | "price" | "distance";
type ViewMode = "list" | "map" | "split";

const REFINEMENT_STORAGE_KEY = "refinement_state";
const LAST_VISIT_KEY = "last_visit_date";
const NOTES_STORAGE_KEY = "listing_notes";

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
  const [showRefine, setShowRefine] = useState(false);
  const [previewItem, setPreviewItem] = useState<ListingWithEval | null>(null);
  const [searchText, setSearchText] = useState("");
  const [qualityMode, setQualityMode] = useState(true);

  // Refinement state
  const [weights, setWeights] = useState<RefinementWeights>({ ...DEFAULT_WEIGHTS });
  const [filters, setFilters] = useState<RefinementFilters>({ ...DEFAULT_FILTERS });
  const [history, setHistory] = useState<RefinementEntry[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  // Compare state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // New listings detection
  const [lastVisitDate, setLastVisitDate] = useState<string | null>(null);
  const [newCount, setNewCount] = useState(0);

  // Sync items when initialItems prop changes
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
        if (parsed.history) {
          setHistory(parsed.history);
          if (parsed.history.length > 0) setShowRefine(true);
        }
        if (parsed.activeProfileId) setActiveProfileId(parsed.activeProfileId);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Load last visit date
  useEffect(() => {
    const saved = localStorage.getItem(LAST_VISIT_KEY);
    if (saved) {
      setLastVisitDate(saved);
    }
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
  }, []);

  // Count new listings since last visit
  useEffect(() => {
    if (lastVisitDate && items.length > 0) {
      const count = items.filter(
        (item) => item.listing.date_scraped > lastVisitDate
      ).length;
      setNewCount(count);
    }
  }, [lastVisitDate, items]);

  // Save refinement state to localStorage
  const saveRefinementState = useCallback(
    (w: RefinementWeights, f: RefinementFilters, h: RefinementEntry[], profileId: string | null) => {
      localStorage.setItem(
        REFINEMENT_STORAGE_KEY,
        JSON.stringify({ weights: w, filters: f, history: h, activeProfileId: profileId })
      );
    },
    []
  );

  const isRefined = history.length > 0 || activeProfileId !== null;

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

  // Calculate distances from Bruxelles
  const distances = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const item of items) {
      const coords = getListingCoordinates(
        item.listing.location,
        item.listing.province
      );
      if (coords) {
        map.set(item.listing.id, haversineDistance(DEFAULT_REFERENCE_POINT, coords));
      } else {
        map.set(item.listing.id, null);
      }
    }
    return map;
  }, [items]);

  // Get unique sources
  const sources = useMemo(() => {
    const s = new Set(items.map((item) => item.listing.source));
    return Array.from(s);
  }, [items]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: items.filter((i) => i.status !== "archived" && i.status !== "rejected").length,
      new: items.filter((i) => i.status === "new").length,
      favorite: items.filter((i) => i.status === "favorite").length,
      active: items.filter((i) => ["contacted", "visit_planned", "visited"].includes(i.status)).length,
      in_discussion: items.filter((i) => i.status === "in_discussion").length,
      archived: items.filter((i) => i.status === "archived" || i.status === "rejected").length,
    };
  }, [items]);

  // Favorites
  const favorites = useMemo(
    () => items.filter((i) => i.status === "favorite"),
    [items]
  );

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
    switch (filter) {
      case "all":
        result = result.filter((i) => i.status !== "archived" && i.status !== "rejected");
        break;
      case "active":
        result = result.filter((i) => ["contacted", "visit_planned", "visited"].includes(i.status));
        break;
      default:
        result = result.filter((i) => i.status === filter);
        break;
    }

    // Source filter
    if (sourceFilter !== "all") {
      result = result.filter((i) => i.listing.source === sourceFilter);
    }

    // Quality mode: hide demand-type listings and low-scoring evaluated listings
    if (qualityMode) {
      result = result.filter((i) => {
        const lt = i.listing.listing_type;
        // Hide demand listings (people searching, not offering)
        if (lt === "demande-location" || lt === "demande-vente") return false;
        // Hide low-scoring evaluated listings (score < 15)
        if (i.evaluation && i.evaluation.overall_score < 15) return false;
        return true;
      });
    }

    // Refinement filters
    if (isRefined) {
      result = result.filter((item) =>
        applyRefinementFilters(item, filters, adjustedScores.get(item.listing.id))
      );
    }

    // Inline search
    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.listing.title.toLowerCase().includes(query) ||
          i.listing.description.toLowerCase().includes(query) ||
          (i.listing.location && i.listing.location.toLowerCase().includes(query)) ||
          (i.listing.province && i.listing.province.toLowerCase().includes(query))
      );
    }

    // UI filters - text search (from filter panel)
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
        (i) => i.listing.province !== null && uiFilters.provinces.includes(i.listing.province)
      );
    }

    // UI filters - listing types
    if (uiFilters.listingTypes.length > 0) {
      result = result.filter(
        (i) => i.listing.listing_type !== null && uiFilters.listingTypes.includes(i.listing.listing_type)
      );
    }

    // UI filters - price range
    if (uiFilters.priceMin !== null || uiFilters.priceMax !== null) {
      result = result.filter((i) => {
        if (i.listing.price_amount === null) return uiFilters.includeNullPrice;
        if (uiFilters.priceMin !== null && i.listing.price_amount < uiFilters.priceMin) return false;
        if (uiFilters.priceMax !== null && i.listing.price_amount > uiFilters.priceMax) return false;
        return true;
      });
    }

    // UI filters - score minimum
    if (uiFilters.scoreMin !== null) {
      result = result.filter((i) => {
        const score = isRefined
          ? (adjustedScores.get(i.listing.id) ?? i.evaluation?.overall_score ?? null)
          : (i.evaluation?.overall_score ?? null);
        if (score === null) return uiFilters.includeUnscored;
        return score >= uiFilters.scoreMin!;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sort === "score") {
        const sa = isRefined
          ? (adjustedScores.get(a.listing.id) ?? a.evaluation?.overall_score ?? -1)
          : (a.evaluation?.overall_score ?? -1);
        const sb = isRefined
          ? (adjustedScores.get(b.listing.id) ?? b.evaluation?.overall_score ?? -1)
          : (b.evaluation?.overall_score ?? -1);
        return sb - sa;
      }
      if (sort === "date") {
        return (b.listing.date_scraped || "").localeCompare(a.listing.date_scraped || "");
      }
      if (sort === "price") {
        return (a.listing.price_amount ?? Infinity) - (b.listing.price_amount ?? Infinity);
      }
      if (sort === "distance") {
        return (distances.get(a.listing.id) ?? Infinity) - (distances.get(b.listing.id) ?? Infinity);
      }
      return 0;
    });

    return result;
  }, [items, filter, sort, sourceFilter, qualityMode, isRefined, adjustedScores, filters, uiFilters, searchText, distances]);

  const handleStatusChange = (id: string, newStatus: ListingStatus) => {
    setItems((prev) =>
      prev.map((item) =>
        item.listing.id === id ? { ...item, status: newStatus } : item
      )
    );
    const savedStates = JSON.parse(localStorage.getItem("listing_states") || "{}");
    savedStates[id] = newStatus;
    localStorage.setItem("listing_states", JSON.stringify(savedStates));
  };

  const handleNotesChange = (id: string, newNotes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.listing.id === id ? { ...item, notes: newNotes } : item
      )
    );
    const savedNotes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || "{}");
    savedNotes[id] = newNotes;
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(savedNotes));
  };

  // Load states and notes from localStorage on mount
  useEffect(() => {
    const savedStates = JSON.parse(localStorage.getItem("listing_states") || "{}");
    const savedNotes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || "{}");
    if (Object.keys(savedStates).length > 0 || Object.keys(savedNotes).length > 0) {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          status: (savedStates[item.listing.id] as ListingStatus) || item.status,
          notes: savedNotes[item.listing.id] || item.notes,
        }))
      );
    }
  }, []);

  // Compare handlers
  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const compareItems = useMemo(
    () => items.filter((i) => compareIds.includes(i.listing.id)),
    [items, compareIds]
  );

  // Refinement handlers
  const handleRefine = (
    newWeights: RefinementWeights,
    newFilters: RefinementFilters,
    entry: RefinementEntry
  ) => {
    setWeights(newWeights);
    setFilters(newFilters);
    setActiveProfileId(null);
    const newHistory = [...history, entry];
    setHistory(newHistory);
    saveRefinementState(newWeights, newFilters, newHistory, null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastEntry = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setWeights(lastEntry.weightsBefore);
    setFilters(lastEntry.filtersBefore);
    setHistory(newHistory);
    saveRefinementState(lastEntry.weightsBefore, lastEntry.filtersBefore, newHistory, activeProfileId);
  };

  const handleReset = () => {
    setWeights({ ...DEFAULT_WEIGHTS });
    setFilters({ ...DEFAULT_FILTERS });
    setHistory([]);
    setActiveProfileId(null);
    localStorage.removeItem(REFINEMENT_STORAGE_KEY);
  };

  const handleProfileApply = (
    newWeights: RefinementWeights,
    newFilters: RefinementFilters,
    profileId: string | null
  ) => {
    setWeights(newWeights);
    setFilters(newFilters);
    setActiveProfileId(profileId);
    setHistory([]);
    saveRefinementState(newWeights, newFilters, [], profileId);
  };

  // Check if a listing is new since last visit
  const isListingNew = (item: ListingWithEval): boolean => {
    if (!lastVisitDate) return false;
    return item.listing.date_scraped > lastVisitDate;
  };

  // Preview navigation
  const navigatePreview = (direction: "prev" | "next") => {
    if (!previewItem) return;
    const currentIndex = filtered.findIndex(
      (i) => i.listing.id === previewItem.listing.id
    );
    if (currentIndex === -1) return;
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < filtered.length) {
      setPreviewItem(filtered[newIndex]);
    }
  };

  const previewIndex = previewItem
    ? filtered.findIndex((i) => i.listing.id === previewItem.listing.id)
    : -1;

  return (
    <div>
      {/* New listings notification */}
      {newCount > 0 && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between print:hidden">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
            {newCount} nouvelle{newCount > 1 ? "s" : ""} annonce{newCount > 1 ? "s" : ""} depuis ta derniere visite !
          </span>
          <button
            onClick={() => { setSort("date"); setNewCount(0); }}
            className="text-sm px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Voir
          </button>
        </div>
      )}

      {/* Favorites "Mes Coups de Coeur" */}
      {favorites.length > 0 && (
        <div className="mb-6 print:mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Mes Coups de Coeur ({favorites.length})
            </h2>
            <button
              onClick={() => window.print()}
              className="text-sm px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 print:hidden"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimer
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 print:flex-wrap print:overflow-visible">
            {favorites.map((item) => (
              <div
                key={item.listing.id}
                className="shrink-0 w-[280px] print:w-full print:break-inside-avoid bg-white dark:bg-slate-800 rounded-lg border border-pink-200 dark:border-pink-800 p-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setPreviewItem(item)}
              >
                {item.listing.images.length > 0 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.listing.images[0]}
                    alt=""
                    className="w-full h-32 object-cover rounded-md mb-2"
                    loading="lazy"
                  />
                )}
                <div className="flex items-center gap-1.5 mb-1">
                  {item.evaluation && (
                    <ScoreBadge score={adjustedScores.get(item.listing.id) ?? item.evaluation.overall_score} />
                  )}
                  {item.listing.price && (
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {item.listing.price}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                  {item.listing.title}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {item.listing.location || item.listing.province}
                  {distances.get(item.listing.id) != null && (
                    <span className="ml-2 text-sky-600 dark:text-sky-400">
                      ~{Math.round(distances.get(item.listing.id)!)} km
                    </span>
                  )}
                </div>
                {item.notes && (
                  <div className="mt-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded line-clamp-2">
                    {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search profiles */}
      <div className="print:hidden">
        <SearchProfiles
          activeProfileId={activeProfileId}
          onApply={handleProfileApply}
        />
      </div>

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200/80 dark:border-slate-700/80 print:hidden">
        {/* Row 1: Search + View toggle */}
        <div className="flex items-center gap-3 mb-2.5">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Rechercher par titre, description, lieu..."
              className="w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex gap-0.5 bg-gray-100 dark:bg-slate-700 p-0.5 rounded-lg shrink-0">
            {([
              ["list", "M4 6h16M4 10h16M4 14h16M4 18h16", "Liste"],
              ["map", "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z", "Carte"],
              ["split", "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7", "Les deux"],
            ] as const).map(([mode, path, title]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded-md transition-colors ${
                  mode === "split" ? "hidden md:block" : ""
                } ${
                  viewMode === mode
                    ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
                title={title}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Status tabs + controls */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 shrink-0">
            {([
              ["all", "Actifs", counts.all],
              ["new", "Nouveaux", counts.new],
              ["favorite", "Favoris", counts.favorite],
              ["active", "En cours", counts.active],
              ["in_discussion", "Discussion", counts.in_discussion],
              ["archived", "Archives", counts.archived],
            ] as [FilterType, string, number][]).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  filter === key
                    ? key === "favorite"
                      ? "bg-pink-600 text-white"
                      : "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-1 ${filter === key ? "text-blue-200" : "text-gray-400 dark:text-gray-500"}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 shrink-0" />

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="px-2 py-1 border border-gray-300 dark:border-slate-600 rounded-md text-xs bg-white dark:bg-slate-800 dark:text-gray-300 shrink-0"
          >
            <option value="score">{isRefined ? "Score paufine" : "Score"}</option>
            <option value="date">Date</option>
            <option value="price">Prix</option>
            <option value="distance">Distance (Bruxelles)</option>
          </select>

          {sources.length > 1 && (
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 dark:border-slate-600 rounded-md text-xs bg-white dark:bg-slate-800 dark:text-gray-300 shrink-0"
            >
              <option value="all">Toutes sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-2 py-1 border rounded-md text-xs transition-colors shrink-0 ${
              showFilters || activeFilterCount > 0
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtres
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Paufini toggle */}
          <button
            onClick={() => setShowRefine(!showRefine)}
            className={`flex items-center gap-1 px-2 py-1 border rounded-md text-xs transition-colors shrink-0 ${
              showRefine || isRefined
                ? "border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                : "border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Paufiner
            {isRefined && (
              <span className="bg-amber-600 text-white text-[10px] px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                {history.length || "P"}
              </span>
            )}
          </button>

          {/* Quality mode toggle */}
          <button
            onClick={() => setQualityMode(!qualityMode)}
            className={`flex items-center gap-1 px-2 py-1 border rounded-md text-xs transition-colors shrink-0 ${
              qualityMode
                ? "border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                : "border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
            title={qualityMode ? "Mode qualite actif : masque les annonces peu pertinentes" : "Afficher toutes les annonces"}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Qualite
          </button>

          {/* Result count */}
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto shrink-0">
            {filtered.length} resultat{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Collapsible panels */}
      <div className="mt-3 print:hidden">
        {showRefine && (
          <RefineSearch
            weights={weights}
            filters={filters}
            history={history}
            onRefine={handleRefine}
            onUndo={handleUndo}
            onReset={handleReset}
          />
        )}

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
      </div>

      {/* Refined indicator (when panel is closed) */}
      {isRefined && !showRefine && (
        <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 print:hidden">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {activeProfileId
            ? `Profil actif: ${activeProfileId}`
            : `Classement paufine actif (${history.length} ajustement${history.length > 1 ? "s" : ""})`
          }
          <button onClick={() => setShowRefine(true)} className="underline hover:text-amber-900 dark:hover:text-amber-200">
            Modifier
          </button>
        </div>
      )}

      {/* Compare floating button */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 print:hidden">
          <button
            onClick={() => setCompareIds([])}
            className="p-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-full shadow-lg text-gray-400 hover:text-red-500"
            title="Vider la selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => setShowCompare(true)}
            className="px-5 py-3 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 font-medium text-sm flex items-center gap-2 transition-all"
          >
            Comparer ({compareIds.length})
          </button>
        </div>
      )}

      {/* Compare modal */}
      {showCompare && (
        <ComparePanel
          items={compareItems}
          adjustedScores={adjustedScores}
          onClose={() => setShowCompare(false)}
          onRemove={(id) => {
            setCompareIds((prev) => prev.filter((x) => x !== id));
            if (compareIds.length <= 1) setShowCompare(false);
          }}
        />
      )}

      {/* Content: list, map, or split */}
      <div className={`mt-3 ${viewMode === "split" ? "flex gap-4" : ""}`}>
        {(viewMode === "list" || viewMode === "split") && (
          <div
            className={
              viewMode === "split"
                ? "w-1/2 overflow-y-auto max-h-[calc(100vh-180px)] space-y-3 pr-2"
                : "space-y-3"
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
                  onNotesChange={handleNotesChange}
                  onToggleCompare={handleToggleCompare}
                  adjustedScore={adjustedScores.get(item.listing.id)}
                  isHighlighted={hoveredListingId === item.listing.id}
                  isSelected={compareIds.includes(item.listing.id)}
                  isNew={isListingNew(item)}
                  distance={distances.get(item.listing.id) ?? null}
                />
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Aucune annonce ne correspond</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Essaie de modifier tes filtres ou ta recherche</p>
              </div>
            )}
          </div>
        )}

        {(viewMode === "map" || viewMode === "split") && (
          <div
            className={
              viewMode === "split"
                ? "w-1/2 sticky top-4 h-[calc(100vh-180px)]"
                : "h-[calc(100vh-180px)]"
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

      {/* Slide-out preview panel */}
      {previewItem && (
        <ListingPreview
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onStatusChange={handleStatusChange}
          onNavigate={navigatePreview}
          currentIndex={previewIndex}
          totalCount={filtered.length}
          adjustedScore={adjustedScores.get(previewItem.listing.id)}
        />
      )}
    </div>
  );
}
