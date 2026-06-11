export type MapViewMode = "property" | "closest" | "major" | "other";

const MAP_VIEW_OPTIONS: Array<{
  label: string;
  mode: MapViewMode;
  className: string;
}> = [
  { label: "Property", mode: "property", className: "legend-home" },
  { label: "Closest", mode: "closest", className: "legend-closest" },
  { label: "Major access", mode: "major", className: "legend-major" },
  { label: "Other access", mode: "other", className: "legend-other" },
];

interface MapViewControlsProps {
  activeView: MapViewMode;
  onChange: (view: MapViewMode) => void;
}

export function MapViewControls({
  activeView,
  onChange,
}: MapViewControlsProps) {
  return (
    <div className="map-legend" aria-label="Map view controls">
      {MAP_VIEW_OPTIONS.map((option) => (
        <button
          aria-pressed={activeView === option.mode}
          className={`map-legend-button ${option.className} ${
            activeView === option.mode ? "is-active" : ""
          }`.trim()}
          key={option.mode}
          onClick={() => onChange(option.mode)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
