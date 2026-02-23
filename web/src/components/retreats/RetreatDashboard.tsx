"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  RetreatVenueWithEval,
  RetreatFilterState,
  DEFAULT_RETREAT_FILTERS,
  VenueStatus,
} from "@/lib/retreats/types";
import { applyRetreatFilters, countActiveFilters } from "@/lib/retreats/filters";
import { RetreatVenueCard } from "./RetreatVenueCard";
import { RetreatFilterPanel } from "./RetreatFilterPanel";
import { RetreatHeroBanner } from "./RetreatHeroBanner";

type SortType = "score" | "price" | "capacity";
type ViewMode = "list" | "map" | "split";

const STATUSES_STORAGE_KEY = "retreat_venue_statuses";
const NOTES_STORAGE_KEY = "retreat_venue_notes";

export function RetreatDashboard({
  initialItems,
}: {
  initialItems: RetreatVenueWithEval[];
}) {
  const [items, setItems] = useState(initialItems);
  const [sort, setSort] = useState<SortType>("score");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filters, setFilters] = useState<RetreatFilterState>({ ...DEFAULT_RETREAT_FILTERS });
  const [showFilters, setShowFilters] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"all" | "favorite">("all");

  // Load persisted statuses and notes
  useEffect(() => {
    try {
      const savedStatuses = localStorage.getItem(STATUSES_STORAGE_KEY);
      const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
      const statusMap: Record<string, VenueStatus> = savedStatuses ? JSON.parse(savedStatuses) : {};
      const notesMap: Record<string, string> = savedNotes ? JSON.parse(savedNotes) : {};

      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          status: statusMap[item.venue.id] || item.status,
          notes: notesMap[item.venue.id] || item.notes,
        }))
      );
    } catch { /* ignore */ }
  }, []);

  const handleStatusChange = useCallback((id: string, status: VenueStatus) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.venue.id === id ? { ...item, status } : item
      );
      const statusMap: Record<string, VenueStatus> = {};
      updated.forEach((item) => { statusMap[item.venue.id] = item.status; });
      localStorage.setItem(STATUSES_STORAGE_KEY, JSON.stringify(statusMap));
      return updated;
    });
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  }, []);

  // Available countries from data
  const availableCountries = useMemo(() => {
    const countries = new Set<string>();
    items.forEach((item) => {
      if (item.venue.country) countries.add(item.venue.country);
    });
    return Array.from(countries).sort();
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => applyRetreatFilters(item, filters));

    // Status filter
    if (statusFilter === "favorite") {
      result = result.filter((item) => item.status === "favorite");
    }

    // Sort
    result.sort((a, b) => {
      if (sort === "score") {
        const sa = a.evaluation?.overall_score ?? 0;
        const sb = b.evaluation?.overall_score ?? 0;
        return sb - sa;
      }
      if (sort === "price") {
        const pa = a.venue.price_per_person_per_night ?? Infinity;
        const pb = b.venue.price_per_person_per_night ?? Infinity;
        return pa - pb;
      }
      if (sort === "capacity") {
        const ca = a.venue.capacity_max ?? 0;
        const cb = b.venue.capacity_max ?? 0;
        return cb - ca;
      }
      return 0;
    });

    return result;
  }, [items, filters, sort, statusFilter]);

  const activeFilterCount = countActiveFilters(filters);
  const favoriteCount = items.filter((i) => i.status === "favorite").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <RetreatHeroBanner />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">
            {filteredItems.length} lieu{filteredItems.length !== 1 ? "x" : ""}
          </h1>

          {/* Status filter */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setStatusFilter("all")}
              className={`text-xs px-3 py-1 rounded-md ${
                statusFilter === "all" ? "bg-white shadow-sm font-medium" : "text-gray-500"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter("favorite")}
              className={`text-xs px-3 py-1 rounded-md flex items-center gap-1 ${
                statusFilter === "favorite" ? "bg-white shadow-sm font-medium" : "text-gray-500"
              }`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {favoriteCount > 0 && favoriteCount}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="score">Score</option>
            <option value="price">Prix</option>
            <option value="capacity">Capacité</option>
          </select>

          {/* View mode */}
          <div className="flex border rounded-lg overflow-hidden">
            {(["list", "map", "split"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs ${
                  viewMode === mode
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {mode === "list" ? "Liste" : mode === "map" ? "Carte" : "Split"}
              </button>
            ))}
          </div>

          {/* Filter toggle (mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-1 text-sm border rounded-lg px-3 py-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtres
            {activeFilterCount > 0 && (
              <span className="bg-gray-900 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Compare bar */}
      {compareIds.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-800">
            {compareIds.size} lieu{compareIds.size > 1 ? "x" : ""} sélectionné{compareIds.size > 1 ? "s" : ""} pour comparaison
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCompareIds(new Set())}
              className="text-xs text-blue-600 hover:underline"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex gap-6">
        {/* Sidebar filters (desktop) */}
        <div className={`w-72 flex-shrink-0 ${showFilters ? "block" : "hidden"} lg:block`}>
          <RetreatFilterPanel
            filters={filters}
            onChange={setFilters}
            availableCountries={availableCountries}
          />
        </div>

        {/* Listing area */}
        <div className="flex-1 min-w-0">
          {viewMode === "list" || viewMode === "split" ? (
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-lg mb-2">Aucun lieu trouvé</p>
                  <p className="text-sm">Essayez de modifier vos filtres</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <RetreatVenueCard
                    key={item.venue.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    onToggleCompare={toggleCompare}
                    isSelected={compareIds.has(item.venue.id)}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              Carte (Phase 3 - Leaflet)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
