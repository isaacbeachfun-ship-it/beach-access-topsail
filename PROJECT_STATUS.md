# Topsail Beach Access — Project Status

Updated: 2026-07-10

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
| Production deployment | `dpl_4FAM6eZoNJjhFmgGUJ2CbVhBssQ9` |
| Public access | No password or authentication |
| Carolina Coast Pricing | Unchanged on its separate project |
| Rollback deployment | `https://topsail-pricing-p92vzptn6-isaacbeachfun-9768s-projects.vercel.app` |

## Map Behavior

The app uses Google Maps when a browser-restricted key is available. If the key
is missing, the browser referrer is not authorized, or Google reports a Maps
authentication failure, the UI switches to the MapLibre/OpenStreetMap fallback.
That keeps the public finder usable while Google Cloud key restrictions are
being maintained.

## Verification

- `npm test`: 22 test files, 111 tests passing.
- `npm run build`: passing Vite production build.
- `npm audit --omit=dev`: zero known runtime vulnerabilities.
- Public desktop and mobile checks: shell branding, no-password access, address
  lookup, map fallback, and representative addresses across North Topsail
  Beach, Surf City, and Topsail Beach.
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
- CarolinaCoastPricing.com remained on its existing deployment and continued to
  serve the pricing site.

## Rollback

If a production regression appears, point both TopsailPricing hosts back to the
rollback deployment above, verify the public redirect/routing behavior, and
leave CarolinaCoastPricing.com untouched.
