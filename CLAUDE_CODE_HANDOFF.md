# Claude Code Handoff: Topsail Beach Access Finder

This is the handoff for reviewing and improving the Treasure-branded Topsail Island beach access prototype in this repo:

`/Users/isaac/Documents/Beach Access Topsail`

The goal is not to make a generic map page. The product idea is: a Treasure Vacation Rentals guest types or picks a Topsail Island property address, sees the closest public beach access, sees a route on Google Maps, and can compare bigger nearby accesses with better parking or facilities. The page should feel polished, helpful, and a little magical, while staying accurate.

## What Isaac Wants From Claude

Find bugs, improve the code, and make the UI better. Be direct. If something is inaccurate, brittle, ugly, confusing, slow, or risky for launch, say so and fix it where reasonable.

Do not redesign away the core experience:

- Address-first finder.
- Nearest public access first.
- Easy alternate path to a larger/major access.
- Rich media for each access.
- Guest-friendly explanation, not GIS jargon.
- Strong mobile experience.
- SEO value for North Topsail Beach, Surf City, and Topsail Beach beach-access searches.

## Current State

This is a Vite + React + TypeScript prototype. It has a Google Maps path when a restricted browser key is configured, and a MapLibre/OpenStreetMap fallback.

Recently verified:

- `npm test` passed: 18 test files, 69 tests.
- `npm run build` passed.
- There is a known Vite warning about large chunks. That is real and worth investigating.
- Preview was being viewed at `http://127.0.0.1:4173/#finder`.

The worktree is intentionally dirty because this is active prototype work. Do not revert unrelated changes. Review the diff before making broad edits.

## Run Commands

```bash
npm install
npm test
npm run build
npm run dev -- --port 5173
npm run preview -- --port 4173
```

Data rebuild commands:

```bash
npm run data:build
npm run data:build:properties
npm run data:build:street-view
```

Aerial video workflow:

```bash
node scripts/render-aerial-videos.mjs --dry-run --limit=10
node scripts/render-aerial-videos.mjs --limit=10
```

Do not print secrets. `.env.local` exists locally but should not be copied into chat, committed, or documented with values. Use `.env.example` for variable names.

## Environment

Required public browser env vars:

```bash
VITE_GOOGLE_MAPS_API_KEY=
VITE_GOOGLE_MAPS_MAP_ID=
```

Google APIs currently relevant:

- Maps JavaScript API.
- Geocoding API.
- Routes API.
- Aerial View API.
- Street View Static API if using still image fallback.

The Google key must stay browser-referrer restricted before this goes public.

## Data And Media Assets

Core generated data:

- `src/data/accesses.json` - 112 mapped public beach/ocean access entries across North Topsail Beach, Surf City, and Topsail Beach.
- `src/data/propertyAddresses.json` - 7,829 main-island property address autocomplete records from Onslow and Pender GIS.
- `src/data/mediaCandidates.json` - 3 prototype/reference media records. These are not a complete launch-safe media set.
- `src/data/aerialViewVideos.json` - 102 Google Aerial View registry records with video IDs/status metadata. This file stores IDs and states, not short-lived video URLs.
- `src/data/streetViewStills.json` - 70 Google Street View panorama/still metadata records.
- `src/data/sampleRentals.ts` - sample properties used by the finder.

Generated/audit artifacts:

- `artifacts/aerial-view/` - dry-run and render audit JSON files from the Google Aerial View workflow.
- `artifacts/*.png` - prior desktop/mobile screenshots used during QA.
- `docs/superpowers/plans/2026-06-10-treasure-beach-access-finder.md` - earlier implementation plan.
- `docs/superpowers/specs/2026-06-10-treasure-beach-access-finder-design.md` - earlier design spec.

There is no `public/` directory right now. Most UI media is loaded dynamically from Google or from generated JSON metadata.

## Important Source Files

App shell and page:

- `src/App.tsx`
- `src/main.tsx`
- `src/styles.css`
- `index.html`

Main feature components:

- `src/components/AccessFinderPage.tsx` - address finder, autocomplete, selected property, closest match, alternates, media.
- `src/components/AccessMapSection.tsx` - chooses Google map vs fallback map.
- `src/components/GoogleAccessMap.tsx` - Google map markers, controls, camera behavior, route drawing.
- `src/components/AccessMap.tsx` - MapLibre/OpenStreetMap fallback.
- `src/components/MapViewControls.tsx` - clickable Property / Closest / Major access / Other access controls.
- `src/components/AccessFeatureIcons.tsx` - feature icons and icon key.
- `src/components/AccessMediaGallery.tsx` - Aerial View video, prototype media, and Street View still fallback.
- `src/components/AccessFacts.tsx`
- `src/components/BeachAccessModule.tsx`

Core logic:

- `src/lib/accessLookup.ts` - distance calculations, route-aware nearest access, alternates.
- `src/lib/googleWalkingRoute.ts` - Google Routes/Directions route drawing.
- `src/lib/mapAccessMarkers.ts` - marker grouping and camera fit behavior.
- `src/lib/accessFeatures.ts` - feature/icon mapping.
- `src/lib/accessScoring.ts` - usefulness/major-access scoring.
- `src/lib/propertySearch.ts` - address autocomplete search.
- `src/lib/geocode.ts` - address geocoding fallback.
- `src/lib/mapConfig.ts` - Google/fallback map configuration.
- `src/lib/aerialView.ts`
- `src/lib/streetView.ts`

Scripts:

- `scripts/build-access-data.mjs`
- `scripts/build-property-address-data.mjs`
- `scripts/build-street-view-stills.mjs`
- `scripts/aerial-view-workflow.mjs`
- `scripts/render-aerial-videos.mjs`
- `scripts/street-view-stills-workflow.mjs`

Tests:

- `tests/AccessFinderPage.test.tsx`
- `tests/AccessMediaGallery.test.tsx`
- `tests/AccessFeatureIcons.test.tsx`
- `tests/BeachAccessModule.test.tsx`
- `tests/App.test.tsx`
- `tests/accessLookup.test.ts`
- `tests/accessScoring.test.ts`
- `tests/accessFeatures.test.ts`
- `tests/googleWalkingRoute.test.ts`
- `tests/mapAccessMarkers.test.ts`
- `tests/mapConfig.test.ts`
- `tests/propertySearch.test.ts`
- `tests/geocode.test.ts`
- `tests/aerialView.test.ts`
- `tests/streetView.test.ts`
- workflow/script tests under `tests/*Workflow.test.mjs` and `tests/buildAccessData.test.mjs`.

## Behaviors To Preserve

- The initial page should not default to `4444 Island Drive`.
- Address suggestions should narrow quickly while typing.
- Selecting an address should immediately run the lookup.
- The Google map defaults to `Closest`.
- Clicking `Major access` should redraw the route to the first larger nearby access.
- Clicking `Property` should refocus on the property.
- Clicking `Other access` should zoom out to browse the island.
- When Google cannot draw a walking route, do not draw fake straight lines across houses or lots.
- Major accesses should be prominent. Smaller accesses should still be discoverable.
- Icons should be used on cards and map markers, with the on-page icon key visible above the map.

## Bugs And Risks To Investigate First

1. Nearest-access accuracy.

   `findNearestAccessByWalkingRoute` first sorts by straight-line distance, then asks Google Routes for only the closest 8 straight-line candidates. That can still choose a bad result in weird canal, inlet, bridge, cul-de-sac, or dune-layout cases. If the user reports a wrong access, this is the first suspect. Consider raising the candidate limit, making it adaptive, caching route results, or explicitly testing known tricky addresses.

2. Distance label vs route reality.

   When Google route distance works, the card uses route distance. When Google fails, it falls back to straight-line distance. That fallback can look confidently wrong. If route-aware lookup fails, the UI should probably label it as estimated differently or prioritize a safer fallback.

3. Google route line availability.

   `googleWalkingRoute.ts` correctly refuses to draw fake geometry if Google cannot route. Good. But the UI should make unavailable-route cases clear without feeling broken.

4. Map camera and marker clutter.

   The latest route view was tightened so selected-property route views fit mostly the property plus selected access. Keep testing this on desktop and mobile. The map gets cluttered fast if it includes too many markers or zooms out too far.

5. Mobile layout.

   This page needs to feel good on a phone. Check the finder input, suggestions dropdown, map controls, icon key, media card, and result cards at phone widths.

6. Bundle/data size.

   `propertyAddresses.json` is about 1.9 MB, and map/media data adds more. The current build passes but warns about large chunks. Consider lazy loading the address index, virtualizing suggestions if needed, or splitting Google map/media code.

7. Media legality and launch readiness.

   This prototype can use Google Aerial View and Street View through Google APIs with attribution. Do not convert those into owned assets. The old prototype/reference visuals are not a launch-safe full media strategy. The launch path should be Google API surfaces, owned photos/video, official reusable media, or explicitly licensed assets.

8. Street View still quality.

   The requirement is "best possible side of access." The current still metadata may not always face the actual walkover or access sign. Review heading/pitch/nearest panorama choices.

9. Accessibility.

   The autocomplete, map controls, and icon key have some ARIA work already. Do not assume it is finished. Keyboard-test the combobox and controls.

10. SEO copy.

   The page needs useful, non-spammy text targeting "North Topsail Beach beach access," "Surf City beach access," "Topsail Beach public access," parking, restrooms, showers, ADA, beach mats, ORV access, and closest beach access from rental addresses.

## Specific QA Addresses And Flows

Use these as smoke tests:

- `305 S Shore Dr, Surf City, NC`
- `2950 Island Dr, North Topsail Beach, NC`
- `915 N Anderson Blvd, Topsail Beach, NC`
- `34 Oak Ct, Surf City, NC` - user questioned whether the selected closest access was right.
- `44 North Ridge, Surf City, NC` - route line previously unavailable.
- `200 Bayview Dr, North Topsail Beach, NC` - previously showed a line that crossed lots before route drawing was changed.
- `235 Port Dr, North Topsail Beach, NC`

For each:

- Pick the suggestion, do not just free-type and submit.
- Confirm the selected property marker is correct.
- Confirm closest access looks plausible.
- Confirm `Closest` route is tight and legible.
- Click `Major access` and confirm the route target changes.
- Click `Property` and confirm focus returns to the property.
- Click `Other access` and confirm island browsing works.
- Check console warnings/errors.

## Review Strategy

Start with:

```bash
git status --short
npm test
npm run build
```

Then run the app and use the browser. Do not rely only on unit tests for this project. The hard bugs are visual, route-specific, and data-specific.

When changing behavior, add focused tests. Best first additions would be around:

- Route-aware candidate selection in `accessLookup.ts`.
- Map view state/caption/control behavior in `GoogleAccessMap.tsx`.
- Feature/icon rendering at compact widths.
- Media fallback priority in `AccessMediaGallery.tsx`.
- Property autocomplete keyboard behavior.

## Do Not Miss This

The biggest product risk is not whether the page looks cool. It already can. The risk is a guest trusting it and being sent to the wrong access, or seeing a fake-looking route over private lots. Accuracy beats decoration here.

The second biggest risk is media. Prototype media is fine for internal mockups. Public launch needs either Google-served media with proper attribution, owned media, official reusable media, or explicitly licensed media.

The third risk is shipping a huge static address index and map stack without performance work. It may be acceptable for a prototype, but Claude should check the actual bundle impact before declaring it good enough.
