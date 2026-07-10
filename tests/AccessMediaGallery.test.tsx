import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AccessMediaGallery } from "../src/components/AccessMediaGallery";
import type { BeachAccess } from "../src/types/access";

const mocks = vi.hoisted(() => ({
  lookupAerialView: vi.fn(async () => ({
    state: "available",
    thumbnailUrl: "https://example.com/aerial.jpg",
    videoUrl: "https://example.com/aerial.mp4",
    captureLabel: "Jul 3, 2025",
    duration: "40s",
  })),
}));

vi.mock("../src/lib/mapConfig", () => ({
  getGoogleMapsApiKey: () => "test-key",
}));

vi.mock("../src/data/aerialViewVideos.json", () => ({
  default: {
    "access-with-video": {
      videoId: "stored-video-id",
      state: "ACTIVE",
    },
    "access-with-video-and-street-view": {
      videoId: "stored-video-id",
      state: "ACTIVE",
    },
    "access-with-fallback-video": {
      videoId: "stored-fallback-video-id",
      state: "ACTIVE",
      addressSource: "nearby-property",
    },
    "access-with-failed-video": {
      videoId: "failed-video-id",
      state: "NOT_FOUND",
    },
    "access-with-failed-video-no-still": {
      videoId: "failed-video-id-no-still",
      state: "NOT_FOUND",
    },
  },
}));

vi.mock("../src/data/streetViewStills.json", () => ({
  default: {
    "access-with-video": {
      state: "AVAILABLE",
      panoId: "street-pano-video",
      heading: 150,
      pitch: 0,
      fov: 70,
      date: "2026-01",
      copyright: "© Google",
    },
    "access-with-fallback-video": {
      state: "AVAILABLE",
      panoId: "street-pano-fallback-video",
      heading: 152,
      pitch: 0,
      fov: 70,
      date: "2026-01",
      copyright: "© Google",
    },
    "access-with-failed-video": {
      state: "AVAILABLE",
      panoId: "street-pano-123",
      heading: 142,
      pitch: 1,
      fov: 68,
      date: "2025-08",
      copyright: "© Google",
    },
    "access-with-video-and-street-view": {
      state: "AVAILABLE",
      panoId: "street-pano-video-123",
      heading: 128,
      pitch: 0,
      fov: 70,
      date: "2026-02",
      copyright: "© Google",
    },
  },
}));

vi.mock("../src/lib/aerialView", async () => {
  const actual =
    await vi.importActual<typeof import("../src/lib/aerialView")>(
      "../src/lib/aerialView",
    );

  return {
    ...actual,
    lookupAerialView: mocks.lookupAerialView,
  };
});

const access = {
  id: "access-with-video",
  name: "Beach Access #33",
  address: "232 New River Inlet Rd",
  town: "North Topsail Beach",
  latitude: 34.512,
  longitude: -77.377,
} as BeachAccess;

describe("AccessMediaGallery", () => {
  beforeEach(() => {
    mocks.lookupAerialView.mockClear();
  });

  test("shows Street View with an aerial video link when Google aerial media is available", async () => {
    render(<AccessMediaGallery access={access} media={[]} />);

    expect(await screen.findByText("Google Street View")).toBeInTheDocument();
    expect(
      screen.getByAltText(
        "Street View still facing Beach Access #33 from the nearest Google panorama.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Google aerial video" }),
    ).toHaveAttribute("href", "https://example.com/aerial.mp4");
  });

  test("looks up Aerial View media by stored video id when available", async () => {
    render(
      <AccessMediaGallery
        access={{ ...access, id: "access-with-video" }}
        media={[]}
      />,
    );

    await screen.findByRole("link", { name: "View Google aerial video" });

    expect(mocks.lookupAerialView).toHaveBeenCalledWith(
      expect.objectContaining({ id: "access-with-video" }),
      "test-key",
      expect.any(Function),
      { videoId: "stored-video-id" },
    );
  });

  test("keeps Street View primary and links to aerial video when both are available", async () => {
    render(
      <AccessMediaGallery
        access={{ ...access, id: "access-with-video-and-street-view" }}
        media={[]}
      />,
    );

    expect(await screen.findByText("Google Street View")).toBeInTheDocument();
    expect(
      screen.getByAltText(
        "Street View still facing Beach Access #33 from the nearest Google panorama.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Captured 2026-02")).toBeInTheDocument();

    const aerialLink = screen.getByRole("link", {
      name: "View Google aerial video",
    });
    expect(aerialLink).toHaveAttribute("href", "https://example.com/aerial.mp4");
    expect(screen.queryByText("Google Aerial View")).not.toBeInTheDocument();
  });

  test("labels nearby-property aerial records as nearby media", async () => {
    render(
      <AccessMediaGallery
        access={{ ...access, id: "access-with-fallback-video" }}
        media={[]}
      />,
    );

    expect(
      await screen.findByRole("link", {
        name: "View nearby Google aerial video",
      }),
    ).toHaveAttribute("href", "https://example.com/aerial.mp4");
    expect(mocks.lookupAerialView).toHaveBeenCalledWith(
      expect.objectContaining({ id: "access-with-fallback-video" }),
      "test-key",
      expect.any(Function),
      { videoId: "stored-fallback-video-id" },
    );
  });

  test("does not recheck a known failed Aerial View record", async () => {
    render(
      <AccessMediaGallery
        access={{ ...access, id: "access-with-failed-video" }}
        media={[]}
      />,
    );

    expect(await screen.findByText("Google Street View")).toBeInTheDocument();
    expect(
      screen.getByAltText(
        "Street View still facing Beach Access #33 from the nearest Google panorama.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Captured 2025-08")).toBeInTheDocument();
    expect(mocks.lookupAerialView).not.toHaveBeenCalled();
  });

  test("does not show a coordinate-only Street View still when no cached panorama exists", async () => {
    render(
      <AccessMediaGallery
        access={{ ...access, id: "access-with-failed-video-no-still" }}
        media={[]}
      />,
    );

    expect(
      await screen.findByText(
        "Street-level imagery is not available for this access yet.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Google Street View")).not.toBeInTheDocument();
    expect(mocks.lookupAerialView).not.toHaveBeenCalled();
  });

  test("shows guest-facing guidance instead of internal launch copy when no media is available", async () => {
    render(
      <AccessMediaGallery
        access={{ ...access, id: "access-with-failed-video-no-still" }}
        media={[]}
      />,
    );

    expect(
      await screen.findByText(
        "Street-level imagery is not available for this access yet.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Use the interactive map or open walking directions to preview the route before you go.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/before launch/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/replacement-ready/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText("No access-specific media yet."),
    ).not.toBeInTheDocument();
  });
});
