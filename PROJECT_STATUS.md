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
| Production deployment | `dpl_FkJLG1wQh8mxQc3t7tUfjMuAVHVV` |
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

- `npm test`: 22 test files, 98 tests passing.
- `npm run build`: passing Vite production build.
- Public desktop and mobile checks: shell branding, no-password access, address
  lookup, map fallback, and representative addresses across North Topsail
  Beach, Surf City, and Topsail Beach.
- CarolinaCoastPricing.com remained on its existing deployment and continued to
  serve the pricing site.

## Rollback

If a production regression appears, point both TopsailPricing hosts back to the
rollback deployment above, verify the public redirect/routing behavior, and
leave CarolinaCoastPricing.com untouched.
