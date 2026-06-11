export type GoogleRouteOverlay = Pick<
  google.maps.Polyline | google.maps.DirectionsRenderer,
  "setMap"
>;

export type GoogleWalkingRouteStatus =
  | "routes-polyline"
  | "directions-renderer"
  | "unavailable";

interface DrawGoogleWalkingRouteOptions {
  map: google.maps.Map;
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  Polyline?: typeof google.maps.Polyline;
  routesLibrary: google.maps.RoutesLibrary;
}

interface GoogleWalkingRouteResult {
  overlays: GoogleRouteOverlay[];
  status: GoogleWalkingRouteStatus;
}

const WALKING_ROUTE_STYLE: google.maps.PolylineOptions = {
  strokeColor: "#2d9aae",
  strokeOpacity: 0.95,
  strokeWeight: 5,
  zIndex: 100,
};

async function drawRoutesPolyline({
  destination,
  map,
  origin,
  Polyline,
  routesLibrary,
}: DrawGoogleWalkingRouteOptions): Promise<google.maps.Polyline[]> {
  const { PolylineQuality, Route, TravelMode } = routesLibrary;

  const result = await Route.computeRoutes({
    destination,
    fields: ["path", "distanceMeters", "durationMillis", "viewport"],
    origin,
    polylineQuality: PolylineQuality.HIGH_QUALITY,
    region: "us",
    travelMode: TravelMode.WALKING,
  });
  const route = result.routes?.[0];
  if (!route) return [];

  let polylines: google.maps.Polyline[] = [];
  try {
    polylines = route.createPolylines({
      polylineOptions: WALKING_ROUTE_STYLE,
    });
  } catch {
    polylines = [];
  }

  if (polylines.length > 0) {
    polylines.forEach((polyline) => polyline.setMap(map));
    return polylines;
  }

  const routePath = route.path?.map((point) => ({
    lat: point.lat,
    lng: point.lng,
  }));

  if (!Polyline || !routePath || routePath.length < 2) return [];

  return [
    new Polyline({
      ...WALKING_ROUTE_STYLE,
      map,
      path: routePath,
    }),
  ];
}

async function drawDirectionsRenderer({
  destination,
  map,
  origin,
  routesLibrary,
}: DrawGoogleWalkingRouteOptions): Promise<google.maps.DirectionsRenderer | null> {
  const { DirectionsRenderer, DirectionsService, TravelMode } = routesLibrary;
  if (!DirectionsRenderer || !DirectionsService) return null;

  const service = new DirectionsService();
  const directions = await service.route({
    destination,
    origin,
    region: "us",
    travelMode: TravelMode.WALKING,
  });

  return new DirectionsRenderer({
    directions,
    map,
    polylineOptions: WALKING_ROUTE_STYLE,
    preserveViewport: true,
    suppressInfoWindows: true,
    suppressMarkers: true,
  });
}

export async function drawGoogleWalkingRoute(
  options: DrawGoogleWalkingRouteOptions,
): Promise<GoogleWalkingRouteResult> {
  try {
    const polylines = await drawRoutesPolyline(options);
    if (polylines.length > 0) {
      return {
        overlays: polylines,
        status: "routes-polyline",
      };
    }
  } catch {
    // The legacy Directions renderer is still better than drawing fake geometry.
  }

  try {
    const renderer = await drawDirectionsRenderer(options);
    if (renderer) {
      return {
        overlays: [renderer],
        status: "directions-renderer",
      };
    }
  } catch {
    // If Google cannot route this pair, draw nothing instead of crossing lots.
  }

  return {
    overlays: [],
    status: "unavailable",
  };
}
