import { describe, expect, it, vi } from "vitest";
import {
  buildDirectionsUrl,
  findNearestAccess,
  findNearestAccessByWalkingRoute,
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

describe("findNearestAccessByWalkingRoute", () => {
  it("uses Google walking distance to avoid picking a closer point across blocked streets", async () => {
    const closerByAir: BeachAccess = {
      ...baseAccess,
      id: "closer-by-air",
      name: "Closer By Air",
      latitude: 34.401769,
      longitude: -77.5818,
    };
    const shorterWalk: BeachAccess = {
      ...baseAccess,
      id: "shorter-walk",
      name: "Shorter Walk",
      latitude: 34.405218,
      longitude: -77.576792,
    };

    const match = await findNearestAccessByWalkingRoute(
      {
        latitude: 34.404606,
        longitude: -77.581453,
        address: "34 Oak Ct, Surf City, NC",
      },
      [closerByAir, shorterWalk],
      {
        apiKey: "test-key",
        fetcher: async (url, init) => {
          const destination = JSON.parse(String(init?.body)).destination.location
            .latLng;
          const distanceMeters =
            destination.longitude === shorterWalk.longitude ? 553 : 858;

          return new Response(
            JSON.stringify({
              routes: [{ distanceMeters, duration: `${distanceMeters}s` }],
            }),
            { status: 200 },
          );
        },
      },
    );

    expect(match.access.id).toBe("shorter-walk");
    expect(match.distanceFeet).toBe(1814);
    expect(match.isRouteDistance).toBe(true);
  });

  it("falls back to a straight-line estimate without an API key", async () => {
    const fetcher = vi.fn();
    const match = await findNearestAccessByWalkingRoute(
      { latitude: 34.4365, longitude: -77.5261, address: "Rental" },
      accesses,
      { apiKey: "", fetcher },
    );

    expect(match.access.id).toBe("quiet");
    expect(match.isRouteDistance).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("measures Google walking routes to the official access point while linking directions to the beach-path target", async () => {
    let requestedDestination: { latitude: number; longitude: number } | null =
      null;

    const match = await findNearestAccessByWalkingRoute(
      {
        latitude: 34.435709,
        longitude: -77.531968,
        address: "204a Mandalay Ct",
      },
      [
        {
          ...baseAccess,
          id: "surf-city-beach-access-10",
          latitude: 34.4356637,
          longitude: -77.5279198,
          routeLatitude: 34.4352826,
          routeLongitude: -77.5274577,
        },
      ],
      {
        apiKey: "test-key",
        fetcher: async (_url, init) => {
          requestedDestination = JSON.parse(String(init?.body)).destination
            .location.latLng;

          return new Response(
            JSON.stringify({
              routes: [{ distanceMeters: 512 }],
            }),
            { status: 200 },
          );
        },
      },
    );

    expect(requestedDestination).toEqual({
      latitude: 34.4356637,
      longitude: -77.5279198,
    });
    expect(match.distanceFeet).toBe(1680);
    expect(match.directionsUrl).toContain(
      "destination=34.4352826%2C-77.5274577",
    );
  });

  it("widens the candidate pool when the closest-by-air accesses need long detours", async () => {
    const origin = {
      latitude: 34.43,
      longitude: -77.53,
      address: "Canal-side rental",
    };
    const acrossCanalA: BeachAccess = {
      ...baseAccess,
      id: "across-canal-a",
      latitude: 34.4302,
      longitude: -77.5295,
    };
    const acrossCanalB: BeachAccess = {
      ...baseAccess,
      id: "across-canal-b",
      latitude: 34.4304,
      longitude: -77.5293,
    };
    const aroundTheBlock: BeachAccess = {
      ...baseAccess,
      id: "around-the-block",
      latitude: 34.431,
      longitude: -77.5288,
    };
    const routeMetersById: Record<string, number> = {
      "across-canal-a": 1600,
      "across-canal-b": 1700,
      "around-the-block": 220,
    };

    const match = await findNearestAccessByWalkingRoute(
      origin,
      [acrossCanalA, acrossCanalB, aroundTheBlock],
      {
        apiKey: "test-key",
        candidateLimit: 2,
        fetcher: async (_url, init) => {
          const destination = JSON.parse(String(init?.body)).destination
            .location.latLng;
          const target = [acrossCanalA, acrossCanalB, aroundTheBlock].find(
            (access) => access.longitude === destination.longitude,
          );

          return new Response(
            JSON.stringify({
              routes: [{ distanceMeters: routeMetersById[target!.id] }],
            }),
            { status: 200 },
          );
        },
      },
    );

    expect(match.access.id).toBe("around-the-block");
    expect(match.isRouteDistance).toBe(true);
  });

  it("stops querying once no remaining candidate can beat the best route", async () => {
    const origin = {
      latitude: 34.43,
      longitude: -77.53,
      address: "Oceanfront rental",
    };
    const nextDoor: BeachAccess = {
      ...baseAccess,
      id: "next-door",
      latitude: 34.4301,
      longitude: -77.5299,
    };
    const farAway: BeachAccess = {
      ...baseAccess,
      id: "far-away",
      latitude: 34.45,
      longitude: -77.5,
    };

    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ routes: [{ distanceMeters: 50 }] }),
          { status: 200 },
        ),
    );

    const match = await findNearestAccessByWalkingRoute(
      origin,
      [nextDoor, farAway],
      { apiKey: "test-key", candidateLimit: 1, fetcher },
    );

    expect(match.access.id).toBe("next-door");
    expect(fetcher).toHaveBeenCalledTimes(1);
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

  it("uses the guest route target when an access has a beach-path endpoint", () => {
    expect(
      buildDirectionsUrl(
        { latitude: 34.43, longitude: -77.53, address: "Rental" },
        {
          ...baseAccess,
          routeLatitude: 34.4352826,
          routeLongitude: -77.5274577,
        },
      ),
    ).toBe(
      "https://www.google.com/maps/dir/?api=1&origin=34.43%2C-77.53&destination=34.4352826%2C-77.5274577&travelmode=walking",
    );
  });
});
