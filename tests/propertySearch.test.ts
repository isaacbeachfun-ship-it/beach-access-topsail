import { describe, expect, it } from "vitest";
import {
  propertyToLookupPoint,
  searchPropertyAddresses,
} from "../src/lib/propertySearch";
import type { PropertyAddress } from "../src/types/access";

const properties: PropertyAddress[] = [
  {
    id: "onslow-4444-island",
    address: "4444 Island Dr",
    town: "North Topsail Beach",
    county: "Onslow",
    latitude: 34.4867,
    longitude: -77.432,
    parcelCount: 1,
    source: "Onslow County GIS",
  },
  {
    id: "onslow-4414-island",
    address: "4414 Island Dr",
    town: "North Topsail Beach",
    county: "Onslow",
    latitude: 34.485,
    longitude: -77.434,
    parcelCount: 1,
    source: "Onslow County GIS",
  },
  {
    id: "surf-city-305-shore",
    address: "305 S Shore Dr",
    town: "Surf City",
    county: "Pender",
    latitude: 34.42415,
    longitude: -77.54795,
    parcelCount: 1,
    source: "Pender County GIS",
  },
];

describe("searchPropertyAddresses", () => {
  it("narrows numeric typing to matching address numbers", () => {
    const results = searchPropertyAddresses(properties, "44", 10);

    expect(results.map((property) => property.address)).toEqual([
      "4414 Island Dr",
      "4444 Island Dr",
    ]);
  });

  it("matches street suffix variations like Drive and Dr", () => {
    const results = searchPropertyAddresses(properties, "4444 island drive", 5);

    expect(results[0]).toMatchObject({
      address: "4444 Island Dr",
      town: "North Topsail Beach",
    });
  });
});

describe("propertyToLookupPoint", () => {
  it("uses the selected GIS parcel coordinates as the lookup point", () => {
    expect(propertyToLookupPoint(properties[0])).toEqual({
      address: "4444 Island Dr, North Topsail Beach, NC",
      latitude: 34.4867,
      longitude: -77.432,
    });
  });
});
