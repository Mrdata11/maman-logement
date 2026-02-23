"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "retreat_hero_dismissed";

export function RetreatHeroBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (dismissed) return null;

  return (
    <div className="relative rounded-lg border bg-gradient-to-r from-teal-50 to-blue-50 p-6 mb-6">
      <button
        onClick={() => {
          setDismissed(true);
          localStorage.setItem(STORAGE_KEY, "true");
        }}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Trouvez le lieu parfait pour votre retraite
      </h2>
      <p className="text-gray-600 max-w-2xl">
        Parcourez notre s\u00e9lection de lieux adapt\u00e9s aux retraites de yoga, m\u00e9ditation,
        danse et bien-\u00eatre. Filtrez par capacit\u00e9, budget, cadre et \u00e9quipements
        pour trouver l'endroit id\u00e9al o\u00f9 organiser votre prochaine retraite.
      </p>
    </div>
  );
}
