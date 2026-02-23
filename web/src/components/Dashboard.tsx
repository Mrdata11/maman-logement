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
  UITagFilters,
  DEFAULT_TAG_FILTERS,
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
import { TagFilterPanel, TagFilterCounts } from "./TagFilterPanel";
import { ListingsMapWrapper } from "./ListingsMapWrapper";
import { ListingPreview } from "./ListingPreview";
import { ComparePanel } from "./ComparePanel";
import { QuestionnaireBanner } from "./QuestionnaireBanner";
import {
  QuestionnaireState,
  QUESTIONNAIRE_STORAGE_KEY,
} from "@/lib/questionnaire-types";
import { mapQuestionnaireToFilters } from "@/lib/questionnaire-mapping";

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
  const [tagFilters, setTagFilters] = useState<UITagFilters>({ ...DEFAULT_TAG_FILTERS });
  const [showFilters, setShowFilters] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [previewItem, setPreviewItem] = useState<ListingWithEval | null>(null);
  const [searchText, setSearchText] = useState("");
  const [qualityMode, setQualityMode] = useState(true);

  // Refinement state
  const [weights, setWeights] = useState<RefinementWeights>({ ...DEFAULT_WEIGHTS });
  const [filters, setFilters] = useState<RefinementFilters>({ ...DEFAULT_FILTERS });
  const [history, setHistory] = useState<RefinementEntry[]>([]);

  // Questionnaire-derived filter state
  const [questionnaireFilterActive, setQuestionnaireFilterActive] = useState(false);
  const [questionnaireSummary, setQuestionnaireSummary] = useState<string[]>([]);

  // Compare state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Questionnaire state
  const [questionnaireState, setQuestionnaireState] = useState<QuestionnaireState | null>(null);

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
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Load questionnaire state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
      if (saved) {
        setQuestionnaireState(JSON.parse(saved));
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
    (w: RefinementWeights, f: RefinementFilters, h: RefinementEntry[]) => {
      localStorage.setItem(
        REFINEMENT_STORAGE_KEY,
        JSON.stringify({ weights: w, filters: f, history: h })
      );
    },
    []
  );

  const isRefined = history.length > 0 || questionnaireFilterActive;

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

  // Available tag values with counts
  const availableTags = useMemo((): TagFilterCounts => {
    const projectTypes = new Map<string, number>();
    const environments = new Map<string, number>();
    const sharedSpaces = new Map<string, number>();
    const values = new Map<string, number>();
    const sharedMeals = new Map<string, number>();
    const unitTypes = new Map<string, number>();
    let petsYes = 0, petsNo = 0;
    let childrenYes = 0, childrenNo = 0;
    let charterYes = 0, charterNo = 0;

    for (const item of items) {
      const t = item.tags;
      if (!t) continue;
      for (const v of t.project_types) projectTypes.set(v, (projectTypes.get(v) || 0) + 1);
      if (t.environment) environments.set(t.environment, (environments.get(t.environment) || 0) + 1);
      for (const v of t.shared_spaces) sharedSpaces.set(v, (sharedSpaces.get(v) || 0) + 1);
      for (const v of t.values) values.set(v, (values.get(v) || 0) + 1);
      if (t.shared_meals) sharedMeals.set(t.shared_meals, (sharedMeals.get(t.shared_meals) || 0) + 1);
      if (t.unit_type) unitTypes.set(t.unit_type, (unitTypes.get(t.unit_type) || 0) + 1);
      if (t.pets_allowed === true) petsYes++;
      else if (t.pets_allowed === false) petsNo++;
      if (t.has_children === true) childrenYes++;
      else if (t.has_children === false) childrenNo++;
      if (t.has_charter === true) charterYes++;
      else if (t.has_charter === false) charterNo++;
    }

    const toSorted = (m: Map<string, number>) =>
      Array.from(m.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

    return {
      projectTypes: toSorted(projectTypes),
      environments: toSorted(environments),
      sharedSpaces: toSorted(sharedSpaces),
      values: toSorted(values),
      sharedMeals: toSorted(sharedMeals),
      unitTypes: toSorted(unitTypes),
      petsAllowed: { yes: petsYes, no: petsNo },
      hasChildren: { yes: childrenYes, no: childrenNo },
      hasCharter: { yes: charterYes, no: charterNo },
    };
  }, [items]);

  // Active UI filter count (includes tag filters)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (uiFilters.searchText.trim()) count++;
    if (uiFilters.provinces.length > 0) count++;
    if (uiFilters.listingTypes.length > 0) count++;
    if (uiFilters.priceMin !== null || uiFilters.priceMax !== null) count++;
    if (uiFilters.scoreMin !== null) count++;
    // Tag filters
    if (tagFilters.projectTypes.length > 0) count++;
    if (tagFilters.environments.length > 0) count++;
    if (tagFilters.sharedSpaces.length > 0) count++;
    if (tagFilters.valuesTags.length > 0) count++;
    if (tagFilters.petsAllowed !== null) count++;
    if (tagFilters.hasChildren !== null) count++;
    if (tagFilters.hasCharter !== null) count++;
    if (tagFilters.sharedMeals.length > 0) count++;
    if (tagFilters.unitTypes.length > 0) count++;
    if (tagFilters.minBedrooms !== null) count++;
    if (tagFilters.minSurface !== null || tagFilters.maxSurface !== null) count++;
    return count;
  }, [uiFilters, tagFilters]);

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

    // Quality mode: only show relevant listing types (collaborative housing offers)
    if (qualityMode) {
      const RELEVANT_TYPES = new Set(["offre-location", "creation-groupe", "habitat-leger"]);
      result = result.filter((i) => {
        const lt = i.listing.listing_type;
        // Only keep listing types that are actual collaborative housing offers
        if (!lt || !RELEVANT_TYPES.has(lt)) return false;
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

    // Tag-based filters
    if (tagFilters.projectTypes.length > 0) {
      result = result.filter((i) =>
        i.tags && tagFilters.projectTypes.some((t) => i.tags!.project_types.includes(t))
      );
    }
    if (tagFilters.environments.length > 0) {
      result = result.filter((i) =>
        i.tags?.environment && tagFilters.environments.includes(i.tags.environment)
      );
    }
    if (tagFilters.sharedSpaces.length > 0) {
      result = result.filter((i) =>
        i.tags && tagFilters.sharedSpaces.some((s) => i.tags!.shared_spaces.includes(s))
      );
    }
    if (tagFilters.valuesTags.length > 0) {
      result = result.filter((i) =>
        i.tags && tagFilters.valuesTags.some((v) => i.tags!.values.includes(v))
      );
    }
    if (tagFilters.petsAllowed !== null) {
      result = result.filter((i) => i.tags?.pets_allowed === tagFilters.petsAllowed);
    }
    if (tagFilters.hasChildren !== null) {
      result = result.filter((i) => i.tags?.has_children === tagFilters.hasChildren);
    }
    if (tagFilters.hasCharter !== null) {
      result = result.filter((i) => i.tags?.has_charter === tagFilters.hasCharter);
    }
    if (tagFilters.sharedMeals.length > 0) {
      result = result.filter((i) =>
        i.tags?.shared_meals && tagFilters.sharedMeals.includes(i.tags.shared_meals)
      );
    }
    if (tagFilters.unitTypes.length > 0) {
      result = result.filter((i) =>
        i.tags?.unit_type && tagFilters.unitTypes.includes(i.tags.unit_type)
      );
    }
    if (tagFilters.minBedrooms !== null) {
      result = result.filter((i) =>
        i.tags?.num_bedrooms !== null && i.tags!.num_bedrooms !== undefined && i.tags!.num_bedrooms >= tagFilters.minBedrooms!
      );
    }
    if (tagFilters.minSurface !== null) {
      result = result.filter((i) =>
        i.tags?.surface_m2 !== null && i.tags!.surface_m2 !== undefined && i.tags!.surface_m2 >= tagFilters.minSurface!
      );
    }
    if (tagFilters.maxSurface !== null) {
      result = result.filter((i) =>
        i.tags?.surface_m2 !== null && i.tags!.surface_m2 !== undefined && i.tags!.surface_m2 <= tagFilters.maxSurface!
      );
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
  }, [items, filter, sort, sourceFilter, qualityMode, isRefined, adjustedScores, filters, uiFilters, tagFilters, searchText, distances]);

  const handleStatusChange = (id: string, newStatus: ListingStatus) => {
    const prevStatus = items.find((i) => i.listing.id === id)?.status;
    setItems((prev) =>
      prev.map((item) =>
        item.listing.id === id ? { ...item, status: newStatus } : item
      )
    );
    const savedStates = JSON.parse(localStorage.getItem("listing_states") || "{}");
    savedStates[id] = newStatus;
    localStorage.setItem("listing_states", JSON.stringify(savedStates));
    // Notify nav heart icon
    if (newStatus === "favorite" && prevStatus !== "favorite") {
      window.dispatchEvent(new CustomEvent("favorite-added"));
    } else if (newStatus !== "favorite" && prevStatus === "favorite") {
      window.dispatchEvent(new CustomEvent("favorite-removed"));
    }
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

  // Apply questionnaire filters when questionnaire is completed
  useEffect(() => {
    if (questionnaireState?.completedAt) {
      const result = mapQuestionnaireToFilters(questionnaireState.answers);
      if (result.isActive) {
        setWeights(result.weights);
        setFilters(result.filters);
        setTagFilters(result.tagFilters);
        setQuestionnaireFilterActive(true);
        setQuestionnaireSummary(result.summary);
        saveRefinementState(result.weights, result.filters, []);
      }
    }
  }, [questionnaireState, saveRefinementState]);

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
    setWeights(lastEntry.weightsBefore);
    setFilters(lastEntry.filtersBefore);
    setHistory(newHistory);
    saveRefinementState(lastEntry.weightsBefore, lastEntry.filtersBefore, newHistory);
  };

  const handleReset = () => {
    // Reset to questionnaire baseline if active, otherwise to defaults
    if (questionnaireState?.completedAt) {
      const result = mapQuestionnaireToFilters(questionnaireState.answers);
      setWeights(result.weights);
      setFilters(result.filters);
      setTagFilters(result.tagFilters);
      setHistory([]);
      saveRefinementState(result.weights, result.filters, []);
    } else {
      setWeights({ ...DEFAULT_WEIGHTS });
      setFilters({ ...DEFAULT_FILTERS });
      setTagFilters({ ...DEFAULT_TAG_FILTERS });
      setHistory([]);
      localStorage.removeItem(REFINEMENT_STORAGE_KEY);
    }
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
      {/* Questionnaire banner */}
      <QuestionnaireBanner
        state={questionnaireState}
        matchCount={questionnaireFilterActive ? filtered.length : undefined}
        onReset={() => {
          // Clear questionnaire from localStorage
          localStorage.removeItem(QUESTIONNAIRE_STORAGE_KEY);
          setQuestionnaireState(null);
          // Reset all filters derived from questionnaire
          setQuestionnaireFilterActive(false);
          setQuestionnaireSummary([]);
          setWeights({ ...DEFAULT_WEIGHTS });
          setFilters({ ...DEFAULT_FILTERS });
          setTagFilters({ ...DEFAULT_TAG_FILTERS });
          setHistory([]);
          localStorage.removeItem(REFINEMENT_STORAGE_KEY);
        }}
      />

      {/* New listings notification */}
      {newCount > 0 && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between print:hidden">
          <span className="text-emerald-600 font-medium text-sm">
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

      {/* Questionnaire filter indicator */}
      {questionnaireFilterActive && questionnaireSummary.length > 0 && (
        <div className="mb-4 px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg print:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Filtrage actif</span>
              <div className="flex flex-wrap gap-1.5">
                {questionnaireSummary.map((s, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/questionnaire"
                className="text-xs px-2.5 py-1 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-800/30 rounded-md transition-colors font-medium"
              >
                Modifier
              </a>
              <button
                onClick={() => {
                  setQuestionnaireFilterActive(false);
                  setQuestionnaireSummary([]);
                  setWeights({ ...DEFAULT_WEIGHTS });
                  setFilters({ ...DEFAULT_FILTERS });
                  setTagFilters({ ...DEFAULT_TAG_FILTERS });
                  setHistory([]);
                  localStorage.removeItem(REFINEMENT_STORAGE_KEY);
                }}
                className="text-xs px-2.5 py-1 text-violet-500 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-800/30 rounded-md transition-colors"
              >
                Tout voir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border-color)]/80 print:hidden">
        {/* Row 1: Search + View toggle */}
        <div className="flex items-center gap-3 mb-2.5">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Rechercher par titre, description, lieu..."
              className="w-full pl-10 pr-8 py-2.5 border border-[var(--input-border)] rounded-xl text-base bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex gap-0.5 bg-[var(--surface)] p-0.5 rounded-xl shrink-0">
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
                    ? "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === key
                    ? key === "favorite"
                      ? "bg-rose-600 text-white"
                      : "bg-[var(--primary)] text-white"
                    : "text-[var(--muted)] hover:bg-[var(--surface)]"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-1 ${filter === key ? "opacity-70" : "text-[var(--muted-light)]"}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-[var(--border-color)] shrink-0" />

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="px-3 py-1.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] shrink-0"
          >
            <option value="score">{history.length > 0 ? "Score paufine" : questionnaireFilterActive ? "Score personnalise" : "Score"}</option>
            <option value="date">Date</option>
            <option value="price">Prix</option>
            <option value="distance">Distance (Bruxelles)</option>
          </select>

          {sources.length > 1 && (
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-1.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] shrink-0"
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
                ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10"
                : "border-[var(--border-color)] text-[var(--muted)] hover:bg-[var(--surface)]"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtres
            {activeFilterCount > 0 && (
              <span className="bg-[var(--primary)] text-white text-[11px] px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Paufini toggle */}
          <button
            onClick={() => setShowRefine(!showRefine)}
            className={`flex items-center gap-1 px-2 py-1 border rounded-md text-xs transition-colors shrink-0 ${
              showRefine || isRefined
                ? "border-amber-500 text-amber-700 bg-amber-50"
                : "border-[var(--border-color)] text-[var(--muted)] hover:bg-[var(--surface)]"
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
                ? "border-green-500 text-green-700 bg-green-50"
                : "border-[var(--border-color)] text-[var(--muted)] hover:bg-[var(--surface)]"
            }`}
            title={qualityMode ? "Mode qualite actif : masque les annonces peu pertinentes" : "Afficher toutes les annonces"}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Qualite
          </button>

          {/* Result count */}
          <span className="text-sm text-[var(--muted-light)] ml-auto shrink-0">
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
            onReset={() => { setUiFilters({ ...DEFAULT_UI_FILTERS }); setTagFilters({ ...DEFAULT_TAG_FILTERS }); }}
            availableProvinces={availableProvinces}
            availableListingTypes={availableListingTypes}
            priceRange={priceRange}
          >
            <TagFilterPanel
              filters={tagFilters}
              onChange={setTagFilters}
              availableTags={availableTags}
            />
          </FilterPanel>
        )}
      </div>

      {/* Refined indicator (when panel is closed and manual refinements exist) */}
      {history.length > 0 && !showRefine && (
        <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 print:hidden">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Classement paufine actif ({history.length} ajustement{history.length > 1 ? "s" : ""})
          <button onClick={() => setShowRefine(true)} className="underline hover:text-amber-900">
            Modifier
          </button>
        </div>
      )}

      {/* Compare floating button */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 print:hidden">
          <button
            onClick={() => setCompareIds([])}
            className="p-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-full shadow-lg text-[var(--muted)] hover:text-red-500"
            title="Vider la selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => setShowCompare(true)}
            className="px-5 py-3 bg-[var(--primary)] text-white rounded-full shadow-xl hover:bg-[var(--primary-hover)] font-medium text-sm flex items-center gap-2 transition-all"
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
                <svg className="w-12 h-12 mx-auto text-[var(--muted-light)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-[var(--muted)] mb-1">Aucune annonce ne correspond</p>
                <p className="text-sm text-[var(--muted-light)]">Essaie de modifier tes filtres ou ta recherche</p>
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
