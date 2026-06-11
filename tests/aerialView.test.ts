import { describe, expect, test } from "vitest";
import {
  buildAerialViewAddress,
  extractAerialViewMedia,
  lookupAerialView,
} from "../src/lib/aerialView";
import type { BeachAccess } from "../src/types/access";

const access = {
  name: "Beach Access #33",
  address: "232 New River Inlet Rd",
  town: "North Topsail Beach",
  latitude: 34.512,
  longitude: -77.377,
} as BeachAccess;

describe("aerial view helpers", () => {
  test("builds a postal-style Topsail access address for Google", () => {
    expect(buildAerialViewAddress(access)).toBe(
      "232 New River Inlet Rd, North Topsail Beach, NC",
    );
  });

  test("skips aerial lookup when an access has no address", () => {
    expect(buildAerialViewAddress({ ...access, address: null })).toBeNull();
  });

  test("extracts image and video URIs from an active Aerial View response", () => {
    const media = extractAerialViewMedia({
      uris: {
        IMAGE: {
          landscapeUri: "https://example.com/landscape.jpg",
          portraitUri: "https://example.com/portrait.jpg",
        },
        MP4_HIGH: {
          landscapeUri: "https://example.com/high.mp4",
        },
      },
      metadata: {
        state: "ACTIVE",
        captureDate: { year: 2025, month: 7, day: 3 },
        duration: "40s",
        videoId: "abc123",
      },
    });

    expect(media).toEqual({
      state: "available",
      videoId: "abc123",
      thumbnailUrl: "https://example.com/landscape.jpg",
      portraitThumbnailUrl: "https://example.com/portrait.jpg",
      videoUrl: "https://example.com/high.mp4",
      captureLabel: "Jul 3, 2025",
      duration: "40s",
    });
  });

  test("returns unavailable instead of throwing when Google has no video", async () => {
    const fetcher = async () =>
      new Response(JSON.stringify({ error: { code: 404 } }), {
        status: 404,
      });

    await expect(lookupAerialView(access, "test-key", fetcher)).resolves.toEqual(
      { state: "unavailable" },
    );
  });

  test("sends the API key with Google's standard key query parameter", async () => {
    let requestedUrl = "";
    const fetcher = async (input: string) => {
      requestedUrl = input;
      return new Response(JSON.stringify({ state: "NOT_FOUND" }), {
        status: 404,
      });
    };

    await lookupAerialView(access, "test-key", fetcher);

    expect(new URL(requestedUrl).searchParams.get("key")).toBe("test-key");
  });

  test("uses a stored video id instead of an address when provided", async () => {
    let requestedUrl = "";
    const fetcher = async (input: string) => {
      requestedUrl = input;
      return new Response(JSON.stringify({ state: "PROCESSING" }), {
        status: 200,
      });
    };

    await lookupAerialView(access, "test-key", fetcher, {
      videoId: "stored-video-id",
    });

    const params = new URL(requestedUrl).searchParams;
    expect(params.get("videoId")).toBe("stored-video-id");
    expect(params.get("address")).toBeNull();
  });
});
