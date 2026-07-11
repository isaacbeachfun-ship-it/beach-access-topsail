# Topsail Beach Access Mobile Layout Repair Design

## Goal

Repair the verified mobile layout defects without changing beach-access data,
search behavior, map controls, or desktop presentation.

## Verified root cause

The shared `.google-map-marker, .maplibre-access-marker` rule assigns
`position: relative`. That is correct for the inner Google marker content but
overrides MapLibre's required `position: absolute`. The MapLibre markers then
participate in normal document flow and stretch the mobile map from its intended
340-pixel viewport to roughly 1,618 pixels.

## Design

- Keep Google marker content positioned relatively.
- Restore absolute positioning for MapLibre marker elements.
- Give the finder map an explicit mobile height so its WebGL canvas and parent
  always share a bounded viewport.
- Reduce the mobile hero heading slightly so its message scans cleanly without
  dominating the first screen.
- Present the eight guest-favorite access cards as a horizontal, scroll-snapping
  row on mobile instead of a long vertical stack.
- Preserve the existing stacked town guide, address result card, accessibility
  labels, and all desktop layouts.

## Verification

- Add a raw-CSS regression test for MapLibre absolute positioning and bounded
  mobile map height.
- Add raw-CSS coverage for the mobile guest-favorites carousel.
- Run the focused test, full test suite, and production build.
- Recheck the page at 390x844 and visually inspect hero, selected result, map,
  guest favorites, horizontal overflow, and console errors.

