# Oyster Lane Street View and Repeat Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the reviewed Oyster Lane Google Street View panorama and prevent a second Find Access submission from collapsing the embedded results.

**Architecture:** Keep the current match mounted while a repeat lookup is pending so the iframe height stays stable. Extend the existing Street View record with an optional official Google embed URL; use that URL only for the reviewed Oyster Lane panorama and preserve the Static API image path for all existing records.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Vite, Google Maps Street View embed, Vercel

---

## File Map

- Modify `src/components/AccessFinderPage.tsx`: retain the current match during repeat searches and use a unique local suggestion on submit.
- Modify `tests/AccessFinderPage.test.tsx`: cover partial Oyster Lane submission.
- Create `tests/AccessFinderRepeatSearch.test.tsx`: prove the current result remains visible while the second lookup is pending.
- Modify `src/lib/streetView.ts`: allow a reviewed record to carry an official Google embed URL.
- Modify `src/components/AccessMediaGallery.tsx`: render the reviewed embed when present and keep the existing Static API image fallback.
- Modify `src/styles.css`: size the Street View iframe inside the existing media frame.
- Modify `src/data/streetViewStills.json`: add the reviewed Oyster Lane panorama metadata.
- Modify `tests/AccessMediaGallery.test.tsx`: prove the Oyster Lane embed is rendered with an accessible title and exact source.

### Task 1: Keep Repeat Search Results Mounted

- [ ] **Step 1: Write the failing repeat-search test**

Create `tests/AccessFinderRepeatSearch.test.tsx`. Mock only `findNearestAccessByWalkingRoute`, let the first lookup resolve to the normal Oyster Lane match, leave the second lookup pending, and assert that `Oyster Lane Beach Access` remains in the document after clicking Find Access again.

```tsx
const routeLookup = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/accessLookup", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/accessLookup")>();
  return { ...actual, findNearestAccessByWalkingRoute: routeLookup };
});

test("keeps the current result visible while a repeat lookup is pending", async () => {
  routeLookup.mockImplementationOnce(async (point, accesses) =>
    findNearestAccess(point, accesses),
  );
  routeLookup.mockImplementationOnce(() => new Promise(() => {}));

  render(<AccessFinderPage embedded />);
  const input = screen.getByRole("combobox", {
    name: "Topsail property address",
  });
  fireEvent.change(input, { target: { value: "208 Oyster Ln" } });
  fireEvent.click(await screen.findByRole("option", { name: /208 Oyster Ln/i }));
  expect(await screen.findByRole("heading", { name: "Oyster Lane Beach Access" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Find Access" }));
  expect(screen.getByRole("heading", { name: "Oyster Lane Beach Access" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Finding..." })).toBeDisabled();
});
```

- [ ] **Step 2: Verify RED**

Run `npm test -- --run tests/AccessFinderRepeatSearch.test.tsx`.
Expected: the Oyster Lane heading disappears after the second submission because `applyLookupPoint()` calls `setMatch(null)`.

- [ ] **Step 3: Apply the minimal state fix**

In `applyLookupPoint()`, remove the unconditional `setMatch(null)`. Keep the existing result mounted until the replacement match resolves. Preserve error clearing in `runLookup()` and keep the already-tested unique local suggestion behavior.

```ts
async function applyLookupPoint(point: LookupPoint) {
  setLookupPoint(point);
  setIsSearching(true);

  try {
    const routeAwareMatch = await findNearestAccessByWalkingRoute(point, accesses, {
      apiKey: getGoogleMapsApiKey(),
    });
    setMatch(routeAwareMatch);
  } finally {
    setIsSearching(false);
  }
}
```

- [ ] **Step 4: Verify GREEN**

Run `npm test -- --run tests/AccessFinderRepeatSearch.test.tsx tests/AccessFinderPage.test.tsx`.
Expected: both files pass, including the `208 oyster` unique-suggestion regression.

- [ ] **Step 5: Commit the search fix**

```bash
git add src/components/AccessFinderPage.tsx tests/AccessFinderPage.test.tsx tests/AccessFinderRepeatSearch.test.tsx
git commit -m "fix: keep repeat beach searches visible"
```

### Task 2: Add the Reviewed Oyster Lane Street View

- [ ] **Step 1: Write the failing media test**

Extend the Street View fixture in `tests/AccessMediaGallery.test.tsx` with an `embedUrl` record and require a uniquely titled iframe with that exact URL.

```tsx
expect(
  await screen.findByTitle("Google Street View of Oyster Lane Beach Access"),
).toHaveAttribute(
  "src",
  "https://www.google.com/maps/embed?pb=!4v1783739810030!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJRGFfZGZKMlFF!2m2!1d34.52474420424951!2d-77.34773682442166!3f133!4f0!5f0.7820865974627469",
);
```

- [ ] **Step 2: Verify RED**

Run `npm test -- --run tests/AccessMediaGallery.test.tsx`.
Expected: no titled Street View iframe exists because the record type and gallery support only Static API images.

- [ ] **Step 3: Extend the Street View record**

Add `embedUrl?: string` to `StreetViewStill` in `src/lib/streetView.ts`.

- [ ] **Step 4: Render the official embed**

In the Street View branch of `AccessMediaGallery`, render the embed before the Static API image when `streetViewStill.embedUrl` exists.

```tsx
{streetViewStill?.embedUrl ? (
  <iframe
    allowFullScreen
    loading="lazy"
    referrerPolicy="strict-origin-when-cross-origin"
    src={streetViewStill.embedUrl}
    title={`Google Street View of ${access.name}`}
  />
) : (
  <img
    src={streetViewUrl}
    alt={`Street View still facing ${access.name} from the nearest Google panorama.`}
    loading="lazy"
    decoding="async"
  />
)}
```

Update the branch condition so a reviewed `embedUrl` displays even when the Static API URL is unavailable.

Add the iframe to the existing media sizing rule in `src/styles.css`:

```css
.media-image-wrap img,
.media-image-wrap video,
.media-image-wrap iframe {
  width: 100%;
  height: 100%;
  border: 0;
  object-fit: cover;
}
```

- [ ] **Step 5: Add the reviewed metadata**

Add this record to `src/data/streetViewStills.json`:

```json
"north-topsail-beach-oyster-lane-access": {
  "state": "AVAILABLE",
  "panoId": "CIHM0ogKEICAgIDa_dfJ2QE",
  "latitude": 34.52474420424951,
  "longitude": -77.34773682442166,
  "heading": 133,
  "pitch": 0,
  "fov": 75,
  "date": "2019-09",
  "copyright": "Google Maps / Southeastern Unmanned Aerial Solutions",
  "checkedAt": "2026-07-11T02:56:50.000Z",
  "embedUrl": "https://www.google.com/maps/embed?pb=!4v1783739810030!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJRGFfZGZKMlFF!2m2!1d34.52474420424951!2d-77.34773682442166!3f133!4f0!5f0.7820865974627469"
}
```

- [ ] **Step 6: Verify GREEN**

Run `npm test -- --run tests/AccessMediaGallery.test.tsx tests/streetView.test.ts`.
Expected: the Oyster Lane embed test and all existing Static API still tests pass.

- [ ] **Step 7: Commit the media change**

```bash
git add src/lib/streetView.ts src/components/AccessMediaGallery.tsx src/styles.css src/data/streetViewStills.json tests/AccessMediaGallery.test.tsx
git commit -m "feat: add Oyster Lane Street View"
```

### Task 3: Verify and Deploy

- [ ] **Step 1: Run complete verification**

Run `npm test -- --run`, `npm run build`, `npm audit --omit=dev`, and `git diff --check`.
Expected: 0 test failures, successful production build, 0 reachable production vulnerabilities, and no whitespace errors.

- [ ] **Step 2: Review the scoped diff**

Confirm the deployment contains only the two search commits, Oyster Lane media metadata, and documentation. Reject unrelated main-worktree changes.

- [ ] **Step 3: Deploy to the existing Vercel project**

Deploy the verified commit to production, then point `topsailpricing.com` and `www.topsailpricing.com` at the ready deployment using the existing project link.

- [ ] **Step 4: Verify the live Treasure flow**

On `https://treasurerentals.com/public-beach-access/`, select `208 Oyster Ln`, confirm the Oyster Lane result and Street View embed appear, click Find Access again, and confirm the result remains visible while the request completes. Verify the iframe still has no horizontal overflow on a 390-pixel viewport.

- [ ] **Step 5: Commit deployment notes**

Record the deployment ID, verification totals, Street View panorama provenance, and repeat-search fix in `PROJECT_STATUS.md`, then commit only that file.
