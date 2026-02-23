import { getRetreatVenuesWithEvals } from "@/lib/retreats/data";
import { RetreatDashboard } from "@/components/retreats/RetreatDashboard";

export const metadata = {
  title: "Lieux de retraite - Trouvez le lieu parfait pour organiser votre retraite",
  description: "Annuaire de lieux adapt\u00e9s aux retraites de yoga, m\u00e9ditation, danse et bien-\u00eatre. Filtrez par capacit\u00e9, budget, cadre et \u00e9quipements.",
};

export default function RetraitesPage() {
  const items = getRetreatVenuesWithEvals();

  return <RetreatDashboard initialItems={items} />;
}
