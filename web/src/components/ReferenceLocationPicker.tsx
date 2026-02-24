"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ReferenceLocation,
  LOCATION_COORDINATES,
  resolveLocationCoordinates,
  saveReferenceLocation,
} from "@/lib/coordinates";

interface ReferenceLocationPickerProps {
  value: ReferenceLocation | null;
  onChange: (ref: ReferenceLocation | null) => void;
}

export function ReferenceLocationPicker({
  value,
  onChange,
}: ReferenceLocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fermer le dropdown au clic exterieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus l'input quand le dropdown s'ouvre
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filteredLocations = useMemo(() => {
    const q = search.toLowerCase().trim();
    const entries = Object.keys(LOCATION_COORDINATES).sort((a, b) =>
      a.localeCompare(b, "fr")
    );
    if (!q) return entries.slice(0, 20);
    return entries.filter((name) => name.toLowerCase().includes(q)).slice(0, 20);
  }, [search]);

  const handleSelect = (name: string) => {
    const resolved = resolveLocationCoordinates(name);
    if (resolved) {
      saveReferenceLocation(resolved);
      onChange(resolved);
    }
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("reference_location");
    }
    onChange(null);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-sm transition-colors ${
          value
            ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5"
            : "border-[var(--input-border)] text-[var(--muted)] hover:border-[var(--primary)]/50 bg-[var(--input-bg)]"
        }`}
        title={value ? `Distance depuis ${value.name}` : "Choisir une ville de référence"}
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="font-medium max-w-[120px] truncate">
          {value ? value.name : "Ma ville"}
        </span>
        <svg
          className={`w-3 h-3 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 min-w-[240px] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
          <div className="p-2 border-b border-[var(--border-color)]/50">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher une ville..."
              className="w-full px-3 py-1.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {value && (
              <button
                onClick={handleClear}
                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 border-b border-[var(--border-color)]/30"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Retirer la ville
              </button>
            )}
            {filteredLocations.length === 0 && (
              <p className="px-4 py-3 text-sm text-[var(--muted)]">
                Aucune ville trouvée
              </p>
            )}
            {filteredLocations.map((name) => (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  value?.name === name
                    ? "text-[var(--primary)] font-medium bg-[var(--primary)]/5"
                    : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                }`}
              >
                {name}
                {value?.name === name && (
                  <svg className="w-3.5 h-3.5 inline ml-2 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
