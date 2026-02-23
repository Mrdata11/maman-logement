"use client";

import { ApartmentFilterState, PEB_RATING_COLORS } from "@/lib/types";

interface ApartmentFilterPanelProps {
  filters: ApartmentFilterState;
  onChange: (filters: ApartmentFilterState) => void;
  onReset: () => void;
  availableCommunes: { value: string; count: number }[];
  priceRange: { min: number; max: number };
}

export function ApartmentFilterPanel({
  filters,
  onChange,
  onReset,
  availableCommunes,
  priceRange,
}: ApartmentFilterPanelProps) {
  const update = (patch: Partial<ApartmentFilterState>) =>
    onChange({ ...filters, ...patch });

  const hasActiveFilters =
    filters.searchText.trim() !== "" ||
    filters.communes.length > 0 ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.bedroomsMin !== null ||
    filters.bathroomsMin !== null ||
    filters.surfaceMin !== null ||
    filters.surfaceMax !== null ||
    filters.pebRatings.length > 0 ||
    filters.furnished !== null ||
    filters.hasParking !== null ||
    filters.hasBalconyOrTerrace !== null ||
    filters.hasGarden !== null ||
    filters.petsAllowed !== null ||
    filters.hasElevator !== null ||
    filters.scoreMin !== null;

  return (
    <div className="p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl mb-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-[var(--foreground)]">Filtres</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Location */}
        <div>
          {/* Search text */}
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">
            Recherche
          </label>
          <input
            type="text"
            value={filters.searchText}
            onChange={(e) => update({ searchText: e.target.value })}
            placeholder="Mot-clé..."
            className="w-full px-3 py-1.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] mb-3"
          />

          {/* Communes */}
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">
            Communes
          </label>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {availableCommunes.map(({ value, count }) => (
              <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.communes.includes(value)}
                  onChange={(e) => {
                    const newCommunes = e.target.checked
                      ? [...filters.communes, value]
                      : filters.communes.filter((c) => c !== value);
                    update({ communes: newCommunes });
                  }}
                  className="rounded border-[var(--input-border)]"
                />
                <span className="text-[var(--foreground)]">{value}</span>
                <span className="text-[var(--muted-light)] text-xs">({count})</span>
              </label>
            ))}
          </div>
        </div>

        {/* Column 2: Property details */}
        <div>
          {/* Bedrooms min */}
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">
            Chambres min
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={filters.bedroomsMin ?? ""}
            onChange={(e) => update({ bedroomsMin: e.target.value ? Number(e.target.value) : null })}
            placeholder="2"
            className="w-full px-3 py-1.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] mb-3"
          />

          {/* Surface range */}
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">
            Surface (m²)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={filters.surfaceMin ?? ""}
              onChange={(e) => update({ surfaceMin: e.target.value ? Number(e.target.value) : null })}
              placeholder="Min"
              className="w-1/2 px-3 py-1.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)]"
            />
            <input
              type="number"
              value={filters.surfaceMax ?? ""}
              onChange={(e) => update({ surfaceMax: e.target.value ? Number(e.target.value) : null })}
              placeholder="Max"
              className="w-1/2 px-3 py-1.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)]"
            />
          </div>

          {/* PEB */}
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">
            PEB
          </label>
          <div className="flex flex-wrap gap-1 mb-3">
            {["A", "B", "C", "D", "E", "F", "G"].map((rating) => (
              <button
                key={rating}
                onClick={() => {
                  const newRatings = filters.pebRatings.includes(rating)
                    ? filters.pebRatings.filter((r) => r !== rating)
                    : [...filters.pebRatings, rating];
                  update({ pebRatings: newRatings });
                }}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                  filters.pebRatings.includes(rating)
                    ? PEB_RATING_COLORS[rating]
                    : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--muted-light)]/20"
                }`}
              >
                {rating}
              </button>
            ))}
          </div>

          {/* Score min */}
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">
            Score minimum
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={filters.scoreMin ?? ""}
            onChange={(e) => update({ scoreMin: e.target.value ? Number(e.target.value) : null })}
            placeholder="0"
            className="w-full px-3 py-1.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)]"
          />
        </div>

        {/* Column 3: Price + Amenities */}
        <div>
          {/* Price range */}
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">
            Loyer mensuel (EUR)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={filters.priceMin ?? ""}
              onChange={(e) => update({ priceMin: e.target.value ? Number(e.target.value) : null })}
              placeholder={`${priceRange.min}`}
              className="w-1/2 px-3 py-1.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)]"
            />
            <input
              type="number"
              value={filters.priceMax ?? ""}
              onChange={(e) => update({ priceMax: e.target.value ? Number(e.target.value) : null })}
              placeholder={`${priceRange.max}`}
              className="w-1/2 px-3 py-1.5 border border-[var(--input-border)] rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)]"
            />
          </div>

          {/* Amenity toggles */}
          <label className="block text-xs font-medium text-[var(--muted)] mb-2">
            Équipements
          </label>
          <div className="space-y-1.5">
            {([
              ["hasBalconyOrTerrace", "Balcon / Terrasse"],
              ["hasParking", "Parking"],
              ["hasElevator", "Ascenseur"],
              ["furnished", "Meublé"],
              ["hasGarden", "Jardin"],
              ["petsAllowed", "Animaux acceptés"],
            ] as [keyof ApartmentFilterState, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters[key] === true}
                  onChange={(e) => update({ [key]: e.target.checked ? true : null })}
                  className="rounded border-[var(--input-border)]"
                />
                <span className="text-[var(--foreground)]">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
