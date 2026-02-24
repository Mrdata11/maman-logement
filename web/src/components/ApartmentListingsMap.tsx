"use client";

import { useEffect, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ApartmentWithEval, PEB_RATING_COLORS } from "@/lib/types";
import { BRUSSELS_MAP_CENTER, BRUSSELS_DEFAULT_ZOOM } from "@/lib/coordinates";
import { escapeHtml, sanitizeUrl } from "@/lib/sanitize";

function formatPrice(price: number | null): string {
  if (!price) return "";
  if (price >= 1000) return `${(price / 1000).toFixed(1)}k€`;
  return `${price}€`;
}

const HOME_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;

function createPricePinIcon(label: string, isHighlighted: boolean): L.DivIcon {
  const content = label || HOME_SVG;
  return L.divIcon({
    className: "",
    html: `<div class="map-price-pin${isHighlighted ? " highlighted" : ""}">
      <span>${content}</span>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterIcon(cluster: any): L.DivIcon {
  const count = cluster.getChildCount();
  let size = "small";
  if (count >= 30) size = "large";
  else if (count >= 10) size = "medium";

  return L.divIcon({
    html: `<div class="map-cluster map-cluster-${size}"><span>${count}</span></div>`,
    className: "",
    iconSize: L.point(40, 40),
  });
}

function createPopupContent(item: ApartmentWithEval): string {
  const { listing, evaluation } = item;
  const imageUrl = listing.images.length > 0 ? listing.images[0] : null;
  const score = evaluation?.quality_score;

  const details = [
    listing.bedrooms ? `${listing.bedrooms} ch.` : null,
    listing.surface_m2 ? `${listing.surface_m2} m²` : null,
    listing.peb_rating ? `PEB ${listing.peb_rating}` : null,
  ].filter(Boolean).join(" · ");

  const highlightsHtml =
    evaluation && evaluation.highlights.length > 0
      ? `<div class="map-popup-tags">${evaluation.highlights
          .slice(0, 3)
          .map((h) => `<span class="map-popup-tag map-popup-tag-green">${escapeHtml(h)}</span>`)
          .join("")}</div>`
      : "";

  const concernsHtml =
    evaluation && evaluation.concerns.length > 0
      ? `<div class="map-popup-tags">${evaluation.concerns
          .slice(0, 2)
          .map((c) => `<span class="map-popup-tag map-popup-tag-red">${escapeHtml(c)}</span>`)
          .join("")}</div>`
      : "";

  return `<div class="map-popup-content">
    ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="" class="map-popup-img" />` : ""}
    <div class="map-popup-body">
      <div class="map-popup-header">
        ${listing.commune ? `<span class="map-popup-type">${escapeHtml(listing.commune)}</span>` : ""}
        ${score !== undefined ? `<span class="map-popup-score" style="background:${score >= 70 ? "#dcfce7" : score >= 40 ? "#fef9c3" : "#fecaca"};color:${score >= 70 ? "#166534" : score >= 40 ? "#854d0e" : "#991b1b"}">${score}/100</span>` : ""}
      </div>
      <div class="map-popup-title">${escapeHtml(listing.title)}</div>
      <div class="map-popup-meta">
        ${listing.price_monthly ? `<span class="map-popup-price">${listing.price_monthly.toLocaleString("fr-BE")} €/mois</span>` : ""}
        <span class="map-popup-location-text">${details}</span>
      </div>
      ${evaluation?.quality_summary ? `<div class="map-popup-summary">${escapeHtml(evaluation.quality_summary)}</div>` : ""}
      ${highlightsHtml}
      ${concernsHtml}
      <div class="map-popup-actions">
        <a href="/appartements/listing/${listing.id}" class="map-popup-link">Voir détail</a>
        <a href="${sanitizeUrl(listing.source_url)}" target="_blank" rel="noopener noreferrer" class="map-popup-link-secondary">Immoweb</a>
        <button class="map-popup-archive-btn" data-archive-id="${listing.id}" title="Archiver">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
        </button>
      </div>
    </div>
  </div>`;
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 14);
      return;
    }
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [coords, map]);

  return null;
}

interface ApartmentListingsMapProps {
  items: ApartmentWithEval[];
  hoveredListingId: string | null;
  onMarkerHover: (id: string | null) => void;
  onArchive?: (id: string) => void;
}

export default function ApartmentListingsMap({
  items,
  hoveredListingId,
  onMarkerHover,
  onArchive,
}: ApartmentListingsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      if (!onArchive) return;
      const btn = (e.target as HTMLElement).closest<HTMLElement>(".map-popup-archive-btn");
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.archiveId;
        if (id) onArchive(id);
      }
    };

    // Hide broken images via event delegation (replaces inline onerror)
    const handleImgError = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" && target.classList.contains("map-popup-img")) {
        target.style.display = "none";
      }
    };

    container.addEventListener("click", handleClick);
    container.addEventListener("error", handleImgError, true);
    return () => {
      container.removeEventListener("click", handleClick);
      container.removeEventListener("error", handleImgError, true);
    };
  }, [onArchive]);
  const mappableItems = useMemo(() => {
    return items
      .filter((item) => item.listing.latitude && item.listing.longitude)
      .map((item) => ({
        item,
        coords: { lat: item.listing.latitude!, lng: item.listing.longitude! },
      }));
  }, [items]);

  const boundsCoords = useMemo(
    () => mappableItems.map(({ coords }) => [coords.lat, coords.lng] as [number, number]),
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
    <div ref={mapContainerRef} className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-[var(--border-color)]">
      <MapContainer
        center={[BRUSSELS_MAP_CENTER.lat, BRUSSELS_MAP_CENTER.lng]}
        zoom={BRUSSELS_DEFAULT_ZOOM}
        className="w-full h-full"
        style={{ minHeight: "400px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {boundsCoords.length > 0 && <FitBounds coords={boundsCoords} />}

        <MarkerClusterGroup
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={40}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          disableClusteringAtZoom={15}
        >
          {mappableItems.map(({ item, coords }) => {
            const isHovered = hoveredListingId === item.listing.id;
            const label = formatPrice(item.listing.price_monthly);

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
                <Popup maxWidth={360} closeButton={true}>
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
        <div className="absolute bottom-2 left-2 bg-[var(--card-bg)]/90 text-xs text-[var(--muted)] px-2 py-1 rounded shadow">
          {unmappableCount} annonce{unmappableCount > 1 ? "s" : ""} sans coordonnées
        </div>
      )}
    </div>
  );
}
