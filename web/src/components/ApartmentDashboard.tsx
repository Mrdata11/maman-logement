"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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

type FilterType = "all" | "new" | "favorite" | "active" | "in_discussion" | "archived";
type SortType = "score" | "price" | "surface" | "distance" | "date";
type ViewMode = "list" | "map" | "split";

const APT_STATES_KEY = "apartment_listing_states";
const APT_NOTES_KEY = "apartment_listing_notes";
const APT_LAST_VISIT_KEY = "apartment_last_visit_date";

export function ApartmentDashboard({
  initialItems,
}: {
  initialItems: ApartmentWithEval[];
}) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("score");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [aptFilters, setAptFilters] = useState<ApartmentFilterState>({ ...DEFAULT_APARTMENT_FILTERS });
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Compare state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // New listings detection
  const [lastVisitDate, setLastVisitDate] = useState<string | null>(null);
  const [newCount, setNewCount] = useState(0);

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
    active: items.filter((i) => ["contacted", "visit_planned", "visited"].includes(i.status)).length,
    in_discussion: items.filter((i) => i.status === "in_discussion").length,
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
        result = result.filter((i) => ["contacted", "visit_planned", "visited"].includes(i.status));
        break;
      default:
        result = result.filter((i) => i.status === filter);
        break;
    }

    // Inline search
    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.listing.title.toLowerCase().includes(query) ||
          i.listing.description.toLowerCase().includes(query) ||
          (i.listing.commune && i.listing.commune.toLowerCase().includes(query)) ||
          (i.listing.address && i.listing.address.toLowerCase().includes(query))
      );
    }

    // Filter panel search text
    if (aptFilters.searchText.trim()) {
      const query = aptFilters.searchText.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.listing.title.toLowerCase().includes(query) ||
          i.listing.description.toLowerCase().includes(query)
      );
    }

    // Communes
    if (aptFilters.communes.length > 0) {
      result = result.filter(
        (i) => i.listing.commune !== null && aptFilters.communes.includes(i.listing.commune)
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
        return (b.listing.date_scraped || "").localeCompare(a.listing.date_scraped || "");
      }
      return 0;
    });

    return result;
  }, [items, filter, sort, searchText, aptFilters, distances]);

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
              placeholder="Rechercher par commune, description..."
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
            ] as const).map(([mode, pathD, title]) => (
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={pathD} />
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
            <option value="score">Score</option>
            <option value="price">Prix</option>
            <option value="surface">Surface</option>
            <option value="distance">Distance (Ixelles)</option>
            <option value="date">Date</option>
          </select>

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

          {/* Result count */}
          <span className="text-sm text-[var(--muted-light)] ml-auto shrink-0">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
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
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-[var(--muted-light)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
                </svg>
                <p className="text-[var(--muted)] mb-1">Aucun appartement ne correspond</p>
                <p className="text-sm text-[var(--muted-light)]">Modifie tes filtres ou ta recherche</p>
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
    </div>
  );
}
