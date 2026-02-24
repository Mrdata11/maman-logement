import type { Metadata } from "next";
import { OutreachDashboard } from "@/components/admin/outreach/OutreachDashboard";

export const metadata: Metadata = {
  title: "Outreach | Admin",
  description:
    "Tableau de bord des campagnes d'outreach pour les lieux de retraite.",
  robots: { index: false },
};

export default function OutreachPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <OutreachDashboard />
    </div>
  );
}
