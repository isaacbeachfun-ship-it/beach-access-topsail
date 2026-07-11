import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

afterEach(() => {
  window.history.replaceState({}, "", "/");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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

  it("renders a focused finder inside the Treasure embed", () => {
    window.history.replaceState({}, "", "/?embed=treasure");

    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Type an address. We’ll find the beach path.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", {
        name: "Topsail Beach Access navigation",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: "A free tool from Carolina Coast Pricing",
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Guest favorites")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Topsail Island beach access guide"),
    ).not.toBeInTheDocument();
  });

  it("sends Treasure only the embedded document height", () => {
    window.history.replaceState({}, "", "/?embed=treasure");
    const postMessage = vi.spyOn(window.parent, "postMessage");
    const observe = vi.fn();
    const disconnect = vi.fn();
    class MockResizeObserver {
      observe = observe;
      disconnect = disconnect;
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 1234,
    });

    const { unmount } = render(<App />);

    expect(postMessage).toHaveBeenCalledWith(
      { type: "topsail-beach-access:height", height: 1234 },
      "https://treasurerentals.com",
    );
    expect(observe).toHaveBeenCalledWith(document.documentElement);

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
