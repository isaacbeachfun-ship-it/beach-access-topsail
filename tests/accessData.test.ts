import { describe, expect, it } from "vitest";
import accesses from "../src/data/accesses.json";

describe("access data", () => {
  it("keeps Surf City Beach Access #4 mapped to the current town parking lot", () => {
    const access = accesses.find(
      (row) => row.id === "surf-city-beach-access-4",
    );

    expect(access).toMatchObject({
      town: "Surf City",
      name: "Beach Access #4",
      address: "1800 North Shore Drive, Surf City, NC 28445",
      parkingSpots: 12,
      parkingOptions: "On-Street Parking",
      parkingFee: true,
      source: "Town of Surf City",
      sourceDetail:
        "Town public access list + Surf City GIS parking map + 2026 visitor/season parking pages",
    });
  });

  it("matches Surf City's official parking map counts and visitor rates", () => {
    const expectedParking = new Map<number, { paid: number; free: number }>([
      [1, { paid: 25, free: 0 }],
      [2, { paid: 6, free: 0 }],
      [3, { paid: 56, free: 0 }],
      [4, { paid: 12, free: 0 }],
      [5, { paid: 34, free: 0 }],
      [6, { paid: 0, free: 0 }],
      [7, { paid: 8, free: 0 }],
      [8, { paid: 2, free: 0 }],
      [9, { paid: 11, free: 0 }],
      [10, { paid: 0, free: 0 }],
      [11, { paid: 35, free: 0 }],
      [12, { paid: 9, free: 0 }],
      [13, { paid: 26, free: 0 }],
      [14, { paid: 12, free: 14 }],
      [15, { paid: 25, free: 0 }],
      [16, { paid: 102, free: 0 }],
      [17, { paid: 62, free: 0 }],
      [18, { paid: 127, free: 0 }],
      [19, { paid: 140, free: 0 }],
      [20, { paid: 32, free: 0 }],
      [21, { paid: 5, free: 0 }],
      [22, { paid: 16, free: 0 }],
      [23, { paid: 31, free: 0 }],
      [24, { paid: 15, free: 0 }],
      [25, { paid: 30, free: 0 }],
      [26, { paid: 0, free: 0 }],
      [27, { paid: 0, free: 0 }],
      [28, { paid: 28, free: 0 }],
      [29, { paid: 0, free: 0 }],
      [30, { paid: 10, free: 0 }],
      [31, { paid: 0, free: 0 }],
      [32, { paid: 0, free: 0 }],
      [33, { paid: 0, free: 0 }],
      [34, { paid: 0, free: 0 }],
      [35, { paid: 10, free: 0 }],
      [36, { paid: 0, free: 0 }],
      [37, { paid: 10, free: 0 }],
      [38, { paid: 0, free: 0 }],
      [39, { paid: 12, free: 0 }],
    ]);

    for (const [accessNumber, expected] of expectedParking) {
      const access = accesses.find(
        (row) =>
          row.town === "Surf City" && row.name === `Beach Access #${accessNumber}`,
      );
      const totalParking = expected.paid + expected.free;

      expect(access, `Surf City access #${accessNumber}`).toMatchObject({
        parkingSpots: totalParking,
        parkingFee:
          expected.paid > 0 ? true : totalParking > 0 ? false : null,
      });

      if (expected.paid > 0) {
        expect(access).toMatchObject({
          hourlyRate: "$3.00",
          dailyRate: "$20.00",
          weeklyRate: "$60.00",
          seasonalRate: expect.stringContaining("$300.00"),
        });
      }

      if (totalParking === 0) {
        expect(access).toMatchObject({
          parkingOptions: "No Parking",
          hourlyRate: null,
          dailyRate: null,
          weeklyRate: null,
          seasonalRate: null,
        });
      }
    }
  });

  it("does not attach paid parking rates to accesses with no parking", () => {
    const zeroParkingAccesses = accesses.filter((row) => row.parkingSpots === 0);

    expect(zeroParkingAccesses.length).toBeGreaterThan(0);
    for (const access of zeroParkingAccesses) {
      expect(access.parkingFee, access.id).toBeNull();
      expect(access.parkingOptions, access.id).toBe("No Parking");
      expect(access.hourlyRate, access.id).toBeNull();
      expect(access.dailyRate, access.id).toBeNull();
      expect(access.weeklyRate, access.id).toBeNull();
      expect(access.seasonalRate, access.id).toBeNull();
    }
  });

  it("keeps Topsail Beach paid parking limited to the official oceanfront paid accesses", () => {
    const paidAccessNumbers = new Set([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

    for (const access of accesses.filter((row) => row.town === "Topsail Beach")) {
      const match = access.name.match(/#(\d+)/);
      if (!match) continue;

      const accessNumber = Number(match[1]);
      if (paidAccessNumbers.has(accessNumber)) {
        expect(access.parkingSpots, access.id).toBeGreaterThan(0);
        expect(access.parkingFee, access.id).toBe(true);
        expect(access.hourlyRate, access.id).toBe("$6.00");
        expect(access.dailyRate, access.id).toBe("$30.00");
      } else if (access.parkingSpots > 0) {
        expect(access.parkingFee, access.id).toBe(false);
        expect(access.hourlyRate, access.id).toBeNull();
        expect(access.dailyRate, access.id).toBeNull();
      }
    }
  });
});
