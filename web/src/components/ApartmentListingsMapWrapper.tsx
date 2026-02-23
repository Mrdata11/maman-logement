"use client";

import dynamic from "next/dynamic";
import type { ApartmentWithEval } from "@/lib/types";

const ApartmentListingsMap = dynamic(() => import("./ApartmentListingsMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
      Chargement de la carte...
    </div>
  ),
});

export function ApartmentListingsMapWrapper({
  items,
  hoveredListingId,
  onMarkerHover,
  onArchive,
}: {
  items: ApartmentWithEval[];
  hoveredListingId: string | null;
  onMarkerHover: (id: string | null) => void;
  onArchive?: (id: string) => void;
}) {
  return (
    <ApartmentListingsMap
      items={items}
      hoveredListingId={hoveredListingId}
      onMarkerHover={onMarkerHover}
      onArchive={onArchive}
    />
  );
}
