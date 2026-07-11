# Topsail Beach Access

Public Topsail Island beach-access finder from Carolina Coast Pricing. Guests can
search a Topsail stay address, find the closest public access, compare larger
nearby options, and open walking directions. The page is intentionally
password-free and is served directly from TopsailPricing.com.

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

Restrict the API key before using it in production:

- Application restriction: HTTP referrers
- Referrers: `http://localhost/*`, `http://127.0.0.1/*`,
  `https://topsailpricing.com/*`, and `https://www.topsailpricing.com/*`
- API restriction for this deployment: Maps JavaScript API, Geocoding API,
  Aerial View API, and Routes API

If `VITE_GOOGLE_MAPS_API_KEY` is missing or rejected, the app falls back to the
MapLibre/OpenStreetMap panel. This fallback is also used when Google rejects a
browser referrer or otherwise reports a Maps authentication failure, so the
finder remains usable without a Google map.

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

Production is live at [https://topsailpricing.com/](https://topsailpricing.com/).
The `www.topsailpricing.com` host serves the same public finder. Both hosts are
attached to the dedicated Vercel project `topsail-beach-access`; there is no
login or password wall.

The current production deployment is `dpl_4FAM6eZoNJjhFmgGUJ2CbVhBssQ9`.
CarolinaCoastPricing.com remains on its separate pricing application and was
not changed. The previous deployment remains the rollback target:

`https://topsail-pricing-p92vzptn6-isaacbeachfun-9768s-projects.vercel.app`

The repository's GitHub Pages deployment is retained only as a historical
fallback. The Vite production build uses the `/beach-access-topsail/` base path
when `GITHUB_PAGES=true`. Regenerate `src/data/accesses.json` locally before
committing source CSV changes.

## Media Policy

Every non-owned or non-official reference asset remains labeled as
`prototype-only` or `needs-replacement`. Do not ship downloaded Google Street
View screenshots or scraped copyrighted photos as owned assets. Use owned
photography, official reusable imagery, generated placeholders, or properly
attributed API surfaces for the public experience.

## Public Scope

- Address-first public beach-access finder.
- Closest and major nearby access highlights.
- Google Maps when configured, with a MapLibre/OpenStreetMap fallback for
  missing or rejected Google authentication.
- Walking directions, parking, facilities, accessibility, and route context.
- An Oyster Lane address override that routes North Topsail Beach properties to
  the neighborhood access at the street end instead of sending them east on
  New River Inlet Road.
- A Port Drive address override that routes all known street properties to the
  neighborhood easement at the ocean end of Port Drive.
- A focused Treasure embed at `/?embed=treasure` that keeps the finder and map
  while omitting the standalone navigation, hero, directory, and SEO guide.
- Static generated data from the canonical CSV.
- No Supabase writes.

## Launch Verification

The public launch was verified with 22 test files and 111 tests, plus a passing
Vite production build. Desktop and mobile checks covered the public shell,
address lookup, map fallback, and the three Topsail towns.
