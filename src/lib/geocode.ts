import type { LookupPoint } from "./accessLookup";
import { sampleRentals } from "../data/sampleRentals";
import { loadPropertyAddresses } from "./propertyAddressIndex";
import {
  findExactPropertyAddress,
  propertyToLookupPoint,
} from "./propertySearch";

const TOPSAIL_BOUNDS = {
  minLatitude: 34.33,
  maxLatitude: 34.55,
  minLongitude: -77.66,
  maxLongitude: -77.34,
};

export async function geocodeTopsailAddress(
  address: string,
): Promise<LookupPoint> {
  const propertyAddresses = await loadPropertyAddresses();
  const propertyMatch = findExactPropertyAddress(propertyAddresses, address);
  if (propertyMatch) {
    return propertyToLookupPoint(propertyMatch);
  }

  const sampleMatch = findSampleRental(address);
  if (sampleMatch) {
    return sampleMatch;
  }

  const queries = [
    address,
    `${address}, NC`,
    `${address}, Topsail Island, NC`,
  ];

  for (const query of queries) {
    const first = await queryNominatim(query);
    if (first && isInTopsailBounds(first)) {
      return {
        address,
        latitude: Number.parseFloat(first.lat),
        longitude: Number.parseFloat(first.lon),
      };
    }
  }

  throw new Error("No match found. Try including town and ZIP code.");
}

function findSampleRental(address: string): LookupPoint | null {
  const normalized = normalizeAddress(address);
  const rental = sampleRentals.find((sample) => {
    const sampleAddress = normalizeAddress(sample.address);
    return sampleAddress.includes(normalized) || normalized.includes(sampleAddress);
  });

  if (!rental) return null;

  return {
    address,
    latitude: rental.latitude,
    longitude: rental.longitude,
  };
}

async function queryNominatim(
  query: string,
): Promise<{ lat: string; lon: string } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "3");
  // Constrain matches to the Topsail Island area so a bare street name does
  // not resolve to a same-named street in another state.
  url.searchParams.set(
    "viewbox",
    `${TOPSAIL_BOUNDS.minLongitude},${TOPSAIL_BOUNDS.maxLatitude},${TOPSAIL_BOUNDS.maxLongitude},${TOPSAIL_BOUNDS.minLatitude}`,
  );
  url.searchParams.set("bounded", "1");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      "Address lookup failed. Try a more specific Topsail address.",
    );
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string }>;
  return results[0] || null;
}

function isInTopsailBounds(result: { lat: string; lon: string }): boolean {
  const latitude = Number.parseFloat(result.lat);
  const longitude = Number.parseFloat(result.lon);

  return (
    latitude >= TOPSAIL_BOUNDS.minLatitude &&
    latitude <= TOPSAIL_BOUNDS.maxLatitude &&
    longitude >= TOPSAIL_BOUNDS.minLongitude &&
    longitude <= TOPSAIL_BOUNDS.maxLongitude
  );
}

function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/\bstreet\b/g, "st")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\bavenue\b/g, "ave")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
