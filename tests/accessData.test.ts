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
      sourceDetail: "Official public beach access list + interactive parking map",
    });
  });
});
