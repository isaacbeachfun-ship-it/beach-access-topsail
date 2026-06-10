export type AccessCategory = "Closest" | "Major" | "Facilities" | "Quiet";

export type MediaStatus =
  | "launch-safe"
  | "prototype-only"
  | "needs-replacement";

export interface AccessMedia {
  id: string;
  accessId: string;
  title: string;
  url: string;
  sourceLabel: string;
  sourceUrl: string;
  status: MediaStatus;
  kind: "photo" | "street-view" | "map" | "generated";
}

export interface BeachAccess {
  id: string;
  town: "North Topsail Beach" | "Surf City" | "Topsail Beach";
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  waterType: string;
  accessType: string;
  parkingSpots: number;
  handicapSpots: number | null;
  parkingOptions: string | null;
  parkingFee: boolean | null;
  hourlyRate: string | null;
  dailyRate: string | null;
  weeklyRate: string | null;
  seasonalRate: string | null;
  restroom: boolean;
  shower: boolean;
  lifeguards: boolean;
  beachWheelchair: boolean;
  beachMat: boolean;
  mobiMat: boolean;
  handicapAccessible: boolean;
  vehicleAccess: boolean;
  duneWalkover: boolean;
  source: string;
  sourceDetail: string;
  comments: string;
  mediaIds: string[];
  categories?: AccessCategory[];
  usefulnessScore?: number;
}

export interface RentalSample {
  id: string;
  name: string;
  address: string;
  town: BeachAccess["town"];
  latitude: number;
  longitude: number;
  heroImageUrl: string;
}

export interface AccessMatch {
  access: BeachAccess;
  distanceFeet: number;
  estimatedWalkMinutes: number;
  categories: AccessCategory[];
  directionsUrl: string;
  isExactSupabaseWalkDistance: boolean;
}
