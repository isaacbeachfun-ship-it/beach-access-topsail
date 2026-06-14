import { describe, expect, it } from "vitest";
import { formatParkingRateSummary } from "../src/lib/parkingRates";
import type { BeachAccess } from "../src/types/access";

const baseAccess: BeachAccess = {
  id: "access",
  town: "Surf City",
  name: "Beach Access #1",
  address: "2100 North Shore Drive",
  latitude: 34.4,
  longitude: -77.5,
  waterType: "ocean",
  accessType: "Public Beach Access",
  parkingSpots: 25,
  handicapSpots: 0,
  parkingOptions: "Both Parking Options",
  parkingFee: true,
  hourlyRate: "$3.00",
  dailyRate: "$20.00",
  weeklyRate: "$60.00",
  seasonalRate: "$300.00 standard season pass",
  restroom: false,
  shower: false,
  lifeguards: false,
  beachWheelchair: false,
  beachMat: false,
  mobiMat: false,
  handicapAccessible: false,
  vehicleAccess: false,
  duneWalkover: true,
  source: "Town",
  sourceDetail: "Source",
  comments: "",
  mediaIds: [],
};

describe("formatParkingRateSummary", () => {
  it("formats paid parking rates by available time window", () => {
    expect(formatParkingRateSummary(baseAccess)).toBe(
      "Rates: $3.00/hr, $20.00/day, $60.00/week, $300.00 standard season pass",
    );
  });

  it("adds enforcement timing when the verified source notes include it", () => {
    expect(
      formatParkingRateSummary({
        ...baseAccess,
        comments:
          "Official GIS linked parking. Visitor paid parking runs Mar 1-Oct 31, 9am-6pm.",
      }),
    ).toBe(
      "Rates: $3.00/hr, $20.00/day, $60.00/week, $300.00 standard season pass. Timing: Mar 1-Oct 31, 9am-6pm",
    );
  });

  it("labels free parking without adding rates", () => {
    expect(
      formatParkingRateSummary({
        ...baseAccess,
        parkingFee: false,
        hourlyRate: null,
        dailyRate: null,
        weeklyRate: null,
        seasonalRate: null,
      }),
    ).toBe("Free parking");
  });

  it("omits rate copy when there is no parking", () => {
    expect(
      formatParkingRateSummary({
        ...baseAccess,
        parkingSpots: 0,
        parkingFee: null,
        parkingOptions: "No Parking",
        hourlyRate: null,
        dailyRate: null,
        weeklyRate: null,
        seasonalRate: null,
      }),
    ).toBeNull();
  });
});
