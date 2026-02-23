"use client";

import dynamic from "next/dynamic";
import type { ListingWithEval } from "@/lib/types";

const ListingsMap = dynamic(() => import("./ListingsMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
      Chargement de la carte...
    </div>
  ),
});

export function ListingsMapWrapper({
  items,
  hoveredListingId,
  onMarkerHover,
}: {
  items: ListingWithEval[];
  hoveredListingId: string | null;
  onMarkerHover: (id: string | null) => void;
}) {
  return (
    <ListingsMap
      items={items}
      hoveredListingId={hoveredListingId}
      onMarkerHover={onMarkerHover}
    />
  );
}
