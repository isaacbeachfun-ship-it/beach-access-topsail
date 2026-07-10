import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GoogleAccessMap } from "../src/components/GoogleAccessMap";
import type { AccessMatch, BeachAccess } from "../src/types/access";

const mocks = vi.hoisted(() => ({
  importLibrary: vi.fn(),
  setOptions: vi.fn(),
}));

vi.mock("@googlemaps/js-api-loader", () => mocks);

type GoogleAuthWindow = Window & {
  gm_authFailure?: () => void;
};

const authWindow = window as GoogleAuthWindow;

describe("GoogleAccessMap", () => {
  afterEach(() => {
    delete authWindow.gm_authFailure;
    vi.unstubAllEnvs();
    mocks.importLibrary.mockReset();
    mocks.setOptions.mockReset();
  });

  test("shows a sanitized fallback when the Google loader rejects", async () => {
    const providerDetail = "RefererNotAllowed for key FAKE-SECRET-API-KEY";
    vi.stubEnv("MODE", "development");
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");
    mocks.importLibrary.mockRejectedValue(new Error(providerDetail));

    render(
      <GoogleAccessMap fallback={<div>Loader rejection fallback</div>} />,
    );

    expect(
      await screen.findByText(/Google Maps could not load for this site\./),
    ).toBeInTheDocument();
    expect(screen.getByText("Loader rejection fallback")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(providerDetail);
    expect(
      screen.queryByLabelText(
        "Google map of property and Topsail Island beach accesses",
      ),
    ).not.toBeInTheDocument();
  });

  test("shares authentication failures across instances and restores the original callback after non-LIFO cleanup", () => {
    const previousAuthFailure = vi.fn();
    const accesses: BeachAccess[] = [];
    const alternates: AccessMatch[] = [];
    authWindow.gm_authFailure = previousAuthFailure;

    const first = render(
      <GoogleAccessMap
        accesses={accesses}
        alternates={alternates}
        fallback={<div>First MapLibre fallback</div>}
      />,
    );
    const sharedDispatcher = authWindow.gm_authFailure;
    const second = render(
      <GoogleAccessMap
        accesses={accesses}
        alternates={alternates}
        fallback={<div>Second MapLibre fallback</div>}
      />,
    );

    expect(authWindow.gm_authFailure).toBe(sharedDispatcher);

    act(() => {
      authWindow.gm_authFailure?.();
    });

    expect(screen.getByText("First MapLibre fallback")).toBeInTheDocument();
    expect(screen.getByText("Second MapLibre fallback")).toBeInTheDocument();
    expect(previousAuthFailure).not.toHaveBeenCalled();

    first.unmount();
    expect(authWindow.gm_authFailure).toBe(sharedDispatcher);

    second.unmount();
    expect(authWindow.gm_authFailure).toBe(previousAuthFailure);
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
