import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  normalizeLookupResult,
  selectFallbackRenderCandidates,
  selectRenderCandidates,
  shouldStopRenderBatch,
  summarizeAerialRegistry,
} from "./aerial-view-workflow.mjs";

const ROOT = process.cwd();
const ACCESS_PATH = path.join(ROOT, "src/data/accesses.json");
const PROPERTY_PATH = path.join(ROOT, "src/data/propertyAddresses.json");
const REGISTRY_PATH = path.join(ROOT, "src/data/aerialViewVideos.json");
const ARTIFACT_DIR = path.join(ROOT, "artifacts/aerial-view");
const RENDER_ENDPOINT =
  "https://aerialview.googleapis.com/v1/videos:renderVideo";
const LOOKUP_ENDPOINT =
  "https://aerialview.googleapis.com/v1/videos:lookupVideo";

const argv = new Set(process.argv.slice(2));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 10;
const maxFallbackAttemptsArg = process.argv.find((arg) =>
  arg.startsWith("--max-fallback-attempts="),
);
const maxFallbackAttempts = maxFallbackAttemptsArg
  ? Number(maxFallbackAttemptsArg.split("=")[1])
  : 3;
const dryRun = argv.has("--dry-run");
const includeQuiet = !argv.has("--major-only");
const retryFailed = argv.has("--retry-failed");
const fallbackProperties = argv.has("--fallback-properties");
const syncExisting = argv.has("--sync-existing") || argv.has("--sync-only");
const syncOnly = argv.has("--sync-only");

if (!Number.isInteger(limit) || limit < 1 || limit > 25) {
  throw new Error("--limit must be an integer from 1 to 25.");
}

if (
  !Number.isInteger(maxFallbackAttempts) ||
  maxFallbackAttempts < 1 ||
  maxFallbackAttempts > 10
) {
  throw new Error("--max-fallback-attempts must be an integer from 1 to 10.");
}

const apiKey = readGoogleMapsApiKey();
const accesses = JSON.parse(fs.readFileSync(ACCESS_PATH, "utf8"));
const properties = fallbackProperties
  ? JSON.parse(fs.readFileSync(PROPERTY_PATH, "utf8"))
  : [];
const registry = readJsonIfExists(REGISTRY_PATH, {});
const requestedAt = new Date().toISOString();
const candidates = syncOnly
  ? []
  : fallbackProperties
    ? selectFallbackRenderCandidates(accesses, properties, registry, {
        includeQuiet,
        limit,
        maxFallbackAttempts,
      })
    : selectRenderCandidates(accesses, registry, {
        includeQuiet,
        limit,
        retryFailed,
      });

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const results = [];
const syncResults = syncExisting
  ? await syncExistingVideos(registry, apiKey, requestedAt)
  : [];

for (const access of candidates) {
  if (dryRun) {
    results.push({
      accessId: access.id,
      name: access.name,
      address: access.aerialAddress,
      addressSource: access.addressSource ?? "official-access-address",
      fallbackPropertyId: access.fallbackPropertyId,
      fallbackDistanceFeet: access.fallbackDistanceFeet,
      state: "DRY_RUN",
    });
    continue;
  }

  const result = await renderVideo(access.aerialAddress, apiKey);
  results.push({
    accessId: access.id,
    name: access.name,
    address: access.aerialAddress,
    addressSource: access.addressSource ?? "official-access-address",
    fallbackPropertyId: access.fallbackPropertyId,
    fallbackDistanceFeet: access.fallbackDistanceFeet,
    ...result,
  });

  registry[access.id] = buildRegistryRecord(
    registry[access.id],
    access,
    result,
    requestedAt,
  );

  if (shouldStopRenderBatch(result)) break;
}

if (!dryRun) {
  fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
}

const artifactPath = path.join(
  ARTIFACT_DIR,
  `${requestedAt.replace(/[:.]/g, "-")}-${dryRun ? "dry-run" : "render"}.json`,
);
fs.writeFileSync(
  artifactPath,
  `${JSON.stringify({ requestedAt, dryRun, limit, results }, null, 2)}\n`,
);

console.log(
  JSON.stringify(
    {
      dryRun,
      fallbackProperties,
      maxFallbackAttempts,
      synced: syncResults.length,
      requested: results.filter((result) => result.state !== "DRY_RUN").length,
      dryRunCount: results.filter((result) => result.state === "DRY_RUN").length,
      videoIds: results.filter((result) => result.videoId).length,
      registrySummary: summarizeAerialRegistry(registry),
      artifactPath,
      registryPath: dryRun ? null : REGISTRY_PATH,
    },
    null,
    2,
  ),
  );

function buildRegistryRecord(previous, access, result, timestamp) {
  const addressSource = access.addressSource ?? "official-access-address";
  const attempt = {
    requestedAt: timestamp,
    address: access.aerialAddress,
    addressSource,
    state: result.state,
    videoId: result.videoId,
    httpStatus: result.httpStatus,
    errorMessage: result.errorMessage,
    fallbackPropertyId: access.fallbackPropertyId,
    fallbackDistanceFeet: access.fallbackDistanceFeet,
  };

  return {
    ...previous,
    videoId: result.videoId ?? previous?.videoId,
    state: result.state,
    requestedAt: timestamp,
    address: access.aerialAddress,
    name: access.name,
    httpStatus: result.httpStatus,
    errorMessage: result.errorMessage,
    addressSource,
    originalAerialAddress:
      access.originalAerialAddress ?? previous?.originalAerialAddress,
    fallbackPropertyId: access.fallbackPropertyId,
    fallbackDistanceFeet: access.fallbackDistanceFeet,
    attempts: [...(previous?.attempts ?? []), attempt],
  };
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function syncExistingVideos(targetRegistry, key, checkedAt) {
  const syncs = [];

  for (const [accessId, record] of Object.entries(targetRegistry)) {
    if (!record.videoId) continue;

    const result = await lookupVideo(record.videoId, key);
    const updated = {
      ...record,
      ...result,
      checkedAt,
    };
    targetRegistry[accessId] = updated;
    syncs.push({
      accessId,
      name: record.name,
      address: record.address,
      ...result,
    });
  }

  return syncs;
}

function readGoogleMapsApiKey() {
  const envPath = path.join(ROOT, ".env.local");
  const localEnv = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const fromFile = localEnv
    .split(/\r?\n/)
    .find((line) => line.startsWith("VITE_GOOGLE_MAPS_API_KEY="))
    ?.split("=")
    .slice(1)
    .join("=")
    .trim();
  const key = process.env.VITE_GOOGLE_MAPS_API_KEY || fromFile;

  if (!key) {
    throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY in environment or .env.local.");
  }

  return key;
}

async function renderVideo(address, key) {
  const url = new URL(RENDER_ENDPOINT);
  url.searchParams.set("key", key);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "http://127.0.0.1:5173/",
    },
    body: JSON.stringify({ address }),
  });
  const payload = await response.json().catch(() => ({}));
  const metadata = payload.metadata ?? {};

  return {
    httpStatus: response.status,
    state: payload.error?.status ?? payload.state ?? "UNKNOWN",
    videoId: metadata.videoId ?? payload.videoId,
    errorMessage: payload.error?.message,
  };
}

async function lookupVideo(videoId, key) {
  const url = new URL(LOOKUP_ENDPOINT);
  url.searchParams.set("key", key);
  url.searchParams.set("videoId", videoId);

  const response = await fetch(url, {
    headers: {
      Referer: "http://127.0.0.1:5173/",
    },
  });
  const payload = await response.json().catch(() => ({}));
  return normalizeLookupResult(payload, response.status);
}
