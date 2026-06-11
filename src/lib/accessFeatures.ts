import type { BeachAccess } from "../types/access";

export type AccessFeatureId =
  | "parking"
  | "noParking"
  | "restroom"
  | "shower"
  | "accessible"
  | "beachMat"
  | "beachWheelchair"
  | "lifeguard"
  | "vehicleAccess"
  | "paidParking"
  | "freeParking"
  | "duneWalkover";

export interface AccessFeature {
  id: AccessFeatureId;
  label: string;
  shortLabel: string;
  mapLabel: string;
  priority: number;
  showOnMap: boolean;
}

function feature(
  id: AccessFeatureId,
  label: string,
  shortLabel: string,
  mapLabel: string,
  priority: number,
  showOnMap = true,
): AccessFeature {
  return { id, label, shortLabel, mapLabel, priority, showOnMap };
}

export const ACCESS_FEATURE_LEGEND: AccessFeature[] = [
  feature("parking", "Parking spaces", "Parking", "P", 10),
  feature("restroom", "Restroom", "Restroom", "R", 20),
  feature("shower", "Shower", "Shower", "S", 30),
  feature("accessible", "ADA accessible", "ADA", "ADA", 40),
  feature("beachMat", "Beach mat", "Beach mat", "Mat", 50),
  feature("beachWheelchair", "Beach wheelchair", "Wheelchair", "WC", 55),
  feature("lifeguard", "Lifeguard", "Guard", "LG", 60),
  feature("vehicleAccess", "Vehicle beach access", "ORV", "ORV", 65),
  feature("paidParking", "Paid parking", "Paid", "$", 70, false),
  feature("freeParking", "Free parking", "Free", "Free", 75, false),
  feature("duneWalkover", "Dune walkover", "Walkover", "W", 80),
  feature("noParking", "No listed parking", "No parking", "NP", 90, false),
];

export function getAccessFeatures(access: BeachAccess): AccessFeature[] {
  const features: AccessFeature[] = [];

  if (access.parkingSpots > 0) {
    features.push(
      feature(
        "parking",
        `${access.parkingSpots.toLocaleString()} parking spaces`,
        `${access.parkingSpots.toLocaleString()} spaces`,
        "P",
        10,
      ),
    );
  } else {
    features.push(feature("noParking", "No listed parking", "No parking", "NP", 90, false));
  }

  if (access.restroom) features.push(feature("restroom", "Restroom", "Restroom", "R", 20));
  if (access.shower) features.push(feature("shower", "Shower", "Shower", "S", 30));
  if (access.handicapAccessible) {
    features.push(feature("accessible", "ADA accessible", "ADA", "ADA", 40));
  }
  if (access.beachMat || access.mobiMat) {
    features.push(feature("beachMat", "Beach mat", "Beach mat", "Mat", 50));
  }
  if (access.beachWheelchair) {
    features.push(
      feature("beachWheelchair", "Beach wheelchair", "Wheelchair", "WC", 55),
    );
  }
  if (access.lifeguards) features.push(feature("lifeguard", "Lifeguard", "Guard", "LG", 60));
  if (access.vehicleAccess) {
    features.push(feature("vehicleAccess", "Vehicle beach access", "ORV", "ORV", 65));
  }
  if (access.parkingFee === true && access.parkingSpots > 0) {
    features.push(feature("paidParking", "Paid parking", "Paid", "$", 70, false));
  }
  if (access.parkingFee === false && access.parkingSpots > 0) {
    features.push(feature("freeParking", "Free parking", "Free", "Free", 75, false));
  }
  if (access.duneWalkover) {
    features.push(feature("duneWalkover", "Dune walkover", "Walkover", "W", 80));
  }

  return features.sort((a, b) => a.priority - b.priority);
}

export function getMapMarkerFeatures(
  access: BeachAccess,
  limit = 4,
): AccessFeature[] {
  return getAccessFeatures(access)
    .filter((feature) => feature.showOnMap)
    .slice(0, limit);
}
