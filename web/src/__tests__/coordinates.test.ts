import { describe, it, expect, beforeEach } from "vitest";
import {
  haversineDistance,
  getListingCoordinates,
  getJitteredCoordinates,
  resolveLocationCoordinates,
  loadReferenceLocation,
  saveReferenceLocation,
  getAvailableLocationNames,
  EUROPE_CENTER,
  LOCATION_COORDINATES,
  REFERENCE_LOCATION_KEY,
} from "@/lib/coordinates";

describe("haversineDistance", () => {
  it("returns 0 for same point", () => {
    const point = { lat: 50.8503, lng: 4.3517 };
    expect(haversineDistance(point, point)).toBe(0);
  });

  it("calculates Bruxelles-Namur distance (~60 km)", () => {
    const bruxelles = LOCATION_COORDINATES["Bruxelles"];
    const namur = LOCATION_COORDINATES["Namur"];
    const distance = haversineDistance(bruxelles, namur);
    expect(distance).toBeGreaterThan(50);
    expect(distance).toBeLessThan(70);
  });

  it("calculates Bruxelles-Toulouse distance (~830 km)", () => {
    const bruxelles = LOCATION_COORDINATES["Bruxelles"];
    const toulouse = LOCATION_COORDINATES["Toulouse"];
    const distance = haversineDistance(bruxelles, toulouse);
    expect(distance).toBeGreaterThan(780);
    expect(distance).toBeLessThan(880);
  });

  it("is commutative: distance(a,b) === distance(b,a)", () => {
    const a = { lat: 50.8503, lng: 4.3517 };
    const b = { lat: 48.8566, lng: 2.3522 };
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 10);
  });

  it("handles negative coordinates", () => {
    const a = { lat: -33.8688, lng: 151.2093 }; // Sydney
    const b = { lat: 51.5074, lng: -0.1278 }; // London
    const distance = haversineDistance(a, b);
    expect(distance).toBeGreaterThan(16000);
    expect(distance).toBeLessThan(18000);
  });
});

describe("getListingCoordinates", () => {
  it("returns coordinates for known location", () => {
    const coords = getListingCoordinates("Ixelles", null);
    expect(coords).toEqual(LOCATION_COORDINATES["Ixelles"]);
  });

  it("returns coordinates for known province when location not found", () => {
    const coords = getListingCoordinates("UnknownCity", "Bruxelles");
    expect(coords).toEqual(LOCATION_COORDINATES["Bruxelles"]);
  });

  it("prefers location over province when both match", () => {
    const coords = getListingCoordinates("Ixelles", "Bruxelles");
    expect(coords).toEqual(LOCATION_COORDINATES["Ixelles"]);
  });

  it("returns null when neither location nor province are found", () => {
    expect(getListingCoordinates("Narnia", "Mordor")).toBeNull();
  });

  it("returns null when both arguments are null", () => {
    expect(getListingCoordinates(null, null)).toBeNull();
  });

  it("returns province coordinates when location is null", () => {
    const coords = getListingCoordinates(null, "Hainaut");
    expect(coords).toEqual(LOCATION_COORDINATES["Hainaut"]);
  });
});

describe("getJitteredCoordinates", () => {
  const base = { lat: 50.8503, lng: 4.3517 };

  it("returns coordinates different from base", () => {
    const jittered = getJitteredCoordinates(base, "listing-abc");
    expect(jittered.lat).not.toBe(base.lat);
    expect(jittered.lng).not.toBe(base.lng);
  });

  it("jitter stays within the 0.15 range", () => {
    const jittered = getJitteredCoordinates(base, "test-listing-123");
    expect(Math.abs(jittered.lat - base.lat)).toBeLessThanOrEqual(0.15);
    expect(Math.abs(jittered.lng - base.lng)).toBeLessThanOrEqual(0.15);
  });

  it("is deterministic: same ID gives same jitter", () => {
    const a = getJitteredCoordinates(base, "same-id");
    const b = getJitteredCoordinates(base, "same-id");
    expect(a).toEqual(b);
  });

  it("different IDs give different jitter", () => {
    const a = getJitteredCoordinates(base, "id-alpha");
    const b = getJitteredCoordinates(base, "id-beta");
    expect(a).not.toEqual(b);
  });
});

describe("constants", () => {
  it("EUROPE_CENTER is defined", () => {
    expect(EUROPE_CENTER.lat).toBe(47.5);
    expect(EUROPE_CENTER.lng).toBe(3.0);
  });

  it("LOCATION_COORDINATES has Belgian provinces", () => {
    expect(LOCATION_COORDINATES["Bruxelles"]).toBeDefined();
    expect(LOCATION_COORDINATES["Namur"]).toBeDefined();
    expect(LOCATION_COORDINATES["Hainaut"]).toBeDefined();
    expect(LOCATION_COORDINATES["Liège"]).toBeDefined();
  });
});

describe("resolveLocationCoordinates", () => {
  it("returns null for null input", () => {
    expect(resolveLocationCoordinates(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(resolveLocationCoordinates("")).toBeNull();
    expect(resolveLocationCoordinates("   ")).toBeNull();
  });

  it("resolves a known city name directly", () => {
    const result = resolveLocationCoordinates("Ixelles");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Ixelles");
    expect(result!.coords).toEqual(LOCATION_COORDINATES["Ixelles"]);
  });

  it("resolves a city from comma-separated string (e.g. 'Ixelles, Bruxelles')", () => {
    const result = resolveLocationCoordinates("Ixelles, Bruxelles");
    expect(result).not.toBeNull();
    // Should match "Ixelles" (first part tried after full string fails)
    expect(result!.name).toBe("Ixelles");
    expect(result!.coords).toEqual(LOCATION_COORDINATES["Ixelles"]);
  });

  it("resolves second part if first part unknown", () => {
    const result = resolveLocationCoordinates("Mon quartier, Namur");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Namur");
    expect(result!.coords).toEqual(LOCATION_COORDINATES["Namur"]);
  });

  it("handles case-insensitive matching", () => {
    const result = resolveLocationCoordinates("ixelles");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Ixelles");
    expect(result!.coords).toEqual(LOCATION_COORDINATES["Ixelles"]);
  });

  it("handles case-insensitive matching in comma-separated parts", () => {
    const result = resolveLocationCoordinates("centre-ville, bruxelles");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Bruxelles");
  });

  it("resolves French cities", () => {
    const result = resolveLocationCoordinates("Toulouse");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Toulouse");
    expect(result!.coords.lat).toBeCloseTo(43.6047, 2);
  });

  it("resolves Spanish cities", () => {
    const result = resolveLocationCoordinates("Pamplona");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Pamplona");
  });

  it("returns null for unknown locations", () => {
    expect(resolveLocationCoordinates("Narnia")).toBeNull();
    expect(resolveLocationCoordinates("Springfield, USA")).toBeNull();
  });

  it("handles extra whitespace gracefully", () => {
    const result = resolveLocationCoordinates("  Ixelles  ,  Bruxelles  ");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Ixelles");
  });

  it("resolves Belgian provinces", () => {
    const result = resolveLocationCoordinates("Hainaut");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Hainaut");
  });

  it("resolves accented names", () => {
    const result = resolveLocationCoordinates("Liège");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Liège");
  });
});

describe("distance from reference location", () => {
  it("distance from Ixelles to Namur is ~60 km", () => {
    const ref = resolveLocationCoordinates("Ixelles");
    const target = LOCATION_COORDINATES["Namur"];
    expect(ref).not.toBeNull();
    const dist = haversineDistance(ref!.coords, target);
    expect(dist).toBeGreaterThan(50);
    expect(dist).toBeLessThan(70);
  });

  it("distance from Namur to Bruxelles is ~60 km", () => {
    const ref = resolveLocationCoordinates("Namur");
    const target = LOCATION_COORDINATES["Bruxelles"];
    expect(ref).not.toBeNull();
    const dist = haversineDistance(ref!.coords, target);
    expect(dist).toBeGreaterThan(50);
    expect(dist).toBeLessThan(70);
  });

  it("distance from Toulouse to Pamplona is ~250 km", () => {
    const ref = resolveLocationCoordinates("Toulouse");
    const target = LOCATION_COORDINATES["Pamplona"];
    expect(ref).not.toBeNull();
    const dist = haversineDistance(ref!.coords, target);
    expect(dist).toBeGreaterThan(200);
    expect(dist).toBeLessThan(300);
  });

  it("distance is 0 when reference equals target", () => {
    const ref = resolveLocationCoordinates("Bruxelles");
    expect(ref).not.toBeNull();
    const dist = haversineDistance(ref!.coords, LOCATION_COORDINATES["Bruxelles"]);
    expect(dist).toBe(0);
  });

  it("distance changes when reference location changes", () => {
    const target = LOCATION_COORDINATES["Charleroi"];
    const fromBruxelles = haversineDistance(LOCATION_COORDINATES["Bruxelles"], target);
    const fromNamur = haversineDistance(LOCATION_COORDINATES["Namur"], target);
    // Charleroi is closer to Namur than to Bruxelles
    expect(fromNamur).toBeLessThan(fromBruxelles);
  });
});

describe("loadReferenceLocation / saveReferenceLocation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing saved", () => {
    expect(loadReferenceLocation()).toBeNull();
  });

  it("round-trips save/load correctly", () => {
    const ref = resolveLocationCoordinates("Namur")!;
    saveReferenceLocation(ref);
    const loaded = loadReferenceLocation();
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("Namur");
    expect(loaded!.coords.lat).toBeCloseTo(ref.coords.lat, 4);
    expect(loaded!.coords.lng).toBeCloseTo(ref.coords.lng, 4);
  });

  it("returns null for corrupted data", () => {
    localStorage.setItem(REFERENCE_LOCATION_KEY, "not json");
    expect(loadReferenceLocation()).toBeNull();
  });

  it("returns null for incomplete data", () => {
    localStorage.setItem(REFERENCE_LOCATION_KEY, JSON.stringify({ name: "test" }));
    expect(loadReferenceLocation()).toBeNull();
  });

  it("returns null for data with wrong types", () => {
    localStorage.setItem(
      REFERENCE_LOCATION_KEY,
      JSON.stringify({ name: 123, coords: { lat: "wrong", lng: true } })
    );
    expect(loadReferenceLocation()).toBeNull();
  });
});

describe("getAvailableLocationNames", () => {
  it("returns a sorted array of strings", () => {
    const names = getAvailableLocationNames();
    expect(names.length).toBeGreaterThan(0);
    expect(typeof names[0]).toBe("string");
    // Check sorting
    for (let i = 1; i < names.length; i++) {
      expect(names[i - 1].localeCompare(names[i], "fr")).toBeLessThanOrEqual(0);
    }
  });

  it("includes known cities", () => {
    const names = getAvailableLocationNames();
    expect(names).toContain("Bruxelles");
    expect(names).toContain("Namur");
    expect(names).toContain("Ixelles");
    expect(names).toContain("Toulouse");
  });
});
