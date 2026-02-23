import { getApartmentsWithEvals } from "@/lib/data";
import { ApartmentFavoritesClient } from "./client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes appartements favoris",
  description: "Ma sélection d’appartements favoris à Bruxelles.",
  robots: { index: false },
};

export default function ApartmentFavoritesPage() {
  const allItems = getApartmentsWithEvals();
  return <div className="max-w-6xl mx-auto"><ApartmentFavoritesClient allItems={allItems} /></div>;
}
