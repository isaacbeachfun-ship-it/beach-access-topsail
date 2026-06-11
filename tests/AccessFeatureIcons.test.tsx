import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { AccessFeatureList } from "../src/components/AccessFeatureIcons";
import type { BeachAccess } from "../src/types/access";

const access = {
  parkingSpots: 16,
  parkingFee: false,
  restroom: true,
  shower: true,
  lifeguards: false,
  beachWheelchair: false,
  beachMat: false,
  mobiMat: false,
  handicapAccessible: true,
  vehicleAccess: false,
  duneWalkover: true,
} as BeachAccess;

describe("AccessFeatureList", () => {
  test("renders accessible icon chips for key access features", () => {
    render(<AccessFeatureList access={access} />);

    expect(screen.getByLabelText("16 parking spaces")).toBeInTheDocument();
    expect(screen.getByLabelText("Restroom")).toBeInTheDocument();
    expect(screen.getByLabelText("Shower")).toBeInTheDocument();
    expect(screen.getByLabelText("ADA accessible")).toBeInTheDocument();
  });

  test("supports a compact limit for dense cards", () => {
    render(<AccessFeatureList access={access} limit={2} variant="compact" />);

    expect(screen.getByLabelText("16 parking spaces")).toBeInTheDocument();
    expect(screen.getByLabelText("Restroom")).toBeInTheDocument();
    expect(screen.queryByLabelText("Shower")).not.toBeInTheDocument();
  });
});
