import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { AccessMatch, RentalSample } from "../types/access";

interface AccessMapProps {
  rental: RentalSample;
  closest: AccessMatch;
  alternates: AccessMatch[];
}

export function AccessMap({ rental, closest, alternates }: AccessMapProps) {
  const mapNode = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapNode.current) return;

    let map: import("maplibre-gl").Map | null = null;
    let markers: import("maplibre-gl").Marker[] = [];
    let isMounted = true;

    async function initializeMap() {
      const { default: maplibregl } = await import("maplibre-gl");
      if (!isMounted || !mapNode.current) return;

      map = new maplibregl.Map({
        container: mapNode.current,
        center: [rental.longitude, rental.latitude],
        zoom: 14,
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

      markers = [
        new maplibregl.Marker({ color: "#163d45" })
          .setLngLat([rental.longitude, rental.latitude])
          .setPopup(new maplibregl.Popup().setText(rental.name))
          .addTo(activeMap),
        new maplibregl.Marker({ color: "#2d9aae" })
          .setLngLat([closest.access.longitude, closest.access.latitude])
          .setPopup(
            new maplibregl.Popup().setText(`Closest: ${closest.access.name}`),
          )
          .addTo(activeMap),
        ...alternates.map((alternate) =>
          new maplibregl.Marker({ color: "#d99a2b" })
            .setLngLat([alternate.access.longitude, alternate.access.latitude])
            .setPopup(
              new maplibregl.Popup().setText(`Major: ${alternate.access.name}`),
            )
            .addTo(activeMap),
        ),
      ];

      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([rental.longitude, rental.latitude]);
      bounds.extend([closest.access.longitude, closest.access.latitude]);
      alternates.forEach((alternate) => {
        bounds.extend([alternate.access.longitude, alternate.access.latitude]);
      });
      activeMap.fitBounds(bounds, { padding: 70, maxZoom: 15 });
    }

    void initializeMap();

    return () => {
      isMounted = false;
      markers.forEach((marker) => marker.remove());
      map?.remove();
    };
  }, [alternates, closest, rental]);

  return (
    <section className="map-panel" aria-labelledby="map-heading">
      <div>
        <p className="eyebrow">Island view</p>
        <h3 id="map-heading">Closest path plus bigger options</h3>
      </div>
      <div className="map-legend" aria-label="Map legend">
        <span className="legend-home">Rental</span>
        <span className="legend-closest">Closest</span>
        <span className="legend-major">Major access</span>
      </div>
      <div
        ref={mapNode}
        className="island-map"
        aria-label="Map of rental and beach accesses"
      />
    </section>
  );
}
