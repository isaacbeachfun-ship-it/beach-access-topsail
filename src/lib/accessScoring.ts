import type { AccessCategory, BeachAccess } from "../types/access";

export function scoreAccessUsefulness(access: BeachAccess): number {
  return (
    access.parkingSpots +
    (access.restroom ? 30 : 0) +
    (access.shower ? 20 : 0) +
    (access.handicapAccessible ? 18 : 0) +
    (access.beachMat ? 12 : 0) +
    (access.mobiMat ? 12 : 0) +
    (access.beachWheelchair ? 8 : 0) +
    (access.lifeguards ? 8 : 0)
  );
}

export function classifyAccess(access: BeachAccess): AccessCategory[] {
  const categories: AccessCategory[] = [];
  const hasFacilities =
    access.restroom ||
    access.shower ||
    access.handicapAccessible ||
    access.beachMat ||
    access.mobiMat;
  const isMajor =
    access.parkingSpots >= 30 ||
    (access.parkingSpots >= 12 && hasFacilities) ||
    (access.restroom && access.shower && access.handicapAccessible);

  if (isMajor) {
    categories.push("Major");
  }

  if (hasFacilities) {
    categories.push("Facilities");
  }

  if (!isMajor && !hasFacilities && access.parkingSpots < 8) {
    categories.push("Quiet");
  }

  return categories.length > 0 ? categories : ["Quiet"];
}
