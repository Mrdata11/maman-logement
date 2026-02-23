"use client";

import { useState } from "react";
import { ListingWithEval } from "@/lib/types";

interface DecisionReportProps {
  favorites: ListingWithEval[];
  inDiscussion: ListingWithEval[];
}

export function DecisionReport({ favorites, inDiscussion }: DecisionReportProps) {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const listings = [...favorites, ...inDiscussion];

  const handleGenerate = async () => {
    if (listings.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listings: listings.map((item) => ({
            listing: {
              title: item.listing.title,
              location: item.listing.location,
              province: item.listing.province,
              price: item.listing.price,
            },
            evaluation: item.evaluation,
            notes: item.notes,
            status: item.status,
          })),
        }),
      });

      if (!response.ok) throw new Error("Erreur API");

      const data = await response.json();
      setReport(data.report);
    } catch {
      setError("Erreur lors de la generation du rapport. Verifie ta connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  if (listings.length === 0) return null;

  return (
    <div className="mt-6 print:mt-8">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg text-left hover:shadow-md transition-shadow print:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-indigo-900">
                Mon rapport de decision
              </p>
              <p className="text-sm text-indigo-600">
                L&apos;IA analyse tes {listings.length} annonces favorites et genere un rapport comparatif
              </p>
            </div>
          </div>
        </button>
      ) : (
        <div className="border border-indigo-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-b border-indigo-200">
            <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Rapport de decision ({listings.length} annonces)
            </h3>
            <div className="flex items-center gap-2">
              {report && (
                <button
                  onClick={() => window.print()}
                  className="text-sm px-3 py-1 border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-100:bg-indigo-900/30 print:hidden"
                >
                  Imprimer
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-indigo-400 hover:text-indigo-600:text-indigo-200 print:hidden"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4 bg-white">
            {!report && !isLoading && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-600 mb-4">
                  Le rapport analysera tes {favorites.length} favoris
                  {inDiscussion.length > 0 && ` et ${inDiscussion.length} annonces en discussion`}.
                </p>
                <button
                  onClick={handleGenerate}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                >
                  Generer le rapport
                </button>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-indigo-600">
                  Analyse en cours de tes {listings.length} annonces...
                </p>
              </div>
            )}

            {error && (
              <div className="text-center py-4">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={handleGenerate}
                  className="mt-2 text-sm px-4 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                >
                  Reessayer
                </button>
              </div>
            )}

            {report && (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {report}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2 print:hidden">
                  <button
                    onClick={handleGenerate}
                    className="text-sm px-4 py-1.5 border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-50:bg-indigo-900/30"
                  >
                    Regenerer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
