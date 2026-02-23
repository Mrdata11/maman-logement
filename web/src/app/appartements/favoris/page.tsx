import { getApartmentsWithEvals } from "@/lib/data";
import { ApartmentFavoritesClient } from "./client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes appartements favoris",
  description: "Ma s\u00e9lection d\u2019appartements favoris \u00e0 Bruxelles.",
  robots: { index: false },
};

export default function ApartmentFavoritesPage() {
  const allItems = getApartmentsWithEvals();
  return <ApartmentFavoritesClient allItems={allItems} />;
}
