# Treasure Beach Access Finder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Treasure Vacation Rentals prototype that shows each guest the nearest public beach access, bigger nearby alternatives, accurate access facts, and clearly labeled prototype media.

**Architecture:** Use a static Vite + React + TypeScript app. Generate app-ready JSON from the canonical Topsail beach-access CSV, keep lookup/classification logic in pure TypeScript modules with Vitest coverage, then render a Treasure-branded rental-detail module plus a secondary finder page. Supabase stays read-only and optional; no prototype step writes to Supabase.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, MapLibre GL JS, CSS modules or plain CSS, Node.js data-generation script.

---

## File Structure

- Create `package.json`: scripts and dependencies for Vite, React, TypeScript, Vitest, Testing Library, and MapLibre.
- Create `index.html`: Vite mount point.
- Create `vite.config.ts`: Vite and Vitest config.
- Create `tsconfig.json`, `tsconfig.node.json`: TypeScript config.
- Create `src/main.tsx`: React entrypoint.
- Create `src/App.tsx`: route/state shell for rental-detail and finder views.
- Create `src/styles.css`: Treasure visual system and responsive layout.
- Create `src/types/access.ts`: shared access/media/rental types.
- Create `src/lib/accessScoring.ts`: access category and guest usefulness scoring.
- Create `src/lib/accessLookup.ts`: nearest-access lookup, alternate ranking, distance formatting, directions URLs.
- Create `src/lib/geocode.ts`: browser geocoding wrapper with testable interface and graceful failure.
- Create `src/components/BeachAccessModule.tsx`: rental-detail "Your Beach Path" module.
- Create `src/components/AccessMap.tsx`: map/visual island panel with highlighted access points.
- Create `src/components/AccessMediaGallery.tsx`: media gallery with launch-readiness/source labels.
- Create `src/components/AccessFacts.tsx`: parking, facilities, accessibility facts.
- Create `src/components/AccessFinderPage.tsx`: standalone address lookup and full access directory.
- Create `src/data/accesses.json`: generated app dataset.
- Create `src/data/mediaCandidates.json`: curated/prototype media references.
- Create `src/data/sampleRentals.ts`: demo Treasure rental coordinates and addresses.
- Create `scripts/build-access-data.mjs`: CSV-to-JSON generator.
- Create `tests/fixtures/beach_access_sample.csv`: small deterministic fixture.
- Create `tests/accessScoring.test.ts`: scoring/category tests.
- Create `tests/accessLookup.test.ts`: lookup/ranking/directions tests.
- Create `tests/buildAccessData.test.mjs`: data-generator test against fixture.
- Create `tests/BeachAccessModule.test.tsx`: component smoke/label tests.

## Task 1: Scaffold The App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "treasure-beach-access-finder",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest",
    "data:build": "node scripts/build-access-data.mjs"
  },
  "dependencies": {
    "maplibre-gl": "^4.7.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vite": "^6.0.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Treasure Vacation Rentals beach access finder for Topsail Island guests."
    />
    <title>Treasure Beach Access Finder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create TypeScript and Vite config files**

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
```

`tsconfig.json`:

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.node.json" }],
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "tests"]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create the minimal React shell**

`src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Treasure demo navigation">
        <a className="brand" href="#rental">
          Treasure Vacation Rentals
        </a>
        <div className="nav-links">
          <a href="#rental">Rental Detail</a>
          <a href="#finder">Beach Access Finder</a>
        </div>
      </nav>
      <section className="page-hero">
        <p className="eyebrow">Topsail Island, North Carolina</p>
        <h1>
          Find your rental. Find your <span>beach path.</span>
        </h1>
        <p>
          A Treasure-branded prototype for helping guests understand the closest
          access, bigger nearby alternatives, parking, amenities, and media.
        </p>
      </section>
    </main>
  );
}
```

`src/styles.css`:

```css
:root {
  --ink: #1d3135;
  --ink-soft: #42585d;
  --teal: #245963;
  --teal-dark: #163d45;
  --parrot-teal: #88d8e8;
  --parrot-teal-strong: #2d9aae;
  --parrot-teal-soft: #dcf5f8;
  --sand: #d7ad66;
  --shell: #f7f3eb;
  --foam: #e7f0ef;
  --line: #d8d0c4;
  --white: #fff;
  --shadow: 0 18px 50px rgba(26, 48, 52, 0.16);
  color: var(--ink);
  background: var(--shell);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

body {
  margin: 0;
  min-width: 320px;
  background: var(--shell);
}

a {
  color: inherit;
}

.app-shell {
  min-height: 100vh;
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 14px clamp(18px, 4vw, 52px);
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
}

.brand {
  color: var(--teal-dark);
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(20px, 3vw, 28px);
  font-weight: 700;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 16px;
  color: var(--ink-soft);
  font-size: 14px;
}

.page-hero {
  display: grid;
  align-content: end;
  min-height: 340px;
  padding: clamp(28px, 6vw, 72px);
  color: var(--white);
  background:
    linear-gradient(90deg, rgba(22, 61, 69, 0.92), rgba(22, 61, 69, 0.44)),
    url("https://isaacbeachfun-ship-it.github.io/treasure-rentals-website-mockup/assets/town-cards/surf-city-pier-bridge.webp")
      center/cover;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--sand);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-hero h1 {
  max-width: 800px;
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(42px, 8vw, 86px);
  line-height: 0.96;
}

.page-hero h1 span {
  font-family: "Snell Roundhand", "Segoe Script", "Brush Script MT", cursive;
  font-weight: 400;
}

.page-hero p:last-child {
  max-width: 680px;
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: clamp(16px, 2vw, 20px);
  line-height: 1.5;
}
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and npm exits with code 0.

- [ ] **Step 6: Run the initial build**

Run: `npm run build`

Expected: TypeScript and Vite complete successfully and create `dist/`.

- [ ] **Step 7: Commit scaffold**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src
git commit -m "feat: scaffold Treasure beach access app"
```

## Task 2: Add Types And Access Scoring

**Files:**
- Create: `src/types/access.ts`
- Create: `src/lib/accessScoring.ts`
- Create: `tests/setup.ts`
- Create: `tests/accessScoring.test.ts`

- [ ] **Step 1: Create test setup**

`tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Write failing scoring tests**

`tests/accessScoring.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { classifyAccess, scoreAccessUsefulness } from "../src/lib/accessScoring";
import type { BeachAccess } from "../src/types/access";

function access(overrides: Partial<BeachAccess>): BeachAccess {
  return {
    id: "surf-city-roland",
    town: "Surf City",
    name: "Beach Access #18",
    address: "100 Roland Ave",
    latitude: 34.425716,
    longitude: -77.544528,
    waterType: "ocean",
    accessType: "public",
    parkingSpots: 32,
    handicapSpots: 0,
    parkingOptions: "Onsite Parking",
    parkingFee: true,
    hourlyRate: null,
    dailyRate: null,
    weeklyRate: null,
    seasonalRate: null,
    restroom: true,
    shower: true,
    lifeguards: false,
    beachWheelchair: true,
    beachMat: false,
    mobiMat: false,
    handicapAccessible: false,
    vehicleAccess: false,
    duneWalkover: false,
    source: "NC DCM",
    sourceDetail: "Town access details",
    comments: "",
    mediaIds: [],
    ...overrides,
  };
}

describe("scoreAccessUsefulness", () => {
  it("gives major parking and facilities a higher guest usefulness score", () => {
    const countyLot = access({
      name: "Onslow Co. Beach Access #2",
      parkingSpots: 250,
      restroom: true,
      shower: true,
      handicapAccessible: true,
      beachWheelchair: true,
    });
    const neighborhoodWalkover = access({
      name: "Quiet walkover",
      parkingSpots: 0,
      restroom: false,
      shower: false,
      handicapAccessible: false,
      beachWheelchair: false,
    });

    expect(scoreAccessUsefulness(countyLot)).toBeGreaterThan(
      scoreAccessUsefulness(neighborhoodWalkover),
    );
  });
});

describe("classifyAccess", () => {
  it("classifies large facility-heavy lots as major", () => {
    expect(
      classifyAccess(
        access({
          parkingSpots: 150,
          restroom: true,
          shower: true,
          handicapAccessible: true,
        }),
      ),
    ).toContain("Major");
  });

  it("classifies small no-parking walkovers as quiet", () => {
    expect(
      classifyAccess(
        access({
          parkingSpots: 0,
          restroom: false,
          shower: false,
          handicapAccessible: false,
        }),
      ),
    ).toEqual(["Quiet"]);
  });

  it("adds facilities when an access has restrooms or showers", () => {
    expect(classifyAccess(access({ parkingSpots: 4, restroom: true }))).toContain(
      "Facilities",
    );
  });
});
```

- [ ] **Step 3: Run scoring tests and verify failure**

Run: `npm test -- tests/accessScoring.test.ts`

Expected: FAIL because `src/lib/accessScoring.ts` and `src/types/access.ts` do not exist.

- [ ] **Step 4: Add shared access types**

`src/types/access.ts`:

```ts
export type AccessCategory = "Closest" | "Major" | "Facilities" | "Quiet";

export type MediaStatus = "launch-safe" | "prototype-only" | "needs-replacement";

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
```

- [ ] **Step 5: Implement scoring**

`src/lib/accessScoring.ts`:

```ts
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
```

- [ ] **Step 6: Run scoring tests and verify pass**

Run: `npm test -- tests/accessScoring.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit scoring module**

```bash
git add src/types/access.ts src/lib/accessScoring.ts tests/setup.ts tests/accessScoring.test.ts
git commit -m "feat: classify beach access usefulness"
```

## Task 3: Generate Access JSON From The Canonical CSV

**Files:**
- Create: `scripts/build-access-data.mjs`
- Create: `tests/fixtures/beach_access_sample.csv`
- Create: `tests/buildAccessData.test.mjs`
- Create: `src/data/accesses.json`

- [ ] **Step 1: Create fixture CSV**

`tests/fixtures/beach_access_sample.csv`:

```csv
market,place,access_name,address,county,state,latitude,longitude,access_type,water_type,parking_spots,handicap_spots,parking_options,parking_fee_yn,hourly_rate,daily_rate,weekly_rate,seasonal_rate,dune_walkover,restroom,shower,vehicle_access,lifeguards,beach_wheelchair,beach_mat,mobi_mat,handicap_accessible,kayak_launch,dcm_funded,land_status,survey_date,orv_permit,fourwd_required,source,source_detail,comments
Topsail Island,North Topsail Beach,Onslow Co. Beach Access #2,2950 Island Drive,Onslow,NC,34.469491,-77.468452,Public Beach Access,ocean,250,8,Onsite Parking,Y,$5.00,$25.00,$100.00,$150.00,Y,Y,Y,N,N,Y,N,N,Y,N,Y,Public,2026-03-12,N,N,NC DCM,County lot,
Topsail Island,Surf City,Beach Access #18,100 Roland Ave,Pender,NC,34.425716,-77.544528,Public Beach Access,ocean,32,0,Onsite Parking,Y,,, , ,Y,Y,Y,N,N,Y,N,N,N,N,Y,Public,2026-03-12,N,N,NC DCM,Town access,
Topsail Island,Topsail Beach,Quiet Walkover,Ocean and Trout,Pender,NC,34.351021,-77.645744,Public Beach Access,ocean,0,0,No Parking,, , , , ,Y,N,N,N,N,Y,N,N,N,N,Y,Public,2026-03-12,N,N,NC DCM,Small walkover,
Brunswick Beaches,Oak Island,Other Beach,1 Ocean Dr,Brunswick,NC,33.9,-78.1,Public Beach Access,ocean,100,2,Onsite Parking,Y,,,,,Y,Y,Y,N,N,Y,N,N,Y,N,Y,Public,2026-03-12,N,N,NC DCM,Not Topsail,
```

- [ ] **Step 2: Write failing generator tests**

`tests/buildAccessData.test.mjs`:

```js
import { describe, expect, it } from "vitest";
import { buildAccessDataFromCsv } from "../scripts/build-access-data.mjs";

describe("buildAccessDataFromCsv", () => {
  it("keeps only Topsail ocean accesses and normalizes fields", () => {
    const rows = buildAccessDataFromCsv("tests/fixtures/beach_access_sample.csv");

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      id: "north-topsail-beach-onslow-co-beach-access-2",
      town: "North Topsail Beach",
      name: "Onslow Co. Beach Access #2",
      parkingSpots: 250,
      parkingFee: true,
      restroom: true,
      shower: true,
      handicapAccessible: true,
    });
  });

  it("attaches category labels and keeps mediaIds empty by default", () => {
    const rows = buildAccessDataFromCsv("tests/fixtures/beach_access_sample.csv");
    const quiet = rows.find((row) => row.name === "Quiet Walkover");

    expect(quiet.categories).toEqual(["Quiet"]);
    expect(quiet.mediaIds).toEqual([]);
  });
});
```

- [ ] **Step 3: Run generator tests and verify failure**

Run: `npm test -- tests/buildAccessData.test.mjs`

Expected: FAIL because `build-access-data.mjs` does not exist.

- [ ] **Step 4: Create generator script**

`scripts/build-access-data.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOURCE =
  "/Users/isaac/Projects/topsail-scrape/data/beach_access/beach_access_master.csv";
const DEFAULT_OUTPUT = path.resolve(__dirname, "../src/data/accesses.json");
const TOPSAIL_TOWNS = new Set([
  "North Topsail Beach",
  "Surf City",
  "Topsail Beach",
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
      return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
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
  if (!isMajor && !hasFacilities && access.parkingSpots < 8) categories.push("Quiet");
  return categories.length > 0 ? categories : ["Quiet"];
}

export function buildAccessDataFromCsv(sourcePath = DEFAULT_SOURCE) {
  return parseCsv(sourcePath)
    .filter((row) => TOPSAIL_TOWNS.has(row.place))
    .filter((row) => row.water_type.toLowerCase() === "ocean")
    .map((row) => {
      const access = {
        id: `${slugify(row.place)}-${slugify(row.access_name || row.address)}`,
        town: row.place,
        name: row.access_name || row.address || "Unnamed access",
        address: clean(row.address),
        latitude: parseNumber(row.latitude),
        longitude: parseNumber(row.longitude),
        waterType: row.water_type,
        accessType: row.access_type,
        parkingSpots: parseNumber(row.parking_spots),
        handicapSpots: clean(row.handicap_spots) === null ? null : parseNumber(row.handicap_spots),
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
      return {
        ...access,
        categories: classifyAccess(access),
        usefulnessScore: scoreAccessUsefulness(access),
      };
    })
    .sort((a, b) => {
      if (a.town !== b.town) return a.town.localeCompare(b.town);
      return a.name.localeCompare(b.name);
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
```

- [ ] **Step 5: Run generator tests and verify pass**

Run: `npm test -- tests/buildAccessData.test.mjs`

Expected: PASS.

- [ ] **Step 6: Generate real access JSON**

Run: `npm run data:build`

Expected: console prints `Wrote 112 Topsail ocean access rows to .../src/data/accesses.json`.

- [ ] **Step 7: Commit generated data tooling**

```bash
git add scripts/build-access-data.mjs tests/fixtures/beach_access_sample.csv tests/buildAccessData.test.mjs src/data/accesses.json
git commit -m "feat: generate Topsail beach access data"
```

## Task 4: Implement Lookup And Ranking Logic

**Files:**
- Create: `src/lib/accessLookup.ts`
- Create: `tests/accessLookup.test.ts`

- [ ] **Step 1: Write failing lookup tests**

`tests/accessLookup.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildDirectionsUrl,
  findNearestAccess,
  formatDistanceFeet,
  rankMajorAlternates,
} from "../src/lib/accessLookup";
import type { BeachAccess } from "../src/types/access";

const baseAccess: BeachAccess = {
  id: "quiet",
  town: "Surf City",
  name: "Quiet Walkover",
  address: "1200 N Shore Dr",
  latitude: 34.436526,
  longitude: -77.526076,
  waterType: "ocean",
  accessType: "Public Beach Access",
  parkingSpots: 0,
  handicapSpots: 0,
  parkingOptions: "No Parking",
  parkingFee: null,
  hourlyRate: null,
  dailyRate: null,
  weeklyRate: null,
  seasonalRate: null,
  restroom: false,
  shower: false,
  lifeguards: false,
  beachWheelchair: false,
  beachMat: false,
  mobiMat: false,
  handicapAccessible: false,
  vehicleAccess: false,
  duneWalkover: true,
  source: "NC DCM",
  sourceDetail: "",
  comments: "",
  mediaIds: [],
};

const accesses: BeachAccess[] = [
  baseAccess,
  {
    ...baseAccess,
    id: "major",
    name: "Broadway Ave Access",
    address: "1700 N Shore Dr",
    latitude: 34.44102,
    longitude: -77.51845,
    parkingSpots: 34,
    restroom: true,
    shower: true,
    beachWheelchair: true,
    beachMat: true,
  },
];

describe("findNearestAccess", () => {
  it("returns the nearest access with estimated distance and directions", () => {
    const match = findNearestAccess(
      { latitude: 34.4365, longitude: -77.5261, address: "1200 N Shore Dr" },
      accesses,
    );

    expect(match.access.id).toBe("quiet");
    expect(match.distanceFeet).toBeLessThan(100);
    expect(match.estimatedWalkMinutes).toBeGreaterThanOrEqual(1);
    expect(match.directionsUrl).toContain("api=1");
  });
});

describe("rankMajorAlternates", () => {
  it("promotes useful larger accesses over quiet walkovers", () => {
    const alternates = rankMajorAlternates(baseAccess, accesses, 3);

    expect(alternates[0].access.id).toBe("major");
    expect(alternates[0].categories).toContain("Major");
  });
});

describe("formatDistanceFeet", () => {
  it("formats short and long distances for guests", () => {
    expect(formatDistanceFeet(480)).toBe("480 ft");
    expect(formatDistanceFeet(5280)).toBe("1.0 mi");
  });
});

describe("buildDirectionsUrl", () => {
  it("builds a Google Maps walking directions URL", () => {
    expect(
      buildDirectionsUrl(
        { latitude: 34.43, longitude: -77.53, address: "Rental" },
        baseAccess,
      ),
    ).toBe(
      "https://www.google.com/maps/dir/?api=1&origin=34.43%2C-77.53&destination=34.436526%2C-77.526076&travelmode=walking",
    );
  });
});
```

- [ ] **Step 2: Run lookup tests and verify failure**

Run: `npm test -- tests/accessLookup.test.ts`

Expected: FAIL because `accessLookup.ts` does not exist.

- [ ] **Step 3: Implement lookup module**

`src/lib/accessLookup.ts`:

```ts
import { classifyAccess, scoreAccessUsefulness } from "./accessScoring";
import type { AccessMatch, BeachAccess } from "../types/access";

export interface LookupPoint {
  latitude: number;
  longitude: number;
  address: string;
}

const FEET_PER_METER = 3.28084;
const WALK_FEET_PER_MINUTE = 275;

export function distanceFeet(
  first: Pick<LookupPoint, "latitude" | "longitude">,
  second: Pick<LookupPoint, "latitude" | "longitude">,
): number {
  const radiusMeters = 6371000;
  const firstLat = toRadians(first.latitude);
  const secondLat = toRadians(second.latitude);
  const deltaLat = toRadians(second.latitude - first.latitude);
  const deltaLon = toRadians(second.longitude - first.longitude);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(firstLat) *
      Math.cos(secondLat) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(radiusMeters * c * FEET_PER_METER);
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function estimateWalkMinutes(distance: number): number {
  return Math.max(1, Math.round(distance / WALK_FEET_PER_MINUTE));
}

export function buildDirectionsUrl(origin: LookupPoint, access: BeachAccess): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${access.latitude},${access.longitude}`,
    travelmode: "walking",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function toAccessMatch(
  origin: LookupPoint,
  access: BeachAccess,
  isExactSupabaseWalkDistance = false,
): AccessMatch {
  const distance = distanceFeet(origin, access);
  return {
    access,
    distanceFeet: distance,
    estimatedWalkMinutes: estimateWalkMinutes(distance),
    categories: classifyAccess(access),
    directionsUrl: buildDirectionsUrl(origin, access),
    isExactSupabaseWalkDistance,
  };
}

export function findNearestAccess(origin: LookupPoint, accesses: BeachAccess[]): AccessMatch {
  if (accesses.length === 0) {
    throw new Error("Cannot find nearest access without access data.");
  }

  return accesses
    .map((access) => toAccessMatch(origin, access))
    .sort((a, b) => a.distanceFeet - b.distanceFeet)[0];
}

export function rankMajorAlternates(
  nearest: BeachAccess,
  accesses: BeachAccess[],
  limit = 3,
): AccessMatch[] {
  const origin = {
    latitude: nearest.latitude,
    longitude: nearest.longitude,
    address: nearest.address || nearest.name,
  };

  return accesses
    .filter((access) => access.id !== nearest.id)
    .map((access) => toAccessMatch(origin, access))
    .filter((match) => match.categories.includes("Major") || match.categories.includes("Facilities"))
    .sort((a, b) => {
      const scoreDelta =
        scoreAccessUsefulness(b.access) - scoreAccessUsefulness(a.access);
      if (scoreDelta !== 0) return scoreDelta;
      return a.distanceFeet - b.distanceFeet;
    })
    .slice(0, limit);
}

export function formatDistanceFeet(distance: number): string {
  if (distance >= 5280) {
    return `${(distance / 5280).toFixed(1)} mi`;
  }
  return `${Math.round(distance).toLocaleString()} ft`;
}
```

- [ ] **Step 4: Run lookup tests and verify pass**

Run: `npm test -- tests/accessLookup.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit lookup logic**

```bash
git add src/lib/accessLookup.ts tests/accessLookup.test.ts
git commit -m "feat: find nearest and major beach accesses"
```

## Task 5: Add Demo Rentals And Media Candidates

**Files:**
- Create: `src/data/sampleRentals.ts`
- Create: `src/data/mediaCandidates.json`
- Modify: `src/types/access.ts`

- [ ] **Step 1: Extend `BeachAccess` generated fields in `src/types/access.ts`**

Add these properties inside `BeachAccess` after `mediaIds`:

```ts
  categories?: AccessCategory[];
  usefulnessScore?: number;
```

- [ ] **Step 2: Create sample Treasure rentals**

`src/data/sampleRentals.ts`:

```ts
import type { RentalSample } from "../types/access";

export const sampleRentals: RentalSample[] = [
  {
    id: "surf-city-sample",
    name: "Surf City Treasure",
    address: "305 S Shore Dr, Surf City, NC 28445",
    town: "Surf City",
    latitude: 34.42415,
    longitude: -77.54795,
    heroImageUrl:
      "https://isaacbeachfun-ship-it.github.io/treasure-rentals-website-mockup/assets/town-cards/surf-city-pier-bridge.webp",
  },
  {
    id: "north-topsail-sample",
    name: "North Topsail Family Week",
    address: "2950 Island Dr, North Topsail Beach, NC 28460",
    town: "North Topsail Beach",
    latitude: 34.46949,
    longitude: -77.46845,
    heroImageUrl:
      "https://isaacbeachfun-ship-it.github.io/treasure-rentals-website-mockup/assets/town-cards/north-topsail-beach.jpg",
  },
  {
    id: "topsail-beach-sample",
    name: "South End Shell House",
    address: "915 N Anderson Blvd, Topsail Beach, NC 28445",
    town: "Topsail Beach",
    latitude: 34.38142,
    longitude: -77.60924,
    heroImageUrl:
      "https://isaacbeachfun-ship-it.github.io/treasure-rentals-website-mockup/assets/topsail-beach/island-overview.jpg",
  },
];
```

- [ ] **Step 3: Create media candidates**

`src/data/mediaCandidates.json`:

```json
[
  {
    "id": "surf-city-pier-reference",
    "accessId": "surf-city-beach-access-18",
    "title": "Surf City reference visual",
    "url": "https://isaacbeachfun-ship-it.github.io/treasure-rentals-website-mockup/assets/town-cards/surf-city-pier-bridge.webp",
    "sourceLabel": "Treasure mockup asset",
    "sourceUrl": "https://isaacbeachfun-ship-it.github.io/treasure-rentals-website-mockup/",
    "status": "prototype-only",
    "kind": "photo"
  },
  {
    "id": "north-topsail-reference",
    "accessId": "north-topsail-beach-onslow-co-beach-access-2",
    "title": "North Topsail reference visual",
    "url": "https://isaacbeachfun-ship-it.github.io/treasure-rentals-website-mockup/assets/town-cards/north-topsail-beach.jpg",
    "sourceLabel": "Treasure mockup asset",
    "sourceUrl": "https://isaacbeachfun-ship-it.github.io/treasure-rentals-website-mockup/",
    "status": "prototype-only",
    "kind": "photo"
  },
  {
    "id": "topsail-beach-reference",
    "accessId": "topsail-beach-0-3",
    "title": "Topsail Beach reference visual",
    "url": "https://isaacbeachfun-ship-it.github.io/treasure-rentals-website-mockup/assets/topsail-beach/island-overview.jpg",
    "sourceLabel": "Treasure mockup asset",
    "sourceUrl": "https://isaacbeachfun-ship-it.github.io/treasure-rentals-website-mockup/",
    "status": "prototype-only",
    "kind": "photo"
  }
]
```

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run build`

Expected: tests pass and app builds.

- [ ] **Step 5: Commit demo data**

```bash
git add src/types/access.ts src/data/sampleRentals.ts src/data/mediaCandidates.json
git commit -m "feat: add demo rentals and media candidates"
```

## Task 6: Build The Rental Detail Beach Access Module

**Files:**
- Create: `src/components/AccessFacts.tsx`
- Create: `src/components/AccessMediaGallery.tsx`
- Create: `src/components/BeachAccessModule.tsx`
- Create: `tests/BeachAccessModule.test.tsx`

- [ ] **Step 1: Write failing component test**

`tests/BeachAccessModule.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BeachAccessModule } from "../src/components/BeachAccessModule";
import type { AccessMedia, BeachAccess, RentalSample } from "../src/types/access";

const rental: RentalSample = {
  id: "rental",
  name: "Surf City Treasure",
  address: "305 S Shore Dr",
  town: "Surf City",
  latitude: 34.42415,
  longitude: -77.54795,
  heroImageUrl: "/sample.jpg",
};

const closest: BeachAccess = {
  id: "closest",
  town: "Surf City",
  name: "Roland Avenue Access",
  address: "100 North Shore Drive",
  latitude: 34.425716,
  longitude: -77.544528,
  waterType: "ocean",
  accessType: "Public Beach Access",
  parkingSpots: 32,
  handicapSpots: 0,
  parkingOptions: "Onsite Parking",
  parkingFee: true,
  hourlyRate: null,
  dailyRate: null,
  weeklyRate: null,
  seasonalRate: null,
  restroom: true,
  shower: true,
  lifeguards: false,
  beachWheelchair: true,
  beachMat: false,
  mobiMat: false,
  handicapAccessible: false,
  vehicleAccess: false,
  duneWalkover: true,
  source: "NC DCM",
  sourceDetail: "Town source",
  comments: "",
  mediaIds: ["media"],
};

const media: AccessMedia[] = [
  {
    id: "media",
    accessId: "closest",
    title: "Reference photo",
    url: "/photo.jpg",
    sourceLabel: "Prototype source",
    sourceUrl: "https://example.com",
    status: "prototype-only",
    kind: "photo",
  },
];

describe("BeachAccessModule", () => {
  it("renders closest access, facts, alternates, and media warning", () => {
    render(
      <BeachAccessModule
        rental={rental}
        closestAccess={closest}
        alternates={[closest]}
        media={media}
      />,
    );

    expect(screen.getByText("Your Beach Path")).toBeInTheDocument();
    expect(screen.getByText("Roland Avenue Access")).toBeInTheDocument();
    expect(screen.getByText("Prototype only")).toBeInTheDocument();
    expect(screen.getByText("Restroom")).toBeInTheDocument();
    expect(screen.getByText("Bigger nearby accesses")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run component test and verify failure**

Run: `npm test -- tests/BeachAccessModule.test.tsx`

Expected: FAIL because components do not exist.

- [ ] **Step 3: Create `AccessFacts.tsx`**

```tsx
import type { BeachAccess } from "../types/access";

interface AccessFactsProps {
  access: BeachAccess;
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

export function AccessFacts({ access }: AccessFactsProps) {
  const parking =
    access.parkingSpots > 0
      ? `${access.parkingSpots} spaces`
      : access.parkingOptions || "No listed parking";
  const fee =
    access.parkingFee === true
      ? "Paid parking"
      : access.parkingFee === false
        ? "No listed parking fee"
        : "Fee unknown";

  return (
    <section className="facts-panel" aria-labelledby="facts-heading">
      <h3 id="facts-heading">Guest facts</h3>
      <div className="facts-grid">
        <div className="fact">
          <b>Parking</b>
          <span>{parking}</span>
          <small>{fee}</small>
        </div>
        <div className="fact">
          <b>Facilities</b>
          <span>{access.restroom ? "Restroom" : "No restroom listed"}</span>
          <small>{access.shower ? "Shower listed" : "No shower listed"}</small>
        </div>
        <div className="fact">
          <b>Accessibility</b>
          <span>ADA: {yesNo(access.handicapAccessible)}</span>
          <small>Mat: {yesNo(access.beachMat || access.mobiMat)}</small>
        </div>
        <div className="fact">
          <b>Source</b>
          <span>{access.source}</span>
          <small>{access.sourceDetail || "No extra source note"}</small>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `AccessMediaGallery.tsx`**

```tsx
import type { AccessMedia } from "../types/access";

interface AccessMediaGalleryProps {
  media: AccessMedia[];
}

function statusLabel(status: AccessMedia["status"]): string {
  if (status === "launch-safe") return "Launch safe";
  if (status === "prototype-only") return "Prototype only";
  return "Needs replacement";
}

export function AccessMediaGallery({ media }: AccessMediaGalleryProps) {
  const primary = media[0];

  return (
    <section className="media-panel" aria-labelledby="media-heading">
      <h3 id="media-heading">What it looks like</h3>
      {primary ? (
        <>
          <div className="media-image-wrap">
            <img src={primary.url} alt={primary.title} />
            <span className={`media-status media-status-${primary.status}`}>
              {statusLabel(primary.status)}
            </span>
          </div>
          <p className="source-tag">
            {primary.sourceLabel} · <a href={primary.sourceUrl}>source</a>
          </p>
        </>
      ) : (
        <div className="media-placeholder">
          <p>No access-specific media yet.</p>
          <span>Use official, owned, embedded, or replacement-ready media before launch.</span>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Create `BeachAccessModule.tsx`**

```tsx
import { formatDistanceFeet, toAccessMatch } from "../lib/accessLookup";
import type { AccessMedia, BeachAccess, RentalSample } from "../types/access";
import { AccessFacts } from "./AccessFacts";
import { AccessMediaGallery } from "./AccessMediaGallery";

interface BeachAccessModuleProps {
  rental: RentalSample;
  closestAccess: BeachAccess;
  alternates: BeachAccess[];
  media: AccessMedia[];
}

export function BeachAccessModule({
  rental,
  closestAccess,
  alternates,
  media,
}: BeachAccessModuleProps) {
  const origin = {
    latitude: rental.latitude,
    longitude: rental.longitude,
    address: rental.address,
  };
  const closest = toAccessMatch(origin, closestAccess);

  return (
    <section className="beach-module" id="rental" aria-labelledby="beach-module-heading">
      <div className="module-copy">
        <p className="eyebrow">Closest public beach access</p>
        <h2 id="beach-module-heading">Your Beach Path</h2>
        <p>
          From <strong>{rental.name}</strong>, the closest public access is{" "}
          <strong>{closestAccess.name}</strong>. Use the bigger alternatives if
          your group needs more parking, restrooms, showers, or accessibility support.
        </p>
      </div>

      <div className="module-grid">
        <article className="answer-card">
          <p className="eyebrow">Nearest access</p>
          <h3>{closestAccess.name}</h3>
          <p>{closestAccess.address || "Address not listed"}</p>
          <div className="metric-row">
            <div>
              <b>{formatDistanceFeet(closest.distanceFeet)}</b>
              <span>estimated distance</span>
            </div>
            <div>
              <b>{closest.estimatedWalkMinutes} min</b>
              <span>estimated walk</span>
            </div>
            <div>
              <b>{closestAccess.parkingSpots}</b>
              <span>parking spaces</span>
            </div>
          </div>
          <a className="primary-action" href={closest.directionsUrl}>
            Get walking directions
          </a>
          <p className="accuracy-note">
            Distance is estimated from coordinates unless exact Supabase walk-distance
            data is available for this listing.
          </p>
        </article>

        <AccessMediaGallery media={media} />

        <AccessFacts access={closestAccess} />

        <section className="alternates-panel" aria-labelledby="alternates-heading">
          <h3 id="alternates-heading">Bigger nearby accesses</h3>
          {alternates.map((access) => (
            <article className="alternate-access" key={access.id}>
              <span>{access.parkingSpots >= 30 ? "Major" : "Facilities"}</span>
              <div>
                <b>{access.name}</b>
                <small>
                  {access.parkingSpots} spaces
                  {access.restroom ? " · restroom" : ""}
                  {access.shower ? " · shower" : ""}
                </small>
              </div>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Add component CSS to `src/styles.css`**

Append:

```css
.beach-module {
  padding: clamp(28px, 5vw, 72px);
  background: var(--shell);
}

.module-copy {
  max-width: 760px;
  margin-bottom: 24px;
}

.module-copy h2 {
  margin: 0;
  color: var(--teal-dark);
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(34px, 5vw, 58px);
}

.module-copy p:last-child {
  color: var(--ink-soft);
  font-size: 18px;
  line-height: 1.55;
}

.module-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 18px;
}

.answer-card,
.media-panel,
.facts-panel,
.alternates-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--white);
  box-shadow: var(--shadow);
}

.answer-card {
  padding: 22px;
  border-top: 5px solid var(--parrot-teal);
}

.answer-card h3,
.media-panel h3,
.facts-panel h3,
.alternates-panel h3 {
  margin: 0 0 8px;
  color: var(--teal-dark);
  font-size: 22px;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 18px 0;
}

.metric-row div,
.fact {
  padding: 12px;
  border-radius: 8px;
  background: var(--foam);
}

.metric-row b,
.fact b {
  display: block;
  color: var(--teal-dark);
  font-size: 20px;
}

.metric-row span,
.fact span,
.fact small,
.accuracy-note,
.source-tag {
  color: var(--ink-soft);
}

.primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 8px;
  color: var(--white);
  background: linear-gradient(135deg, var(--teal), var(--teal-dark));
  font-weight: 800;
  text-decoration: none;
}

.media-panel,
.facts-panel,
.alternates-panel {
  padding: 16px;
}

.media-image-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  aspect-ratio: 16 / 10;
}

.media-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-status {
  position: absolute;
  left: 10px;
  bottom: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--parrot-teal);
  color: var(--teal-dark);
  font-size: 12px;
  font-weight: 800;
}

.source-tag {
  margin: 10px 0 0;
  font-size: 13px;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.alternate-access {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background: var(--shell);
}

.alternate-access + .alternate-access {
  margin-top: 8px;
}

.alternate-access span {
  padding: 5px 8px;
  border-radius: 999px;
  background: #f4d79b;
  color: var(--teal-dark);
  font-size: 11px;
  font-weight: 800;
}

.alternate-access b {
  color: var(--teal-dark);
}

.alternate-access small {
  display: block;
  color: var(--ink-soft);
}

.media-placeholder {
  display: grid;
  place-items: center;
  min-height: 220px;
  border-radius: 8px;
  color: var(--ink-soft);
  background: var(--foam);
  text-align: center;
}

@media (max-width: 820px) {
  .top-nav,
  .nav-links {
    align-items: flex-start;
    flex-direction: column;
  }

  .module-grid {
    grid-template-columns: 1fr;
  }

  .metric-row,
  .facts-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Run component test and verify pass**

Run: `npm test -- tests/BeachAccessModule.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit rental module**

```bash
git add src/components tests/BeachAccessModule.test.tsx src/styles.css
git commit -m "feat: add rental beach path module"
```

## Task 7: Add Map Panel And Finder Page

**Files:**
- Create: `src/components/AccessMap.tsx`
- Create: `src/components/AccessFinderPage.tsx`
- Create: `src/lib/geocode.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Create `geocode.ts`**

```ts
import type { LookupPoint } from "./accessLookup";

export async function geocodeTopsailAddress(address: string): Promise<LookupPoint> {
  const query = `${address}, Topsail Island, NC`;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Address lookup failed. Try a more specific Topsail address.");
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string }>;
  const first = results[0];
  if (!first) {
    throw new Error("No match found. Try including town and ZIP code.");
  }

  return {
    address,
    latitude: Number.parseFloat(first.lat),
    longitude: Number.parseFloat(first.lon),
  };
}
```

- [ ] **Step 2: Create `AccessMap.tsx`**

```tsx
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { AccessMatch, RentalSample } from "../types/access";

interface AccessMapProps {
  rental: RentalSample;
  closest: AccessMatch;
  alternates: AccessMatch[];
}

export function AccessMap({ rental, closest, alternates }: AccessMapProps) {
  const mapNode = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapNode.current) return;

    const map = new maplibregl.Map({
      container: mapNode.current,
      center: [rental.longitude, rental.latitude],
      zoom: 14,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
    });

    const markers = [
      new maplibregl.Marker({ color: "#163d45" })
        .setLngLat([rental.longitude, rental.latitude])
        .setPopup(new maplibregl.Popup().setText(rental.name))
        .addTo(map),
      new maplibregl.Marker({ color: "#2d9aae" })
        .setLngLat([closest.access.longitude, closest.access.latitude])
        .setPopup(new maplibregl.Popup().setText(`Closest: ${closest.access.name}`))
        .addTo(map),
      ...alternates.map((alternate) =>
        new maplibregl.Marker({ color: "#d99a2b" })
          .setLngLat([alternate.access.longitude, alternate.access.latitude])
          .setPopup(new maplibregl.Popup().setText(`Major: ${alternate.access.name}`))
          .addTo(map),
      ),
    ];

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([rental.longitude, rental.latitude]);
    bounds.extend([closest.access.longitude, closest.access.latitude]);
    alternates.forEach((alternate) => {
      bounds.extend([alternate.access.longitude, alternate.access.latitude]);
    });
    map.fitBounds(bounds, { padding: 70, maxZoom: 15 });

    return () => {
      markers.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [alternates, closest, rental]);

  return (
    <section className="map-panel" aria-labelledby="map-heading">
      <div>
        <p className="eyebrow">Island view</p>
        <h3 id="map-heading">Closest path plus bigger options</h3>
      </div>
      <div className="map-legend" aria-label="Map legend">
        <span className="legend-home">Rental</span>
        <span className="legend-closest">Closest</span>
        <span className="legend-major">Major access</span>
      </div>
      <div ref={mapNode} className="island-map" aria-label="Map of rental and beach accesses" />
    </section>
  );
}
```

- [ ] **Step 3: Create `AccessFinderPage.tsx`**

```tsx
import { type FormEvent, useMemo, useState } from "react";
import accessesData from "../data/accesses.json";
import { geocodeTopsailAddress } from "../lib/geocode";
import {
  findNearestAccess,
  formatDistanceFeet,
  rankMajorAlternates,
} from "../lib/accessLookup";
import type { AccessMatch, BeachAccess } from "../types/access";

const accesses = accessesData as BeachAccess[];

export function AccessFinderPage() {
  const [address, setAddress] = useState("305 S Shore Dr, Surf City, NC 28445");
  const [match, setMatch] = useState<AccessMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const majorAccesses = useMemo(
    () =>
      accesses
        .filter((access) => (access.usefulnessScore || 0) >= 70)
        .sort((a, b) => (b.usefulnessScore || 0) - (a.usefulnessScore || 0))
        .slice(0, 8),
    [],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const point = await geocodeTopsailAddress(address);
      setMatch(findNearestAccess(point, accesses));
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Address lookup failed.");
    }
  }

  const alternates = match ? rankMajorAlternates(match.access, accesses, 3) : [];

  return (
    <section className="finder-page" id="finder" aria-labelledby="finder-heading">
      <div className="finder-copy">
        <p className="eyebrow">Beach Access Finder</p>
        <h2 id="finder-heading">Type an address. Treasure finds the beach path.</h2>
      </div>
      <form className="finder-form" onSubmit={handleSubmit}>
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          aria-label="Topsail address"
        />
        <button type="submit">Find Access</button>
      </form>
      {error ? <p className="error-message">{error}</p> : null}
      {match ? (
        <article className="finder-result">
          <h3>{match.access.name}</h3>
          <p>
            {formatDistanceFeet(match.distanceFeet)} estimated from this address ·{" "}
            {match.estimatedWalkMinutes} min walk
          </p>
          <a href={match.directionsUrl}>Open walking directions</a>
          <div className="finder-alternates">
            {alternates.map((alternate) => (
              <span key={alternate.access.id}>{alternate.access.name}</span>
            ))}
          </div>
        </article>
      ) : null}
      <div className="major-directory">
        {majorAccesses.map((access) => (
          <article key={access.id}>
            <b>{access.name}</b>
            <span>
              {access.town} · {access.parkingSpots} spaces
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire app state in `App.tsx`**

Replace `src/App.tsx` with:

```tsx
import accessesData from "./data/accesses.json";
import mediaCandidates from "./data/mediaCandidates.json";
import { sampleRentals } from "./data/sampleRentals";
import { findNearestAccess, rankMajorAlternates } from "./lib/accessLookup";
import { BeachAccessModule } from "./components/BeachAccessModule";
import { AccessFinderPage } from "./components/AccessFinderPage";
import { AccessMap } from "./components/AccessMap";
import type { AccessMedia, BeachAccess } from "./types/access";

const accesses = accessesData as BeachAccess[];
const media = mediaCandidates as AccessMedia[];

export default function App() {
  const rental = sampleRentals[0];
  const closest = findNearestAccess(
    {
      latitude: rental.latitude,
      longitude: rental.longitude,
      address: rental.address,
    },
    accesses,
  );
  const alternates = rankMajorAlternates(closest.access, accesses, 3);
  const exactMedia = media.filter((item) => item.accessId === closest.access.id);
  const mediaForClosest = exactMedia.length > 0 ? exactMedia : media.slice(0, 1);

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Treasure demo navigation">
        <a className="brand" href="#rental">
          Treasure Vacation Rentals
        </a>
        <div className="nav-links">
          <a href="#rental">Rental Detail</a>
          <a href="#finder">Beach Access Finder</a>
        </div>
      </nav>
      <section className="page-hero">
        <p className="eyebrow">Topsail Island, North Carolina</p>
        <h1>
          Find your rental. Find your <span>beach path.</span>
        </h1>
        <p>
          A Treasure-branded prototype for helping guests understand the closest
          access, bigger nearby alternatives, parking, amenities, and media.
        </p>
      </section>
      <BeachAccessModule
        rental={rental}
        closestAccess={closest.access}
        alternates={alternates.map((alternate) => alternate.access)}
        media={mediaForClosest}
      />
      <AccessMap rental={rental} closest={closest} alternates={alternates} />
      <AccessFinderPage />
    </main>
  );
}
```

- [ ] **Step 5: Append finder/map CSS**

Add to `src/styles.css`:

```css
.map-panel,
.finder-page {
  margin: 0;
  padding: clamp(28px, 5vw, 72px);
  background: var(--foam);
}

.map-panel h3,
.finder-copy h2 {
  margin: 0 0 16px;
  color: var(--teal-dark);
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(30px, 5vw, 52px);
}

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 12px;
}

.map-legend span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  color: var(--white);
  font-size: 12px;
  font-weight: 800;
}

.legend-home {
  background: var(--teal-dark);
}

.legend-closest {
  background: var(--parrot-teal-strong);
}

.legend-major {
  background: #d99a2b;
}

.island-map {
  min-height: 380px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.finder-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  max-width: 760px;
  margin-bottom: 18px;
}

.finder-form input {
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font: inherit;
}

.finder-form button {
  min-height: 48px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  color: var(--white);
  background: linear-gradient(135deg, var(--teal), var(--teal-dark));
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.error-message,
.finder-result {
  max-width: 760px;
  border-radius: 8px;
  background: var(--white);
}

.error-message {
  padding: 14px;
  color: #7c2d12;
}

.finder-result {
  padding: 18px;
  box-shadow: var(--shadow);
}

.finder-result h3 {
  margin: 0 0 8px;
  color: var(--teal-dark);
}

.finder-alternates {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.finder-alternates span {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--parrot-teal-soft);
  color: var(--teal-dark);
  font-size: 12px;
  font-weight: 800;
}

.major-directory {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 24px;
}

.major-directory article {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--white);
}

.major-directory b,
.major-directory span {
  display: block;
}

.major-directory b {
  color: var(--teal-dark);
}

.major-directory span {
  margin-top: 4px;
  color: var(--ink-soft);
}
```

- [ ] **Step 6: Run tests and build**

Run: `npm test && npm run build`

Expected: all tests pass and app builds.

- [ ] **Step 7: Commit map and finder**

```bash
git add src/App.tsx src/components/AccessMap.tsx src/components/AccessFinderPage.tsx src/lib/geocode.ts src/styles.css
git commit -m "feat: add beach access finder page"
```

## Task 8: Browser QA And Polish

**Files:**
- Modify as needed: `src/styles.css`, component files touched in Tasks 6-7.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev -- --port 5173`

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 2: Open the app in the in-app browser**

Use Browser plugin for `http://127.0.0.1:5173/`.

Expected: page loads with Treasure hero, rental-detail beach module, map panel, and finder page.

- [ ] **Step 3: Desktop visual check**

Viewport: 1440x1000.

Expected:

- No overlapping text.
- The nearest access answer is visible without hunting.
- Bigger nearby accesses are visually warmer/more prominent than quiet walkovers.
- Media panel labels prototype-only media visibly.
- Finder input and button fit on one line.

- [ ] **Step 4: Mobile visual check**

Viewport: 390x844.

Expected:

- Nav stacks cleanly.
- Hero text does not overflow.
- Rental module cards stack in a single column.
- Metric cards do not squeeze text outside their containers.
- Finder input and button remain usable.

- [ ] **Step 5: Address lookup smoke test**

In browser, enter `305 S Shore Dr, Surf City, NC 28445` and submit.

Expected:

- Either a nearest access result appears, or a clear Nominatim lookup error appears.
- If Nominatim fails, the UI does not crash.
- The directions link opens a Google Maps walking route in a new navigation context.

- [ ] **Step 6: Fix any visual or runtime defects found**

Make only targeted edits. If CSS is changed, rerun `npm run build`. If logic is changed, rerun `npm test`.

- [ ] **Step 7: Final verification**

Run:

```bash
npm test
npm run build
```

Expected: both commands pass.

- [ ] **Step 8: Commit QA polish**

```bash
git add src tests
git commit -m "fix: polish beach access prototype"
```

## Task 9: Final Documentation

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README**

`README.md`:

```md
# Treasure Beach Access Finder

Treasure Vacation Rentals prototype for showing Topsail Island guests the closest public beach access, bigger nearby alternatives, parking, amenities, accessibility, directions, and clearly labeled prototype media.

## Data Sources

- Canonical local access CSV: `/Users/isaac/Projects/topsail-scrape/data/beach_access/beach_access_master.csv`
- Generated app data: `src/data/accesses.json`
- Optional live context: Supabase `public.beach_walk_distances` in project `olxxtivntwntswipfelz`
- Official public context:
  - https://www.surfcitync.gov/2395/Public-Beach-Accesses
  - https://www.northtopsailbeachnc.gov/community/page/beach-access-parking
  - https://topsailbeachnc.gov/Visitors/Public-Accesses-and-Parking
  - https://coastalaccess.nc.gov

## Commands

```bash
npm install
npm run data:build
npm test
npm run build
npm run dev -- --port 5173
```

## Media Policy

Prototype media may include reference visuals, but every non-owned or non-official asset must be labeled as `prototype-only` or `needs-replacement` before public launch. Do not ship downloaded Google Street View screenshots or scraped copyrighted photos as owned assets. Use owned photography, official reusable imagery, generated placeholders, or properly attributed embeds/API surfaces for launch.

## Current Prototype Scope

- Rental-detail "Your Beach Path" module.
- Major nearby access highlights.
- Standalone address finder.
- Static generated data from the canonical CSV.
- No Supabase writes.
```

- [ ] **Step 2: Verify docs and final build**

Run:

```bash
npm test
npm run build
```

Expected: both commands pass.

- [ ] **Step 3: Commit docs**

```bash
git add README.md
git commit -m "docs: document beach access prototype"
```

## Self-Review Checklist

- Spec coverage: Tasks 2-4 cover data, scoring, lookup, and major access highlighting. Tasks 5-7 cover Treasure-branded rental detail, media labeling, and standalone finder. Task 8 covers browser/mobile verification. Task 9 covers handoff docs.
- No placeholders: The plan avoids forbidden placeholder language and gives exact file paths, commands, expected outputs, and code for each implementation step.
- Type consistency: Core types are defined in `src/types/access.ts`; lookup and component tasks consume those same `BeachAccess`, `AccessMatch`, `AccessMedia`, and `RentalSample` names.
