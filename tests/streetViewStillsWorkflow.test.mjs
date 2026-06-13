import { describe, expect, it } from "vitest";
import {
  metadataToStreetViewRecord,
  pruneStreetViewStillRegistry,
  selectStreetViewStillTargets,
} from "../scripts/street-view-stills-workflow.mjs";

const accesses = [
  {
    id: "active-video",
    name: "Active Video",
    latitude: 34.4,
    longitude: -77.5,
  },
  {
    id: "missing-video",
    name: "Missing Video",
    latitude: 34.401,
    longitude: -77.5,
  },
  {
    id: "already-has-still",
    name: "Already Has Still",
    latitude: 34.402,
    longitude: -77.5,
  },
];

describe("street view still workflow", () => {
  it("targets accesses without existing available stills even when aerial videos are active", () => {
    const targets = selectStreetViewStillTargets(
      accesses,
      {
        "active-video": { state: "ACTIVE" },
        "missing-video": { state: "NOT_FOUND" },
        "already-has-still": { state: "NOT_FOUND" },
      },
      {
        "already-has-still": { state: "AVAILABLE" },
      },
    );

    expect(targets.map((access) => access.id)).toEqual([
      "active-video",
      "missing-video",
    ]);
  });

  it("drops stale still records for access ids no longer in the current inventory", () => {
    const registry = pruneStreetViewStillRegistry(
      {
        "active-video": { state: "AVAILABLE", panoId: "pano-active" },
        "stale-id": { state: "AVAILABLE", panoId: "pano-stale" },
      },
      accesses,
    );

    expect(Object.keys(registry)).toEqual(["active-video"]);
  });

  it("can include active aerial video accesses for a full refresh", () => {
    const targets = selectStreetViewStillTargets(
      accesses,
      {
        "active-video": { state: "ACTIVE" },
      },
      {},
      { includeActive: true },
    );

    expect(targets.map((access) => access.id)).toEqual([
      "active-video",
      "missing-video",
      "already-has-still",
    ]);
  });

  it("turns Street View metadata into a pano record aimed at the access", () => {
    const record = metadataToStreetViewRecord(
      {
        id: "missing-video",
        latitude: 34.401,
        longitude: -77.5,
      },
      {
        status: "OK",
        pano_id: "pano-123",
        location: { lat: 34.4, lng: -77.5 },
        date: "2025-06",
        copyright: "© Google",
      },
      "2026-06-11T00:00:00.000Z",
    );

    expect(record).toEqual({
      state: "AVAILABLE",
      panoId: "pano-123",
      latitude: 34.4,
      longitude: -77.5,
      heading: 0,
      pitch: 0,
      fov: 70,
      date: "2025-06",
      copyright: "© Google",
      checkedAt: "2026-06-11T00:00:00.000Z",
    });
  });

  it("applies reviewed heading overrides to generated pano records", () => {
    const record = metadataToStreetViewRecord(
      {
        id: "missing-video",
        latitude: 34.401,
        longitude: -77.5,
      },
      {
        status: "OK",
        pano_id: "pano-123",
        location: { lat: 34.4, lng: -77.5 },
        date: "2025-06",
        copyright: "© Google",
      },
      "2026-06-11T00:00:00.000Z",
      { heading: 185 },
    );

    expect(record.heading).toBe(185);
  });
});
