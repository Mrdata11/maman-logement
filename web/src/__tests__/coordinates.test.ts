import { describe, it, expect } from "vitest";
import {
  haversineDistance,
  getListingCoordinates,
  getJitteredCoordinates,
  IXELLES_CENTER,
  EUROPE_CENTER,
  LOCATION_COORDINATES,
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
  it("IXELLES_CENTER is defined with lat/lng", () => {
    expect(IXELLES_CENTER.lat).toBeCloseTo(50.8306, 2);
    expect(IXELLES_CENTER.lng).toBeCloseTo(4.3722, 2);
  });

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
