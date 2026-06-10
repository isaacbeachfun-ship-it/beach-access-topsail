import { describe, expect, it } from "vitest";
import { classifyAccess, scoreAccessUsefulness } from "../src/lib/accessScoring";
import type { BeachAccess } from "../src/types/access";

function access(overrides: Partial<BeachAccess>): BeachAccess {
  return {
    id: "surf-city-roland",
    town: "Surf City",
    name: "Beach Access #18",
    address: "100 Roland Ave",
    latitude: 34.425716,
    longitude: -77.544528,
    waterType: "ocean",
    accessType: "public",
    parkingSpots: 32,
    handicapSpots: 0,
    parkingOptions: "Onsite Parking",
    parkingFee: true,
    hourlyRate: null,
    dailyRate: null,
    weeklyRate: null,
    seasonalRate: null,
    restroom: true,
    shower: true,
    lifeguards: false,
    beachWheelchair: true,
    beachMat: false,
    mobiMat: false,
    handicapAccessible: false,
    vehicleAccess: false,
    duneWalkover: false,
    source: "NC DCM",
    sourceDetail: "Town access details",
    comments: "",
    mediaIds: [],
    ...overrides,
  };
}

describe("scoreAccessUsefulness", () => {
  it("gives major parking and facilities a higher guest usefulness score", () => {
    const countyLot = access({
      name: "Onslow Co. Beach Access #2",
      parkingSpots: 250,
      restroom: true,
      shower: true,
      handicapAccessible: true,
      beachWheelchair: true,
    });
    const neighborhoodWalkover = access({
      name: "Quiet walkover",
      parkingSpots: 0,
      restroom: false,
      shower: false,
      handicapAccessible: false,
      beachWheelchair: false,
    });

    expect(scoreAccessUsefulness(countyLot)).toBeGreaterThan(
      scoreAccessUsefulness(neighborhoodWalkover),
    );
  });
});

describe("classifyAccess", () => {
  it("classifies large facility-heavy lots as major", () => {
    expect(
      classifyAccess(
        access({
          parkingSpots: 150,
          restroom: true,
          shower: true,
          handicapAccessible: true,
        }),
      ),
    ).toContain("Major");
  });

  it("classifies small no-parking walkovers as quiet", () => {
    expect(
      classifyAccess(
        access({
          parkingSpots: 0,
          restroom: false,
          shower: false,
          handicapAccessible: false,
        }),
      ),
    ).toEqual(["Quiet"]);
  });

  it("adds facilities when an access has restrooms or showers", () => {
    expect(classifyAccess(access({ parkingSpots: 4, restroom: true }))).toContain(
      "Facilities",
    );
  });
});
