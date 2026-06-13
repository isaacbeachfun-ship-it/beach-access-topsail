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

    const stillState = stillRegistry[access.id]?.state;
    return stillState !== "AVAILABLE";
  });
}

export function pruneStreetViewStillRegistry(stillRegistry = {}, accesses = []) {
  const currentAccessIds = new Set(accesses.map((access) => access.id));
  return Object.fromEntries(
    Object.entries(stillRegistry).filter(([id]) => currentAccessIds.has(id)),
  );
}

export function applyStreetViewOverride(record, override = {}) {
  if (record.state !== "AVAILABLE") return record;

  return {
    ...record,
    ...(Number.isFinite(override.heading) ? { heading: override.heading } : {}),
    ...(Number.isFinite(override.pitch) ? { pitch: override.pitch } : {}),
    ...(Number.isFinite(override.fov) ? { fov: override.fov } : {}),
  };
}

export function metadataToStreetViewRecord(
  access,
  metadata,
  checkedAt,
  override = {},
) {
  if (
    metadata.status === "OK" &&
    metadata.pano_id &&
    Number.isFinite(metadata.location?.lat) &&
    Number.isFinite(metadata.location?.lng)
  ) {
    const record = {
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

    return applyStreetViewOverride(record, override);
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
