import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  getCameraFitAccesses,
  getMapAccessMarkerGroups,
} from "../lib/mapAccessMarkers";
import {
  getMapMarkerFeatures,
  type AccessFeature,
} from "../lib/accessFeatures";
import { getAccessRoutePoint } from "../lib/accessPoint";
import type {
  AccessMatch,
  BeachAccess,
  MapLocation,
  RentalSample,
} from "../types/access";
import { AccessFeatureLegend } from "./AccessFeatureIcons";
import { MapViewControls, type MapViewMode } from "./MapViewControls";

interface AccessMapProps {
  rental?: RentalSample;
  origin?: MapLocation;
  closest?: AccessMatch | null;
  alternates?: AccessMatch[];
  accesses?: BeachAccess[];
  eyebrow?: string;
  heading?: string;
  className?: string;
}

const TOPSAIL_CENTER = { latitude: 34.449, longitude: -77.516 };

function toLngLat(access: BeachAccess): [number, number] {
  const target = getAccessRoutePoint(access);
  return [target.longitude, target.latitude];
}

function createFeatureToken(feature: AccessFeature): HTMLSpanElement {
  const token = document.createElement("span");
  token.className = `map-marker-feature-token map-marker-feature-token--${feature.id}`;
  token.textContent = feature.mapLabel;
  token.title = feature.label;
  token.setAttribute("aria-label", feature.label);
  return token;
}

function createMarkerElement(
  className: string,
  label?: string,
  features: AccessFeature[] = [],
): HTMLDivElement {
  const marker = document.createElement("div");
  marker.className = className;
  if (label) {
    const labelNode = document.createElement("span");
    labelNode.className = "maplibre-marker-label";
    labelNode.textContent = label;
    marker.append(labelNode);
  }
  if (features.length) {
    const rail = document.createElement("span");
    rail.className = "map-marker-feature-rail";
    features.forEach((feature) => rail.append(createFeatureToken(feature)));
    marker.append(rail);
  }
  return marker;
}

export function AccessMap({
  rental,
  origin,
  closest = null,
  alternates = [],
  accesses = [],
  eyebrow = "Island view",
  heading = "Closest path plus bigger options",
  className = "",
}: AccessMapProps) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const activeOrigin = origin ?? rental;
  const [activeMapView, setActiveMapView] =
    useState<MapViewMode>("closest");
  const selectedRouteAccess =
    activeMapView === "closest"
      ? closest?.access ?? null
      : activeMapView === "major"
        ? alternates[0]?.access ?? null
        : null;

  useEffect(() => {
    setActiveMapView("closest");
  }, [activeOrigin?.id, closest?.access.id]);

  useEffect(() => {
    if (!mapNode.current) return;
    if (import.meta.env.MODE === "test") return;

    let map: import("maplibre-gl").Map | null = null;
    let markers: import("maplibre-gl").Marker[] = [];
    let isMounted = true;

    async function initializeMap() {
      const { default: maplibregl } = await import("maplibre-gl");
      if (!isMounted || !mapNode.current) return;

      map = new maplibregl.Map({
        container: mapNode.current,
        center: [
          activeOrigin?.longitude ?? TOPSAIL_CENTER.longitude,
          activeOrigin?.latitude ?? TOPSAIL_CENTER.latitude,
        ],
        zoom: activeOrigin ? 14 : 11,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
      });
      const activeMap = map;
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
        markers.push(
          new maplibregl.Marker({
            element: createMarkerElement(
              "maplibre-access-marker",
              undefined,
              getMapMarkerFeatures(access, 2),
            ),
          })
            .setLngLat(toLngLat(access))
            .setPopup(new maplibregl.Popup().setText(access.name))
            .addTo(activeMap),
        );
      });

      markerGroups.major.forEach((access) => {
        markers.push(
          new maplibregl.Marker({
            element: createMarkerElement(
              "maplibre-access-marker maplibre-access-marker--major",
              "M",
              getMapMarkerFeatures(access),
            ),
          })
            .setLngLat(toLngLat(access))
            .setPopup(new maplibregl.Popup().setText(`Major: ${access.name}`))
            .addTo(activeMap),
        );
      });

      if (activeOrigin) {
        markers.push(
          new maplibregl.Marker({ color: "#163d45" })
            .setLngLat([activeOrigin.longitude, activeOrigin.latitude])
            .setPopup(new maplibregl.Popup().setText(activeOrigin.name))
            .addTo(activeMap),
        );
      }

      if (closest) {
        markers.push(
          new maplibregl.Marker({ color: "#2d9aae" })
            .setLngLat(toLngLat(closest.access))
            .setPopup(
              new maplibregl.Popup().setText(`Closest: ${closest.access.name}`),
            )
            .addTo(activeMap),
        );
      }

      markers.push(
        ...alternates.map((alternate) =>
          new maplibregl.Marker({ color: "#d99a2b" })
            .setLngLat(toLngLat(alternate.access))
            .setPopup(
              new maplibregl.Popup().setText(`Major: ${alternate.access.name}`),
            )
            .addTo(activeMap),
        ),
      );

      if (activeMapView === "property" && activeOrigin) {
        activeMap.setCenter([activeOrigin.longitude, activeOrigin.latitude]);
        activeMap.setZoom(17);
      } else if (activeMapView === "other") {
        const bounds = new maplibregl.LngLatBounds();
        accesses.forEach((access) =>
          bounds.extend(toLngLat(access)),
        );
        if (accesses.length > 0) {
          activeMap.fitBounds(bounds, { padding: 54, maxZoom: 11 });
        } else {
          activeMap.setCenter([
            TOPSAIL_CENTER.longitude,
            TOPSAIL_CENTER.latitude,
          ]);
          activeMap.setZoom(11);
        }
      } else {
        const bounds = new maplibregl.LngLatBounds();
        if (activeOrigin) {
          bounds.extend([activeOrigin.longitude, activeOrigin.latitude]);
        }
        if (selectedRouteAccess) {
          bounds.extend(toLngLat(selectedRouteAccess));
        } else if (closest) {
          bounds.extend(toLngLat(closest.access));
        }
        const boundAccesses = getCameraFitAccesses(
          accesses,
          closest,
          alternates,
        );
        boundAccesses.forEach((access) =>
          bounds.extend(toLngLat(access)),
        );
        activeMap.fitBounds(bounds, { padding: 58, maxZoom: 17 });
      }
    }

    void initializeMap();

    return () => {
      isMounted = false;
      markers.forEach((marker) => marker.remove());
      map?.remove();
    };
  }, [
    accesses,
    activeMapView,
    activeOrigin,
    alternates,
    closest,
    selectedRouteAccess,
  ]);

  return (
    <section
      className={`map-panel ${className}`.trim()}
      aria-labelledby="map-heading"
    >
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3 id="map-heading">{heading}</h3>
      </div>
      <MapViewControls
        activeView={activeMapView}
        onChange={setActiveMapView}
      />
      <AccessFeatureLegend />
      <div
        ref={mapNode}
        className="island-map"
        aria-label="Map of property and Topsail Island beach accesses"
      />
    </section>
  );
}
