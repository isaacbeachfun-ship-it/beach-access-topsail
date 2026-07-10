# TopsailPricing.com Beach Access Launch Design

**Date:** 2026-07-10

## Goal

Make the existing Topsail beach-access finder the public homepage at
`https://topsailpricing.com`, with no login or password. Stop redirecting that
domain to Carolina Coast Pricing. Keep `https://carolinacoastpricing.com` and
its private pricing application operational and independently deployable.

## Public Experience

- `https://topsailpricing.com/` opens the beach-access finder directly.
- `https://www.topsailpricing.com/` resolves to the same public experience.
- The primary identity is **Topsail Beach Access**.
- The supporting attribution is **A free tool from Carolina Coast Pricing**.
- A visible link takes visitors to `https://carolinacoastpricing.com`.
- Treasure Vacation Rentals branding and prototype language are removed.
- The existing address-first experience remains: search for a Topsail Island
  address, see the closest public beach access, compare larger nearby accesses,
  review parking and facilities, and use the map and walking-route views.

## Architecture

Deploy the beach-access Vite application as its own Vercel project. Attach
`topsailpricing.com` and `www.topsailpricing.com` to that project after removing
them from the older Vercel project that currently redirects to
`carolinacoastpricing.com`.

Do not deploy the beach-access app inside the Carolina Coast Pricing project and
do not use host-dependent routing in that project. The two products must have
separate deployment boundaries so a beach-access release cannot replace or
roll back the private pricing application.

The current GitHub Pages deployment may remain temporarily as a fallback, but
TopsailPricing.com becomes the canonical public URL.

## Application Changes

1. Replace Treasure-specific navigation, headings, copy, accessibility labels,
   and example-property language with Topsail Beach Access and Carolina Coast
   Pricing language.
2. Remove wording that calls the page a prototype or frames it as a Treasure
   rental-listing demonstration.
3. Keep the finder, map controls, access facts, access media, address index,
   access dataset, and route-aware selection behavior.
4. Add a clear Carolina Coast Pricing link without turning the finder into a
   pricing-sales page.
5. Update page title, description, canonical URL, Open Graph metadata, and
   favicon/brand assets for the new public identity.
6. Configure Vite's production base so all JavaScript, CSS, data, map, and media
   assets load correctly from the domain root.

## Data and Privacy Boundaries

The public tool uses only its bundled beach-access, address, parking, map, and
media metadata plus browser-side map services already used by the finder. It
must not read private Carolina Coast Pricing routes, Supabase pricing tables,
owner data, or authenticated sessions.

No login or password is required. The homepage and all assets needed for the
finder must work in a fresh logged-out browser session.

Any browser-visible Google Maps key must remain restricted by allowed HTTP
referrers. Add `https://topsailpricing.com/*` and
`https://www.topsailpricing.com/*` before relying on Google Maps in production.
Do not expose unrestricted or server-only credentials.

## Failure Behavior

- If Google Maps is unavailable or rejects its key, retain the existing
  MapLibre/OpenStreetMap fallback.
- If Google cannot provide a walking route, do not draw a fake straight line
  across buildings or lots; explain that a walking route is unavailable.
- If dynamic media is unavailable, retain the existing media fallback rather
  than leaving a broken player or image.
- Domain migration must not change DNS mail records for TopsailPricing.com.

## Deployment

1. Verify the beach-access source and preserve unrelated dirty worktree changes.
2. Build and test the rebranded app locally.
3. Create or link a dedicated Vercel project for the beach-access repository.
4. Deploy and verify the Vercel preview URL before moving either custom domain.
5. Detach `topsailpricing.com` and `www.topsailpricing.com` from the older
   redirecting Vercel project.
6. Attach both domains to the dedicated beach-access project without changing
   unrelated Cloudflare DNS or email records.
7. Verify the public site after domain reassignment.

## Verification

- Run the beach-access unit test suite and production build.
- Confirm `/` returns `200` at both TopsailPricing.com hostnames without
  redirecting to CarolinaCoastPricing.com or a login page.
- Confirm the page title, visible branding, Carolina Coast Pricing link, and
  absence of Treasure/prototype copy.
- Test representative addresses in North Topsail Beach, Surf City, and Topsail
  Beach.
- Verify closest-access and major-access selection, map controls, route fallback,
  parking/facility details, and media fallback.
- Test desktop and mobile layouts in a logged-out browser.
- Confirm `https://carolinacoastpricing.com`, its login page, and a protected
  route remain unchanged after the domain move.
- Confirm no secret values were committed or printed.

## Non-Goals

- Rewriting the finder as a native Next.js application.
- Moving private pricing features onto TopsailPricing.com.
- Changing Supabase data or authentication.
- Changing Cloudflare mail records, Google Workspace configuration, or the
  Carolina Coast Pricing deployment.
- Redesigning the finder beyond the branding and launch-readiness changes needed
  for this public release.
