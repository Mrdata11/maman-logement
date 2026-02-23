import { getApartmentsWithEvals } from "@/lib/data";
import { ApartmentDashboard } from "@/components/ApartmentDashboard";

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
