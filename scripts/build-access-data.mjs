import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOURCE =
  "/Users/isaac/Projects/topsail-scrape/data/beach_access/beach_access_master.csv";
const DEFAULT_OUTPUT = path.resolve(__dirname, "../src/data/accesses.json");
const DEFAULT_PARKING_OVERRIDES = path.resolve(
  __dirname,
  "../src/data/accessParkingOverrides.json",
);
const TOPSAIL_TOWNS = new Set([
  "North Topsail Beach",
  "Surf City",
  "Topsail Beach",
]);
const PARKING_OVERRIDE_FIELDS = new Set([
  "parkingSpots",
  "handicapSpots",
  "parkingOptions",
  "parkingFee",
  "hourlyRate",
  "dailyRate",
  "weeklyRate",
  "seasonalRate",
  "routeLatitude",
  "routeLongitude",
  "restroom",
  "shower",
  "lifeguards",
  "beachWheelchair",
  "beachMat",
  "mobiMat",
  "handicapAccessible",
  "vehicleAccess",
  "duneWalkover",
  "source",
  "sourceDetail",
  "comments",
]);

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const cells = parseCsvLine(line);
      return Object.fromEntries(
        headers.map((header, index) => [header, cells[index] ?? ""]),
      );
    });
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseBool(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["y", "yes", "true", "1"].includes(normalized)) return true;
  if (["n", "no", "false", "0"].includes(normalized)) return false;
  return false;
}

function parseNullableBool(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["y", "yes", "true", "1"].includes(normalized)) return true;
  if (["n", "no", "false", "0"].includes(normalized)) return false;
  return null;
}

function parseNumber(value, fallback = 0) {
  const normalized = String(value ?? "").replace(/[$,]/g, "").trim();
  if (!normalized) return fallback;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clean(value) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function loadParkingOverrides(overridesPath) {
  if (!overridesPath || !fs.existsSync(overridesPath)) return new Map();

  const overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
  if (!Array.isArray(overrides)) {
    throw new Error(`Parking overrides must be an array: ${overridesPath}`);
  }

  return new Map(
    overrides.map((override) => {
      if (!override.id) {
        throw new Error(`Parking override is missing an id: ${overridesPath}`);
      }
      return [override.id, override];
    }),
  );
}

function applyParkingOverride(access, override) {
  if (!override) return access;

  const next = { ...access };
  for (const [field, value] of Object.entries(override)) {
    if (PARKING_OVERRIDE_FIELDS.has(field)) {
      next[field] = value;
    }
  }

  return {
    ...next,
    categories: classifyAccess(next),
    usefulnessScore: scoreAccessUsefulness(next),
  };
}

function scoreAccessUsefulness(access) {
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

function classifyAccess(access) {
  const categories = [];
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

  if (isMajor) categories.push("Major");
  if (hasFacilities) categories.push("Facilities");
  if (!isMajor && !hasFacilities && access.parkingSpots < 8) {
    categories.push("Quiet");
  }

  return categories.length > 0 ? categories : ["Quiet"];
}

export function buildAccessDataFromCsv(
  sourcePath = DEFAULT_SOURCE,
  parkingOverridesPath = DEFAULT_PARKING_OVERRIDES,
) {
  const parkingOverrides = loadParkingOverrides(parkingOverridesPath);
  const accesses = parseCsv(sourcePath)
    .filter((row) => TOPSAIL_TOWNS.has(row.place))
    .filter((row) => String(row.water_type ?? "").trim().toLowerCase() === "ocean")
    .map((row) => {
      const baseId = `${slugify(row.place)}-${slugify(
        row.access_name || row.address,
      )}`;
      const access = {
        id: baseId,
        town: row.place,
        name: row.access_name || row.address || "Unnamed access",
        address: clean(row.address),
        latitude: parseNumber(row.latitude),
        longitude: parseNumber(row.longitude),
        waterType: row.water_type,
        accessType: row.access_type,
        parkingSpots: parseNumber(row.parking_spots),
        handicapSpots:
          clean(row.handicap_spots) === null
            ? null
            : parseNumber(row.handicap_spots),
        parkingOptions: clean(row.parking_options),
        parkingFee: parseNullableBool(row.parking_fee_yn),
        hourlyRate: clean(row.hourly_rate),
        dailyRate: clean(row.daily_rate),
        weeklyRate: clean(row.weekly_rate),
        seasonalRate: clean(row.seasonal_rate),
        restroom: parseBool(row.restroom),
        shower: parseBool(row.shower),
        lifeguards: parseBool(row.lifeguards),
        beachWheelchair: parseBool(row.beach_wheelchair),
        beachMat: parseBool(row.beach_mat),
        mobiMat: parseBool(row.mobi_mat),
        handicapAccessible: parseBool(row.handicap_accessible),
        vehicleAccess: parseBool(row.vehicle_access),
        duneWalkover: parseBool(row.dune_walkover),
        source: row.source || "Unknown",
        sourceDetail: row.source_detail || "",
        comments: row.comments || "",
        mediaIds: [],
      };

      return access;
    });

  const baseIdCounts = accesses.reduce((counts, access) => {
    counts.set(access.id, (counts.get(access.id) ?? 0) + 1);
    return counts;
  }, new Map());
  const finalIdCounts = new Map();

  return accesses
    .map((access) => {
      const duplicateBaseId = (baseIdCounts.get(access.id) ?? 0) > 1;
      const disambiguator = slugify(
        access.address || `${access.latitude}-${access.longitude}`,
      );
      const preferredId = duplicateBaseId
        ? `${access.id}-${disambiguator}`
        : access.id;
      const previousFinalIdCount = finalIdCounts.get(preferredId) ?? 0;
      finalIdCounts.set(preferredId, previousFinalIdCount + 1);

      return {
        ...access,
        id:
          previousFinalIdCount > 0
            ? `${preferredId}-${previousFinalIdCount + 1}`
            : preferredId,
      };
    })
    .map((access) => {
      const accessWithOverride = applyParkingOverride(
        access,
        parkingOverrides.get(access.id),
      );

      return {
        ...accessWithOverride,
        categories: classifyAccess(accessWithOverride),
        usefulnessScore: scoreAccessUsefulness(accessWithOverride),
      };
    })
    .sort((a, b) => {
      if (a.town !== b.town) return a.town.localeCompare(b.town);
      if (a.name !== b.name) return a.name.localeCompare(b.name);
      return (a.address ?? "").localeCompare(b.address ?? "");
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = process.env.SOURCE_BEACH_ACCESS_CSV || DEFAULT_SOURCE;
  const output = process.env.ACCESS_OUTPUT_JSON || DEFAULT_OUTPUT;
  const rows = buildAccessDataFromCsv(source);

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(rows, null, 2)}\n`);
  console.log(`Wrote ${rows.length} Topsail ocean access rows to ${output}`);
}
