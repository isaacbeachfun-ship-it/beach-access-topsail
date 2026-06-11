import { getMapProvider } from "../lib/mapConfig";
import type {
  AccessMatch,
  BeachAccess,
  MapLocation,
  RentalSample,
} from "../types/access";
import { AccessMap } from "./AccessMap";
import { GoogleAccessMap } from "./GoogleAccessMap";

interface AccessMapSectionProps {
  rental?: RentalSample;
  origin?: MapLocation;
  closest?: AccessMatch | null;
  alternates?: AccessMatch[];
  accesses?: BeachAccess[];
  eyebrow?: string;
  heading?: string;
  className?: string;
}

export function AccessMapSection(props: AccessMapSectionProps) {
  const fallback = <AccessMap {...props} />;

  if (getMapProvider() === "google") {
    return <GoogleAccessMap {...props} fallback={fallback} />;
  }

  return fallback;
}
