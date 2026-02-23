"use client";

import { useEffect, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ListingWithEval, LISTING_TYPE_LABELS } from "@/lib/types";
import {
  LOCATION_COORDINATES,
  BELGIUM_CENTER,
  DEFAULT_ZOOM,
  getJitteredCoordinates,
} from "@/lib/coordinates";

// --- Pin prix style Airbnb ---

function formatPinPrice(
  priceAmount: number | null,
  price: string | null,
): string {
  if (priceAmount) {
    if (priceAmount >= 1000) return `${Math.round(priceAmount / 1000)}k\u20ac`;
    return `${priceAmount}\u20ac`;
  }
  if (price) {
    const match = price.match(/(\d[\d\s]*)/);
    if (match) {
      const num = parseInt(match[1].replace(/\s/g, ""));
      if (num >= 1000) return `${Math.round(num / 1000)}k\u20ac`;
      return `${num}\u20ac`;
    }
  }
  return "\u2022";
}

function createPricePinIcon(label: string, isHighlighted: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="map-price-pin${isHighlighted ? " highlighted" : ""}">
      <span>${label}</span>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// --- Cluster icon ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterIcon(cluster: any): L.DivIcon {
  const count = cluster.getChildCount();
  let size = "small";
  if (count >= 50) size = "large";
  else if (count >= 20) size = "medium";

  return L.divIcon({
    html: `<div class="map-cluster map-cluster-${size}"><span>${count}</span></div>`,
    className: "",
    iconSize: L.point(40, 40),
  });
}

// --- Popup HTML enrichi ---

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createPopupContent(item: ListingWithEval): string {
  const { listing, evaluation } = item;
  const imageUrl = listing.images.length > 0 ? listing.images[0] : null;
  const score = evaluation?.overall_score;
  const typeLabel = listing.listing_type
    ? LISTING_TYPE_LABELS[listing.listing_type] || listing.listing_type
    : null;

  const highlightsHtml =
    evaluation && evaluation.highlights.length > 0
      ? `<div class="map-popup-tags">${evaluation.highlights
          .slice(0, 2)
          .map(
            (h) =>
              `<span class="map-popup-tag map-popup-tag-green">${escapeHtml(h)}</span>`,
          )
          .join("")}</div>`
      : "";

  const concernsHtml =
    evaluation && evaluation.concerns.length > 0
      ? `<div class="map-popup-tags">${evaluation.concerns
          .slice(0, 1)
          .map(
            (c) =>
              `<span class="map-popup-tag map-popup-tag-red">${escapeHtml(c)}</span>`,
          )
          .join("")}</div>`
      : "";

  const summaryHtml = evaluation?.match_summary
    ? `<div class="map-popup-summary">${escapeHtml(evaluation.match_summary)}</div>`
    : "";

  return `<div class="map-popup-content">
    ${
      imageUrl
        ? `<img src="${imageUrl}" alt="" class="map-popup-img" onerror="this.style.display='none'" />`
        : ""
    }
    <div class="map-popup-body">
      <div class="map-popup-header">
        ${typeLabel ? `<span class="map-popup-type">${escapeHtml(typeLabel)}</span>` : ""}
        ${
          score !== undefined
            ? `<span class="map-popup-score" style="background:${score >= 70 ? "#dcfce7" : score >= 40 ? "#fef9c3" : "#fecaca"};color:${score >= 70 ? "#166534" : score >= 40 ? "#854d0e" : "#991b1b"}">${score}/100</span>`
            : ""
        }
      </div>
      <div class="map-popup-title">${escapeHtml(listing.title)}</div>
      <div class="map-popup-meta">
        ${listing.price ? `<span class="map-popup-price">${escapeHtml(listing.price)}</span>` : ""}
        <span class="map-popup-location-text">
          ${escapeHtml(listing.location || "")}${listing.province && listing.province !== listing.location ? " \u00b7 " + escapeHtml(listing.province) : ""}
        </span>
      </div>
      ${summaryHtml}
      ${highlightsHtml}
      ${concernsHtml}
      <div class="map-popup-actions">
        <a href="/listing/${listing.id}" class="map-popup-link">Voir d\u00e9tail</a>
        <a href="${listing.source_url}" target="_blank" rel="noopener noreferrer" class="map-popup-link-secondary">Source</a>
      </div>
    </div>
  </div>`;
}

// --- Sub-component: fit bounds ---

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (coords.length === 0) return;
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [coords, map]);

  return null;
}

// --- Main map component ---

interface ListingsMapProps {
  items: ListingWithEval[];
  hoveredListingId: string | null;
  onMarkerHover: (id: string | null) => void;
}

export default function ListingsMap({
  items,
  hoveredListingId,
  onMarkerHover,
}: ListingsMapProps) {
  const mappableItems = useMemo(() => {
    return items
      .filter((item) => LOCATION_COORDINATES[item.listing.location || ""])
      .map((item) => {
        const base = LOCATION_COORDINATES[item.listing.location!]!;
        const coords = getJitteredCoordinates(base, item.listing.id);
        return { item, coords };
      });
  }, [items]);

  const boundsCoords = useMemo(
    () =>
      mappableItems.map(
        ({ coords }) => [coords.lat, coords.lng] as [number, number],
      ),
    [mappableItems],
  );

  const unmappableCount = items.length - mappableItems.length;

  const handleMouseOver = useCallback(
    (id: string) => () => onMarkerHover(id),
    [onMarkerHover],
  );
  const handleMouseOut = useCallback(
    () => onMarkerHover(null),
    [onMarkerHover],
  );

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
      <MapContainer
        center={[BELGIUM_CENTER.lat, BELGIUM_CENTER.lng]}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        style={{ minHeight: "400px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds coords={boundsCoords} />

        <MarkerClusterGroup
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          disableClusteringAtZoom={13}
        >
          {mappableItems.map(({ item, coords }) => {
            const isHovered = hoveredListingId === item.listing.id;
            const label = formatPinPrice(
              item.listing.price_amount,
              item.listing.price,
            );

            return (
              <Marker
                key={item.listing.id}
                position={[coords.lat, coords.lng]}
                icon={createPricePinIcon(label, isHovered)}
                eventHandlers={{
                  mouseover: handleMouseOver(item.listing.id),
                  mouseout: handleMouseOut,
                }}
              >
                <Popup maxWidth={300} closeButton={true}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: createPopupContent(item),
                    }}
                  />
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {unmappableCount > 0 && (
        <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-800/90 text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded shadow">
          {unmappableCount} annonce{unmappableCount > 1 ? "s" : ""} sans
          localisation pr\u00e9cise
        </div>
      )}
    </div>
  );
}
