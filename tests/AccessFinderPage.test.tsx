import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { AccessFinderPage } from "../src/components/AccessFinderPage";

describe("AccessFinderPage", () => {
  test("uses a non-oceanfront-style property prompt instead of 4444 Island Drive", () => {
    render(<AccessFinderPage />);

    expect(
      screen.getByPlaceholderText("204 Goldsboro Dr, North Topsail Beach"),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("4444 Island Dr, North Topsail Beach"),
    ).not.toBeInTheDocument();
  });

  test("places the interactive map with the address finder", () => {
    render(<AccessFinderPage />);

    expect(
      screen.getByRole("heading", {
        name: "Explore every Topsail Island access",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Major access")).toBeInTheDocument();
    expect(screen.getByText("Other access")).toBeInTheDocument();
  });

  test("explains the access feature icons above the on-page map", () => {
    render(<AccessFinderPage />);

    expect(screen.getByLabelText("Access feature icon key")).toBeInTheDocument();
    expect(screen.getByText("Icon key")).toBeInTheDocument();
    expect(screen.getByText("Parking spaces")).toBeInTheDocument();
    expect(screen.getByText("Restroom")).toBeInTheDocument();
    expect(screen.getByText("ADA accessible")).toBeInTheDocument();
    expect(screen.getByText("Beach wheelchair")).toBeInTheDocument();
    expect(screen.getByText("Dune walkover")).toBeInTheDocument();
  });

  test("uses clickable map view controls with closest selected by default", () => {
    render(<AccessFinderPage />);

    const closestControl = screen.getByRole("button", { name: "Closest" });
    const majorControl = screen.getByRole("button", { name: "Major access" });
    const propertyControl = screen.getByRole("button", { name: "Property" });
    const otherControl = screen.getByRole("button", { name: "Other access" });

    expect(closestControl).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(majorControl);
    expect(majorControl).toHaveAttribute("aria-pressed", "true");
    expect(closestControl).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(propertyControl);
    expect(propertyControl).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(otherControl);
    expect(otherControl).toHaveAttribute("aria-pressed", "true");
  });

  test("renders search-focused copy for each Topsail Island town", () => {
    render(<AccessFinderPage />);

    expect(
      screen.getByRole("heading", {
        name: "Find public beach access in North Topsail Beach, Surf City, and Topsail Beach",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "North Topsail Beach beach accesses",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Surf City beach accesses" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Topsail Beach beach accesses" }),
    ).toBeInTheDocument();
  });

  test("shows parking rate details for a selected paid access", async () => {
    render(<AccessFinderPage />);

    fireEvent.click(
      screen.getByRole("button", { name: /Surf City305 S Shore Dr/i }),
    );

    expect(
      await screen.findByText(
        "Rates: $3.00/hr, $20.00/day, $60.00/week, $300.00 standard season pass; $270.00 senior/military/ETJ; $100.00 apartment/mobile-home. Timing: Mar 1-Oct 31, 9am-6pm",
      ),
    ).toBeInTheDocument();
  });
});
