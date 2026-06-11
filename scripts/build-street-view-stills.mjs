import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  metadataToStreetViewRecord,
  selectStreetViewStillTargets,
} from "./street-view-stills-workflow.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ACCESSES_PATH = path.join(ROOT, "src/data/accesses.json");
const AERIAL_REGISTRY_PATH = path.join(ROOT, "src/data/aerialViewVideos.json");
const STREET_VIEW_REGISTRY_PATH = path.join(
  ROOT,
  "src/data/streetViewStills.json",
);
const METADATA_URL = "https://maps.googleapis.com/maps/api/streetview/metadata";

function parseArgs(argv) {
  return {
    includeActive: argv.includes("--include-active"),
    limit: numberArg(argv, "--limit"),
  };
}

function numberArg(argv, name) {
  const prefix = `${name}=`;
  const value = argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function readGoogleMapsApiKey() {
  const envPath = path.join(ROOT, ".env.local");
  const env = await fs.readFile(envPath, "utf8");
  const line = env
    .split(/\r?\n/)
    .find((entry) => entry.startsWith("VITE_GOOGLE_MAPS_API_KEY="));
  return line?.split("=").slice(1).join("=").trim() ?? "";
}

async function lookupStreetViewMetadata(access, apiKey) {
  const url = new URL(METADATA_URL);
  url.searchParams.set("location", `${access.latitude},${access.longitude}`);
  url.searchParams.set("radius", "120");
  url.searchParams.set("source", "outdoor");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  const body = await response.json();
  return { httpStatus: response.status, body };
}

async function lookupStreetViewMetadataWithRetry(access, apiKey) {
  let latest;

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    latest = await lookupStreetViewMetadata(access, apiKey);
    if (latest.body.status !== "REQUEST_DENIED") return latest;
    await sleep(attempt * 750);
  }

  return latest;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const apiKey = await readGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY in .env.local");
  }

  const [accesses, aerialRegistry, stillRegistry] = await Promise.all([
    readJson(ACCESSES_PATH, []),
    readJson(AERIAL_REGISTRY_PATH, {}),
    readJson(STREET_VIEW_REGISTRY_PATH, {}),
  ]);

  const targets = selectStreetViewStillTargets(
    accesses,
    aerialRegistry,
    stillRegistry,
    { includeActive: options.includeActive },
  ).slice(0, options.limit);

  const nextRegistry = { ...stillRegistry };
  const checkedAt = new Date().toISOString();

  for (const access of targets) {
    const { httpStatus, body } = await lookupStreetViewMetadataWithRetry(
      access,
      apiKey,
    );
    if (body.status === "REQUEST_DENIED") {
      throw new Error(
        `Street View Static API denied metadata for ${access.id}: ${
          body.error_message ?? `HTTP ${httpStatus}`
        }`,
      );
    }

    nextRegistry[access.id] = metadataToStreetViewRecord(
      access,
      body,
      checkedAt,
    );
    console.log(`${access.id}: ${nextRegistry[access.id].state}`);
  }

  await fs.writeFile(
    STREET_VIEW_REGISTRY_PATH,
    `${JSON.stringify(nextRegistry, null, 2)}\n`,
  );

  const summary = Object.values(nextRegistry).reduce((counts, record) => {
    counts[record.state] = (counts[record.state] ?? 0) + 1;
    return counts;
  }, {});
  console.log(JSON.stringify({ checked: targets.length, summary }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
