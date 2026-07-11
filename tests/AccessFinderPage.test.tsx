/// <reference types="node" />

import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  AccessFinderPage,
  isLaunchSafeMedia,
} from "../src/components/AccessFinderPage";
import type { AccessMedia } from "../src/types/access";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

function createMedia(status: AccessMedia["status"]): AccessMedia {
  return {
    id: `media-${status}`,
    accessId: "test-access",
    title: "Test media",
    url: "https://example.com/media.jpg",
    sourceLabel: "Test source",
    sourceUrl: "https://example.com",
    status,
    kind: "photo",
  };
}

describe("AccessFinderPage", () => {
  test("keeps the finder and map but omits standalone sections when embedded", () => {
    render(<AccessFinderPage embedded />);

    expect(
      screen.getByRole("combobox", { name: "Topsail property address" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Explore every Topsail Island access" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Guest favorites")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Topsail Island beach access guide"),
    ).not.toBeInTheDocument();
  });

  test("accepts launch-safe media", () => {
    expect(isLaunchSafeMedia(createMedia("launch-safe"))).toBe(true);
  });

  test("rejects media that is not launch-safe", () => {
    expect(isLaunchSafeMedia(createMedia("prototype-only"))).toBe(false);
    expect(isLaunchSafeMedia(createMedia("needs-replacement"))).toBe(false);
  });

  test("does not hotlink prototype Treasure media in the page hero", () => {
    expect(styles).not.toContain("treasure-rentals-website-mockup");
    expect(styles).not.toContain("isaacbeachfun-ship-it.github.io");
  });

  test("keeps MapLibre markers out of document flow", () => {
    expect(styles).toMatch(
      /\.maplibre-access-marker\s*\{[^}]*position:\s*absolute;/s,
    );
    expect(styles).not.toMatch(
      /\.google-map-marker,\s*\.maplibre-access-marker\s*\{[^}]*position:\s*relative;/s,
    );
  });

  test("bounds the map and tightens the hero on mobile", () => {
    const mobileStyles = styles.slice(styles.indexOf("@media (max-width: 620px)"));

    expect(mobileStyles).toMatch(
      /\.finder-map-panel \.island-map\s*\{[^}]*height:\s*340px;/s,
    );
    expect(mobileStyles).toMatch(
      /\.page-hero h1\s*\{[^}]*font-size:\s*38px;/s,
    );
  });

  test("uses a swipeable guest-favorites row on mobile", () => {
    const mobileStyles = styles.slice(styles.indexOf("@media (max-width: 620px)"));

    expect(mobileStyles).toMatch(
      /\.major-directory\s*\{[^}]*grid-auto-flow:\s*column;[^}]*overflow-x:\s*auto;[^}]*scroll-snap-type:\s*x mandatory;/s,
    );
    expect(mobileStyles).toMatch(
      /\.major-directory article\s*\{[^}]*scroll-snap-align:\s*start;/s,
    );
  });

  test("uses public launch copy and excludes prototype-only media", () => {
    const { container } = render(<AccessFinderPage />);

    expect(
      screen.getByRole("heading", {
        name: "Type an address. We’ll find the beach path.",
      }),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Treasure/i);
    expect(container.textContent).not.toMatch(/prototype/i);
    expect(container.textContent).not.toMatch(/Prototype only/i);
  });

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

  test("shows the Oyster Lane neighborhood access at the end of the street", async () => {
    render(<AccessFinderPage />);

    const input = screen.getByRole("combobox", {
      name: "Topsail property address",
    });
    fireEvent.change(input, { target: { value: "200 Oyster Ln" } });
    fireEvent.click(
      await screen.findByRole("option", { name: /200 Oyster Ln/i }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Oyster Lane Beach Access",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Neighborhood beach access")).toBeInTheDocument();
    expect(screen.getByText("End of Oyster Lane")).toBeInTheDocument();
  });

  test("submits the only matching local property instead of geocoding partial text", async () => {
    render(<AccessFinderPage />);

    const input = screen.getByRole("combobox", {
      name: "Topsail property address",
    });
    fireEvent.change(input, { target: { value: "208 oyster" } });

    expect(
      await screen.findByRole("option", { name: /208 Oyster Ln/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Find Access" }));

    expect(
      await screen.findByRole("heading", {
        name: "Oyster Lane Beach Access",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("End of Oyster Lane")).toBeInTheDocument();
  });

  test("shows the Port Drive neighborhood access at the end of the street", async () => {
    render(<AccessFinderPage />);

    const input = screen.getByRole("combobox", {
      name: "Topsail property address",
    });
    fireEvent.change(input, { target: { value: "235 Port Dr" } });
    fireEvent.click(
      await screen.findByRole("option", { name: /235 Port Dr/i }),
    );

    expect(
      await screen.findByRole("heading", { name: "Port Drive Beach Access" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Neighborhood beach access")).toBeInTheDocument();
    expect(screen.getByText("End of Port Drive")).toBeInTheDocument();
  });
});
