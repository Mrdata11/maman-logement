"use client";

import { ScreeningCallInterface } from "./ScreeningCallInterface";

interface TestCallOverlayProps {
  token: string;
  onClose: () => void;
}

export function TestCallOverlay({ token, onClose }: TestCallOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--background)]">
      {/* Bouton quitter */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-full border border-[var(--border-light)] shadow-lg hover:shadow-xl transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Quitter le test
      </button>

      <ScreeningCallInterface token={token} />
    </div>
  );
}
