"use client";

import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [largeText, setLargeText] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLargeText = localStorage.getItem("large_text");
    if (savedLargeText === "true") {
      setLargeText(true);
      document.body.classList.add("large-text");
    }
  }, []);

  const toggleLargeText = () => {
    const next = !largeText;
    setLargeText(next);
    if (next) {
      document.body.classList.add("large-text");
      localStorage.setItem("large_text", "true");
    } else {
      document.body.classList.remove("large-text");
      localStorage.setItem("large_text", "false");
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleLargeText}
      className={`p-2 rounded-md border transition-colors ${
        largeText
          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
          : "border-[var(--border-color)] hover:bg-[var(--surface)] text-[var(--muted)]"
      }`}
      aria-label={largeText ? "Texte normal" : "Grands caracteres"}
      title={largeText ? "Texte normal" : "Grands caracteres"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <text x="3" y="18" fontSize={largeText ? "18" : "14"} fontWeight="bold" fill="currentColor" stroke="none">A</text>
        <text x="14" y="18" fontSize="10" fill="currentColor" stroke="none">A</text>
      </svg>
    </button>
  );
}
