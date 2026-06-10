import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT = path.resolve(__dirname, "../src/data/propertyAddresses.json");

const ENDPOINTS = [
  {
    county: "Onslow",
    source: "Onslow County GIS",
    url: "https://gismaps.onslowcountync.gov/arcgis/rest/services/WEB_PUBLICATIONS/Tax_Data/MapServer/0/query",
    pageSize: 2000,
    fields: "PARID,PHYSICALADDRESS,PHYSICALCITY,LANDUSEDESCR",
    idField: "PARID",
    addressField: "PHYSICALADDRESS",
    towns: [
      {
        town: "North Topsail Beach",
        where: "PHYSICALCITY LIKE 'N%TOPSAIL%BEACH'",
      },
      {
        town: "Surf City",
        where: "PHYSICALCITY='SURF CITY'",
      },
    ],
  },
  {
    county: "Pender",
    source: "Pender County GIS",
    url: "https://gis.pendercountync.gov/arcgis/rest/services/LayersMapIASLink/MapServer/4/query",
    pageSize: 1000,
    fields: "PIN,PROPERTY_ADDRESS,TAX_CODES,USE_",
    idField: "PIN",
    addressField: "PROPERTY_ADDRESS",
    towns: [
      {
        town: "Surf City",
        where: "TAX_CODES LIKE '%C53%'",
      },
      {
        town: "Topsail Beach",
        where: "TAX_CODES LIKE '%C54%'",
      },
    ],
  },
];

const TOWN_ORDER = new Map([
  ["North Topsail Beach", 0],
  ["Surf City", 1],
  ["Topsail Beach", 2],
]);

const TOPSAIL_SPINE = [
  { latitude: 34.343, longitude: -77.648 },
  { latitude: 34.385, longitude: -77.601 },
  { latitude: 34.423, longitude: -77.552 },
  { latitude: 34.487, longitude: -77.432 },
  { latitude: 34.552, longitude: -77.346 },
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanAddress(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s*,+\s*$/g, "")
    .trim();
}

function titleCaseAddress(value) {
  const keepUpper = new Set(["NC", "US"]);
  const suffixes = new Map([
    ["AVE", "Ave"],
    ["BLVD", "Blvd"],
    ["CIR", "Cir"],
    ["CT", "Ct"],
    ["DR", "Dr"],
    ["HWY", "Hwy"],
    ["LN", "Ln"],
    ["PL", "Pl"],
    ["RD", "Rd"],
    ["ST", "St"],
    ["TER", "Ter"],
    ["WAY", "Way"],
  ]);

  return cleanAddress(value)
    .toUpperCase()
    .split(" ")
    .map((token) => {
      if (keepUpper.has(token)) return token;
      if (suffixes.has(token)) return suffixes.get(token);
      if (/^\d+(ST|ND|RD|TH)$/.test(token)) return token.toLowerCase();
      return token
        .split("-")
        .map((part) =>
          part.length === 0
            ? part
            : `${part[0]}${part.slice(1).toLowerCase()}`,
        )
        .join("-");
    })
    .join(" ");
}

function centroidFromFeature(feature) {
  const centroid = feature.centroid;
  if (
    centroid &&
    Number.isFinite(centroid.x) &&
    Number.isFinite(centroid.y)
  ) {
    return { latitude: centroid.y, longitude: centroid.x };
  }

  const rings = feature.geometry?.rings ?? [];
  let pointCount = 0;
  let longitudeSum = 0;
  let latitudeSum = 0;

  for (const ring of rings) {
    for (const [longitude, latitude] of ring) {
      longitudeSum += longitude;
      latitudeSum += latitude;
      pointCount += 1;
    }
  }

  if (pointCount === 0) return null;

  return {
    latitude: latitudeSum / pointCount,
    longitude: longitudeSum / pointCount,
  };
}

function distanceToTopsailSpineMeters(point) {
  return Math.min(
    ...TOPSAIL_SPINE.slice(0, -1).map((start, index) =>
      distanceToSegmentMeters(point, start, TOPSAIL_SPINE[index + 1]),
    ),
  );
}

function distanceToSegmentMeters(point, start, end) {
  const latitudeRadians =
    ((point.latitude + start.latitude + end.latitude) / 3) * (Math.PI / 180);
  const xScale = 111_320 * Math.cos(latitudeRadians);
  const yScale = 110_540;
  const px = point.longitude * xScale;
  const py = point.latitude * yScale;
  const ax = start.longitude * xScale;
  const ay = start.latitude * yScale;
  const bx = end.longitude * xScale;
  const by = end.latitude * yScale;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));

  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function isMainIslandProperty(row) {
  if (!/^\d/.test(row.address)) return false;
  if (row.town === "North Topsail Beach") return true;

  const maxDistanceMeters = row.town === "Surf City" ? 1500 : 1700;
  return distanceToTopsailSpineMeters(row) <= maxDistanceMeters;
}

async function fetchTownRows(endpoint, townConfig) {
  let offset = 0;
  const rows = [];

  while (true) {
    const url = new URL(endpoint.url);
    url.searchParams.set("where", townConfig.where);
    url.searchParams.set("outFields", endpoint.fields);
    url.searchParams.set("returnGeometry", "true");
    url.searchParams.set("returnCentroid", "true");
    url.searchParams.set("outSR", "4326");
    url.searchParams.set("f", "json");
    url.searchParams.set("resultRecordCount", String(endpoint.pageSize));
    url.searchParams.set("resultOffset", String(offset));

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${endpoint.source} request failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`${endpoint.source} error: ${JSON.stringify(data.error)}`);
    }

    const features = data.features ?? [];
    for (const feature of features) {
      const centroid = centroidFromFeature(feature);
      const rawAddress = cleanAddress(
        feature.attributes?.[endpoint.addressField],
      );

      if (!centroid || !rawAddress) continue;

      rows.push({
        ...centroid,
        address: titleCaseAddress(rawAddress),
        town: townConfig.town,
        county: endpoint.county,
        source: endpoint.source,
      });
    }

    if (data.exceededTransferLimit && features.length > 0) {
      offset += endpoint.pageSize;
      await new Promise((resolve) => setTimeout(resolve, 100));
    } else {
      break;
    }
  }

  return rows;
}

function groupRows(rows) {
  const groups = new Map();

  for (const row of rows) {
    if (!isMainIslandProperty(row)) continue;

    const key = `${row.town}|${row.address}`;
    const group =
      groups.get(key) ??
      {
        id: `${slugify(row.town)}-${slugify(row.address)}`,
        address: row.address,
        town: row.town,
        county: row.county,
        latitudeSum: 0,
        longitudeSum: 0,
        parcelCount: 0,
        source: row.source,
      };

    group.latitudeSum += row.latitude;
    group.longitudeSum += row.longitude;
    group.parcelCount += 1;
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((group) => ({
      id: group.id,
      address: group.address,
      town: group.town,
      county: group.county,
      latitude: Number((group.latitudeSum / group.parcelCount).toFixed(6)),
      longitude: Number((group.longitudeSum / group.parcelCount).toFixed(6)),
      parcelCount: group.parcelCount,
      source: group.source,
    }))
    .sort((a, b) => {
      const townDelta = TOWN_ORDER.get(a.town) - TOWN_ORDER.get(b.town);
      if (townDelta !== 0) return townDelta;
      return a.address.localeCompare(b.address, undefined, { numeric: true });
    });
}

export async function buildPropertyAddressData() {
  const rows = [];

  for (const endpoint of ENDPOINTS) {
    for (const townConfig of endpoint.towns) {
      rows.push(...(await fetchTownRows(endpoint, townConfig)));
    }
  }

  return groupRows(rows);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = process.env.PROPERTY_OUTPUT_JSON || DEFAULT_OUTPUT;
  const rows = await buildPropertyAddressData();

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(rows, null, 2)}\n`);
  console.log(`Wrote ${rows.length} Topsail island property addresses to ${output}`);
}
