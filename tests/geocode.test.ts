import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeTopsailAddress } from "../src/lib/geocode";

describe("geocodeTopsailAddress", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns bundled local coordinates before trying external geocoding", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    const point = await geocodeTopsailAddress(
      "305 S Shore Dr, Surf City, NC 28445",
    );

    expect(point.address).toContain("305 S Shore Dr");
    expect(point.latitude).toBeCloseTo(34.424, 2);
    expect(point.longitude).toBeCloseTo(-77.548, 2);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns bundled GIS property coordinates before trying external geocoding", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    const point = await geocodeTopsailAddress("4444 Island Drive");

    expect(point.address).toBe("4444 Island Dr, North Topsail Beach, NC");
    expect(point.latitude).toBeCloseTo(34.4867, 3);
    expect(point.longitude).toBeCloseTo(-77.432, 3);
    expect(fetch).not.toHaveBeenCalled();
  });
});
