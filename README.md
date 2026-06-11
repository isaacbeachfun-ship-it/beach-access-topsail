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

## Google Maps Setup

The app keeps the GIS address autocomplete as the source of truth. Google Maps is
used only for the map/media layer when a browser-safe key is configured.

Create `.env.local` from `.env.example` and set:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_restricted_browser_key
VITE_GOOGLE_MAPS_MAP_ID=your_javascript_map_id
```

Enable these Google Cloud APIs:

- Maps JavaScript API
- Geocoding API
- Aerial View API if dynamic Google aerial media is enabled
- Routes API for walking-route lines and route-aware nearest-access ranking
- Places API only if Google Places fallback is added later
- Street View Static API only if Street View thumbnails are added later

Restrict the API key before putting it on GitHub Pages:

- Application restriction: HTTP referrers
- Referrers: `http://localhost/*`, `http://127.0.0.1/*`,
  `https://isaacbeachfun-ship-it.github.io/*`, and the future Treasure domain
- API restriction for this prototype: Maps JavaScript API, Geocoding API,
  Aerial View API, and Routes API

If `VITE_GOOGLE_MAPS_API_KEY` is missing or rejected, the app falls back to the
existing MapLibre/OpenStreetMap panel. If `VITE_GOOGLE_MAPS_MAP_ID` is missing,
the prototype uses Google's `DEMO_MAP_ID`, but launch should use a real
JavaScript map ID from the same Cloud project.

The Aerial View card only calls `lookupVideo` for the currently displayed
access. It does not call `renderVideo`, download videos, store short-lived
Google media URLs, or prefetch all access points. If Google has no rendered
aerial video for an access, or if Aerial View API is disabled, the gallery falls
back to the existing reference media or placeholder.

To queue Google Aerial View renders for the most useful public accesses, run:

```bash
node scripts/render-aerial-videos.mjs --dry-run --limit=10
node scripts/render-aerial-videos.mjs --limit=10
```

The script ranks ocean accesses by usefulness/parking/facilities, calls
`renderVideo` only for missing records, writes an audit artifact under
`artifacts/aerial-view/`, and stores only `videoId` plus status metadata in
`src/data/aerialViewVideos.json`. Do not store returned video or thumbnail URLs;
they are short-lived Google media URLs and should be requested at display time.

## Shareable Deployment

Default public prototype URL after deployment:

https://isaacbeachfun-ship-it.github.io/beach-access-topsail/

The app is deployed as a static GitHub Pages site from the `gh-pages` branch because the available GitHub credential does not have `workflow` scope for Actions-based deployment. The Vite production build uses the `/beach-access-topsail/` base path when `GITHUB_PAGES=true`. The deployed branch is built from committed `src/data/accesses.json`; regenerate that file locally before committing when the source CSV changes.

## Media Policy

Prototype media may include reference visuals, but every non-owned or non-official asset must be labeled as `prototype-only` or `needs-replacement` before public launch. Do not ship downloaded Google Street View screenshots or scraped copyrighted photos as owned assets. Use owned photography, official reusable imagery, generated placeholders, or properly attributed embeds/API surfaces for launch.

## Current Prototype Scope

- Rental-detail "Your Beach Path" module.
- Major nearby access highlights.
- Google Maps island view when configured, with MapLibre/OpenStreetMap fallback.
- Standalone address finder with sample-rental fallback and Nominatim lookup.
- Static generated data from the canonical CSV.
- No Supabase writes.

## Public URL

GitHub Pages target:

https://isaacbeachfun-ship-it.github.io/beach-access-topsail/

If the URL is not live yet, rebuild with `GITHUB_PAGES=true npm run build`, publish `dist/` to the `gh-pages` branch, and confirm the repository Pages source is set to `gh-pages` `/`.
