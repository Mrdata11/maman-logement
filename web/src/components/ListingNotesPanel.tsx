"use client";

import { useState } from "react";

interface ListingNotesPanelProps {
  notes: string;
  onSave: (notes: string) => void;
  onClose: () => void;
}

export function ListingNotesPanel({ notes, onSave, onClose }: ListingNotesPanelProps) {
  const [localNotes, setLocalNotes] = useState(notes);

  return (
    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg animate-fadeIn">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-amber-800">
          Mes notes
        </h3>
        <button
          onClick={onClose}
          className="text-amber-400 hover:text-amber-600"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <textarea
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        placeholder="Tes impressions, questions, points importants..."
        rows={3}
        autoFocus
        className="w-full px-3 py-2 text-sm border border-amber-300 rounded-md bg-[var(--input-bg)] text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onSave(localNotes)}
          className="text-sm px-4 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-medium"
        >
          Sauvegarder
        </button>
        <button
          onClick={onClose}
          className="text-sm px-3 py-1.5 text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
