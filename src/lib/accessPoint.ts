import type { BeachAccess } from "../types/access";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export type AccessPointInput = Pick<BeachAccess, "latitude" | "longitude"> &
  Partial<Pick<BeachAccess, "routeLatitude" | "routeLongitude">>;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function hasAccessRoutePoint(access: AccessPointInput): boolean {
  return (
    isFiniteNumber(access.routeLatitude) &&
    isFiniteNumber(access.routeLongitude)
  );
}

export function getAccessRoutePoint(access: AccessPointInput): GeoPoint {
  if (hasAccessRoutePoint(access)) {
    return {
      latitude: access.routeLatitude!,
      longitude: access.routeLongitude!,
    };
  }

  return {
    latitude: access.latitude,
    longitude: access.longitude,
  };
}
