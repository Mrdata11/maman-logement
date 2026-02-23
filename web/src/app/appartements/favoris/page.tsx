import { getApartmentsWithEvals } from "@/lib/data";
import { ApartmentFavoritesClient } from "./client";

export default function ApartmentFavoritesPage() {
  const allItems = getApartmentsWithEvals();
  return <ApartmentFavoritesClient allItems={allItems} />;
}
