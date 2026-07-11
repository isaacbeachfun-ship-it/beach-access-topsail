# Treasure Beach Access Quality Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair Google authentication on the deployed Treasure beach-access experience, add public-access-only notices in both the finder and Treasure wrapper, and prove the complete desktop/mobile guest flow works.

**Architecture:** Update the browser restrictions on the exact Google key embedded in the deployed Vite bundle, then add one tested React notice without changing finder behavior or data. Update only WordPress page 983's existing disclaimer through the authenticated REST path with before/after backups, deploy the tested finder, and verify both production surfaces with Playwright.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, CSS, Vite, Vercel, Google Cloud API Keys, WordPress REST, Playwright CLI.

---

## File map

- Modify `src/components/AccessFinderPage.tsx`: render the approved public-access-only notice before the search controls.
- Modify `src/styles.css`: style the notice within the current finder visual system and mobile layout.
- Modify `tests/AccessFinderPage.test.tsx`: prove the notice is present and contains the approved private-access limitation.
- Modify `PROJECT_STATUS.md`: record the deployed commit, Google key repair, WordPress page update, and final verification evidence.
- Create `/tmp/update_treasure_page_983.py`: temporary credential-safe WordPress page backup/diff/update helper; do not commit it.
- Create `/Users/isaac/Documents/Beach Access Topsail/backups/wordpress/2026-07-11-page-983-public-beach-access-before-quality-repair.json`: live rollback record.
- Create `/Users/isaac/Documents/Beach Access Topsail/backups/wordpress/2026-07-11-page-983-public-beach-access-after-quality-repair.json`: live read-back record.
- External configuration: update Google key `projects/912886988217/locations/global/keys/4739fa58-1e51-4b95-a872-e91050d247de` without changing its API targets.

### Task 1: Repair the actual deployed Google key

- [ ] **Step 1: Read and record the current key restrictions**

Run:

```bash
gcloud services api-keys describe \
  projects/912886988217/locations/global/keys/4739fa58-1e51-4b95-a872-e91050d247de \
  --format='json(displayName,restrictions)'
```

Expected: display name `Treasure Beach Access Map`; API targets for Aerial View, Geocoding, Maps JavaScript, Routes, and Street View; allowed referrers limited to the prior GitHub Pages and local hosts.

- [ ] **Step 2: Add only the approved production referrers**

Run:

```bash
gcloud services api-keys update \
  projects/912886988217/locations/global/keys/4739fa58-1e51-4b95-a872-e91050d247de \
  --allowed-referrers='https://isaacbeachfun-ship-it.github.io/*,http://localhost/*,http://127.0.0.1/*,https://topsailpricing.com/*,https://www.topsailpricing.com/*,https://treasurerentals.com/*,https://www.treasurerentals.com/*' \
  --api-target=service=aerialview.googleapis.com \
  --api-target=service=geocoding-backend.googleapis.com \
  --api-target=service=maps-backend.googleapis.com \
  --api-target=service=routes.googleapis.com \
  --api-target=service=street-view-image-backend.googleapis.com
```

Expected: completed operation with all seven referrers and all five API targets retained. Do not use `--clear-restrictions`.

- [ ] **Step 3: Read back and minimally test the repaired key**

Describe the key again and confirm the exact referrer/API-target lists. Then request a small Static Maps image from each production host using its HTTP `Referer` header without printing the key string.

Expected: each request returns `200 image/png`.

### Task 2: Add the finder public-access notice with TDD

**Files:**
- Modify: `tests/AccessFinderPage.test.tsx`
- Modify: `src/components/AccessFinderPage.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing notice test**

Add to the `AccessFinderPage` test suite:

```tsx
test("states that the finder covers public access only", () => {
  render(<AccessFinderPage embedded />);

  expect(
    screen.getByRole("note", { name: "Public access only" }),
  ).toHaveTextContent(
    "This finder includes public beach access points only. It does not identify or authorize private, HOA, neighborhood, or property-owner access. Always follow posted signs and local rules.",
  );
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- --run tests/AccessFinderPage.test.tsx
```

Expected: FAIL because no element with role `note` and accessible name `Public access only` exists.

- [ ] **Step 3: Add the minimal finder notice**

Immediately after `.finder-copy` and before `.finder-search-shell`, add:

```tsx
<aside
  aria-label="Public access only"
  className="public-access-notice"
  role="note"
>
  <strong>Public access only:</strong>{" "}
  This finder includes public beach access points only. It does not identify
  or authorize private, HOA, neighborhood, or property-owner access. Always
  follow posted signs and local rules.
</aside>
```

- [ ] **Step 4: Style the notice using the existing design system**

Add near the finder-copy styles:

```css
.public-access-notice {
  max-width: 760px;
  margin: 14px 0 18px;
  padding: 12px 14px;
  border: 1px solid rgba(217, 154, 43, 0.34);
  border-radius: 8px;
  color: var(--ink-soft);
  background: #fff8e7;
  font-size: 13px;
  line-height: 1.45;
}

.public-access-notice strong {
  color: var(--teal-dark);
}
```

Under `@media (max-width: 620px)`, add:

```css
.public-access-notice {
  margin: 12px 0 16px;
  padding: 11px 12px;
  font-size: 12px;
}
```

- [ ] **Step 5: Verify GREEN and commit**

Run:

```bash
npm test -- --run tests/AccessFinderPage.test.tsx
git diff --check
git add src/components/AccessFinderPage.tsx src/styles.css tests/AccessFinderPage.test.tsx
git commit -m "feat: clarify public beach access scope"
```

Expected: selected tests pass and no whitespace errors remain.

### Task 3: Update only the Treasure wrapper disclaimer

**Files:**
- Create temporarily: `/tmp/update_treasure_page_983.py`
- Create backup: `/Users/isaac/Documents/Beach Access Topsail/backups/wordpress/2026-07-11-page-983-public-beach-access-before-quality-repair.json`
- Create read-back: `/Users/isaac/Documents/Beach Access Topsail/backups/wordpress/2026-07-11-page-983-public-beach-access-after-quality-repair.json`

- [ ] **Step 1: Create a credential-safe one-page updater**

Use the existing `treasure-wordpress-editor` module's Keychain-backed `Client`. The temporary script must:

1. Log in through the existing cookie/REST-nonce path.
2. Read `/wp-json/wp/v2/pages/983?context=edit`.
3. Save the complete editable JSON record to the before-backup path.
4. Require exactly one occurrence of the current disclaimer:

```html
<p class="tvr-beach-access-note">Parking rules, seasonal fees, accessibility amenities, and local regulations can change. Follow posted town and county signage when you arrive.</p>
```

5. Replace it with exactly:

```html
<p class="tvr-beach-access-note"><strong>Public access only:</strong> This tool shows public beach accesses only and does not grant access through private property or private, HOA, neighborhood, or property-owner paths. Parking rules, seasonal fees, accessibility amenities, and local regulations can change. Follow posted signs and current town or county rules when you arrive.</p>
```

6. Print a unified diff during dry-run.
7. Write only when invoked with `--confirm-live-write`.
8. Read page 983 back and save the after JSON only after a successful update.
9. Never print or persist credentials.

Create `/tmp/update_treasure_page_983.py` with:

```python
#!/usr/bin/env python3
from __future__ import annotations

import argparse
import difflib
import importlib.util
import json
from pathlib import Path

MODULE_PATH = Path(
    "/Users/isaac/.codex/skills/treasure-wordpress-editor/scripts/treasure_wp.py"
)
BEFORE_PATH = Path(
    "/Users/isaac/Documents/Beach Access Topsail/backups/wordpress/"
    "2026-07-11-page-983-public-beach-access-before-quality-repair.json"
)
AFTER_PATH = Path(
    "/Users/isaac/Documents/Beach Access Topsail/backups/wordpress/"
    "2026-07-11-page-983-public-beach-access-after-quality-repair.json"
)
OLD = (
    '<p class="tvr-beach-access-note">Parking rules, seasonal fees, '
    'accessibility amenities, and local regulations can change. Follow posted '
    'town and county signage when you arrive.</p>'
)
NEW = (
    '<p class="tvr-beach-access-note"><strong>Public access only:</strong> '
    'This tool shows public beach accesses only and does not grant access '
    'through private property or private, HOA, neighborhood, or property-owner '
    'paths. Parking rules, seasonal fees, accessibility amenities, and local '
    'regulations can change. Follow posted signs and current town or county '
    'rules when you arrive.</p>'
)


def load_module():
    spec = importlib.util.spec_from_file_location("treasure_wp", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load Treasure WordPress helper")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--confirm-live-write", action="store_true")
    args = parser.parse_args()

    module = load_module()
    client = module.Client()
    client.login_for_write()
    headers = {"X-WP-Nonce": client.rest_nonce or "", "Accept": "application/json"}
    page = client.json("/wp-json/wp/v2/pages/983?context=edit", headers=headers)

    if page.get("id") != 983 or page.get("slug") != "public-beach-access":
        raise RuntimeError("WordPress target mismatch; refusing update")

    BEFORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    BEFORE_PATH.write_text(json.dumps(page, indent=2), encoding="utf-8")
    content = page["content"]["raw"]
    if content.count(OLD) != 1:
        raise RuntimeError("Expected exactly one current disclaimer; refusing update")
    updated_content = content.replace(OLD, NEW)
    print("\n".join(difflib.unified_diff(
        content.splitlines(),
        updated_content.splitlines(),
        fromfile="current page 983",
        tofile="updated page 983",
        lineterm="",
    )))

    if not args.confirm_live_write:
        print(f"Dry run only. Backup: {BEFORE_PATH}")
        return 0

    client.rest_update_post("pages", 983, {"content": updated_content})
    readback = client.json(
        "/wp-json/wp/v2/pages/983?context=edit",
        headers={"X-WP-Nonce": client.rest_nonce or "", "Accept": "application/json"},
    )
    if readback["content"]["raw"].count(NEW) != 1:
        raise RuntimeError("Live read-back did not contain the approved disclaimer")
    AFTER_PATH.write_text(json.dumps(readback, indent=2), encoding="utf-8")
    print(f"Updated page 983. Read-back: {AFTER_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Run dry-run and inspect the exact diff**

Run the temporary helper without `--confirm-live-write`.

Expected: page ID `983`, slug `public-beach-access`, one disclaimer replacement, a fresh before-backup, and no other content difference.

- [ ] **Step 3: Apply the approved live WordPress update**

Run:

```bash
python3 /tmp/update_treasure_page_983.py --confirm-live-write
```

Expected: published page 983 is updated, the after-backup is written, and read-back contains the new disclaimer exactly once.

- [ ] **Step 4: Verify the public WordPress response**

Confirm `https://treasurerentals.com/public-beach-access/` returns HTTP 200 and its rendered HTML contains `Public access only:` plus the unchanged iframe source `https://topsailpricing.com/?embed=treasure`.

### Task 4: Full code verification, deployment, and status

**Files:**
- Modify: `PROJECT_STATUS.md`

- [ ] **Step 1: Run complete local verification**

Run:

```bash
npm test -- --run
npm run build
npm audit --omit=dev
git diff --check
git status --short
```

Expected: all tests pass, build succeeds, audit reports no known runtime vulnerabilities, whitespace check is clean, and only intended status/documentation changes remain.

- [ ] **Step 2: Review the code change**

Inspect the scoped diff for correctness, accessibility, mobile behavior, security, and accidental data changes. Confirm no access coordinate, parking, amenity, property-address, route, or media data file changed.

- [ ] **Step 3: Push and deploy the tested commit**

Push the isolated branch's tested commits to `origin/main`, deploy the existing Vercel project to production, wait for READY, and confirm both `https://topsailpricing.com/` and `https://www.topsailpricing.com/` point to the ready deployment.

- [ ] **Step 4: Record deployment state**

Update `PROJECT_STATUS.md` with:

- deployed commit and Vercel deployment ID;
- test/build/audit results;
- actual Google key resource and referrer repair;
- WordPress page ID 983 and before/after backup paths;
- final live desktop/mobile verification results.

Commit with:

```bash
git add PROJECT_STATUS.md
git commit -m "docs: record Treasure beach access quality repair"
git push origin HEAD:main
```

### Task 5: Final live desktop/mobile quality audit

- [ ] **Step 1: Start a fresh Playwright session and capture the initial page**

Open `https://treasurerentals.com/public-beach-access/` at 1440 x 1000, capture a snapshot and screenshot, and confirm the finder notice and wrapper disclaimer are visible.

- [ ] **Step 2: Verify Google integrations**

Confirm the page contains the Google map rather than the MapLibre authentication fallback. Inspect console/network output and require:

- no `RefererNotAllowedMapError`;
- no authentication-related `403` from Routes or Aerial View;
- no new application errors.

- [ ] **Step 3: Verify Oyster and repeated Find Access**

Search `208 oyster`, require `Oyster Lane Beach Access`, `End of Oyster Lane`, the reviewed Street View, and a Google Maps walking-directions link. Press Find Access again and require the same result to remain rendered.

- [ ] **Step 4: Verify Port Drive**

Search `218 Port Dr` and require `Port Drive Beach Access`, `End of Port Drive`, `No parking`, and a Google Maps walking-directions link.

- [ ] **Step 5: Verify mobile reflow**

Resize to 390 x 844, capture a screenshot, and evaluate:

```js
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

Expected: `true`; the notice, search controls, results, and map remain readable without horizontal overflow.

- [ ] **Step 6: Verify direct finder and close the audit**

Repeat the no-console-error and notice checks on `https://topsailpricing.com/?embed=treasure`. Save accepted screenshots under `output/playwright/treasure-beach-access-quality-repair/`, inspect them, and close the Playwright session.
