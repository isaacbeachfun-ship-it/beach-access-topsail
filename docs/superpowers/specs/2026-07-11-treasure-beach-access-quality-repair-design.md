# Treasure Beach Access Quality Repair Design

## Goal

Make the public beach-access finder reliable on both `topsailpricing.com` and its embedded Treasure Rentals page, and clearly state that the finder covers public beach access only.

## Confirmed production findings

- The Treasure page and embedded finder load on desktop and mobile.
- The deployed client uses the Google Cloud key named `Treasure Beach Access Map` in project `hermes-project-497421`.
- That deployed key currently allows only the prior GitHub Pages host and local development hosts, causing `RefererNotAllowedMapError` on `topsailpricing.com`.
- The same restriction causes Google Routes and Aerial View requests to return `403` responses.
- `208 Oyster` returns Oyster Lane Beach Access at the end of Oyster Lane.
- Repeating Find Access keeps the result rendered.
- `218 Port Dr` returns Port Drive Beach Access at the end of Port Drive.
- Oyster Lane's reviewed Google Street View is present.
- The Treasure page has no horizontal overflow at a 390-pixel viewport.

## Approved changes

### Google Maps authentication

Preserve the deployed key's existing referrers and API targets. Add only these production referrers:

- `https://topsailpricing.com/*`
- `https://www.topsailpricing.com/*`
- `https://treasurerentals.com/*`
- `https://www.treasurerentals.com/*`

Do not loosen the key to unrestricted browser use.

### Finder notice

Add a compact notice beneath the finder introduction, before the address controls:

> **Public access only:** This finder includes public beach access points only. It does not identify or authorize private, HOA, neighborhood, or property-owner access. Always follow posted signs and local rules.

The notice must use the existing visual system and remain readable on desktop and mobile without increasing horizontal overflow.

### Treasure wrapper disclaimer

Update the existing disclaimer beneath the embedded finder to reinforce the same limitation. The wrapper copy must say that the tool shows public beach accesses only, does not grant access through private property, and that posted signage and current town or county rules control.

## Technical boundaries

- Keep the current iframe architecture and public URLs.
- Do not alter access coordinates, parking counts, amenities, routing formulas, or property-address data.
- Do not redesign the page or introduce new visual assets.
- Keep the existing MapLibre fallback for resilience, even after Google Maps authentication is repaired.
- Preserve unrelated local and production changes.

## Verification

### Automated

- Add a regression test for the finder public-access notice.
- Run the full test suite and production build.

### Live production

Verify on the Treasure page and direct Topsail Pricing page:

1. Google Maps loads without `RefererNotAllowedMapError`.
2. Routes and Aerial View no longer return authentication-related `403` errors.
3. The public-access-only notice appears in the finder.
4. The reinforced wrapper disclaimer appears below the iframe.
5. `208 Oyster` returns Oyster Lane and its Street View.
6. Pressing Find Access a second time keeps the result visible.
7. `218 Port Dr` returns Port Drive Beach Access.
8. Walking-directions links are present and target Google Maps.
9. Desktop layout remains visually sound.
10. A 390-pixel mobile viewport has no horizontal overflow.
11. Console output contains no new application errors.

## Rollback

- Google Cloud: restore the previous allowed-referrer list if the key change produces an unexpected issue.
- Finder: revert the notice commit and redeploy.
- WordPress: restore the prior wrapper disclaimer content from the page backup captured before editing.
