const ATTEMPTED_STATES = new Set([
  "ACTIVE",
  "FAILED",
  "NOT_FOUND",
  "PERMISSION_DENIED",
  "PROCESSING",
  "SKIPPED",
  "UNKNOWN",
]);
const TRANSIENT_RETRY_STATES = new Set(["RESOURCE_EXHAUSTED", "UNAVAILABLE"]);

export function selectRenderCandidates(
  sourceAccesses,
  registry = {},
  options = {},
) {
  const limit = options.limit ?? 10;
  const includeQuiet = options.includeQuiet ?? true;
  const retryFailed = options.retryFailed ?? false;

  return rankAerialAccesses(sourceAccesses)
    .filter((access) => includeQuiet || isBiggerAccess(access))
    .filter((access) => {
      const record = registry[access.id];
      if (!record) return true;
      if (retryFailed && isFailedRecord(record)) return true;
      return !isAttemptedRecord(record);
    })
    .slice(0, limit);
}

export function selectFallbackRenderCandidates(
  sourceAccesses,
  sourceProperties,
  registry = {},
  options = {},
) {
  const limit = options.limit ?? 10;
  const includeQuiet = options.includeQuiet ?? true;
  const maxFallbackAttempts = options.maxFallbackAttempts ?? 3;
  const properties = sourceProperties.filter(
    (property) =>
      property.address &&
      property.town &&
      Number.isFinite(property.latitude) &&
      Number.isFinite(property.longitude),
  );

  return rankAerialAccesses(sourceAccesses)
    .filter((access) => includeQuiet || isBiggerAccess(access))
    .filter((access) => isFailedRecord(registry[access.id]))
    .filter(
      (access) =>
        countNearbyPropertyAttempts(registry[access.id]) < maxFallbackAttempts,
    )
    .map((access) => {
      const property = findNearestUntriedProperty(
        access,
        properties,
        registry[access.id],
      );
      if (!property) return null;

      return {
        ...access,
        aerialAddress: formatAerialAddress(property.address, property.town),
        addressSource: "nearby-property",
        fallbackDistanceFeet: Math.round(
          distanceFeet(access.latitude, access.longitude, property.latitude, property.longitude),
        ),
        fallbackPropertyId: property.id,
        originalAerialAddress: access.aerialAddress,
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

export function rankAerialAccesses(sourceAccesses) {
  return sourceAccesses
    .filter((access) => access.address && access.waterType === "Ocean")
    .map((access) => ({
      ...access,
      aerialAddress: formatAerialAddress(access.address, access.town),
    }))
    .sort((a, b) => {
      const biggerDelta = Number(isBiggerAccess(b)) - Number(isBiggerAccess(a));
      if (biggerDelta !== 0) return biggerDelta;

      const scoreDelta = (b.usefulnessScore ?? 0) - (a.usefulnessScore ?? 0);
      if (scoreDelta !== 0) return scoreDelta;

      const parkingDelta = (b.parkingSpots ?? 0) - (a.parkingSpots ?? 0);
      if (parkingDelta !== 0) return parkingDelta;

      return a.name.localeCompare(b.name);
    });
}

export function summarizeAerialRegistry(registry = {}) {
  return Object.values(registry).reduce((summary, record) => {
    const state = record.state ?? "UNKNOWN";
    summary[state] = (summary[state] ?? 0) + 1;
    return summary;
  }, {});
}

export function normalizeLookupResult(payload, responseStatus) {
  const metadata = payload.metadata ?? {};
  const state = metadata.state ?? payload.state ?? payload.error?.status ?? "UNKNOWN";
  const image = payload.uris?.IMAGE;
  const video = payload.uris?.MP4_HIGH ?? payload.uris?.MP4_LOW;

  return {
    httpStatus: responseStatus,
    state,
    videoId: metadata.videoId ?? payload.videoId,
    hasImage: Boolean(image?.landscapeUri || image?.portraitUri),
    hasVideo: Boolean(
      video?.landscapeUri ||
        video?.portraitUri ||
        payload.uris?.MP4_LOW?.landscapeUri ||
        payload.uris?.MP4_LOW?.portraitUri,
    ),
    errorMessage: payload.error?.message,
  };
}

export function shouldStopRenderBatch(result) {
  return result?.state === "RESOURCE_EXHAUSTED";
}

export function isBiggerAccess(access) {
  return Boolean(
    access.categories?.includes("Major") ||
      (access.parkingSpots ?? 0) >= 10 ||
      access.restroom ||
      access.shower ||
      access.handicapAccessible ||
      access.beachMat ||
      access.mobiMat,
  );
}

function isAttemptedRecord(record) {
  return Boolean(record.videoId || ATTEMPTED_STATES.has(record.state));
}

function isFailedRecord(record) {
  return (
    ["FAILED", "NOT_FOUND", "PERMISSION_DENIED"].includes(record?.state) ||
    TRANSIENT_RETRY_STATES.has(record?.state)
  );
}

function cleanAddress(address) {
  return address.replace(/\s*,+\s*$/, "").trim();
}

function formatAerialAddress(address, town) {
  return `${cleanAddress(address)}, ${town}, NC`;
}

function findNearestUntriedProperty(access, properties, record) {
  const attemptedAddresses = new Set(
    [
      access.aerialAddress,
      TRANSIENT_RETRY_STATES.has(record?.state) ? null : record?.address,
      record?.originalAerialAddress,
      ...(record?.attempts ?? [])
        .filter((attempt) => !TRANSIENT_RETRY_STATES.has(attempt.state))
        .map((attempt) => attempt.address),
    ]
      .filter(Boolean)
      .map(normalizeAddressKey),
  );

  return properties
    .filter((property) => property.town === access.town)
    .map((property) => ({
      ...property,
      aerialAddress: formatAerialAddress(property.address, property.town),
      distanceFeet: distanceFeet(
        access.latitude,
        access.longitude,
        property.latitude,
        property.longitude,
      ),
    }))
    .filter((property) => !attemptedAddresses.has(normalizeAddressKey(property.aerialAddress)))
    .sort((a, b) => a.distanceFeet - b.distanceFeet)[0];
}

function normalizeAddressKey(address) {
  return String(address ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function countNearbyPropertyAttempts(record) {
  const attemptedNearbyAddresses = new Set();

  if (record?.addressSource === "nearby-property" && record.address) {
    if (!TRANSIENT_RETRY_STATES.has(record.state)) {
      attemptedNearbyAddresses.add(normalizeAddressKey(record.address));
    }
  }

  for (const attempt of record?.attempts ?? []) {
    if (attempt.addressSource === "nearby-property" && attempt.address) {
      if (!TRANSIENT_RETRY_STATES.has(attempt.state)) {
        attemptedNearbyAddresses.add(normalizeAddressKey(attempt.address));
      }
    }
  }

  return attemptedNearbyAddresses.size;
}

function distanceFeet(fromLat, fromLng, toLat, toLng) {
  const earthRadiusFeet = 20_902_231;
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusFeet * Math.asin(Math.sqrt(haversine));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}
