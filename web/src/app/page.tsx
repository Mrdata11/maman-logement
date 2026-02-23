import { getListingsWithEvals } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  const items = getListingsWithEvals();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Recherche Habitat Group&eacute;
      </h1>
      <p className="text-gray-600 mb-6">
        Annonces d&apos;habitats group&eacute;s en Belgique, &eacute;valu&eacute;es automatiquement selon tes crit&egrave;res.
      </p>
      <Dashboard initialItems={items} />
    </div>
  );
}
