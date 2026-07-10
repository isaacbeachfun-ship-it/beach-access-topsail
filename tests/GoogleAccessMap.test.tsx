import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GoogleAccessMap } from "../src/components/GoogleAccessMap";

type GoogleAuthWindow = Window & {
  gm_authFailure?: () => void;
};

const authWindow = window as GoogleAuthWindow;

describe("GoogleAccessMap", () => {
  afterEach(() => {
    delete authWindow.gm_authFailure;
  });

  test("shows the fallback on Google authentication failure and restores the previous callback", () => {
    const previousAuthFailure = vi.fn();
    authWindow.gm_authFailure = previousAuthFailure;

    const { unmount } = render(
      <GoogleAccessMap fallback={<div>Identifiable MapLibre fallback</div>} />,
    );

    expect(authWindow.gm_authFailure).toEqual(expect.any(Function));
    expect(authWindow.gm_authFailure).not.toBe(previousAuthFailure);

    act(() => {
      authWindow.gm_authFailure?.();
    });

    expect(
      screen.getByText("Google Maps is not ready yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Google Maps authentication failed for this site\./),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Identifiable MapLibre fallback"),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(
        "Google map of property and Topsail Island beach accesses",
      ),
    ).not.toBeInTheDocument();
    expect(previousAuthFailure).not.toHaveBeenCalled();

    unmount();

    expect(authWindow.gm_authFailure).toBe(previousAuthFailure);
  });
});
