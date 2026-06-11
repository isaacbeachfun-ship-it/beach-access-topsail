import {
  ACCESS_FEATURE_LEGEND,
  getAccessFeatures,
} from "../lib/accessFeatures";
import type { AccessFeature, AccessFeatureId } from "../lib/accessFeatures";
import type { BeachAccess } from "../types/access";

interface AccessFeatureListProps {
  access: BeachAccess;
  limit?: number;
  variant?: "chip" | "compact";
  className?: string;
}

interface AccessFeatureIconProps {
  feature: AccessFeature;
  variant?: "chip" | "compact";
}

interface AccessFeatureLegendProps {
  className?: string;
}

function FeatureGlyph({ id }: { id: AccessFeatureId }) {
  switch (id) {
    case "parking":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="5" y="3" width="14" height="18" rx="3" />
          <path d="M9 17V7h4.2a3.2 3.2 0 0 1 0 6.4H9" />
        </svg>
      );
    case "noParking":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8" />
          <path d="M9 16V8h3.2a2.5 2.5 0 0 1 0 5H9" />
          <path d="M6.5 17.5 17.5 6.5" />
        </svg>
      );
    case "restroom":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="8" cy="5" r="2" />
          <circle cx="16" cy="5" r="2" />
          <path d="M6 10h4l-1 9H7l-1-9Z" />
          <path d="M14 10h4l1 9h-6l1-9Z" />
        </svg>
      );
    case "shower":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 8a6 6 0 0 1 12 0" />
          <path d="M5 9h14" />
          <path d="M8 13v1" />
          <path d="M12 13v1" />
          <path d="M16 13v1" />
          <path d="M9 18v1" />
          <path d="M15 18v1" />
        </svg>
      );
    case "accessible":
    case "beachWheelchair":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="11" cy="5" r="2" />
          <path d="M11 8v5h4l3 5" />
          <path d="M9 12a5 5 0 1 0 5 5" />
        </svg>
      );
    case "beachMat":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <path d="M5 10h14" />
          <path d="M5 14h14" />
          <path d="M10 5v14" />
          <path d="M14 5v14" />
        </svg>
      );
    case "lifeguard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v10" />
          <path d="M7 12h10" />
        </svg>
      );
    case "vehicleAccess":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M5 14h14l-2-5H7l-2 5Z" />
          <circle cx="8" cy="17" r="2" />
          <circle cx="16" cy="17" r="2" />
        </svg>
      );
    case "paidParking":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 4v16" />
          <path d="M16 8c-1-2-8-2-8 1 0 4 8 1 8 5 0 3-7 3-9 1" />
        </svg>
      );
    case "freeParking":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      );
    case "duneWalkover":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 16c4-4 12-4 16 0" />
          <path d="M6 12h12" />
          <path d="M8 8h8" />
          <path d="M10 18v-6" />
          <path d="M14 18v-6" />
        </svg>
      );
  }
}

export function AccessFeatureIcon({
  feature,
  variant = "chip",
}: AccessFeatureIconProps) {
  return (
    <span
      aria-label={feature.label}
      className={`feature-chip feature-chip--${feature.id} feature-chip--${variant}`}
      title={feature.label}
    >
      <FeatureGlyph id={feature.id} />
      <span>{variant === "compact" ? feature.mapLabel : feature.shortLabel}</span>
    </span>
  );
}

export function AccessFeatureList({
  access,
  limit,
  variant = "chip",
  className = "",
}: AccessFeatureListProps) {
  const features = getAccessFeatures(access).slice(0, limit);

  return (
    <div className={`feature-list feature-list--${variant} ${className}`.trim()}>
      {features.map((feature) => (
        <AccessFeatureIcon
          feature={feature}
          key={feature.id}
          variant={variant}
        />
      ))}
    </div>
  );
}

export function AccessFeatureLegend({
  className = "",
}: AccessFeatureLegendProps) {
  return (
    <div
      aria-label="Access feature icon key"
      className={`feature-key ${className}`.trim()}
    >
      <div className="feature-key-title">
        <span aria-hidden="true" className="feature-key-orb">
          i
        </span>
        <b>Icon key</b>
      </div>
      <div className="feature-key-items">
        {ACCESS_FEATURE_LEGEND.map((feature) => (
          <span className="feature-key-item" key={feature.id}>
            <span
              aria-hidden="true"
              className={`map-marker-feature-token map-marker-feature-token--${feature.id}`}
            >
              {feature.mapLabel}
            </span>
            <span>{feature.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
