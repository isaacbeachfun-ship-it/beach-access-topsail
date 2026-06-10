import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeTopsailAddress } from "../src/lib/geocode";

describe("geocodeTopsailAddress", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns bundled sample rental coordinates before trying external geocoding", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    const point = await geocodeTopsailAddress(
      "305 S Shore Dr, Surf City, NC 28445",
    );

    expect(point).toMatchObject({
      address: "305 S Shore Dr, Surf City, NC 28445",
      latitude: 34.42415,
      longitude: -77.54795,
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
