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
});
