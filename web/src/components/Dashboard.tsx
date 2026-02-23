"use client";

import { useState, useMemo } from "react";
import { ListingWithEval, ListingStatus } from "@/lib/types";
import { ListingCard } from "./ListingCard";

type FilterType = "all" | "new" | "in_discussion" | "archived";
type SortType = "score" | "date" | "price";

export function Dashboard({
  initialItems,
}: {
  initialItems: ListingWithEval[];
}) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("score");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

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

    // Sort
    result.sort((a, b) => {
      if (sort === "score") {
        const sa = a.evaluation?.overall_score ?? -1;
        const sb = b.evaluation?.overall_score ?? -1;
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
  }, [items, filter, sort, sourceFilter]);

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
  useState(() => {
    if (typeof window !== "undefined") {
      const saved = JSON.parse(
        localStorage.getItem("listing_states") || "{}"
      );
      if (Object.keys(saved).length > 0) {
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            status: saved[item.listing.id] || item.status,
          }))
        );
      }
    }
  });

  return (
    <div>
      {/* Stats */}
      <div className="mb-4 text-sm text-gray-500">
        {items.length} annonces au total &middot;{" "}
        {items.filter((i) => i.evaluation).length} {"\u00e9valu\u00e9es par l'IA"}
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
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort and source filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortType)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
        >
          <option value="score">Trier par score</option>
          <option value="date">Trier par date</option>
          <option value="price">Trier par prix</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
        >
          <option value="all">Toutes les sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Listings */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <ListingCard
            key={item.listing.id}
            item={item}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune annonce ne correspond aux filtres s&eacute;lectionn&eacute;s.
        </div>
      )}
    </div>
  );
}
