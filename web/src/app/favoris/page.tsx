import { getListingsWithEvals } from "@/lib/data";
import { FavoritesPage } from "@/components/FavoritesPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes coups de c\u0153ur",
  description: "Ma s\u00e9lection de coups de c\u0153ur d\u2019habitats group\u00e9s.",
  robots: { index: false },
};

export default function Favoris() {
  const allItems = getListingsWithEvals();
  return <FavoritesPage allItems={allItems} />;
}
