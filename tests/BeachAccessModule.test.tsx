import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BeachAccessModule } from "../src/components/BeachAccessModule";
import type { AccessMedia, BeachAccess, RentalSample } from "../src/types/access";

const rental: RentalSample = {
  id: "rental",
  name: "Surf City Treasure",
  address: "305 S Shore Dr",
  town: "Surf City",
  latitude: 34.42415,
  longitude: -77.54795,
  heroImageUrl: "/sample.jpg",
};

const closest: BeachAccess = {
  id: "closest",
  town: "Surf City",
  name: "Roland Avenue Access",
  address: "100 North Shore Drive",
  latitude: 34.425716,
  longitude: -77.544528,
  waterType: "ocean",
  accessType: "Public Beach Access",
  parkingSpots: 32,
  handicapSpots: 0,
  parkingOptions: "Onsite Parking",
  parkingFee: true,
  hourlyRate: null,
  dailyRate: null,
  weeklyRate: null,
  seasonalRate: null,
  restroom: true,
  shower: true,
  lifeguards: false,
  beachWheelchair: true,
  beachMat: false,
  mobiMat: false,
  handicapAccessible: false,
  vehicleAccess: false,
  duneWalkover: true,
  source: "NC DCM",
  sourceDetail: "Town source",
  comments: "",
  mediaIds: ["media"],
};

const media: AccessMedia[] = [
  {
    id: "media",
    accessId: "closest",
    title: "Reference photo",
    url: "/photo.jpg",
    sourceLabel: "Prototype source",
    sourceUrl: "https://example.com",
    status: "prototype-only",
    kind: "photo",
  },
];

describe("BeachAccessModule", () => {
  it("renders closest access, facts, alternates, and media warning", () => {
    render(
      <BeachAccessModule
        rental={rental}
        closestAccess={closest}
        alternates={[closest]}
        media={media}
      />,
    );

    expect(screen.getByText("Your Beach Path")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Roland Avenue Access" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Prototype only")).toBeInTheDocument();
    expect(screen.getByText("Restroom")).toBeInTheDocument();
    expect(screen.getByText("Bigger nearby accesses")).toBeInTheDocument();
  });
});
