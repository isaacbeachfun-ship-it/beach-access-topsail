import { classifyAccess, scoreAccessUsefulness } from "./accessScoring";
import type { AccessMatch, BeachAccess } from "../types/access";

export interface MapAccessMarkerGroups {
  major: BeachAccess[];
  other: BeachAccess[];
}

export function isMajorMapAccess(access: BeachAccess): boolean {
  return (
    classifyAccess(access).includes("Major") ||
    (access.usefulnessScore ?? scoreAccessUsefulness(access)) >= 70
  );
}

export function getMapAccessMarkerGroups(
  accesses: BeachAccess[],
  highlightedAccessIds = new Set<string>(),
): MapAccessMarkerGroups {
  return accesses.reduce<MapAccessMarkerGroups>(
    (groups, access) => {
      if (highlightedAccessIds.has(access.id)) return groups;

      if (isMajorMapAccess(access)) {
        groups.major.push(access);
      } else {
        groups.other.push(access);
      }

      return groups;
    },
    { major: [], other: [] },
  );
}

export function getCameraFitAccesses(
  accesses: BeachAccess[],
  closest?: AccessMatch | null,
  _alternates: AccessMatch[] = [],
): BeachAccess[] {
  if (!closest) return accesses;

  return [];
}
