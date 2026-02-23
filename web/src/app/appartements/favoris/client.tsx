"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ApartmentWithEval, ListingStatus, PEB_RATING_COLORS } from "@/lib/types";
import { haversineDistance, IXELLES_CENTER } from "@/lib/coordinates";

const APT_STATES_KEY = "apartment_listing_states";
const APT_NOTES_KEY = "apartment_listing_notes";

export function ApartmentFavoritesClient({ allItems }: { allItems: ApartmentWithEval[] }) {
  const [items, setItems] = useState(allItems);

  // Load states from localStorage
  useEffect(() => {
    const savedStates = JSON.parse(localStorage.getItem(APT_STATES_KEY) || "{}");
    const savedNotes = JSON.parse(localStorage.getItem(APT_NOTES_KEY) || "{}");
    setItems(
      allItems.map((item) => ({
        ...item,
        status: (savedStates[item.listing.id] as ListingStatus) || item.status,
        notes: savedNotes[item.listing.id] || item.notes,
      }))
    );
  }, [allItems]);

  const favorites = useMemo(
    () => items.filter((i) => i.status === "favorite"),
    [items]
  );

  const handleRemove = (id: string) => {
    const savedStates = JSON.parse(localStorage.getItem(APT_STATES_KEY) || "{}");
    savedStates[id] = "new";
    localStorage.setItem(APT_STATES_KEY, JSON.stringify(savedStates));
    setItems((prev) =>
      prev.map((item) =>
        item.listing.id === id ? { ...item, status: "new" } : item
      )
    );
  };

  return (
    <div>
      <Link
        href="/appartements"
        className="text-[var(--primary)] hover:opacity-80 text-sm mb-4 inline-flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux appartements
      </Link>

      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Mes favoris ({favorites.length})
      </h1>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-[var(--muted-light)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-[var(--muted)] mb-2">Aucun favori pour le moment</p>
          <Link href="/appartements" className="text-[var(--primary)] hover:underline text-sm">
            Parcourir les appartements
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((item) => {
            const { listing, evaluation } = item;
            const distance =
              listing.latitude && listing.longitude
                ? haversineDistance(IXELLES_CENTER, { lat: listing.latitude, lng: listing.longitude })
                : null;

            return (
              <div
                key={listing.id}
                className="p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl flex gap-4"
              >
                {listing.images[0] && (
                  <img
                    src={listing.images[0]}
                    alt=""
                    className="w-24 h-24 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {evaluation && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        evaluation.overall_score >= 70 ? "bg-emerald-100 text-emerald-800" :
                        evaluation.overall_score >= 40 ? "bg-amber-100 text-amber-800" :
                        "bg-rose-100 text-rose-800"
                      }`}>
                        {evaluation.overall_score}/100
                      </span>
                    )}
                    {listing.price_monthly && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {listing.price_monthly.toLocaleString("fr-BE")} €/mois
                      </span>
                    )}
                    {listing.bedrooms && (
                      <span className="text-xs text-[var(--muted)]">{listing.bedrooms} ch.</span>
                    )}
                    {listing.surface_m2 && (
                      <span className="text-xs text-[var(--muted)]">{listing.surface_m2} m²</span>
                    )}
                    {listing.peb_rating && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${PEB_RATING_COLORS[listing.peb_rating] || ""}`}>
                        {listing.peb_rating}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/appartements/listing/${listing.id}`}
                    className="text-base font-semibold text-[var(--foreground)] hover:text-[var(--primary)]"
                  >
                    {listing.title}
                  </Link>
                  <div className="text-xs text-[var(--muted)] mt-0.5">
                    {listing.commune}
                    {distance !== null && ` · ${distance.toFixed(1)} km d'Ixelles`}
                  </div>
                  {evaluation?.match_summary && (
                    <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">
                      {evaluation.match_summary}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <button
                    onClick={() => handleRemove(listing.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Retirer des favoris"
                  >
                    <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <a
                    href={listing.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-[var(--muted-light)] hover:text-[var(--foreground)] transition-colors"
                    title="Voir sur Immoweb"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
