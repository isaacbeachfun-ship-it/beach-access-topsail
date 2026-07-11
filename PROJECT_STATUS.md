# Topsail Beach Access — Project Status

Updated: 2026-07-11

## Launch Status

The public beach-access finder is live at [https://topsailpricing.com/](https://topsailpricing.com/).
`www.topsailpricing.com` serves the same page. Visitors do not need an account,
password, or invitation.

The page is branded **Topsail Beach Access** and identifies itself as a free
tool from Carolina Coast Pricing. It is a standalone Vercel project and does
not replace or modify the Carolina Coast Pricing application.

## Production Routing

| Item | Current value |
| --- | --- |
| Apex host | `https://topsailpricing.com/` |
| `www` host | `https://www.topsailpricing.com/` |
| Vercel project | `topsail-beach-access` |
| Production commit | `49a5ecb` |
| Production deployment | `dpl_3WLiJoNDJ26Yscjy98yTEgMndiDJ` |
| Production URL | `https://topsail-beach-access-3dm13dj86-isaacbeachfun-9768s-projects.vercel.app` |
| Public access | No password or authentication |
| Carolina Coast Pricing | Unchanged on its separate project |
| Rollback deployment | `https://topsail-beach-access-o9f95qymn-isaacbeachfun-9768s-projects.vercel.app` |

## Map Behavior

The production app uses Google Maps through the browser-restricted key named
`Treasure Beach Access Map` at
`projects/912886988217/locations/global/keys/4739fa58-1e51-4b95-a872-e91050d247de`.
Its existing local and GitHub Pages referrers remain intact, and the key now
also authorizes the apex and `www` hosts for Topsail Pricing and Treasure
Rentals. The API targets remain restricted to Aerial View, Geocoding, Maps
JavaScript, Routes, and Street View.

If Google is unavailable, the app retains the MapLibre/OpenStreetMap fallback.

## Treasure WordPress Integration

- Live page: `https://treasurerentals.com/public-beach-access/`
- WordPress page ID: `983`
- Finder source: `https://topsailpricing.com/?embed=treasure`
- The finder and Treasure wrapper both state that the tool covers public beach
  access only and does not grant access through private property or private,
  HOA, neighborhood, or property-owner paths.
- Before backup:
  `/Users/isaac/Documents/Beach Access Topsail/backups/wordpress/2026-07-11-page-983-public-beach-access-before-quality-repair.json`
- After read-back:
  `/Users/isaac/Documents/Beach Access Topsail/backups/wordpress/2026-07-11-page-983-public-beach-access-after-quality-repair.json`

## Verification

- `npm test`: 23 test files, 116 tests passing.
- `npm run build`: passing Vite production build.
- `npm audit --omit=dev`: zero known runtime vulnerabilities.
- Fresh direct-embed browser check: Google map present, public-access notice
  present, and zero console errors or warnings.
- Fresh Treasure browser check: Google map and both public-access notices
  present; no `RefererNotAllowedMapError`, authentication-related Routes/Aerial
  `403`, or cross-origin resize warning.
- Port Drive's Aerial View lookup can return `404` when Google has no video for
  that exact street-end address; the page handles this as unavailable media,
  not an authentication failure.
- Mobile layout repair: the fallback map is bounded to 340 pixels, all rendered
  MapLibre markers remain absolutely positioned, and the page has no document-
  level horizontal overflow at 390 pixels wide.
- All 24 known Oyster Lane property addresses resolve to the neighborhood
  beach access at the end of Oyster Lane, with directions ending there rather
  than continuing east on New River Inlet Road.
- All 29 known Port Drive property addresses resolve to the neighborhood beach
  access at the ocean end of Port Drive rather than Beach Access #46.
- `https://topsailpricing.com/?embed=treasure` serves a focused, responsive
  finder for the Treasure WordPress page without duplicate app navigation,
  promotional content, or document-level horizontal overflow.
- Opening the embed URL directly no longer sends resize messages to a nonexistent
  Treasure parent window.
- CarolinaCoastPricing.com remained on its existing deployment and continued to
  serve the pricing site.

## Rollback

If a production regression appears, point both TopsailPricing hosts back to the
rollback deployment above, verify the public redirect/routing behavior, and
leave CarolinaCoastPricing.com untouched.
