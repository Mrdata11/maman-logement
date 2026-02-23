import { getRetreatVenuesWithEvals } from "@/lib/retreats/data";
import { RetreatDashboard } from "@/components/retreats/RetreatDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lieux de retraite",
  description:
    "Annuaire de lieux adapt\u00e9s aux retraites de yoga, m\u00e9ditation, danse et bien-\u00eatre. Filtrez par capacit\u00e9, budget, cadre et \u00e9quipements.",
  openGraph: {
    title: "Lieux de retraite",
    description:
      "Trouvez le lieu parfait pour organiser votre retraite. Filtrez par capacit\u00e9, budget et \u00e9quipements.",
  },
};

export default function RetraitesPage() {
  const items = getRetreatVenuesWithEvals();

  return <RetreatDashboard initialItems={items} />;
}
