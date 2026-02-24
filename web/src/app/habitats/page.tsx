import { getAllListingsWithEvals } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";
import type { Metadata } from "next";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Habitats groupés en Europe",
  description:
    "Explore les annonces d'habitats groupés en Europe, évaluées par IA pour t'aider à trouver le lieu qui te correspond.",
  openGraph: {
    title: "Habitats groupés en Europe",
    description:
      "Explore les annonces d'habitats groupés en Europe, évaluées par IA pour trouver ton lieu de vie idéal.",
  },
};

export default async function HabitatsPage() {
  const items = await getAllListingsWithEvals();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Ton futur chez-toi existe d&eacute;j&agrave;
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Des lieux de vie partag&eacute;s en Europe, &eacute;valu&eacute;s pour toi.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <a
            href="/creer"
            className="px-5 py-2.5 border border-[var(--primary)]/40 text-[var(--primary)] rounded-xl text-sm font-medium hover:bg-[var(--primary)]/5 transition-colors inline-flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Ajouter un projet
          </a>
        </div>
      </div>
      <Dashboard initialItems={items} />
    </div>
  );
}
