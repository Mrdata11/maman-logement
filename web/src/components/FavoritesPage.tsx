"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ListingWithEval,
  ListingStatus,
  STATUS_CONFIG,
  LISTING_TYPE_LABELS,
} from "@/lib/types";
import {
  haversineDistance,
  getListingCoordinates,
  DEFAULT_REFERENCE_POINT,
} from "@/lib/coordinates";
import { ScoreBadge } from "./ScoreBar";

type SortType = "score" | "date_added" | "price" | "distance" | "name";

const NOTES_STORAGE_KEY = "listing_notes";

export function FavoritesPage({ allItems }: { allItems: ListingWithEval[] }) {
  const [items, setItems] = useState<ListingWithEval[]>([]);
  const [sort, setSort] = useState<SortType>("score");
  const [mounted, setMounted] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  // Load favorites from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const savedStates = JSON.parse(localStorage.getItem("listing_states") || "{}");
      const savedNotes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || "{}");
      const favorites = allItems
        .map((item) => ({
          ...item,
          status: (savedStates[item.listing.id] as ListingStatus) || item.status,
          notes: savedNotes[item.listing.id] || item.notes,
        }))
        .filter((item) => item.status === "favorite");
      setItems(favorites);
    } catch {
      // Ignore
    }
  }, [allItems]);

  // Distances
  const distances = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const item of items) {
      const coords = getListingCoordinates(item.listing.location, item.listing.province);
      if (coords) {
        map.set(item.listing.id, haversineDistance(DEFAULT_REFERENCE_POINT, coords));
      } else {
        map.set(item.listing.id, null);
      }
    }
    return map;
  }, [items]);

  // Filter & Sort
  const sorted = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.listing.title.toLowerCase().includes(q) ||
          i.listing.description.toLowerCase().includes(q) ||
          (i.listing.location && i.listing.location.toLowerCase().includes(q)) ||
          (i.listing.province && i.listing.province.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sort === "score") {
        return (b.evaluation?.overall_score ?? -1) - (a.evaluation?.overall_score ?? -1);
      }
      if (sort === "price") {
        return (a.listing.price_amount ?? Infinity) - (b.listing.price_amount ?? Infinity);
      }
      if (sort === "distance") {
        return (distances.get(a.listing.id) ?? Infinity) - (distances.get(b.listing.id) ?? Infinity);
      }
      if (sort === "name") {
        return a.listing.title.localeCompare(b.listing.title);
      }
      // date_added - use date_scraped as proxy
      return (b.listing.date_scraped || "").localeCompare(a.listing.date_scraped || "");
    });
    return result;
  }, [items, sort, distances, searchText]);

  // Remove favorite
  const handleRemoveFavorite = useCallback((id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.listing.id !== id));
      const savedStates = JSON.parse(localStorage.getItem("listing_states") || "{}");
      savedStates[id] = "new";
      localStorage.setItem("listing_states", JSON.stringify(savedStates));
      setRemovingId(null);
      window.dispatchEvent(new CustomEvent("favorite-removed"));
    }, 300);
  }, []);

  // Save notes
  const handleNotesSave = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.listing.id === id ? { ...item, notes: localNotes } : item
        )
      );
      const savedNotes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || "{}");
      savedNotes[id] = localNotes;
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(savedNotes));
      setEditingNoteId(null);
    },
    [localNotes]
  );

  // Status change
  const handleStatusChange = useCallback((id: string, newStatus: ListingStatus) => {
    const savedStates = JSON.parse(localStorage.getItem("listing_states") || "{}");
    savedStates[id] = newStatus;
    localStorage.setItem("listing_states", JSON.stringify(savedStates));
    if (newStatus !== "favorite") {
      setRemovingId(id);
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.listing.id !== id));
        setRemovingId(null);
        window.dispatchEvent(new CustomEvent("favorite-removed"));
      }, 300);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Mes Coups de Coeur
            </h1>
            <p className="text-sm text-[var(--muted)]">
              {items.length === 0
                ? "Aucun favori pour le moment"
                : `${items.length} habitat${items.length > 1 ? "s" : ""} sélectionné${items.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-pink-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Pas encore de coups de coeur
          </h2>
          <p className="text-sm text-[var(--muted)] mb-6 max-w-md mx-auto">
            Parcourez les annonces et cliquez sur le coeur pour ajouter vos habitats préférés ici.
            Ils seront sauvegardés pour que vous puissiez les retrouver facilement.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Explorer les annonces
          </Link>
        </div>
      )}

      {/* Toolbar */}
      {items.length > 0 && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Rechercher dans mes favoris..."
              className="w-full pl-10 pr-8 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-light)] hover:text-[var(--foreground)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] shrink-0"
          >
            <option value="score">Meilleur score</option>
            <option value="price">Prix croissant</option>
            <option value="distance">Plus proche</option>
            <option value="name">Alphabétique</option>
            <option value="date_added">Plus récent</option>
          </select>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 border border-[var(--border-color)] text-[var(--muted)] rounded-lg hover:bg-[var(--surface)] text-sm transition-colors print:hidden shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimer
          </button>

          {/* Back to listings */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--surface)] text-[var(--muted)] rounded-lg hover:bg-[var(--surface)] text-sm transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Toutes les annonces
          </Link>
        </div>
      )}

      {/* Search results info */}
      {searchText && items.length > 0 && (
        <p className="text-sm text-[var(--muted)] mb-4">
          {sorted.length} résultat{sorted.length !== 1 ? "s" : ""} pour &quot;{searchText}&quot;
        </p>
      )}

      {/* Favorites grid */}
      <div className="space-y-4 print:space-y-6">
        {sorted.map((item) => {
          const dist = distances.get(item.listing.id);
          const isRemoving = removingId === item.listing.id;

          return (
            <div
              key={item.listing.id}
              className={`group bg-[var(--card-bg)] rounded-xl border border-pink-200 transition-all duration-300 print:break-inside-avoid ${
                isRemoving ? "opacity-0 scale-95 -translate-x-4" : "opacity-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="sm:w-56 shrink-0 overflow-hidden rounded-t-xl sm:rounded-t-none sm:rounded-l-xl">
                  {item.listing.images.length > 0 ? (
                    <Link href={`/listing/${item.listing.id}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.listing.images[0]}
                        alt=""
                        className="w-full h-40 sm:h-full object-cover hover:opacity-90 transition-opacity"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </Link>
                  ) : (
                    <div className="w-full h-40 sm:h-full bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-pink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-5 min-w-0">
                  {/* Top row: badges */}
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {item.evaluation && (
                      <ScoreBadge score={item.evaluation.overall_score} />
                    )}
                    {item.listing.listing_type && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)]">
                        {LISTING_TYPE_LABELS[item.listing.listing_type] || item.listing.listing_type}
                      </span>
                    )}
                    {item.listing.price && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                        {item.listing.price}
                      </span>
                    )}
                    {dist != null && (
                      <span className="text-xs px-2 py-0.5 rounded bg-sky-50 text-sky-700">
                        ~{Math.round(dist)} km de Bruxelles
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <Link
                    href={`/listing/${item.listing.id}`}
                    className="text-lg font-semibold text-[var(--foreground)] hover:text-pink-600 line-clamp-2 transition-colors"
                  >
                    {item.listing.title}
                  </Link>

                  {/* Location */}
                  {(item.listing.location || item.listing.province) && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-[var(--muted)]">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>
                        {item.listing.location}
                        {item.listing.province && item.listing.province !== item.listing.location && `, ${item.listing.province}`}
                      </span>
                    </div>
                  )}

                  {/* AI Summary */}
                  {item.evaluation && (
                    <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">
                      {item.evaluation.match_summary}
                    </p>
                  )}

                  {/* Highlights & Concerns */}
                  {item.evaluation && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.evaluation.highlights.slice(0, 3).map((h, i) => (
                        <span
                          key={i}
                          className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded"
                        >
                          {h}
                        </span>
                      ))}
                      {item.evaluation.concerns.slice(0, 2).map((c, i) => (
                        <span
                          key={i}
                          className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes section */}
                  {editingNoteId === item.listing.id ? (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <textarea
                        value={localNotes}
                        onChange={(e) => setLocalNotes(e.target.value)}
                        placeholder="Vos impressions, questions, points importants..."
                        rows={3}
                        autoFocus
                        className="w-full px-3 py-2 text-sm border border-amber-300 rounded-md bg-[var(--input-bg)] text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleNotesSave(item.listing.id)}
                          className="text-sm px-3 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700"
                        >
                          Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="text-sm px-3 py-1 text-[var(--muted)] hover:text-[var(--foreground)]"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : item.notes ? (
                    <div
                      onClick={() => {
                        setEditingNoteId(item.listing.id);
                        setLocalNotes(item.notes);
                      }}
                      className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-[11px] font-medium text-amber-600">
                          Mes notes
                        </span>
                      </div>
                      <p className="text-sm text-amber-900 whitespace-pre-wrap line-clamp-3">
                        {item.notes}
                      </p>
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap print:hidden">
                    <Link
                      href={`/listing/${item.listing.id}`}
                      className="text-sm px-3 py-1.5 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
                    >
                      Voir détail
                    </Link>
                    <a
                      href={item.listing.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm px-3 py-1.5 border border-[var(--border-color)] text-[var(--muted)] rounded-md hover:bg-[var(--surface)] transition-colors"
                    >
                      Source
                    </a>
                    {!item.notes && (
                      <button
                        onClick={() => {
                          setEditingNoteId(item.listing.id);
                          setLocalNotes("");
                        }}
                        className="text-sm px-3 py-1.5 border border-[var(--border-color)] text-[var(--muted)] rounded-md hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Ajouter une note
                      </button>
                    )}

                    {/* Status change dropdown */}
                    <StatusDropdown
                      currentStatus="favorite"
                      onStatusChange={(s) => handleStatusChange(item.listing.id, s)}
                    />

                    {/* Remove from favorites */}
                    <button
                      onClick={() => handleRemoveFavorite(item.listing.id)}
                      className="ml-auto text-sm px-3 py-1.5 text-[var(--muted-light)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Retirer des coups de coeur"
                    >
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Retirer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom spacing */}
      {items.length > 0 && <div className="h-8" />}
    </div>
  );
}

// Small status dropdown sub-component
function StatusDropdown({
  currentStatus,
  onStatusChange,
}: {
  currentStatus: ListingStatus;
  onStatusChange: (s: ListingStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm px-3 py-1.5 border border-[var(--border-color)] text-[var(--muted)] rounded-md hover:bg-[var(--surface)] transition-colors"
      >
        Changer statut
        <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 bottom-full z-20 mb-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[180px]">
            {(Object.keys(STATUS_CONFIG) as ListingStatus[])
              .filter((s) => s !== currentStatus)
              .map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onStatusChange(s);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface)] flex items-center gap-2"
                >
                  <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_CONFIG[s].color}`}>
                    {STATUS_CONFIG[s].label}
                  </span>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
