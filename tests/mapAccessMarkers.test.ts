import { describe, expect, test } from "vitest";
import accessesData from "../src/data/accesses.json";
import propertyAddressesData from "../src/data/propertyAddresses.json";
import { findNearestAccess, rankMajorAlternates } from "../src/lib/accessLookup";
import {
  getCameraFitAccesses,
  getMapAccessMarkerGroups,
  isMajorMapAccess,
} from "../src/lib/mapAccessMarkers";
import { propertyToLookupPoint } from "../src/lib/propertySearch";
import type { BeachAccess, PropertyAddress } from "../src/types/access";

const accesses = accessesData as BeachAccess[];
const propertyAddresses = propertyAddressesData as PropertyAddress[];

describe("map access marker groups", () => {
  test("splits canonical Topsail accesses into prominent major markers and small other markers", () => {
    const groups = getMapAccessMarkerGroups(accesses);

    expect(groups.major).toHaveLength(16);
    expect(groups.other).toHaveLength(accesses.length - groups.major.length);
    expect(groups.major.every(isMajorMapAccess)).toBe(true);
    expect(groups.other.every((access) => !isMajorMapAccess(access))).toBe(true);
  });

  test("excludes highlighted access ids from the background marker groups", () => {
    const highlightedAccess = accesses.find((access) => isMajorMapAccess(access));

    expect(highlightedAccess).toBeDefined();

    const groups = getMapAccessMarkerGroups(
      accesses,
      new Set([highlightedAccess!.id]),
    );

    expect(groups.major.map((access) => access.id)).not.toContain(
      highlightedAccess!.id,
    );
    expect(groups.other.map((access) => access.id)).not.toContain(
      highlightedAccess!.id,
    );
  });

  test("keeps route camera focused on only the property and selected access", () => {
    const property = propertyAddresses.find(
      (candidate) =>
        candidate.address === "235 Port Dr" &&
        candidate.town === "North Topsail Beach",
    );

    expect(property).toBeDefined();

    const closest = findNearestAccess(propertyToLookupPoint(property!), accesses);
    const alternates = rankMajorAlternates(closest.access, accesses, 3);

    expect(alternates.length).toBeGreaterThan(0);
    expect(getCameraFitAccesses(accesses, closest, alternates)).toEqual([]);
  });
});
