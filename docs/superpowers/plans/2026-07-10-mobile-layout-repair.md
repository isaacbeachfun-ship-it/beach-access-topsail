# Topsail Beach Access Mobile Layout Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the stretched mobile map and reduce unnecessary mobile page length while preserving desktop behavior.

**Architecture:** Keep the change CSS-only. A raw stylesheet regression test will protect the MapLibre positioning contract and the mobile layout rules, while Playwright verifies the rendered result.

**Tech Stack:** React, TypeScript, CSS, Vitest, Playwright CLI, Vite

---

### Task 1: Guard the mobile layout contract

**Files:**
- Modify: `tests/AccessFinderPage.test.tsx`

- [ ] Add a failing test that requires `.maplibre-access-marker` to be
  absolutely positioned, the mobile finder map to have an explicit height, and
  the mobile major-access directory to use horizontal overflow and scroll snap.
- [ ] Run `npm test -- tests/AccessFinderPage.test.tsx --run` and confirm the
  new assertions fail against the current stylesheet.

### Task 2: Repair the CSS

**Files:**
- Modify: `src/styles.css`

- [ ] Split the shared marker positioning rule so Google marker content remains
  relative and MapLibre marker elements remain absolute.
- [ ] Set a bounded mobile map height and reduce the mobile hero heading size.
- [ ] Convert the mobile `.major-directory` to a horizontal scroll-snapping row
  with cards wide enough to read without shrinking text.
- [ ] Run the focused test and confirm it passes.

### Task 3: Verify and publish

**Files:**
- No additional source files.

- [ ] Run `npm test -- --run`, `npm run build`, and `git diff --check`.
- [ ] Use Playwright at 390x844, select `305 S Shore Dr`, and visually inspect
  the hero, result card, map, and guest-favorites row. Confirm the page has no
  horizontal document overflow and no console errors.
- [ ] Commit, deploy to the existing `topsail-beach-access` Vercel project,
  verify `topsailpricing.com`, and push the updated branch to remote `main`.

