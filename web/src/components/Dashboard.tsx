"use client";

import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  ListingWithEval,
  ListingStatus,
  RefinementFilters,
  DEFAULT_FILTERS,
  UIFilterState,
  DEFAULT_UI_FILTERS,
  UITagFilters,
  DEFAULT_TAG_FILTERS,
  applyRefinementFilters,
  PersonalizedResult,
} from "@/lib/types";
import {
  haversineDistance,
  getListingCoordinates,
  EUROPE_CENTER,
} from "@/lib/coordinates";
import { ListingCard } from "./ListingCard";
import { TagFilterCounts } from "./TagFilterPanel";
import { FilterModal } from "./FilterModal";
import { ListingsMapWrapper } from "./ListingsMapWrapper";
import { ListingPreview } from "./ListingPreview";
import { ComparePanel } from "./ComparePanel";
import { VoiceQuestionnaire } from "./VoiceQuestionnaire";
import { QuestionnaireBanner } from "./QuestionnaireBanner";
import {
  QuestionnaireState,
  QUESTIONNAIRE_STORAGE_KEY,
} from "@/lib/questionnaire-types";
import { mapQuestionnaireToFilters } from "@/lib/questionnaire-mapping";

type FilterType = "all" | "new" | "favorite" | "active" | "archived";
type SortType = "score" | "price" | "distance" | "personal";

const SortIconScore = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16" />
  </svg>
);
const SortIconPrice = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10m-5-9v18m-3-3l3 3 3-3" />
  </svg>
);
const SortIconDistance = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="6" cy="6" r="2" strokeWidth={2} />
    <circle cx="18" cy="18" r="2" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8v2a4 4 0 004 4h4a4 4 0 004-4V8" />
  </svg>
);

const SortIconPersonal = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SORT_OPTIONS: { value: SortType; label: string; icon: ReactNode }[] = [
  { value: "score", label: "Score", icon: <SortIconScore /> },
  { value: "personal", label: "Mon score", icon: <SortIconPersonal /> },
  { value: "price", label: "Prix", icon: <SortIconPrice /> },
  { value: "distance", label: "Distance", icon: <SortIconDistance /> },
];

const SORT_LABELS: Record<SortType, string> = {
  score: "Score",
  personal: "Mon score",
  price: "Prix",
  distance: "Distance",
};
type ViewMode = "list" | "map" | "split";

const REFINEMENT_STORAGE_KEY = "refinement_state";
const LAST_VISIT_KEY = "last_visit_date";
const NOTES_STORAGE_KEY = "listing_notes";
const PERSONAL_CRITERIA_KEY = "personal_criteria";
const PERSONAL_SCORES_KEY = "personal_scores";

export function Dashboard({
  initialItems,
}: {
  initialItems: ListingWithEval[];
}) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("score");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [uiFilters, setUiFilters] = useState<UIFilterState>({ ...DEFAULT_UI_FILTERS });
  const [tagFilters, setTagFilters] = useState<UITagFilters>({ ...DEFAULT_TAG_FILTERS });
  const [showFilters, setShowFilters] = useState(false);
  const [previewItem, setPreviewItem] = useState<ListingWithEval | null>(null);

  // Custom dropdown states
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Refinement state (driven by questionnaire)
  const [filters, setFilters] = useState<RefinementFilters>({ ...DEFAULT_FILTERS });

  // Questionnaire-derived filter state
  const [questionnaireFilterActive, setQuestionnaireFilterActive] = useState(false);
  const [questionnaireSummary, setQuestionnaireSummary] = useState<string[]>([]);

  // Compare state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Questionnaire state
  const [questionnaireState, setQuestionnaireState] = useState<QuestionnaireState | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Personalized scoring state
  const [showScoringPanel, setShowScoringPanel] = useState(false);
  const [personalCriteria, setPersonalCriteria] = useState("");
  const [personalScores, setPersonalScores] = useState<Map<string, PersonalizedResult>>(new Map());
  const [scoringLoading, setScoringLoading] = useState(false);
  const [scoringProgress, setScoringProgress] = useState("");

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
        if (parsed.filters) setFilters(parsed.filters);
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

  // Load personalized criteria and scores from localStorage
  useEffect(() => {
    try {
      const savedCriteria = localStorage.getItem(PERSONAL_CRITERIA_KEY);
      if (savedCriteria) setPersonalCriteria(savedCriteria);
      const savedScores = localStorage.getItem(PERSONAL_SCORES_KEY);
      if (savedScores) {
        const parsed: [string, PersonalizedResult][] = JSON.parse(savedScores);
        setPersonalScores(new Map(parsed));
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

  // Click outside to close custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save refinement state to localStorage
  const saveRefinementState = useCallback(
    (f: RefinementFilters) => {
      localStorage.setItem(
        REFINEMENT_STORAGE_KEY,
        JSON.stringify({ filters: f })
      );
    },
    []
  );

  const isRefined = questionnaireFilterActive;

  // Personalized scoring function
  const runPersonalizedScoring = useCallback(async (criteria: string, listingsToScore: ListingWithEval[]) => {
    if (!criteria || listingsToScore.length === 0) return;
    setScoringLoading(true);
    setScoringProgress(`Scoring de ${listingsToScore.length} annonces...`);

    const summaries = listingsToScore.map((item) => ({
      id: item.listing.id,
      title: item.evaluation?.ai_title || item.listing.title,
      description: (item.evaluation?.ai_description || item.listing.description).slice(0, 500),
      location: item.listing.location,
      country: item.listing.country,
      price: item.listing.price,
      listing_type: item.listing.listing_type,
      tags_summary: item.tags
        ? [
            ...item.tags.project_types,
            item.tags.environment,
            ...item.tags.values,
            ...item.tags.shared_spaces.slice(0, 3),
          ].filter(Boolean).join(", ")
        : "",
    }));

    try {
      const resp = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria, listings: summaries }),
      });

      if (!resp.ok) throw new Error("API error");

      const data = await resp.json();
      const newScores = new Map(personalScores);
      for (const r of data.results) {
        newScores.set(r.listing_id, {
          listing_id: r.listing_id,
          score: r.score,
          explanation: r.explanation,
          highlights: [],
          concerns: [],
        });
      }
      setPersonalScores(newScores);
      localStorage.setItem(PERSONAL_CRITERIA_KEY, criteria);
      localStorage.setItem(PERSONAL_SCORES_KEY, JSON.stringify(Array.from(newScores.entries())));
      setScoringProgress(`${data.results.length} annonces \u00e9valu\u00e9es`);
    } catch (err) {
      console.error("Scoring error:", err);
      setScoringProgress("Erreur lors du scoring");
    } finally {
      setScoringLoading(false);
    }
  }, [personalScores]);

  // Calculate distances from Bruxelles
  const distances = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const item of items) {
      const coords = getListingCoordinates(
        item.listing.location,
        item.listing.province
      );
      if (coords) {
        map.set(item.listing.id, haversineDistance(EUROPE_CENTER, coords));
      } else {
        map.set(item.listing.id, null);
      }
    }
    return map;
  }, [items]);

  // Available sources with counts
  const availableSources = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const s = item.listing.source;
      if (s) map.set(s, (map.get(s) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // Quality-filtered items (always on — only relevant, evaluated listings)
  const RELEVANT_TYPES = useMemo(() => new Set(["offre-location", "creation-groupe", "habitat-leger", "ecovillage", "community-profile", "cohousing"]), []);
  const qualityFiltered = useMemo(() => {
    return items.filter((i) => {
      const lt = i.listing.listing_type;
      if (!lt || !RELEVANT_TYPES.has(lt)) return false;
      if (!i.evaluation) return false;
      if (i.evaluation.quality_score < 15) return false;
      return true;
    });
  }, [items, RELEVANT_TYPES]);

  // Counts (based on quality-filtered items so they match displayed results)
  const counts = useMemo(() => {
    return {
      all: qualityFiltered.filter((i) => i.status !== "archived" && i.status !== "rejected").length,
      new: qualityFiltered.filter((i) => i.status === "new").length,
      favorite: qualityFiltered.filter((i) => i.status === "favorite").length,
      active: qualityFiltered.filter((i) => ["contacted", "visit_planned", "in_discussion"].includes(i.status)).length,
      archived: qualityFiltered.filter((i) => i.status === "archived" || i.status === "rejected").length,
    };
  }, [qualityFiltered]);

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

  // Available countries with counts
  const availableCountries = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const c = item.listing.country;
      if (c) map.set(c, (map.get(c) || 0) + 1);
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
    // New maps & counters
    const ageRange = new Map<string, number>();
    const familyTypes = new Map<string, number>();
    const petDetails = new Map<string, number>();
    const governance = new Map<string, number>();
    let furnishedYes = 0, furnishedNo = 0;
    let pmrYes = 0, pmrNo = 0;
    let natureYes = 0, natureNo = 0;
    let transportYes = 0, transportNo = 0;
    const availabilityStatus = new Map<string, number>();

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
      // New tag counting
      for (const v of t.age_range) ageRange.set(v, (ageRange.get(v) || 0) + 1);
      for (const v of t.family_types) familyTypes.set(v, (familyTypes.get(v) || 0) + 1);
      for (const v of t.pet_details) petDetails.set(v, (petDetails.get(v) || 0) + 1);
      if (t.governance) governance.set(t.governance, (governance.get(t.governance) || 0) + 1);
      if (t.furnished === true) furnishedYes++;
      else if (t.furnished === false) furnishedNo++;
      if (t.accessible_pmr === true) pmrYes++;
      else if (t.accessible_pmr === false) pmrNo++;
      if (t.near_nature === true) natureYes++;
      else if (t.near_nature === false) natureNo++;
      if (t.near_transport === true) transportYes++;
      else if (t.near_transport === false) transportNo++;
      // Availability from evaluation
      const avail = item.evaluation?.availability_status;
      if (avail) availabilityStatus.set(avail, (availabilityStatus.get(avail) || 0) + 1);
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
      ageRange: toSorted(ageRange),
      familyTypes: toSorted(familyTypes),
      petDetails: toSorted(petDetails),
      governance: toSorted(governance),
      furnished: { yes: furnishedYes, no: furnishedNo },
      accessiblePmr: { yes: pmrYes, no: pmrNo },
      nearNature: { yes: natureYes, no: natureNo },
      nearTransport: { yes: transportYes, no: transportNo },
      availabilityStatus: toSorted(availabilityStatus),
    };
  }, [items]);

  // Active UI filter count (includes tag filters)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (uiFilters.searchText.trim()) count++;
    if (uiFilters.countries.length > 0) count++;
    if (uiFilters.provinces.length > 0) count++;
    if (uiFilters.listingTypes.length > 0) count++;
    if (uiFilters.sources.length > 0) count++;
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
    // New tag filters
    if (tagFilters.ageRange.length > 0) count++;
    if (tagFilters.familyTypes.length > 0) count++;
    if (tagFilters.minGroupSize !== null || tagFilters.maxGroupSize !== null) count++;
    if (tagFilters.petDetails.length > 0) count++;
    if (tagFilters.furnished !== null) count++;
    if (tagFilters.accessiblePmr !== null) count++;
    if (tagFilters.governance.length > 0) count++;
    if (tagFilters.nearNature !== null) count++;
    if (tagFilters.nearTransport !== null) count++;
    if (tagFilters.availabilityStatus.length > 0) count++;
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
        result = result.filter((i) => ["contacted", "visit_planned", "in_discussion"].includes(i.status));
        break;
      default:
        result = result.filter((i) => i.status === filter);
        break;
    }

    // Source filter (from filter modal)
    if (uiFilters.sources.length > 0) {
      result = result.filter((i) => uiFilters.sources.includes(i.listing.source));
    }

    // Quality filter: always on — only relevant, evaluated listings
    result = result.filter((i) => {
      const lt = i.listing.listing_type;
      if (!lt || !RELEVANT_TYPES.has(lt)) return false;
      if (!i.evaluation) return false;
      if (i.evaluation.quality_score < 15) return false;
      return true;
    });

    // Refinement filters
    if (isRefined) {
      result = result.filter((item) =>
        applyRefinementFilters(item, filters)
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

    // UI filters - countries
    if (uiFilters.countries.length > 0) {
      result = result.filter(
        (i) => i.listing.country !== null && uiFilters.countries.includes(i.listing.country)
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
        const score = i.evaluation?.quality_score ?? null;
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
    // New tag filters
    if (tagFilters.ageRange.length > 0) {
      result = result.filter((i) =>
        i.tags && tagFilters.ageRange.some((a) => i.tags!.age_range.includes(a))
      );
    }
    if (tagFilters.familyTypes.length > 0) {
      result = result.filter((i) =>
        i.tags && tagFilters.familyTypes.some((f) => i.tags!.family_types.includes(f))
      );
    }
    if (tagFilters.minGroupSize !== null) {
      result = result.filter((i) =>
        i.tags?.group_size != null && i.tags!.group_size >= tagFilters.minGroupSize!
      );
    }
    if (tagFilters.maxGroupSize !== null) {
      result = result.filter((i) =>
        i.tags?.group_size != null && i.tags!.group_size <= tagFilters.maxGroupSize!
      );
    }
    if (tagFilters.petDetails.length > 0) {
      result = result.filter((i) =>
        i.tags && tagFilters.petDetails.some((p) => i.tags!.pet_details.includes(p))
      );
    }
    if (tagFilters.furnished !== null) {
      result = result.filter((i) => i.tags?.furnished === tagFilters.furnished);
    }
    if (tagFilters.accessiblePmr !== null) {
      result = result.filter((i) => i.tags?.accessible_pmr === tagFilters.accessiblePmr);
    }
    if (tagFilters.governance.length > 0) {
      result = result.filter((i) =>
        i.tags?.governance && tagFilters.governance.includes(i.tags.governance)
      );
    }
    if (tagFilters.nearNature !== null) {
      result = result.filter((i) => i.tags?.near_nature === tagFilters.nearNature);
    }
    if (tagFilters.nearTransport !== null) {
      result = result.filter((i) => i.tags?.near_transport === tagFilters.nearTransport);
    }
    if (tagFilters.availabilityStatus.length > 0) {
      result = result.filter((i) => {
        const status = i.evaluation?.availability_status ?? "unknown";
        return tagFilters.availabilityStatus.includes(status);
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sort === "personal") {
        const sa = personalScores.get(a.listing.id)?.score ?? -1;
        const sb = personalScores.get(b.listing.id)?.score ?? -1;
        if (sb !== sa) return sb - sa;
        // Fallback to quality score for unscored items
        return (b.evaluation?.quality_score ?? -1) - (a.evaluation?.quality_score ?? -1);
      }
      if (sort === "score") {
        const sa = a.evaluation?.quality_score ?? -1;
        const sb = b.evaluation?.quality_score ?? -1;
        return sb - sa;
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
  }, [items, filter, sort, RELEVANT_TYPES, isRefined, filters, uiFilters, tagFilters, distances, personalScores]);

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
        setFilters(result.filters);
        setTagFilters(result.tagFilters);
        setQuestionnaireFilterActive(true);
        setQuestionnaireSummary(result.summary);
        saveRefinementState(result.filters);
      }
    }
  }, [questionnaireState, saveRefinementState]);

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
      {/* Questionnaire banner (unified: match count + profile summary) */}
      <QuestionnaireBanner
        state={questionnaireState}
        matchCount={questionnaireFilterActive ? filtered.length : undefined}
        questionnaireSummary={questionnaireFilterActive ? questionnaireSummary : undefined}
        onStartVoice={() => setShowVoiceModal(true)}
        onClearFilters={questionnaireFilterActive ? () => {
          setQuestionnaireFilterActive(false);
          setQuestionnaireSummary([]);
          setFilters({ ...DEFAULT_FILTERS });
          setTagFilters({ ...DEFAULT_TAG_FILTERS });
          localStorage.removeItem(REFINEMENT_STORAGE_KEY);
        } : undefined}
        onReset={() => {
          // Clear questionnaire from localStorage
          localStorage.removeItem(QUESTIONNAIRE_STORAGE_KEY);
          setQuestionnaireState(null);
          // Reset all filters derived from questionnaire
          setQuestionnaireFilterActive(false);
          setQuestionnaireSummary([]);
          setFilters({ ...DEFAULT_FILTERS });
          setTagFilters({ ...DEFAULT_TAG_FILTERS });
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
            onClick={() => { setNewCount(0); }}
            className="text-sm px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Voir
          </button>
        </div>
      )}

      {/* Spacer before toolbar */}
      <div className="mb-2" />

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border-color)]/80 print:hidden">
        {/* Single row: Status tabs + Sort/Source/Filters + View toggle */}
        <div className="flex items-center gap-2">
          {/* Scrollable status tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            {([
              ["all", "Actifs", counts.all],
              ["new", "Nouveaux", counts.new],
              ["favorite", "Favoris", counts.favorite],
              ["active", "En cours", counts.active],
              ["archived", "Archives", counts.archived],
            ] as [FilterType, string, number][]).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1 ${
                  filter === key
                    ? key === "favorite"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-[var(--primary)] text-white shadow-sm"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border-color)]"
                }`}
              >
                {key === "favorite" && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={filter === "favorite" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
                {label}
                {count > 0 && (
                  <span className={`ml-1 ${filter === key ? "opacity-80" : "text-[var(--muted-light)]"}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-7 bg-[var(--border-color)] shrink-0" />

          {/* Sort + Filters (outside overflow so dropdowns work) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sort dropdown */}
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-sm transition-colors ${
                  sortOpen
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-[var(--input-border)] bg-[var(--input-bg)] hover:border-[var(--primary)]/50"
                }`}
              >
                <svg className="w-3.5 h-3.5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span className="font-medium text-[var(--foreground)]">{SORT_LABELS[sort]}</span>
                <svg className={`w-3 h-3 text-[var(--muted)] transition-transform ${sortOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sortOpen && (
                <div className="absolute top-full mt-1.5 right-0 min-w-[220px] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
                  {SORT_OPTIONS.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      onClick={() => { setSort(value); setSortOpen(false); if (value === "personal") setShowScoringPanel(true); }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                        sort === value
                          ? "text-[var(--primary)] font-medium bg-[var(--primary)]/5"
                          : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                      }`}
                    >
                      <span className="text-[var(--muted)] shrink-0">{icon}</span>
                      <span className="flex-1">{label}</span>
                      {sort === value && (
                        <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-sm transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5"
                  : "border-[var(--input-border)] text-[var(--muted)] hover:border-[var(--primary)]/50 bg-[var(--input-bg)]"
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

          {/* Result count */}
          <span className="text-sm text-[var(--muted-light)] shrink-0">
            {filtered.length}
          </span>
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        uiFilters={uiFilters}
        onUiFiltersChange={setUiFilters}
        availableCountries={availableCountries}
        availableProvinces={availableProvinces}
        availableListingTypes={availableListingTypes}
        availableSources={availableSources}
        priceRange={priceRange}
        tagFilters={tagFilters}
        onTagFiltersChange={setTagFilters}
        availableTags={availableTags}
        resultCount={filtered.length}
        activeFilterCount={activeFilterCount}
      />

      {/* Personalized scoring panel */}
      {showScoringPanel && (
        <div className="mb-4 p-5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-sm print:hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Scoring personnalis&eacute;</h3>
            <button
              onClick={() => setShowScoringPanel(false)}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-[var(--muted)] mb-3">
            D&eacute;crivez ce que vous cherchez et l&apos;IA &eacute;valuera chaque annonce selon vos crit&egrave;res.
          </p>
          <textarea
            value={personalCriteria}
            onChange={(e) => setPersonalCriteria(e.target.value)}
            placeholder="Ex: Je cherche un habitat group&eacute; &eacute;cologique pr&egrave;s de la nature, avec jardin partag&eacute;, pour une famille avec enfants. Budget max 800&euro;/mois. Id&eacute;alement en France ou Belgique."
            className="w-full px-4 py-3 border border-[var(--border-light)] rounded-xl text-sm bg-[var(--surface)]/50 text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]/40 transition-all duration-200 resize-none"
            rows={3}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-[var(--muted)]">
              {scoringProgress && <span>{scoringProgress}</span>}
              {personalScores.size > 0 && !scoringLoading && (
                <span>{personalScores.size} annonces &eacute;valu&eacute;es</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {personalScores.size > 0 && (
                <button
                  onClick={() => {
                    setPersonalScores(new Map());
                    setPersonalCriteria("");
                    localStorage.removeItem(PERSONAL_CRITERIA_KEY);
                    localStorage.removeItem(PERSONAL_SCORES_KEY);
                    setScoringProgress("");
                    setSort("score");
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Effacer
                </button>
              )}
              <button
                onClick={() => runPersonalizedScoring(personalCriteria, filtered)}
                disabled={scoringLoading || personalCriteria.length < 10}
                className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-xl hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {scoringLoading && (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {scoringLoading ? "Scoring..." : `Scorer ${filtered.length} annonces`}
              </button>
            </div>
          </div>
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
          onClose={() => setShowCompare(false)}
          onRemove={(id) => {
            setCompareIds((prev) => prev.filter((x) => x !== id));
            if (compareIds.length <= 1) setShowCompare(false);
          }}
        />
      )}

      {/* Content: list, map, or split */}
      <div className={`mt-5 ${viewMode === "split" ? "flex gap-4" : ""}`}>
        {(viewMode === "list" || viewMode === "split") && (
          <div
            className={
              viewMode === "split"
                ? "w-1/2 overflow-y-auto max-h-[calc(100vh-180px)] space-y-4 pr-2"
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
                  onNotesChange={handleNotesChange}
                  onToggleCompare={handleToggleCompare}
                  adjustedScore={undefined}
                  personalScore={personalScores.get(item.listing.id) ? { score: personalScores.get(item.listing.id)!.score, explanation: personalScores.get(item.listing.id)!.explanation } : null}
                  isHighlighted={hoveredListingId === item.listing.id}
                  isSelected={compareIds.includes(item.listing.id)}
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
              onArchive={(id) => handleStatusChange(id, "archived")}
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
          adjustedScore={undefined}
        />
      )}

      {/* Voice questionnaire modal */}
      {showVoiceModal && (
        <VoiceQuestionnaire
          onClose={() => setShowVoiceModal(false)}
          onComplete={() => {
            setShowVoiceModal(false);
            // Re-read questionnaire state from localStorage
            const saved = localStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
            if (saved) {
              setQuestionnaireState(JSON.parse(saved));
            }
          }}
        />
      )}

    </div>
  );
}
