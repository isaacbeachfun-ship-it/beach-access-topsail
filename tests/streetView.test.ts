import { describe, expect, test } from "vitest";
import {
  buildStreetViewLocationStillUrl,
  buildStreetViewStillUrl,
  headingFromPanoramaToAccess,
  type StreetViewStill,
} from "../src/lib/streetView";

describe("street view media helpers", () => {
  test("calculates the camera heading from the panorama toward the access", () => {
    expect(
      headingFromPanoramaToAccess(
        { latitude: 34.4, longitude: -77.5 },
        { latitude: 34.401, longitude: -77.5 },
      ),
    ).toBeCloseTo(0, 0);

    expect(
      headingFromPanoramaToAccess(
        { latitude: 34.4, longitude: -77.5 },
        { latitude: 34.4, longitude: -77.499 },
      ),
    ).toBeCloseTo(90, 0);
  });

  test("builds a Street View Static URL from stored pano metadata without caching images", () => {
    const still: StreetViewStill = {
      state: "AVAILABLE",
      panoId: "pano-123",
      heading: 224,
      pitch: 2,
      fov: 70,
      date: "2025-06",
      copyright: "© Google",
    };

    const url = new URL(buildStreetViewStillUrl(still, "test-key"));

    expect(url.origin + url.pathname).toBe(
      "https://maps.googleapis.com/maps/api/streetview",
    );
    expect(url.searchParams.get("pano")).toBe("pano-123");
    expect(url.searchParams.get("heading")).toBe("224");
    expect(url.searchParams.get("pitch")).toBe("2");
    expect(url.searchParams.get("fov")).toBe("70");
    expect(url.searchParams.get("size")).toBe("640x400");
    expect(url.searchParams.get("source")).toBe("outdoor");
    expect(url.searchParams.get("key")).toBe("test-key");
  });

  test("builds a location-based Street View URL when no pano metadata is cached yet", () => {
    const url = new URL(
      buildStreetViewLocationStillUrl(
        { latitude: 34.4479, longitude: -77.5081 },
        "test-key",
      ),
    );

    expect(url.searchParams.get("location")).toBe("34.4479,-77.5081");
    expect(url.searchParams.get("radius")).toBe("120");
    expect(url.searchParams.get("size")).toBe("640x400");
    expect(url.searchParams.has("heading")).toBe(false);
  });
});
