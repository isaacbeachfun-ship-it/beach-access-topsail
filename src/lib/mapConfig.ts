export type MapProvider = "google" | "open-map";

type MapEnv = Record<string, string | boolean | undefined>;

export function getGoogleMapsApiKey(env: MapEnv = import.meta.env): string {
  const value = env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof value === "string" ? value.trim() : "";
}

export function getGoogleMapsMapId(env: MapEnv = import.meta.env): string {
  const value = env.VITE_GOOGLE_MAPS_MAP_ID;
  return typeof value === "string" && value.trim() ? value.trim() : "DEMO_MAP_ID";
}

export function getMapProvider(env: MapEnv = import.meta.env): MapProvider {
  return getGoogleMapsApiKey(env) ? "google" : "open-map";
}
