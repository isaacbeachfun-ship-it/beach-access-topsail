import { describe, expect, test } from "vitest";
import {
  getAccessFeatures,
  getMapMarkerFeatures,
} from "../src/lib/accessFeatures";
import type { BeachAccess } from "../src/types/access";

function access(overrides: Partial<BeachAccess> = {}): BeachAccess {
  return {
    id: "access",
    town: "Surf City",
    name: "Feature Access",
    address: "100 Beach Dr",
    latitude: 34.4,
    longitude: -77.5,
    waterType: "Ocean",
    accessType: "Beach",
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
    duneWalkover: true,
    source: "NC DCM",
    sourceDetail: "",
    comments: "",
    mediaIds: [],
    ...overrides,
  };
}

describe("access feature icons", () => {
  test("turns beach access facts into ordered guest-facing features", () => {
    const features = getAccessFeatures(
      access({
        parkingSpots: 34,
        parkingFee: true,
        restroom: true,
        shower: true,
        handicapAccessible: true,
        beachMat: true,
      }),
    );

    expect(features.map((feature) => feature.id)).toEqual([
      "parking",
      "restroom",
      "shower",
      "accessible",
      "beachMat",
      "paidParking",
      "duneWalkover",
    ]);
    expect(features[0]).toMatchObject({
      label: "34 parking spaces",
      shortLabel: "34 spaces",
      mapLabel: "P",
    });
  });

  test("keeps no-parking warnings out of compact map marker badges", () => {
    const features = getMapMarkerFeatures(
      access({
        parkingSpots: 0,
        restroom: true,
        shower: true,
      }),
    );

    expect(features.map((feature) => feature.id)).toEqual([
      "restroom",
      "shower",
      "duneWalkover",
    ]);
  });
});
