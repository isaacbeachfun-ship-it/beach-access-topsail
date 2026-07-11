import { classifyAccess, scoreAccessUsefulness } from "./accessScoring";
import { getAccessRoutePoint } from "./accessPoint";
import type { AccessMatch, BeachAccess } from "../types/access";

export interface LookupPoint {
  latitude: number;
  longitude: number;
  address: string;
}

const FEET_PER_METER = 3.28084;
const WALK_FEET_PER_MINUTE = 275;
const NEARBY_ALTERNATE_RADIUS_FEET = 5280;
const ROUTE_CANDIDATE_LIMIT = 8;
const ROUTE_CANDIDATE_HARD_LIMIT = 24;
const ROUTES_ENDPOINT =
  "https://routes.googleapis.com/directions/v2:computeRoutes";
const OYSTER_LANE_ADDRESS = /\boyster\s+(?:lane|ln)\b/i;
const PORT_DRIVE_ADDRESS = /\bport\s+(?:drive|dr)\b/i;
const NORTH_TOPSAIL_BEACH_ADDRESS = /\bnorth topsail beach\b/i;

const OYSTER_LANE_ACCESS: BeachAccess = {
  id: "north-topsail-beach-oyster-lane-access",
  town: "North Topsail Beach",
  name: "Oyster Lane Beach Access",
  address: "End of Oyster Lane",
  latitude: 34.5247222,
  longitude: -77.3477083,
  waterType: "Ocean",
  accessType: "Neighborhood Beach Access",
  parkingSpots: 0,
  handicapSpots: null,
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
  duneWalkover: false,
  source: "Local access correction + SaltChef",
  sourceDetail: "Oyster Lane street-end easement and reviewed GPS point",
  comments:
    "Neighborhood beach path at the end of Oyster Lane; no parking is listed for this path.",
  mediaIds: [],
  categories: ["Quiet"],
  usefulnessScore: 0,
};

const PORT_DRIVE_ACCESS: BeachAccess = {
  id: "north-topsail-beach-port-drive-access",
  town: "North Topsail Beach",
  name: "Port Drive Beach Access",
  address: "End of Port Drive",
  latitude: 34.5251417,
  longitude: -77.3466111,
  waterType: "Ocean",
  accessType: "Neighborhood Beach Access",
  parkingSpots: 0,
  handicapSpots: null,
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
  duneWalkover: false,
  source: "NC DCM review + SaltChef",
  sourceDetail: "Port Drive street-end easement and reviewed BA-48 GPS point",
  comments:
    "Neighborhood beach path at the end of Port Drive; no parking is listed for this path.",
  mediaIds: [],
  categories: ["Quiet"],
  usefulnessScore: 0,
};

const ADDRESS_ACCESS_OVERRIDES = [
  { addressPattern: OYSTER_LANE_ADDRESS, access: OYSTER_LANE_ACCESS },
  { addressPattern: PORT_DRIVE_ADDRESS, access: PORT_DRIVE_ACCESS },
];

type RoutesFetch = (url: string, init: RequestInit) => Promise<Response>;

interface GoogleRoutesPayload {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
  }>;
}

interface WalkingRouteDistance {
  distanceFeet: number;
  durationSeconds?: number;
}

interface WalkingRouteLookupOptions {
  apiKey?: string;
  candidateLimit?: number;
  maxCandidates?: number;
  fetcher?: RoutesFetch;
}

function getAddressAccessOverride(origin: LookupPoint): BeachAccess | null {
  if (!NORTH_TOPSAIL_BEACH_ADDRESS.test(origin.address)) return null;

  return (
    ADDRESS_ACCESS_OVERRIDES.find(({ addressPattern }) =>
      addressPattern.test(origin.address),
    )?.access ?? null
  );
}

export function distanceFeet(
  first: Pick<LookupPoint, "latitude" | "longitude">,
  second: Pick<LookupPoint, "latitude" | "longitude">,
): number {
  const radiusMeters = 6371000;
  const firstLat = toRadians(first.latitude);
  const secondLat = toRadians(second.latitude);
  const deltaLat = toRadians(second.latitude - first.latitude);
  const deltaLon = toRadians(second.longitude - first.longitude);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(firstLat) *
      Math.cos(secondLat) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(radiusMeters * c * FEET_PER_METER);
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function estimateWalkMinutes(distance: number): number {
  return Math.max(1, Math.round(distance / WALK_FEET_PER_MINUTE));
}

export function buildDirectionsUrl(
  origin: LookupPoint,
  access: BeachAccess,
): string {
  const destination = getAccessRoutePoint(access);
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: "walking",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function toAccessMatch(
  origin: LookupPoint,
  access: BeachAccess,
  isRouteDistance = false,
): AccessMatch {
  const distance = distanceFeet(origin, getAccessRoutePoint(access));

  return {
    access,
    distanceFeet: distance,
    estimatedWalkMinutes: estimateWalkMinutes(distance),
    categories: classifyAccess(access),
    directionsUrl: buildDirectionsUrl(origin, access),
    isRouteDistance,
  };
}

export function findNearestAccess(
  origin: LookupPoint,
  accesses: BeachAccess[],
): AccessMatch {
  if (accesses.length === 0) {
    throw new Error("Cannot find nearest access without access data.");
  }

  const addressOverride = getAddressAccessOverride(origin);
  if (addressOverride) return toAccessMatch(origin, addressOverride);

  return accesses
    .map((access) => toAccessMatch(origin, access))
    .sort((a, b) => a.distanceFeet - b.distanceFeet)[0];
}

export async function findNearestAccessByWalkingRoute(
  origin: LookupPoint,
  accesses: BeachAccess[],
  options: WalkingRouteLookupOptions = {},
): Promise<AccessMatch> {
  if (accesses.length === 0) {
    throw new Error("Cannot find nearest access without access data.");
  }

  const apiKey = options.apiKey?.trim();
  const fetcher = options.fetcher ?? fetch;
  const addressOverride = getAddressAccessOverride(origin);

  if (addressOverride) {
    const fallback = toAccessMatch(origin, addressOverride);
    if (!apiKey) return fallback;

    const route = await lookupGoogleWalkingRouteDistance(
      origin,
      addressOverride,
      apiKey,
      fetcher,
    );
    if (!route) return fallback;

    return {
      ...fallback,
      distanceFeet: route.distanceFeet,
      estimatedWalkMinutes: route.durationSeconds
        ? Math.max(1, Math.round(route.durationSeconds / 60))
        : estimateWalkMinutes(route.distanceFeet),
      isRouteDistance: true,
    };
  }

  const straightLineMatches = accesses
    .map((access) => toAccessMatch(origin, access))
    .sort((a, b) => a.distanceFeet - b.distanceFeet);
  const fallback = straightLineMatches[0];

  if (!apiKey) return fallback;

  const batchSize = options.candidateLimit ?? ROUTE_CANDIDATE_LIMIT;
  const maxCandidates = options.maxCandidates ?? ROUTE_CANDIDATE_HARD_LIMIT;
  const candidateCount = Math.min(straightLineMatches.length, maxCandidates);
  let best: AccessMatch | null = null;

  for (let index = 0; index < candidateCount; index += batchSize) {
    // A walking route can never be shorter than the straight line, so any
    // candidate whose straight-line distance already exceeds the best
    // measured route cannot win. This lets canal/cul-de-sac detour cases
    // widen the search without paying for extra Routes calls normally.
    const batch = straightLineMatches
      .slice(index, index + batchSize)
      .filter((match) => !best || match.distanceFeet < best.distanceFeet);
    if (batch.length === 0) break;

    const routeMatches = await Promise.all(
      batch.map(async (match) => {
        const route = await lookupGoogleWalkingRouteDistance(
          origin,
          match.access,
          apiKey,
          fetcher,
        );

        if (!route) return null;

        return {
          ...match,
          distanceFeet: route.distanceFeet,
          estimatedWalkMinutes: route.durationSeconds
            ? Math.max(1, Math.round(route.durationSeconds / 60))
            : estimateWalkMinutes(route.distanceFeet),
          isRouteDistance: true,
        };
      }),
    );

    for (const match of routeMatches) {
      if (match && (!best || match.distanceFeet < best.distanceFeet)) {
        best = match;
      }
    }
  }

  return best ?? fallback;
}

async function lookupGoogleWalkingRouteDistance(
  origin: LookupPoint,
  access: BeachAccess,
  apiKey: string,
  fetcher: RoutesFetch,
): Promise<WalkingRouteDistance | null> {
  const url = new URL(ROUTES_ENDPOINT);
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetcher(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: origin.latitude,
              longitude: origin.longitude,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: access.latitude,
              longitude: access.longitude,
            },
          },
        },
        travelMode: "WALK",
      }),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as GoogleRoutesPayload;
    const route = payload.routes?.[0];
    if (!route?.distanceMeters) return null;

    return {
      distanceFeet: Math.round(route.distanceMeters * FEET_PER_METER),
      durationSeconds: parseGoogleDurationSeconds(route.duration),
    };
  } catch {
    return null;
  }
}

function parseGoogleDurationSeconds(duration: string | undefined): number | undefined {
  const match = duration?.match(/^(\d+(?:\.\d+)?)s$/);
  if (!match) return undefined;
  return Number(match[1]);
}

export function rankMajorAlternates(
  nearest: BeachAccess,
  accesses: BeachAccess[],
  limit = 3,
): AccessMatch[] {
  const nearestRoutePoint = getAccessRoutePoint(nearest);
  const origin = {
    latitude: nearestRoutePoint.latitude,
    longitude: nearestRoutePoint.longitude,
    address: nearest.address || nearest.name,
  };

  return accesses
    .filter((access) => access.id !== nearest.id)
    .map((access) => toAccessMatch(origin, access))
    .filter(
      (match) =>
        match.categories.includes("Major") ||
        match.categories.includes("Facilities"),
    )
    .sort((a, b) => {
      const distanceBucketDelta =
        Number(a.distanceFeet > NEARBY_ALTERNATE_RADIUS_FEET) -
        Number(b.distanceFeet > NEARBY_ALTERNATE_RADIUS_FEET);
      if (distanceBucketDelta !== 0) return distanceBucketDelta;

      const scoreDelta =
        scoreAccessUsefulness(b.access) - scoreAccessUsefulness(a.access);
      if (scoreDelta !== 0) return scoreDelta;
      return a.distanceFeet - b.distanceFeet;
    })
    .slice(0, limit);
}

export function formatDistanceFeet(distance: number): string {
  if (distance >= 5280) {
    return `${(distance / 5280).toFixed(1)} mi`;
  }

  return `${Math.round(distance).toLocaleString()} ft`;
}

export function formatAccessAddress(
  access: Pick<BeachAccess, "address" | "town">,
  fallback: string = access.town,
): string {
  const cleanedAddress = access.address?.replace(/\s*,+\s*$/, "").trim();
  return cleanedAddress || fallback;
}
