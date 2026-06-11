import { describe, expect, it } from "vitest";
import {
  selectFallbackRenderCandidates,
  selectRenderCandidates,
  shouldStopRenderBatch,
  summarizeAerialRegistry,
} from "../scripts/aerial-view-workflow.mjs";

const baseAccess = {
  id: "base",
  town: "Surf City",
  name: "Base Access",
  address: "100 Beach Rd",
  latitude: 34.4,
  longitude: -77.5,
  waterType: "Ocean",
  accessType: "Beach",
  parkingSpots: 0,
  restroom: false,
  shower: false,
  handicapAccessible: false,
  beachWheelchair: false,
  beachMat: false,
  mobiMat: false,
  usefulnessScore: 0,
};

describe("selectRenderCandidates", () => {
  it("skips already attempted records and keeps moving down the priority list", () => {
    const candidates = selectRenderCandidates(
      [
        {
          ...baseAccess,
          id: "active-big",
          name: "Active Big",
          usefulnessScore: 100,
          parkingSpots: 250,
        },
        {
          ...baseAccess,
          id: "failed-big",
          name: "Failed Big",
          usefulnessScore: 90,
          parkingSpots: 100,
        },
        {
          ...baseAccess,
          id: "new-big",
          name: "New Big",
          usefulnessScore: 80,
          parkingSpots: 50,
        },
        {
          ...baseAccess,
          id: "new-small",
          name: "New Small",
          usefulnessScore: 1,
        },
      ],
      {
        "active-big": { state: "ACTIVE", videoId: "active-video" },
        "failed-big": { state: "NOT_FOUND", videoId: "failed-video" },
      },
      { limit: 2 },
    );

    expect(candidates.map((candidate) => candidate.id)).toEqual([
      "new-big",
      "new-small",
    ]);
  });

  it("can limit work to bigger access candidates", () => {
    const candidates = selectRenderCandidates(
      [
        {
          ...baseAccess,
          id: "quiet",
          name: "Quiet",
          usefulnessScore: 1,
        },
        {
          ...baseAccess,
          id: "restroom",
          name: "Restroom",
          restroom: true,
          usefulnessScore: 20,
        },
      ],
      {},
      { includeQuiet: false, limit: 5 },
    );

    expect(candidates.map((candidate) => candidate.id)).toEqual(["restroom"]);
  });

  it("does not treat a beach wheelchair flag alone as a bigger aerial candidate", () => {
    const candidates = selectRenderCandidates(
      [
        {
          ...baseAccess,
          id: "wheelchair-only",
          name: "Wheelchair Only",
          beachWheelchair: true,
          usefulnessScore: 8,
        },
      ],
      {},
      { includeQuiet: false, limit: 5 },
    );

    expect(candidates).toEqual([]);
  });
});

describe("selectFallbackRenderCandidates", () => {
  it("uses the nearest untried property address for failed access records", () => {
    const candidates = selectFallbackRenderCandidates(
      [
        {
          ...baseAccess,
          id: "failed-big",
          name: "Failed Big",
          parkingSpots: 100,
          usefulnessScore: 100,
        },
        {
          ...baseAccess,
          id: "active-big",
          name: "Active Big",
          parkingSpots: 100,
          usefulnessScore: 90,
        },
      ],
      [
        {
          id: "near",
          address: "101 Beach Rd",
          town: "Surf City",
          latitude: 34.4001,
          longitude: -77.5001,
        },
        {
          id: "far",
          address: "999 Mainland Rd",
          town: "Surf City",
          latitude: 34.9,
          longitude: -77.9,
        },
      ],
      {
        "failed-big": {
          state: "NOT_FOUND",
          address: "100 Beach Rd, Surf City, NC",
        },
        "active-big": { state: "ACTIVE", videoId: "active-video" },
      },
      { limit: 5 },
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      id: "failed-big",
      aerialAddress: "101 Beach Rd, Surf City, NC",
      addressSource: "nearby-property",
      fallbackPropertyId: "near",
      originalAerialAddress: "100 Beach Rd, Surf City, NC",
    });
  });

  it("skips fallback property addresses that are already recorded as attempts", () => {
    const candidates = selectFallbackRenderCandidates(
      [
        {
          ...baseAccess,
          id: "failed-big",
          name: "Failed Big",
          parkingSpots: 100,
          usefulnessScore: 100,
        },
      ],
      [
        {
          id: "already-tried",
          address: "101 Beach Rd",
          town: "Surf City",
          latitude: 34.4001,
          longitude: -77.5001,
        },
        {
          id: "next-best",
          address: "103 Beach Rd",
          town: "Surf City",
          latitude: 34.4002,
          longitude: -77.5002,
        },
      ],
      {
        "failed-big": {
          state: "NOT_FOUND",
          address: "100 Beach Rd, Surf City, NC",
          attempts: [
            {
              address: "101 Beach Rd, Surf City, NC",
              addressSource: "nearby-property",
            },
          ],
        },
      },
      { limit: 5 },
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      aerialAddress: "103 Beach Rd, Surf City, NC",
      fallbackPropertyId: "next-best",
    });
  });

  it("retries quota-exhausted fallback addresses instead of burning the attempt", () => {
    const candidates = selectFallbackRenderCandidates(
      [
        {
          ...baseAccess,
          id: "quota-hit",
          name: "Quota Hit",
          parkingSpots: 100,
          usefulnessScore: 100,
        },
      ],
      [
        {
          id: "quota-address",
          address: "101 Beach Rd",
          town: "Surf City",
          latitude: 34.4001,
          longitude: -77.5001,
        },
        {
          id: "next-best",
          address: "103 Beach Rd",
          town: "Surf City",
          latitude: 34.4002,
          longitude: -77.5002,
        },
      ],
      {
        "quota-hit": {
          state: "RESOURCE_EXHAUSTED",
          address: "101 Beach Rd, Surf City, NC",
          addressSource: "nearby-property",
          originalAerialAddress: "100 Beach Rd, Surf City, NC",
          attempts: [
            {
              address: "101 Beach Rd, Surf City, NC",
              addressSource: "nearby-property",
              state: "RESOURCE_EXHAUSTED",
            },
          ],
        },
      },
      { limit: 5, maxFallbackAttempts: 1 },
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      aerialAddress: "101 Beach Rd, Surf City, NC",
      fallbackPropertyId: "quota-address",
    });
  });

  it("stops after the configured number of nearby-property attempts", () => {
    const candidates = selectFallbackRenderCandidates(
      [
        {
          ...baseAccess,
          id: "failed-big",
          name: "Failed Big",
          parkingSpots: 100,
          usefulnessScore: 100,
        },
      ],
      [
        {
          id: "next-best",
          address: "109 Beach Rd",
          town: "Surf City",
          latitude: 34.4003,
          longitude: -77.5003,
        },
      ],
      {
        "failed-big": {
          state: "NOT_FOUND",
          address: "107 Beach Rd, Surf City, NC",
          addressSource: "nearby-property",
          attempts: [
            { address: "101 Beach Rd, Surf City, NC", addressSource: "nearby-property" },
            { address: "103 Beach Rd, Surf City, NC", addressSource: "nearby-property" },
          ],
        },
      },
      { limit: 5, maxFallbackAttempts: 3 },
    );

    expect(candidates).toEqual([]);
  });
});

describe("summarizeAerialRegistry", () => {
  it("counts registry states for progress reporting", () => {
    expect(
      summarizeAerialRegistry({
        first: { state: "ACTIVE" },
        second: { state: "ACTIVE" },
        third: { state: "NOT_FOUND" },
      }),
    ).toEqual({ ACTIVE: 2, NOT_FOUND: 1 });
  });
});

describe("shouldStopRenderBatch", () => {
  it("stops a render batch when Google reports render quota exhaustion", () => {
    expect(
      shouldStopRenderBatch({
        state: "RESOURCE_EXHAUSTED",
        errorMessage:
          "Quota exceeded for quota metric 'RenderVideo requests' and limit 'RenderVideo requests per day'.",
      }),
    ).toBe(true);
  });

  it("continues after ordinary render outcomes", () => {
    expect(shouldStopRenderBatch({ state: "PROCESSING" })).toBe(false);
    expect(shouldStopRenderBatch({ state: "NOT_FOUND" })).toBe(false);
  });
});
