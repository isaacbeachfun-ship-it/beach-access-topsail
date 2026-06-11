import type { PropertyAddress } from "../types/access";

let propertyAddressesPromise: Promise<PropertyAddress[]> | null = null;

// propertyAddresses.json is ~1.9 MB, so it stays out of the main bundle and
// loads on demand the first time the finder needs the address index.
export function loadPropertyAddresses(): Promise<PropertyAddress[]> {
  propertyAddressesPromise ??= import("../data/propertyAddresses.json").then(
    (module) => module.default as PropertyAddress[],
  );
  return propertyAddressesPromise;
}
