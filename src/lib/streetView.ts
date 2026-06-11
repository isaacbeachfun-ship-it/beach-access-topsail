export type StreetViewStillState = "AVAILABLE" | "NOT_FOUND" | "ERROR";

export interface StreetViewStill {
  state: StreetViewStillState;
  panoId?: string;
  latitude?: number;
  longitude?: number;
  heading?: number;
  pitch?: number;
  fov?: number;
  date?: string;
  copyright?: string;
  checkedAt?: string;
  errorMessage?: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const STREET_VIEW_STATIC_URL =
  "https://maps.googleapis.com/maps/api/streetview";

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function headingFromPanoramaToAccess(
  panorama: GeoPoint,
  access: GeoPoint,
): number {
  const startLat = toRadians(panorama.latitude);
  const endLat = toRadians(access.latitude);
  const deltaLng = toRadians(access.longitude - panorama.longitude);
  const y = Math.sin(deltaLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(deltaLng);

  return Math.round((toDegrees(Math.atan2(y, x)) + 360) % 360);
}

export function buildStreetViewStillUrl(
  still: StreetViewStill,
  apiKey: string,
): string {
  if (still.state !== "AVAILABLE" || !still.panoId || !apiKey) return "";

  const url = new URL(STREET_VIEW_STATIC_URL);
  url.searchParams.set("size", "640x400");
  url.searchParams.set("pano", still.panoId);
  url.searchParams.set("heading", String(still.heading ?? 0));
  url.searchParams.set("pitch", String(still.pitch ?? 0));
  url.searchParams.set("fov", String(still.fov ?? 70));
  url.searchParams.set("source", "outdoor");
  url.searchParams.set("key", apiKey);

  return url.toString();
}

export function buildStreetViewLocationStillUrl(
  point: GeoPoint,
  apiKey: string,
): string {
  if (!apiKey) return "";

  const url = new URL(STREET_VIEW_STATIC_URL);
  url.searchParams.set("size", "640x400");
  url.searchParams.set("location", `${point.latitude},${point.longitude}`);
  url.searchParams.set("radius", "120");
  url.searchParams.set("pitch", "0");
  url.searchParams.set("fov", "70");
  url.searchParams.set("source", "outdoor");
  url.searchParams.set("key", apiKey);

  return url.toString();
}
