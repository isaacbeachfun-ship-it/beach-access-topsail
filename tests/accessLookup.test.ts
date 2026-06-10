import { describe, expect, it } from "vitest";
import {
  buildDirectionsUrl,
  findNearestAccess,
  formatAccessAddress,
  formatDistanceFeet,
  rankMajorAlternates,
} from "../src/lib/accessLookup";
import type { BeachAccess } from "../src/types/access";

const baseAccess: BeachAccess = {
  id: "quiet",
  town: "Surf City",
  name: "Quiet Walkover",
  address: "1200 N Shore Dr",
  latitude: 34.436526,
  longitude: -77.526076,
  waterType: "ocean",
  accessType: "Public Beach Access",
  parkingSpots: 0,
  handicapSpots: 0,
  parkingOptions: "No Parking",
  parkingFee: null,
  hourlyRate: null,
  dailyRate: null,
  weeklyRate: null,
  seasonalRate: null,
  restroom: false,
  shower: false,
  lifeguards: false,
  beachWheelchair: false,
  beachMat: false,
  mobiMat: false,
  handicapAccessible: false,
  vehicleAccess: false,
  duneWalkover: true,
  source: "NC DCM",
  sourceDetail: "",
  comments: "",
  mediaIds: [],
};

const accesses: BeachAccess[] = [
  baseAccess,
  {
    ...baseAccess,
    id: "major",
    name: "Broadway Ave Access",
    address: "1700 N Shore Dr",
    latitude: 34.44102,
    longitude: -77.51845,
    parkingSpots: 34,
    restroom: true,
    shower: true,
    beachWheelchair: true,
    beachMat: true,
  },
];

describe("findNearestAccess", () => {
  it("returns the nearest access with estimated distance and directions", () => {
    const match = findNearestAccess(
      { latitude: 34.4365, longitude: -77.5261, address: "1200 N Shore Dr" },
      accesses,
    );

    expect(match.access.id).toBe("quiet");
    expect(match.distanceFeet).toBeLessThan(100);
    expect(match.estimatedWalkMinutes).toBeGreaterThanOrEqual(1);
    expect(match.directionsUrl).toContain("api=1");
  });
});

describe("rankMajorAlternates", () => {
  it("promotes useful larger accesses over quiet walkovers", () => {
    const alternates = rankMajorAlternates(baseAccess, accesses, 3);

    expect(alternates[0].access.id).toBe("major");
    expect(alternates[0].categories).toContain("Major");
  });

  it("keeps nearby major accesses ahead of far-away giant lots", () => {
    const nearbyMajor = {
      ...baseAccess,
      id: "nearby-major",
      name: "Nearby Major Access",
      latitude: 34.44102,
      longitude: -77.51845,
      parkingSpots: 34,
      restroom: true,
      shower: true,
    };
    const farGiantLot = {
      ...baseAccess,
      id: "far-giant",
      name: "Far Giant Lot",
      latitude: 34.52,
      longitude: -77.36,
      parkingSpots: 250,
      restroom: true,
      shower: true,
      handicapAccessible: true,
    };

    const alternates = rankMajorAlternates(
      baseAccess,
      [baseAccess, farGiantLot, nearbyMajor],
      2,
    );

    expect(alternates[0].access.id).toBe("nearby-major");
  });
});

describe("formatDistanceFeet", () => {
  it("formats short and long distances for guests", () => {
    expect(formatDistanceFeet(480)).toBe("480 ft");
    expect(formatDistanceFeet(5280)).toBe("1.0 mi");
  });
});

describe("formatAccessAddress", () => {
  it("cleans generated trailing commas and uses a fallback for missing addresses", () => {
    expect(
      formatAccessAddress({
        address: "300 South Shore Drive,",
        town: "Surf City",
      }),
    ).toBe("300 South Shore Drive");
    expect(formatAccessAddress({ address: null, town: "Surf City" })).toBe(
      "Surf City",
    );
  });
});

describe("buildDirectionsUrl", () => {
  it("builds a Google Maps walking directions URL", () => {
    expect(
      buildDirectionsUrl(
        { latitude: 34.43, longitude: -77.53, address: "Rental" },
        baseAccess,
      ),
    ).toBe(
      "https://www.google.com/maps/dir/?api=1&origin=34.43%2C-77.53&destination=34.436526%2C-77.526076&travelmode=walking",
    );
  });
});
