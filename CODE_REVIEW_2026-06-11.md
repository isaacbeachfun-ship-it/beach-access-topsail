# Code Review & Fixes — Topsail Beach Access Finder

**Date:** June 11, 2026
**Reviewed by:** Claude Code (on Isaac's behalf), working from `CLAUDE_CODE_HANDOFF.md`
**Baseline:** 18 test files / 69 tests passing, `npm run build` passing with a large-chunk warning
**After:** 18 test files / 72 tests passing, build passing, main JS chunk reduced from ~2 MB to 497 KB (105 KB gzip)

This document summarizes what was reviewed, what was changed and why, how it was verified, and what still needs attention before launch. It is written for the original author of the app.

---

## Review approach

1. Ran the prescribed baseline (`git status`, `npm test`, `npm run build`).
2. Three parallel deep-read reviews: core lookup/geocode logic, the Google/MapLibre map layer, and the page/UI/SEO surface.
3. Verified each candidate finding against the source before acting — several reported findings were false positives and were discarded (e.g., Earth-radius precision, NaN coordinate guards, address-sort tie-breaking; all either negligible or already handled).
4. Fixed the issues below, added tests, then verified in a real browser (dev server + scripted interaction) using the handoff's QA addresses at desktop and mobile (375px) widths. No console errors or warnings.

---

## Changes made

### 1. Nearest-access search now widens past the top-8 candidates when routes detour
**File:** `src/lib/accessLookup.ts` (`findNearestAccessByWalkingRoute`)

**Problem (handoff risk #1):** The old code sorted all accesses by straight-line distance and asked Google Routes for only the closest 8. On a barrier island with canals, inlets, and cul-de-sacs, the truly nearest-by-foot access can sit outside that top-8 window.

**Fix:** Candidates are now routed in batches (default 8) with a hard cap of 24, using a pruning invariant: *a walking route can never be shorter than the straight line between the same two points.* After each batch, any remaining candidate whose straight-line distance already exceeds the best measured route distance is discarded. In the normal case the first batch settles it and the cost is identical to before (~8 Routes calls). In detour-heavy cases the search automatically widens until no remaining candidate could possibly win.

**New tests:** widening behavior in a canal-detour scenario, early termination (verifies no extra API calls are made when the first result is unbeatable), and the no-API-key fallback path.

### 2. Distance labels are now honest about route-measured vs straight-line
**Files:** `src/types/access.ts`, `src/lib/accessLookup.ts`, `src/components/AccessFinderPage.tsx`

**Problem (handoff risk #2):** `AccessMatch.isExactSupabaseWalkDistance` was vestigial — misnamed (no Supabase exists in this project), never set to `true`, never read by the UI. When Google routing failed, the card silently showed a straight-line distance labeled the same way as a measured one. That is the exact "confidently wrong" failure mode the handoff warns about.

**Fix:** The field is now `isRouteDistance`, set to `true` only when the distance came from the Google Routes API. The result card shows **"walking distance"** for measured routes and **"straight-line estimate"** for fallbacks, so a guest (and you, during QA) can always tell which one they're looking at.

### 3. The 1.9 MB address index no longer blocks first paint
**Files:** `src/lib/propertyAddressIndex.ts` (new), `src/components/AccessFinderPage.tsx`, `src/lib/geocode.ts`

**Problem (handoff risk #6):** `propertyAddresses.json` (7,829 records, ~1.9 MB) was statically imported by both the finder page and the geocoder, landing in the main bundle and triggering the Vite chunk-size warning.

**Fix:** A small shared loader (`loadPropertyAddresses()`) dynamically imports the JSON once and caches the promise. The finder loads it in the background after mount; the geocoder awaits it on demand. The "Search 7,829 addresses" note shows a loading state until the index arrives. Result: main chunk 497 KB (105 KB gzip), address index in its own lazy chunk (120 KB gzip). MapLibre was already dynamically imported, so it needed no change.

### 4. Nominatim geocoding is now bounded to Topsail
**File:** `src/lib/geocode.ts`

**Problem:** The fallback geocoder sent unconstrained queries. A bare street name ("Ocean View Drive") could match a same-named street in another state; the after-the-fact bounds check caught it, but the user got a dead-end error instead of a local match.

**Fix:** Queries now include `viewbox` (the existing `TOPSAIL_BOUNDS`) plus `bounded=1`, so Nominatim only returns results inside the island area. The post-hoc bounds check remains as a second guard.

### 5. Map effect hygiene in `GoogleAccessMap`
**File:** `src/components/GoogleAccessMap.tsx`

- If the effect is torn down while a route fetch is in flight (user switches address/view quickly), the late-arriving route overlays are now removed immediately instead of dangling on a discarded map instance.
- The `InfoWindow` is closed during effect cleanup.

### 6. Small UX / accessibility fixes
**Files:** `src/components/AccessFinderPage.tsx`, `src/styles.css`

- The suggestions dropdown had `z-index: 5` while the sticky top nav has `z-index: 10`, so the dropdown could be clipped under the nav when scrolled. Now `z-index: 30`.
- Added a `role="status"` line ("Measuring walking routes to nearby public accesses...") while a lookup is in flight, so the wait is visible and announced to screen readers — previously the only signal was the submit button's label change.

---

## Browser verification performed

- `34 Oak Ct, Surf City` (the address whose closest-access choice was previously questioned): suggestion narrows correctly, returns Beach Access #32 at 2000 S Shore Dr, **1,814 ft labeled "walking distance"** (route-measured), tight route camera, route polyline drawn, no console errors.
- `44 North Ridge, Surf City` (previously route-unavailable): now resolves with a route-measured 1,125 ft to 1602 South Shore Drive; route note absent because routing succeeded.
- Mobile (375×812): result card, metric row with the new labels, suggestion list, and media gallery all render cleanly.

---

## Known issues NOT fixed (ranked)

1. **Map teardown churn.** `GoogleAccessMap` recreates the entire Google Map instance on every view-control click and prop change (the main effect depends on `activeMapView`, `closest`, etc.). Tiles refetch and the map flashes on each switch. The right fix is persisting the map instance across renders and updating markers/camera imperatively — but that touches the recently hand-tuned camera behavior, so it was deliberately left for a dedicated pass with visual QA.
2. **SEO launch items.** No `og:image`, no `twitter:card`, no canonical URL, no schema.org structured data. All need the final production domain and a real 1200×630 share image, so they're launch-checklist work rather than code fixes. The on-page town-by-town SEO copy is already good.
3. **Media launch-readiness** (handoff risk #7) and **Street View heading quality** (risk #8) are unchanged — data/licensing work, not bugs.
4. **Minor:** when switching to the "Other access" view, accesses flagged as closest/alternates are excluded from the background marker groups (`src/lib/mapAccessMarkers.ts`, the `highlightedAccessIds` filter). They're still rendered as their own highlighted markers, so the effect is cosmetic, but worth knowing. Relatedly, `getCameraFitAccesses()` always returns `[]` for the route view — if that's permanent, the call site and function could be removed.
5. **Minor:** the route-unavailable note (`.map-route-note`) is plain text below the heading; on mobile it's easy to miss. Consider an alert-styled banner.

---

## Verification commands

```bash
npm test        # 18 files, 72 tests passing
npm run build   # passes; main chunk 497 KB, address index lazy-chunked
```
