import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("App", () => {
  it("renders the public Topsail Beach Access shell", () => {
    const { container } = render(<App />);

    expect(
      screen.getByRole("navigation", {
        name: "Topsail Beach Access navigation",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Topsail Beach Access" }),
    ).toHaveAttribute("href", "#finder");
    expect(
      screen.getByRole("link", {
        name: "A free tool from Carolina Coast Pricing",
      }),
    ).toHaveAttribute("href", "https://carolinacoastpricing.com");
    expect(
      screen.getByRole("heading", {
        name: "Find the beach access closest to your Topsail stay.",
      }),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Treasure Vacation Rentals/i);
    expect(container.textContent).not.toMatch(/prototype/i);
    expect(container.textContent).not.toMatch(/Example Rental/i);
  });
});
