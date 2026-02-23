import { notFound } from "next/navigation";
import { getRetreatVenueById, getRetreatVenuesWithEvals } from "@/lib/retreats/data";
import { RetreatVenueDetail } from "@/components/retreats/RetreatVenueDetail";

export function generateStaticParams() {
  const items = getRetreatVenuesWithEvals();
  return items.map((item) => ({ id: item.venue.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getRetreatVenueById(id);
  if (!item) return { title: "Lieu non trouv\u00e9" };
  return {
    title: `${item.venue.name} - ${item.venue.city || item.venue.region || ""} | Lieux de retraite`,
    description: item.evaluation?.ai_description || item.venue.description.slice(0, 160),
  };
}

export default async function RetreatVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getRetreatVenueById(id);

  if (!item) {
    notFound();
  }

  return <RetreatVenueDetail item={item} />;
}
