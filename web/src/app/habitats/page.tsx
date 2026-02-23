import { getListingsWithEvals } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Habitats group\u00e9s - Maman Logement",
  description:
    "Parcourez toutes les annonces d\u2019habitats group\u00e9s en Belgique et en Europe, \u00e9valu\u00e9es automatiquement selon vos crit\u00e8res.",
};

export default function HabitatsPage() {
  const items = getListingsWithEvals();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">
        Recherche Habitat Group&eacute;
      </h1>
      <p className="text-[var(--muted)] mb-4 text-base">
        Annonces d&apos;habitats group&eacute;s en Belgique, &eacute;valu&eacute;es
        automatiquement selon vos crit&egrave;res.
      </p>
      <Dashboard initialItems={items} />
    </div>
  );
}
