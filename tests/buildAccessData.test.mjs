import { describe, expect, it } from "vitest";
import { buildAccessDataFromCsv } from "../scripts/build-access-data.mjs";

describe("buildAccessDataFromCsv", () => {
  it("keeps only Topsail ocean accesses and normalizes fields", () => {
    const rows = buildAccessDataFromCsv("tests/fixtures/beach_access_sample.csv");

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      id: "north-topsail-beach-onslow-co-beach-access-2",
      town: "North Topsail Beach",
      name: "Onslow Co. Beach Access #2",
      parkingSpots: 250,
      parkingFee: true,
      restroom: true,
      shower: true,
      handicapAccessible: true,
    });
  });

  it("attaches category labels and keeps mediaIds empty by default", () => {
    const rows = buildAccessDataFromCsv("tests/fixtures/beach_access_sample.csv");
    const quiet = rows.find((row) => row.name === "Quiet Walkover");

    expect(quiet.categories).toEqual(["Quiet"]);
    expect(quiet.mediaIds).toEqual([]);
  });

  it("keeps duplicate access names addressable with unique IDs", () => {
    const rows = buildAccessDataFromCsv(
      "tests/fixtures/beach_access_duplicates.csv",
    );

    expect(rows.map((row) => row.id)).toEqual([
      "north-topsail-beach-beach-access-8-322-sea-shore-dr",
      "north-topsail-beach-beach-access-8-540-ocean-drive",
    ]);
  });

  it("applies tracked parking overrides after generating stable access IDs", () => {
    const rows = buildAccessDataFromCsv(
      "tests/fixtures/beach_access_sample.csv",
      "tests/fixtures/access_parking_overrides.json",
    );
    const access = rows.find((row) => row.id === "surf-city-beach-access-18");

    expect(access).toMatchObject({
      parkingSpots: 127,
      parkingFee: true,
      hourlyRate: "$3.00",
      dailyRate: "$20.00",
      weeklyRate: "$60.00",
      routeLatitude: 34.4352826,
      routeLongitude: -77.5274577,
      source: "Town of Surf City",
      categories: ["Major", "Facilities"],
      usefulnessScore: 185,
    });
  });
});
