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

## Shareable Deployment

Default public prototype URL after deployment:

https://isaacbeachfun-ship-it.github.io/beach-access-topsail/

The app is deployed as a static GitHub Pages site from the `gh-pages` branch because the available GitHub credential does not have `workflow` scope for Actions-based deployment. The Vite production build uses the `/beach-access-topsail/` base path when `GITHUB_PAGES=true`. The deployed branch is built from committed `src/data/accesses.json`; regenerate that file locally before committing when the source CSV changes.

## Media Policy

Prototype media may include reference visuals, but every non-owned or non-official asset must be labeled as `prototype-only` or `needs-replacement` before public launch. Do not ship downloaded Google Street View screenshots or scraped copyrighted photos as owned assets. Use owned photography, official reusable imagery, generated placeholders, or properly attributed embeds/API surfaces for launch.

## Current Prototype Scope

- Rental-detail "Your Beach Path" module.
- Major nearby access highlights.
- MapLibre/OpenStreetMap island view.
- Standalone address finder with sample-rental fallback and Nominatim lookup.
- Static generated data from the canonical CSV.
- No Supabase writes.

## Public URL

GitHub Pages target:

https://isaacbeachfun-ship-it.github.io/beach-access-topsail/

If the URL is not live yet, rebuild with `GITHUB_PAGES=true npm run build`, publish `dist/` to the `gh-pages` branch, and confirm the repository Pages source is set to `gh-pages` `/`.
