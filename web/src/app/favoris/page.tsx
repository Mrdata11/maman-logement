import { getListingsWithEvals } from "@/lib/data";
import { FavoritesPage } from "@/components/FavoritesPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes coups de cœur",
  description: "Ma sélection de coups de cœur d’habitats groupés.",
  robots: { index: false },
};

export default function Favoris() {
  const allItems = getListingsWithEvals();
  return <div className="max-w-6xl mx-auto"><FavoritesPage allItems={allItems} /></div>;
}
