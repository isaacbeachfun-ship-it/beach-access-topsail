import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  formatAccessAddress,
  formatDistanceFeet,
} from "../lib/accessLookup";
import {
  getAccessRoutePoint,
  type AccessPointInput,
} from "../lib/accessPoint";
import {
  getCameraFitAccesses,
  getMapAccessMarkerGroups,
} from "../lib/mapAccessMarkers";
import {
  getMapMarkerFeatures,
  type AccessFeature,
} from "../lib/accessFeatures";
import {
  getGoogleMapsApiKey,
  getGoogleMapsMapId,
} from "../lib/mapConfig";
import {
  drawGoogleWalkingRoute,
  type GoogleRouteOverlay,
  type GoogleWalkingRouteStatus,
} from "../lib/googleWalkingRoute";
import type {
  AccessMatch,
  BeachAccess,
  MapLocation,
  RentalSample,
} from "../types/access";
import { AccessFeatureLegend } from "./AccessFeatureIcons";
import { MapViewControls, type MapViewMode } from "./MapViewControls";

interface GoogleAccessMapProps {
  rental?: RentalSample;
  origin?: MapLocation;
  closest?: AccessMatch | null;
  alternates?: AccessMatch[];
  accesses?: BeachAccess[];
  fallback?: ReactNode;
  eyebrow?: string;
  heading?: string;
  className?: string;
}

const TOPSAIL_CENTER = { lat: 34.449, lng: -77.516 };

let configuredGoogleMapsKey: string | null = null;

function configureGoogleMaps(apiKey: string, mapId: string) {
  if (configuredGoogleMapsKey) {
    if (configuredGoogleMapsKey !== apiKey) {
      throw new Error("Google Maps was already configured with a different key.");
    }
    return;
  }

  setOptions({
    key: apiKey,
    v: "weekly",
    authReferrerPolicy: "origin",
    mapIds: [mapId],
  });
  configuredGoogleMapsKey = apiKey;
}

function createFeatureToken(feature: AccessFeature) {
  const token = document.createElement("span");
  token.className = `map-marker-feature-token map-marker-feature-token--${feature.id}`;
  token.textContent = feature.mapLabel;
  token.title = feature.label;
  token.setAttribute("aria-label", feature.label);
  return token;
}

function createFeatureRail(features: AccessFeature[]) {
  const rail = document.createElement("span");
  rail.className = "map-marker-feature-rail";
  features.forEach((feature) => rail.append(createFeatureToken(feature)));
  return rail;
}

function createGoogleMarkerContent(options: {
  label?: string;
  variant: "other" | "major" | "property" | "closest" | "alternate";
  features?: AccessFeature[];
}) {
  const marker = document.createElement("div");
  marker.className = `google-map-marker google-map-marker--${options.variant}`;

  if (options.label) {
    const label = document.createElement("span");
    label.className = "google-map-marker-label";
    label.textContent = options.label;
    marker.append(label);
  }

  if (options.features?.length) {
    marker.append(createFeatureRail(options.features));
  }

  return marker;
}

function createInfoContent(
  title: string,
  detail: string,
  meta: string,
  features: AccessFeature[] = [],
) {
  const wrapper = document.createElement("div");
  wrapper.className = "google-info-card";

  const heading = document.createElement("strong");
  heading.textContent = title;
  wrapper.append(heading);

  const detailLine = document.createElement("span");
  detailLine.textContent = detail;
  wrapper.append(detailLine);

  const metaLine = document.createElement("small");
  metaLine.textContent = meta;
  wrapper.append(metaLine);

  if (features.length) {
    wrapper.append(createFeatureRail(features));
  }

  return wrapper;
}

function toLatLngLiteral(point: AccessPointInput): google.maps.LatLngLiteral {
  const target = getAccessRoutePoint(point);
  return { lat: target.latitude, lng: target.longitude };
}

export function GoogleAccessMap({
  rental,
  origin,
  closest = null,
  alternates = [],
  accesses = [],
  fallback,
  eyebrow = "Google island view",
  heading = "Closest path plus bigger options",
  className = "",
}: GoogleAccessMapProps) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routeStatus, setRouteStatus] =
    useState<GoogleWalkingRouteStatus | null>(null);
  const [activeMapView, setActiveMapView] =
    useState<MapViewMode>("closest");
  const activeOrigin = origin ?? rental;
  const majorRouteAccess = alternates[0]?.access ?? null;
  const selectedRouteAccess =
    activeMapView === "closest"
      ? closest?.access ?? null
      : activeMapView === "major"
        ? majorRouteAccess
        : null;
  const routeTargetName = selectedRouteAccess?.name ?? null;

  useEffect(() => {
    setActiveMapView("closest");
  }, [activeOrigin?.id, closest?.access.id]);

  const mapCaption = useMemo(() => {
    if (activeMapView === "property") {
      return activeOrigin
        ? "Focused on the selected property. Pick Closest or Major access to draw a walking route."
        : "Search an address first, then use this control to return to the selected property.";
    }

    if (activeMapView === "other") {
      return "Zoomed out to browse all mapped public beach accesses across Topsail Island.";
    }

    if (activeOrigin && routeTargetName) {
      return `Showing the walking route to ${routeTargetName}.`;
    }

    return "Browse the island map, then search an address to draw the path to the closest public walkover.";
  }, [activeMapView, activeOrigin, routeTargetName]);

  useEffect(() => {
    if (!mapNode.current) return;
    if (import.meta.env.MODE === "test") {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let map: google.maps.Map | null = null;
    let infoWindow: google.maps.InfoWindow | null = null;
    const routeOverlays: GoogleRouteOverlay[] = [];
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];

    async function initializeMap() {
      const apiKey = getGoogleMapsApiKey();
      const mapId = getGoogleMapsMapId();

      if (!apiKey) {
        setLoadError("Google Maps needs a configured API key.");
        setIsLoading(false);
        return;
      }

      try {
        setLoadError(null);
        setIsLoading(true);
        setRouteStatus(null);
        configureGoogleMaps(apiKey, mapId);

        const [
          { Map, InfoWindow, Polyline },
          { AdvancedMarkerElement },
          { LatLngBounds },
          routesLibrary,
        ] = await Promise.all([
          importLibrary("maps"),
          importLibrary("marker"),
          importLibrary("core"),
          importLibrary("routes"),
        ]);

        if (!isMounted || !mapNode.current) return;

        map = new Map(mapNode.current, {
          center: activeOrigin ? toLatLngLiteral(activeOrigin) : TOPSAIL_CENTER,
          zoom: activeOrigin ? 14 : 11,
          mapId,
          backgroundColor: "#e7f0ef",
          clickableIcons: false,
          fullscreenControl: true,
          gestureHandling: "cooperative",
          mapTypeControl: true,
          streetViewControl: true,
        });

        infoWindow = new InfoWindow();

        function addMarker(options: {
          title: string;
          position: google.maps.LatLngLiteral;
          detail: string;
          meta: string;
          glyphText?: string;
          content?: HTMLElement;
          features?: AccessFeature[];
          zIndex: number;
        }) {
          if (!map) return;

          const marker = new AdvancedMarkerElement({
            map,
            position: options.position,
            title: options.title,
            content:
              options.content ??
              createGoogleMarkerContent({
                label: options.glyphText,
                variant: "other",
                features: options.features,
              }),
            gmpClickable: true,
            zIndex: options.zIndex,
          });

          marker.addEventListener("gmp-click", () => {
            if (!infoWindow) return;
            infoWindow.close();
            infoWindow.setContent(
              createInfoContent(
                options.title,
                options.detail,
                options.meta,
                options.features,
              ),
            );
            infoWindow.open({ map, anchor: marker });
          });

          markers.push(marker);
        }

        const highlightedAccessIds = new Set<string>();
        if (closest) highlightedAccessIds.add(closest.access.id);
        alternates.forEach((alternate) =>
          highlightedAccessIds.add(alternate.access.id),
        );
        const markerGroups = getMapAccessMarkerGroups(
          accesses,
          highlightedAccessIds,
        );

        markerGroups.other.forEach((access) => {
          const features = getMapMarkerFeatures(access, 2);
          addMarker({
            title: access.name,
            position: toLatLngLiteral(access),
            detail: formatAccessAddress(access),
            meta: `${access.town} public beach access`,
            content: createGoogleMarkerContent({
              variant: "other",
              features,
            }),
            features,
            zIndex: 5,
          });
        });

        markerGroups.major.forEach((access) => {
          const features = getMapMarkerFeatures(access);
          addMarker({
            title: access.name,
            position: toLatLngLiteral(access),
            detail: formatAccessAddress(access),
            meta: `${access.parkingSpots.toLocaleString()} parking spaces`,
            content: createGoogleMarkerContent({
              label: "M",
              variant: "major",
              features,
            }),
            features,
            glyphText: "M",
            zIndex: 20,
          });
        });

        if (activeOrigin) {
          addMarker({
            title: activeOrigin.name,
            position: toLatLngLiteral(activeOrigin),
            detail: activeOrigin.address,
            meta: "Property starting point",
            content: createGoogleMarkerContent({
              label: "P",
              variant: "property",
            }),
            glyphText: "P",
            zIndex: 60,
          });
        }

        if (closest) {
          addMarker({
            title: closest.access.name,
            position: toLatLngLiteral(closest.access),
            detail: formatAccessAddress(closest.access),
            meta: activeOrigin
              ? `${formatDistanceFeet(closest.distanceFeet)} from the property`
              : "Closest selected access",
            content: createGoogleMarkerContent({
              label: "1",
              variant: "closest",
              features: getMapMarkerFeatures(closest.access),
            }),
            features: getMapMarkerFeatures(closest.access),
            glyphText: "1",
            zIndex: 70,
          });
        }

        alternates.forEach((alternate, index) => {
          addMarker({
            title: alternate.access.name,
            position: toLatLngLiteral(alternate.access),
            detail: formatAccessAddress(alternate.access),
            meta: `${alternate.access.parkingSpots.toLocaleString()} parking spaces`,
            content: createGoogleMarkerContent({
              label: String(index + 2),
              variant: "alternate",
              features: getMapMarkerFeatures(alternate.access),
            }),
            features: getMapMarkerFeatures(alternate.access),
            glyphText: String(index + 2),
            zIndex: 50 - index,
          });
        });

        if (map && activeOrigin && selectedRouteAccess) {
          const routeResult = await drawGoogleWalkingRoute({
            destination: toLatLngLiteral(selectedRouteAccess),
            map,
            origin: toLatLngLiteral(activeOrigin),
            Polyline,
            routesLibrary: routesLibrary as google.maps.RoutesLibrary,
          });
          routeOverlays.push(...routeResult.overlays);
          if (!isMounted) {
            // The effect was torn down while the route request was in
            // flight; remove the late-drawn overlays so they cannot linger.
            routeOverlays.forEach((overlay) => overlay.setMap(null));
            return;
          }
          setRouteStatus(routeResult.status);
        } else if (isMounted) {
          setRouteStatus(null);
        }

        if (activeMapView === "property" && activeOrigin) {
          map.setCenter(toLatLngLiteral(activeOrigin));
          map.setZoom(17);
        } else if (activeMapView === "other") {
          const bounds = new LatLngBounds();
          accesses.forEach((access) => bounds.extend(toLatLngLiteral(access)));
          if (accesses.length > 0) {
            map.fitBounds(bounds, window.innerWidth < 640 ? 32 : 48);
          } else {
            map.setCenter(TOPSAIL_CENTER);
            map.setZoom(11);
          }
        } else {
          const bounds = new LatLngBounds();
          if (activeOrigin) bounds.extend(toLatLngLiteral(activeOrigin));
          if (selectedRouteAccess) {
            bounds.extend(toLatLngLiteral(selectedRouteAccess));
          } else if (closest) {
            bounds.extend(toLatLngLiteral(closest.access));
          }
          const boundAccesses = getCameraFitAccesses(
            accesses,
            closest,
            alternates,
          );
          boundAccesses.forEach((access) =>
            bounds.extend(toLatLngLiteral(access)),
          );
          map.fitBounds(bounds, window.innerWidth < 640 ? 46 : 68);
        }

        if (isMounted) setIsLoading(false);
      } catch (error) {
        if (!isMounted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Google Maps could not load.",
        );
        setRouteStatus(null);
        setIsLoading(false);
      }
    }

    void initializeMap();

    return () => {
      isMounted = false;
      infoWindow?.close();
      markers.forEach((marker) => {
        marker.map = null;
      });
      routeOverlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [
    accesses,
    activeMapView,
    activeOrigin,
    alternates,
    closest,
    selectedRouteAccess,
  ]);

  if (loadError && fallback) {
    return (
      <>
        <section className="map-provider-note" role="status">
          <strong>Google Maps is not ready yet.</strong>
          <span>{loadError} Showing the open map fallback for now.</span>
        </section>
        {fallback}
      </>
    );
  }

  return (
    <section
      className={`map-panel map-panel-google ${className}`.trim()}
      aria-labelledby="map-heading"
    >
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3 id="map-heading">{heading}</h3>
        <p className="map-caption">{mapCaption}</p>
        {activeOrigin && selectedRouteAccess && routeStatus === "unavailable" ? (
          <p className="map-route-note" role="status">
            Route line unavailable from Google Maps right now. Use the walking
            directions button for turn-by-turn guidance.
          </p>
        ) : null}
      </div>
      <MapViewControls
        activeView={activeMapView}
        onChange={setActiveMapView}
      />
      <AccessFeatureLegend />
      <div className="map-frame">
        {isLoading ? <div className="map-loading">Loading map...</div> : null}
        <div
          ref={mapNode}
          className="island-map google-island-map"
          aria-label="Google map of property and Topsail Island beach accesses"
        />
      </div>
    </section>
  );
}
