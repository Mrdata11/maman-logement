"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ApartmentWithEval,
  ApartmentFilterState,
  DEFAULT_APARTMENT_FILTERS,
  ListingStatus,
} from "@/lib/types";
import { haversineDistance, IXELLES_CENTER } from "@/lib/coordinates";
import { ApartmentListingCard } from "./ApartmentListingCard";
import { ApartmentFilterPanel } from "./ApartmentFilterPanel";
import { ApartmentListingsMapWrapper } from "./ApartmentListingsMapWrapper";
import { ApartmentComparePanel } from "./ApartmentComparePanel";

type FilterType = "all" | "new" | "favorite" | "active" | "archived";
type SortType = "score" | "price" | "surface" | "distance" | "date";
type ViewMode = "list" | "map" | "split";

const APT_STATES_KEY = "apartment_listing_states";
const APT_NOTES_KEY = "apartment_listing_notes";
const APT_LAST_VISIT_KEY = "apartment_last_visit_date";
const ITEMS_PER_PAGE = 20;

export function ApartmentDashboard({
  initialItems,
}: {
  initialItems: ApartmentWithEval[];
}) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>(() => {
    const hasEvals = initialItems.some((i) => i.evaluation);
    return hasEvals ? "score" : "price";
  });
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [aptFilters, setAptFilters] = useState<ApartmentFilterState>({ ...DEFAULT_APARTMENT_FILTERS });
  const [showFilters, setShowFilters] = useState(false);

  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Compare state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // New listings detection
  const [lastVisitDate, setLastVisitDate] = useState<string | null>(null);
  const [newCount, setNewCount] = useState(0);

  // Scroll to top visibility
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Default to split view on desktop
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setViewMode("split");
    }
  }, []);

  // Track scroll for "back to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync items
  useEffect(() => {
    if (initialItems.length > 0) setItems(initialItems);
  }, [initialItems]);

  // Load last visit date
  useEffect(() => {
    const saved = localStorage.getItem(APT_LAST_VISIT_KEY);
    if (saved) setLastVisitDate(saved);
    localStorage.setItem(APT_LAST_VISIT_KEY, new Date().toISOString());
  }, []);

  // Count new listings
  useEffect(() => {
    if (lastVisitDate && items.length > 0) {
      const count = items.filter((item) => item.listing.date_scraped > lastVisitDate).length;
      setNewCount(count);
    }
  }, [lastVisitDate, items]);

  // Click outside to close sort dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load states and notes from localStorage on mount
  useEffect(() => {
    const savedStates = JSON.parse(localStorage.getItem(APT_STATES_KEY) || "{}");
    const savedNotes = JSON.parse(localStorage.getItem(APT_NOTES_KEY) || "{}");
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

  // Calculate distances from Ixelles
  const distances = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const item of items) {
      if (item.listing.latitude && item.listing.longitude) {
        map.set(
          item.listing.id,
          haversineDistance(IXELLES_CENTER, { lat: item.listing.latitude, lng: item.listing.longitude })
        );
      } else {
        map.set(item.listing.id, null);
      }
    }
    return map;
  }, [items]);

  // Counts
  const counts = useMemo(() => ({
    all: items.filter((i) => i.status !== "archived" && i.status !== "rejected").length,
    new: items.filter((i) => i.status === "new").length,
    favorite: items.filter((i) => i.status === "favorite").length,
    active: items.filter((i) => ["contacted", "visit_planned", "in_discussion"].includes(i.status)).length,
    archived: items.filter((i) => i.status === "archived" || i.status === "rejected").length,
  }), [items]);

  // Available communes with counts
  const availableCommunes = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const c = item.listing.commune;
      if (c) map.set(c, (map.get(c) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // Price range
  const priceRange = useMemo(() => {
    const prices = items
      .map((i) => i.listing.price_monthly)
      .filter((p): p is number => p !== null);
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 3000,
    };
  }, [items]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (aptFilters.searchText.trim()) count++;
    if (aptFilters.communes.length > 0) count++;
    if (aptFilters.priceMin !== null || aptFilters.priceMax !== null) count++;
    if (aptFilters.bedroomsMin !== null) count++;
    if (aptFilters.surfaceMin !== null || aptFilters.surfaceMax !== null) count++;
    if (aptFilters.pebRatings.length > 0) count++;
    if (aptFilters.furnished !== null) count++;
    if (aptFilters.hasParking !== null) count++;
    if (aptFilters.hasBalconyOrTerrace !== null) count++;
    if (aptFilters.hasGarden !== null) count++;
    if (aptFilters.petsAllowed !== null) count++;
    if (aptFilters.hasElevator !== null) count++;
    if (aptFilters.scoreMin !== null) count++;
    return count;
  }, [aptFilters]);

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

    // Filter panel search text
    if (aptFilters.searchText.trim()) {
      const query = aptFilters.searchText.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.listing.title.toLowerCase().includes(query) ||
          i.listing.description.toLowerCase().includes(query) ||
          (i.listing.commune && i.listing.commune.toLowerCase().includes(query)) ||
          (i.listing.address && i.listing.address.toLowerCase().includes(query)) ||
          (i.listing.tags && i.listing.tags.some((t) => t.toLowerCase().includes(query)))
      );
    }

    // Communes (case-insensitive matching)
    if (aptFilters.communes.length > 0) {
      const communesLower = aptFilters.communes.map((c) => c.toLowerCase());
      result = result.filter(
        (i) => i.listing.commune !== null && communesLower.includes(i.listing.commune.toLowerCase())
      );
    }

    // Price range
    if (aptFilters.priceMin !== null) {
      result = result.filter((i) => i.listing.price_monthly !== null && i.listing.price_monthly >= aptFilters.priceMin!);
    }
    if (aptFilters.priceMax !== null) {
      result = result.filter((i) => i.listing.price_monthly !== null && i.listing.price_monthly <= aptFilters.priceMax!);
    }

    // Bedrooms
    if (aptFilters.bedroomsMin !== null) {
      result = result.filter((i) => i.listing.bedrooms !== null && i.listing.bedrooms >= aptFilters.bedroomsMin!);
    }

    // Bathrooms
    if (aptFilters.bathroomsMin !== null) {
      result = result.filter((i) => i.listing.bathrooms !== null && i.listing.bathrooms >= aptFilters.bathroomsMin!);
    }

    // Surface
    if (aptFilters.surfaceMin !== null) {
      result = result.filter((i) => i.listing.surface_m2 !== null && i.listing.surface_m2 >= aptFilters.surfaceMin!);
    }
    if (aptFilters.surfaceMax !== null) {
      result = result.filter((i) => i.listing.surface_m2 !== null && i.listing.surface_m2 <= aptFilters.surfaceMax!);
    }

    // PEB
    if (aptFilters.pebRatings.length > 0) {
      result = result.filter((i) => i.listing.peb_rating !== null && aptFilters.pebRatings.includes(i.listing.peb_rating));
    }

    // Boolean amenities
    if (aptFilters.furnished === true) result = result.filter((i) => i.listing.furnished === true);
    if (aptFilters.hasParking === true) result = result.filter((i) => i.listing.has_parking === true);
    if (aptFilters.hasBalconyOrTerrace === true) {
      result = result.filter((i) => i.listing.has_balcony === true || i.listing.has_terrace === true);
    }
    if (aptFilters.hasGarden === true) result = result.filter((i) => i.listing.has_garden === true);
    if (aptFilters.petsAllowed === true) result = result.filter((i) => i.listing.pets_allowed === true);
    if (aptFilters.hasElevator === true) result = result.filter((i) => i.listing.has_elevator === true);

    // Score min
    if (aptFilters.scoreMin !== null) {
      result = result.filter((i) => {
        const score = i.evaluation?.overall_score ?? null;
        if (score === null) return true; // Keep unevaluated
        return score >= aptFilters.scoreMin!;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sort === "score") {
        return (b.evaluation?.overall_score ?? -1) - (a.evaluation?.overall_score ?? -1);
      }
      if (sort === "price") {
        return (a.listing.price_monthly ?? Infinity) - (b.listing.price_monthly ?? Infinity);
      }
      if (sort === "surface") {
        return (b.listing.surface_m2 ?? 0) - (a.listing.surface_m2 ?? 0);
      }
      if (sort === "distance") {
        return (distances.get(a.listing.id) ?? Infinity) - (distances.get(b.listing.id) ?? Infinity);
      }
      if (sort === "date") {
        return (b.listing.date_published || b.listing.date_scraped || "").localeCompare(a.listing.date_published || a.listing.date_scraped || "");
      }
      return 0;
    });

    return result;
  }, [items, filter, sort, aptFilters, distances]);

  // Reset page when filters/search/sort change
  useEffect(() => {
    setPage(1);
  }, [filter, sort, aptFilters]);

  // Paginated results
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(
    () => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filtered, page]
  );

  const handleStatusChange = (id: string, newStatus: ListingStatus) => {
    const prevStatus = items.find((i) => i.listing.id === id)?.status;
    setItems((prev) =>
      prev.map((item) =>
        item.listing.id === id ? { ...item, status: newStatus } : item
      )
    );
    const savedStates = JSON.parse(localStorage.getItem(APT_STATES_KEY) || "{}");
    savedStates[id] = newStatus;
    localStorage.setItem(APT_STATES_KEY, JSON.stringify(savedStates));
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
    const savedNotes = JSON.parse(localStorage.getItem(APT_NOTES_KEY) || "{}");
    savedNotes[id] = newNotes;
    localStorage.setItem(APT_NOTES_KEY, JSON.stringify(savedNotes));
  };

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

  const isListingNew = (item: ApartmentWithEval): boolean => {
    if (!lastVisitDate) return false;
    return item.listing.date_scraped > lastVisitDate;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPage = (p: number) => {
    setPage(p);
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {/* New listings notification */}
      {newCount > 0 && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between print:hidden">
          <span className="text-emerald-600 font-medium text-sm">
            {newCount} nouvelle{newCount > 1 ? "s" : ""} annonce{newCount > 1 ? "s" : ""} depuis ta dernière visite !
          </span>
          <button
            onClick={() => { setSort("date"); setNewCount(0); }}
            className="text-sm px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Voir
          </button>
        </div>
      )}

      {/* Sticky toolbar - single row */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2.5 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border-color)]/80 print:hidden">
        <div className="flex items-center gap-2">
          {/* Status tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide min-w-0">
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

          {/* Divider */}
          <div className="w-px h-7 bg-[var(--border-color)] shrink-0" />

          {/* Sort + Filter controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sort */}
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  sortOpen
                    ? "bg-white text-[var(--foreground)] shadow-md ring-1 ring-[var(--primary)]/30"
                    : "bg-white text-[var(--muted)] shadow-sm border border-[var(--border-color)] hover:shadow-md hover:border-[var(--primary)]/30"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span className="font-medium text-[var(--foreground)]">
                  {{ score: "Score", price: "Prix", surface: "Surface", distance: "Distance", date: "Publication" }[sort]}
                </span>
                <svg className={`w-3 h-3 text-[var(--muted)] transition-transform ${sortOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sortOpen && (
                <div className="absolute top-full mt-1.5 right-0 min-w-[220px] bg-white border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
                  {([
                    ["score", "Score", "star"],
                    ["price", "Prix", "currency"],
                    ["surface", "Surface", "area"],
                    ["distance", "Distance (Ixelles)", "pin"],
                    ["date", "Date de publication", "clock"],
                  ] as [SortType, string, string][]).map(([value, label, iconType]) => (
                    <button
                      key={value}
                      onClick={() => { setSort(value); setSortOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                        sort === value
                          ? "text-[var(--primary)] font-medium bg-[var(--primary)]/5"
                          : "text-[var(--foreground)] hover:bg-gray-50"
                      }`}
                    >
                      <span className="w-5 h-5 flex items-center justify-center text-[var(--muted)]">
                        {iconType === "star" && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        )}
                        {iconType === "currency" && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                        {iconType === "area" && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        )}
                        {iconType === "pin" && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                        {iconType === "clock" && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </span>
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

            {/* Divider between sort and filter */}
            <div className="w-px h-5 bg-[var(--border-color)]" />

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? "bg-white text-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]/30"
                  : "bg-white text-[var(--muted)] shadow-sm border border-[var(--border-color)] hover:shadow-md hover:border-[var(--primary)]/30"
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

          {/* Divider */}
          <div className="w-px h-7 bg-[var(--border-color)] shrink-0" />

          {/* View mode toggle */}
          <div className="flex gap-1 bg-[var(--surface)] p-1 rounded-xl shrink-0">
            {([
              ["list", "M4 6h16M4 10h16M4 14h16M4 18h16", "Liste"],
              ["map", "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z", "Carte"],
              ["split", "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7", "Les deux"],
            ] as const).map(([mode, pathD, title]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 rounded-lg transition-colors ${
                  mode === "split" ? "hidden md:block" : ""
                } ${
                  viewMode === mode
                    ? "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                title={title}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={pathD} />
                </svg>
              </button>
            ))}
          </div>

          {/* Result count */}
          <span className="text-sm text-[var(--muted-light)] shrink-0">
            {filtered.length}
            {totalPages > 1 && (
              <span className="ml-1">· p.{page}/{totalPages}</span>
            )}
          </span>
        </div>
      </div>

      {/* Collapsible filter panel */}
      <div className="mt-3 print:hidden">
        {showFilters && (
          <ApartmentFilterPanel
            filters={aptFilters}
            onChange={setAptFilters}
            onReset={() => setAptFilters({ ...DEFAULT_APARTMENT_FILTERS })}
            availableCommunes={availableCommunes}
            priceRange={priceRange}
          />
        )}
      </div>

      {/* Compare floating button */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 print:hidden">
          <button
            onClick={() => setCompareIds([])}
            className="p-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-full shadow-lg text-[var(--muted)] hover:text-red-500"
            title="Vider la sélection"
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
        <ApartmentComparePanel
          items={compareItems}
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
            ref={listRef}
            className={
              viewMode === "split"
                ? "w-1/2 overflow-y-auto max-h-[calc(100vh-180px)] grid grid-cols-1 gap-3 pr-2 auto-rows-max"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            }
          >
            {paginatedItems.map((item) => (
              <div
                key={item.listing.id}
                onMouseEnter={() => setHoveredListingId(item.listing.id)}
                onMouseLeave={() => setHoveredListingId(null)}
              >
                <ApartmentListingCard
                  item={item}
                  onStatusChange={handleStatusChange}
                  onNotesChange={handleNotesChange}
                  onToggleCompare={handleToggleCompare}
                  isHighlighted={hoveredListingId === item.listing.id}
                  isSelected={compareIds.includes(item.listing.id)}
                  isNew={isListingNew(item)}
                  distance={distances.get(item.listing.id) ?? null}
                />
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12 col-span-full">
                <svg className="w-12 h-12 mx-auto text-[var(--muted-light)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
                </svg>
                <p className="text-[var(--muted)] mb-1">Aucun appartement ne correspond</p>
                <p className="text-sm text-[var(--muted-light)]">Modifie tes filtres ou ta recherche</p>
              </div>
            )}

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-6 col-span-full">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-2 rounded-lg text-sm font-medium border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Précédent
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | "dots")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("dots");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "dots" ? (
                      <span key={`dots-${i}`} className="px-1 text-[var(--muted-light)]">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p as number)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === p
                            ? "bg-[var(--primary)] text-white shadow-sm"
                            : "border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] hover:bg-[var(--surface)]"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-2 rounded-lg text-sm font-medium border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
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
            <ApartmentListingsMapWrapper
              items={filtered}
              hoveredListingId={hoveredListingId}
              onMarkerHover={setHoveredListingId}
            />
          </div>
        )}
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-40 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-full shadow-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:shadow-xl transition-all print:hidden"
          title="Retour en haut"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}
