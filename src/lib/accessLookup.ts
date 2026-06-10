import { classifyAccess, scoreAccessUsefulness } from "./accessScoring";
import type { AccessMatch, BeachAccess } from "../types/access";

export interface LookupPoint {
  latitude: number;
  longitude: number;
  address: string;
}

const FEET_PER_METER = 3.28084;
const WALK_FEET_PER_MINUTE = 275;
const NEARBY_ALTERNATE_RADIUS_FEET = 5280;

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
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${access.latitude},${access.longitude}`,
    travelmode: "walking",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function toAccessMatch(
  origin: LookupPoint,
  access: BeachAccess,
  isExactSupabaseWalkDistance = false,
): AccessMatch {
  const distance = distanceFeet(origin, access);

  return {
    access,
    distanceFeet: distance,
    estimatedWalkMinutes: estimateWalkMinutes(distance),
    categories: classifyAccess(access),
    directionsUrl: buildDirectionsUrl(origin, access),
    isExactSupabaseWalkDistance,
  };
}

export function findNearestAccess(
  origin: LookupPoint,
  accesses: BeachAccess[],
): AccessMatch {
  if (accesses.length === 0) {
    throw new Error("Cannot find nearest access without access data.");
  }

  return accesses
    .map((access) => toAccessMatch(origin, access))
    .sort((a, b) => a.distanceFeet - b.distanceFeet)[0];
}

export function rankMajorAlternates(
  nearest: BeachAccess,
  accesses: BeachAccess[],
  limit = 3,
): AccessMatch[] {
  const origin = {
    latitude: nearest.latitude,
    longitude: nearest.longitude,
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
