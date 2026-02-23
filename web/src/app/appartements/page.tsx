import { getApartmentsWithEvals } from "@/lib/data";
import { ApartmentDashboard } from "@/components/ApartmentDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appartements Bruxelles",
  description:
    "Appartements 2+ chambres \u00e0 louer \u00e0 Bruxelles, proches d\u2019Ixelles. Annonces \u00e9valu\u00e9es par IA avec score de qualit\u00e9.",
  openGraph: {
    title: "Appartements Bruxelles",
    description:
      "Appartements 2+ chambres \u00e0 louer \u00e0 Bruxelles, proches d\u2019Ixelles. \u00c9valu\u00e9s par IA.",
  },
};

export default function AppartementsPage() {
  const items = getApartmentsWithEvals();

  return (
    <div>
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
