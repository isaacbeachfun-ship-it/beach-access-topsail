import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AccessFinderPage } from "../src/components/AccessFinderPage";
import {
  findNearestAccess,
  type LookupPoint,
} from "../src/lib/accessLookup";
import type { BeachAccess } from "../src/types/access";

const routeLookup = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/accessLookup", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/lib/accessLookup")>();
  return { ...actual, findNearestAccessByWalkingRoute: routeLookup };
});

describe("AccessFinderPage repeat searches", () => {
  beforeEach(() => {
    routeLookup.mockReset();
    routeLookup.mockImplementation(
      async (point: LookupPoint, accesses: BeachAccess[]) =>
        findNearestAccess(point, accesses),
    );
  });

  test("keeps the current result visible while a repeat lookup is pending", async () => {
    render(<AccessFinderPage embedded />);

    const input = screen.getByRole("combobox", {
      name: "Topsail property address",
    });
    fireEvent.change(input, { target: { value: "208 Oyster Ln" } });
    fireEvent.click(
      await screen.findByRole("option", { name: /208 Oyster Ln/i }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Oyster Lane Beach Access",
      }),
    ).toBeInTheDocument();

    routeLookup.mockImplementationOnce(() => new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "Find Access" }));

    expect(
      screen.getByRole("heading", { name: "Oyster Lane Beach Access" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finding..." })).toBeDisabled();
  });
});
