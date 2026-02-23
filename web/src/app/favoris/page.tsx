import { getListingsWithEvals } from "@/lib/data";
import { FavoritesPage } from "@/components/FavoritesPage";

export const metadata = {
  title: "Mes Coups de Coeur - Cohabitat Europe",
  description: "Ma sélection de coups de coeur d'habitats groupés",
};

export default function Favoris() {
  const allItems = getListingsWithEvals();
  return <FavoritesPage allItems={allItems} />;
}
