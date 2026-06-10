import type { LookupPoint } from "./accessLookup";
import type { PropertyAddress } from "../types/access";

const STREET_SUFFIXES: Record<string, string> = {
  avenue: "ave",
  ave: "ave",
  boulevard: "blvd",
  blvd: "blvd",
  circle: "cir",
  cir: "cir",
  court: "ct",
  ct: "ct",
  drive: "dr",
  dr: "dr",
  highway: "hwy",
  hwy: "hwy",
  lane: "ln",
  ln: "ln",
  place: "pl",
  pl: "pl",
  road: "rd",
  rd: "rd",
  street: "st",
  st: "st",
  terrace: "ter",
  ter: "ter",
  way: "way",
};

const STATE_AND_ZIP = /\b(nc|north carolina|28445|28460)\b/g;
const TOWN_NAMES =
  /\b(north topsail beach|topsail beach|surf city|topsail island)\b/g;

export function normalizePropertyQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(STATE_AND_ZIP, " ")
    .replace(TOWN_NAMES, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => STREET_SUFFIXES[token] ?? token)
    .join(" ")
    .trim();
}

export function formatPropertyAddressLabel(property: PropertyAddress): string {
  return `${property.address}, ${property.town}, NC`;
}

export function propertyToLookupPoint(property: PropertyAddress): LookupPoint {
  return {
    address: formatPropertyAddressLabel(property),
    latitude: property.latitude,
    longitude: property.longitude,
  };
}

export function findExactPropertyAddress(
  properties: PropertyAddress[],
  query: string,
): PropertyAddress | null {
  const normalizedQuery = normalizePropertyQuery(query);
  if (!normalizedQuery) return null;

  return (
    properties.find(
      (property) => normalizePropertyQuery(property.address) === normalizedQuery,
    ) ?? null
  );
}

export function searchPropertyAddresses(
  properties: PropertyAddress[],
  query: string,
  limit = 8,
): PropertyAddress[] {
  const normalizedQuery = normalizePropertyQuery(query);
  if (!normalizedQuery) return [];

  const queryTerms = normalizedQuery.split(" ");

  return properties
    .map((property) => {
      const normalizedAddress = normalizePropertyQuery(property.address);
      const normalizedTown = normalizePropertyQuery(property.town);
      const searchText = `${normalizedAddress} ${normalizedTown}`;
      const addressNumber = normalizedAddress.match(/^\d+/)?.[0] ?? "";
      const allTermsMatch = queryTerms.every((term) => searchText.includes(term));

      if (!allTermsMatch && !normalizedAddress.startsWith(normalizedQuery)) {
        return null;
      }

      return {
        property,
        normalizedAddress,
        addressNumber,
        score: rankMatch(normalizedQuery, normalizedAddress, addressNumber),
      };
    })
    .filter((match): match is NonNullable<typeof match> => match !== null)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const numberDelta =
        Number.parseInt(a.addressNumber || "0", 10) -
        Number.parseInt(b.addressNumber || "0", 10);
      if (numberDelta !== 0) return numberDelta;
      return a.normalizedAddress.localeCompare(b.normalizedAddress);
    })
    .slice(0, limit)
    .map((match) => match.property);
}

function rankMatch(
  normalizedQuery: string,
  normalizedAddress: string,
  addressNumber: string,
): number {
  if (normalizedAddress === normalizedQuery) return 0;
  if (normalizedAddress.startsWith(normalizedQuery)) return 1;
  if (addressNumber.startsWith(normalizedQuery)) return 2;
  return 3;
}
