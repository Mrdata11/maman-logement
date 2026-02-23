"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function FavoritesNav() {
  const [hasFavorites, setHasFavorites] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const pathname = usePathname();
  const isActive = pathname === "/favoris";

  const loadFavorites = useCallback(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("listing_states") || "{}");
      setHasFavorites(Object.values(saved).some((s) => s === "favorite"));
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    const handleFavoriteAdded = () => {
      loadFavorites();
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
    };

    const handleFavoriteRemoved = () => {
      loadFavorites();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "listing_states") loadFavorites();
    };

    window.addEventListener("favorite-added", handleFavoriteAdded);
    window.addEventListener("favorite-removed", handleFavoriteRemoved);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("favorite-added", handleFavoriteAdded);
      window.removeEventListener("favorite-removed", handleFavoriteRemoved);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadFavorites]);

  if (!mounted) return null;

  return (
    <Link
      href="/favoris"
      className={`p-2 rounded-md border transition-colors ${
        isActive
          ? "border-pink-400 bg-pink-50 text-pink-600"
          : hasFavorites
            ? "border-[var(--border-color)] text-pink-500 hover:bg-pink-50"
            : "border-[var(--border-color)] text-[var(--muted)] hover:bg-[var(--surface)]"
      }`}
      aria-label="Mes coups de coeur"
      title="Mes coups de coeur"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={hasFavorites || isActive ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animating ? "favorites-heart-bounce" : ""}
      >
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </Link>
  );
}
