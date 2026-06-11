import { describe, expect, it } from "vitest";
import { getGoogleMapsMapId, getMapProvider } from "../src/lib/mapConfig";

describe("getMapProvider", () => {
  it("uses Google Maps only when an API key is configured", () => {
    expect(getMapProvider({ VITE_GOOGLE_MAPS_API_KEY: "AIza-test-key" })).toBe(
      "google",
    );
  });

  it("falls back to the open map when the Google Maps key is blank", () => {
    expect(getMapProvider({ VITE_GOOGLE_MAPS_API_KEY: "   " })).toBe(
      "open-map",
    );
  });

  it("falls back to the open map when no config is available", () => {
    expect(getMapProvider({})).toBe("open-map");
  });

  it("uses a real map ID when configured and the Google demo map for prototypes", () => {
    expect(getGoogleMapsMapId({ VITE_GOOGLE_MAPS_MAP_ID: "topsail-map" })).toBe(
      "topsail-map",
    );
    expect(getGoogleMapsMapId({})).toBe("DEMO_MAP_ID");
  });
});
