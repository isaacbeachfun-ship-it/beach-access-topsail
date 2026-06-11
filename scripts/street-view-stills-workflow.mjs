export function selectStreetViewStillTargets(
  accesses,
  aerialRegistry = {},
  stillRegistry = {},
  options = {},
) {
  const includeActive = Boolean(options.includeActive);
  return accesses.filter((access) => {
    if (!Number.isFinite(access.latitude) || !Number.isFinite(access.longitude)) {
      return false;
    }

    if (includeActive) return true;

    const aerialState = aerialRegistry[access.id]?.state;
    const stillState = stillRegistry[access.id]?.state;
    return aerialState !== "ACTIVE" && stillState !== "AVAILABLE";
  });
}

export function metadataToStreetViewRecord(access, metadata, checkedAt) {
  if (
    metadata.status === "OK" &&
    metadata.pano_id &&
    Number.isFinite(metadata.location?.lat) &&
    Number.isFinite(metadata.location?.lng)
  ) {
    return {
      state: "AVAILABLE",
      panoId: metadata.pano_id,
      latitude: metadata.location.lat,
      longitude: metadata.location.lng,
      heading: headingFromPanoramaToAccess(
        {
          latitude: metadata.location.lat,
          longitude: metadata.location.lng,
        },
        {
          latitude: access.latitude,
          longitude: access.longitude,
        },
      ),
      pitch: 0,
      fov: 70,
      date: metadata.date,
      copyright: metadata.copyright,
      checkedAt,
    };
  }

  const state =
    metadata.status === "ZERO_RESULTS" || metadata.status === "NOT_FOUND"
      ? "NOT_FOUND"
      : "ERROR";

  return {
    state,
    checkedAt,
    errorMessage: metadata.error_message ?? metadata.status ?? "Unknown error",
  };
}

export function headingFromPanoramaToAccess(panorama, access) {
  const startLat = toRadians(panorama.latitude);
  const endLat = toRadians(access.latitude);
  const deltaLng = toRadians(access.longitude - panorama.longitude);
  const y = Math.sin(deltaLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(deltaLng);

  return Math.round((toDegrees(Math.atan2(y, x)) + 360) % 360);
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}
