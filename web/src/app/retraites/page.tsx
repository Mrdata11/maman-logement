import { getRetreatVenuesWithEvals } from "@/lib/retreats/data";
import { RetreatDashboard } from "@/components/retreats/RetreatDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lieux de retraite",
  description:
    "Annuaire de lieux adaptés aux retraites de yoga, méditation, danse et bien-être. Filtrez par capacité, budget, cadre et équipements.",
  openGraph: {
    title: "Lieux de retraite",
    description:
      "Trouvez le lieu parfait pour organiser votre retraite. Filtrez par capacité, budget et équipements.",
  },
};

export default function RetraitesPage() {
  const items = getRetreatVenuesWithEvals();

  return <div className="max-w-6xl mx-auto"><RetreatDashboard initialItems={items} /></div>;
}
