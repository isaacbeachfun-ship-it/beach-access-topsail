import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("App", () => {
  it("does not render the old standalone prototype photo section", () => {
    render(<App />);

    expect(screen.queryByRole("link", { name: "Media" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Photos in this mockup" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Current media status")).not.toBeInTheDocument();
  });
});
