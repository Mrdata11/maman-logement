import { getListingsWithEvals } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Habitats groupés en Europe",
  description:
    "Parcourez toutes les annonces d’habitats groupés en Europe, évaluées automatiquement par IA selon vos critères de recherche.",
  openGraph: {
    title: "Habitats groupés en Europe",
    description:
      "Parcourez toutes les annonces d’habitats groupés en Europe, évaluées automatiquement par IA.",
  },
};

export default function HabitatsPage() {
  const items = getListingsWithEvals();

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">
        Recherche Habitat Group&eacute;
      </h1>
      <p className="text-[var(--muted)] mb-4 text-base">
        Annonces d&apos;habitats group&eacute;s en Europe, &eacute;valu&eacute;es
        automatiquement selon vos crit&egrave;res.
      </p>
      <Dashboard initialItems={items} />
    </div>
  );
}
