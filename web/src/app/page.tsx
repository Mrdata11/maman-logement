import { getListingsWithEvals } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";
import { HeroBanner } from "@/components/HeroBanner";

export default function Home() {
  const items = getListingsWithEvals();

  return (
    <div>
      <HeroBanner />
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
