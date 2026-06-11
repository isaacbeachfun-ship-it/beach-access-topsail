import { describe, expect, test, vi } from "vitest";
import { drawGoogleWalkingRoute } from "../src/lib/googleWalkingRoute";

const map = { id: "map" } as unknown as google.maps.Map;
const origin = { lat: 34.49573, lng: -77.43088 };
const destination = { lat: 34.49218, lng: -77.43609 };

function createRoutesLibrary(
  overrides: Partial<google.maps.RoutesLibrary>,
): google.maps.RoutesLibrary {
  return {
    PolylineQuality: { HIGH_QUALITY: "HIGH_QUALITY" },
    TravelMode: { WALKING: "WALKING" },
    ...overrides,
  } as unknown as google.maps.RoutesLibrary;
}

describe("drawGoogleWalkingRoute", () => {
  test("draws the modern Routes polyline when Google returns one", async () => {
    const polyline = {
      setMap: vi.fn(),
    } as unknown as google.maps.Polyline;
    const createPolylines = vi.fn(() => [polyline]);
    const computeRoutes = vi.fn(async () => ({
      fallbackInfo: null,
      geocodingResults: null,
      routes: [{ createPolylines }],
    }));

    const result = await drawGoogleWalkingRoute({
      map,
      origin,
      destination,
      routesLibrary: createRoutesLibrary({
        Route: { computeRoutes } as unknown as typeof google.maps.routes.Route,
      }),
    });

    expect(computeRoutes).toHaveBeenCalledWith(
      expect.objectContaining({
        destination,
        origin,
        region: "us",
        travelMode: "WALKING",
      }),
    );
    expect(createPolylines).toHaveBeenCalledWith({
      polylineOptions: expect.objectContaining({
        strokeColor: "#2d9aae",
        strokeOpacity: 0.95,
        strokeWeight: 5,
      }),
    });
    expect(polyline.setMap).toHaveBeenCalledWith(map);
    expect(result).toEqual({
      overlays: [polyline],
      status: "routes-polyline",
    });
  });

  test("draws a manual polyline from the modern route path when createPolylines returns no overlays", async () => {
    const manualPolyline = {
      setMap: vi.fn(),
    } as unknown as google.maps.Polyline;
    const Polyline = vi.fn(function PolylineMock() {
      return manualPolyline;
    });
    const computeRoutes = vi.fn(async () => ({
      fallbackInfo: null,
      geocodingResults: null,
      routes: [
        {
          createPolylines: vi.fn(() => []),
          path: [
            { lat: 34.527098, lng: -77.348036 },
            { lat: 34.5264, lng: -77.3476 },
            { lat: 34.5251, lng: -77.3466 },
          ],
        },
      ],
    }));

    const result = await drawGoogleWalkingRoute({
      map,
      origin,
      destination,
      Polyline: Polyline as unknown as typeof google.maps.Polyline,
      routesLibrary: createRoutesLibrary({
        Route: { computeRoutes } as unknown as typeof google.maps.routes.Route,
      }),
    });

    expect(Polyline).toHaveBeenCalledWith(
      expect.objectContaining({
        map,
        path: [
          { lat: 34.527098, lng: -77.348036 },
          { lat: 34.5264, lng: -77.3476 },
          { lat: 34.5251, lng: -77.3466 },
        ],
        strokeColor: "#2d9aae",
        strokeOpacity: 0.95,
        strokeWeight: 5,
      }),
    );
    expect(result).toEqual({
      overlays: [manualPolyline],
      status: "routes-polyline",
    });
  });

  test("draws a manual polyline from the modern route path when createPolylines throws", async () => {
    const manualPolyline = {
      setMap: vi.fn(),
    } as unknown as google.maps.Polyline;
    const Polyline = vi.fn(function PolylineMock() {
      return manualPolyline;
    });

    const result = await drawGoogleWalkingRoute({
      map,
      origin,
      destination,
      Polyline: Polyline as unknown as typeof google.maps.Polyline,
      routesLibrary: createRoutesLibrary({
        Route: {
          computeRoutes: vi.fn(async () => ({
            fallbackInfo: null,
            geocodingResults: null,
            routes: [
              {
                createPolylines: vi.fn(() => {
                  throw new Error("route helper failed");
                }),
                path: [
                  { lat: 34.527098, lng: -77.348036 },
                  { lat: 34.5264, lng: -77.3476 },
                  { lat: 34.5251, lng: -77.3466 },
                ],
              },
            ],
          })),
        } as unknown as typeof google.maps.routes.Route,
      }),
    });

    expect(Polyline).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      overlays: [manualPolyline],
      status: "routes-polyline",
    });
  });

  test("falls back to DirectionsRenderer so failed Routes calls still follow roads", async () => {
    const directionsResult = { routes: [] } as unknown as google.maps.DirectionsResult;
    const route = vi.fn(async () => directionsResult);
    const DirectionsService = vi.fn(function DirectionsServiceMock() {
      return { route };
    });
    const renderer = {
      setMap: vi.fn(),
    } as unknown as google.maps.DirectionsRenderer;
    const DirectionsRenderer = vi.fn(function DirectionsRendererMock() {
      return renderer;
    });

    const result = await drawGoogleWalkingRoute({
      map,
      origin,
      destination,
      routesLibrary: createRoutesLibrary({
        DirectionsRenderer:
          DirectionsRenderer as unknown as typeof google.maps.DirectionsRenderer,
        DirectionsService:
          DirectionsService as unknown as typeof google.maps.DirectionsService,
        Route: {
          computeRoutes: vi.fn(async () => {
            throw new Error("Routes API unavailable");
          }),
        } as unknown as typeof google.maps.routes.Route,
      }),
    });

    expect(route).toHaveBeenCalledWith(
      expect.objectContaining({
        destination,
        origin,
        region: "us",
        travelMode: "WALKING",
      }),
    );
    expect(DirectionsRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        directions: directionsResult,
        map,
        preserveViewport: true,
        suppressInfoWindows: true,
        suppressMarkers: true,
        polylineOptions: expect.objectContaining({
          strokeColor: "#2d9aae",
          strokeOpacity: 0.95,
          strokeWeight: 5,
        }),
      }),
    );
    expect(result).toEqual({
      overlays: [renderer],
      status: "directions-renderer",
    });
  });

  test("draws no route overlay instead of a straight line when Google cannot route it", async () => {
    const route = vi.fn(async () => {
      throw new Error("Directions unavailable");
    });

    const result = await drawGoogleWalkingRoute({
      map,
      origin,
      destination,
      routesLibrary: createRoutesLibrary({
        DirectionsRenderer: vi.fn(
          function DirectionsRendererMock() {},
        ) as unknown as typeof google.maps.DirectionsRenderer,
        DirectionsService: vi.fn(function DirectionsServiceMock() {
          return { route };
        }) as unknown as typeof google.maps.DirectionsService,
        Route: {
          computeRoutes: vi.fn(async () => {
            throw new Error("Routes API unavailable");
          }),
        } as unknown as typeof google.maps.routes.Route,
      }),
    });

    expect(result).toEqual({
      overlays: [],
      status: "unavailable",
    });
  });
});
