import { getApartmentsWithEvals } from "@/lib/data";
import { ApartmentDashboard } from "@/components/ApartmentDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appartements Bruxelles",
  description:
    "Appartements 2+ chambres à louer à Bruxelles, proches d’Ixelles. Annonces évaluées par IA avec score de qualité.",
  openGraph: {
    title: "Appartements Bruxelles",
    description:
      "Appartements 2+ chambres à louer à Bruxelles, proches d’Ixelles. Évalués par IA.",
  },
};

export default function AppartementsPage() {
  const items = getApartmentsWithEvals();

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
        Appartements Bruxelles
      </h1>
      <p className="text-[var(--muted)] mb-6 text-base">
        Appartements 2+ chambres &agrave; louer &agrave; Bruxelles, proches d&apos;Ixelles.
      </p>
      <ApartmentDashboard initialItems={items} />
    </div>
  );
}
