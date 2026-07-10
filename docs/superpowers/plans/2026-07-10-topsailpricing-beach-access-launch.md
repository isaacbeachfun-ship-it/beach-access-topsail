# TopsailPricing.com Beach Access Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch the rebranded Topsail Beach Access finder as the public, password-free homepage at topsailpricing.com without changing the Carolina Coast Pricing application.

**Architecture:** Keep the existing Vite/React finder intact, remove Treasure/prototype presentation, and deploy it to a new Vercel project named topsail-beach-access. Preview first, then repoint only topsailpricing.com and www.topsailpricing.com; carolinacoastpricing.com remains attached to its separate project.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest/Testing Library, Google Maps with MapLibre fallback, Vercel CLI 55.

---

## File Map

- Modify src/App.tsx and src/styles.css — public brand, navigation, attribution, and hero.
- Modify src/components/AccessFinderPage.tsx — launch copy and media filtering.
- Modify tests/App.test.tsx and tests/AccessFinderPage.test.tsx — brand regressions.
- Modify index.html; create public/favicon.svg — canonical metadata and identity.
- Create tests/publicLaunch.test.ts and vercel.json — deployment contract.
- Modify .gitignore, README.md, and PROJECT_STATUS.md — local linkage and durable operations documentation.

## Task 1: Safe Branch and Baseline

**Files:**
- Read: AGENTS.md
- Read: docs/superpowers/specs/2026-07-10-topsailpricing-beach-access-launch-design.md
- Preserve: all current modified and untracked paths

- [ ] **Step 1: Create an isolated worktree**

Invoke superpowers:using-git-worktrees. Create a worktree from aa61093 on branch codex/topsailpricing-beach-access-launch. Do not copy or commit existing unrelated GoogleAccessMap, review-document, billboard, or test changes.

- [ ] **Step 2: Confirm baseline**

    git status --short --branch
    git rev-parse HEAD
    npm test
    npm run build

Expected: clean feature tree at aa61093, all tests pass, build creates dist/index.html.

- [ ] **Step 3: Record live state and rollback**

    curl -sSIL https://topsailpricing.com/ | sed -n '1,40p'
    curl -sSIL https://www.topsailpricing.com/ | sed -n '1,40p'
    curl -sSIL https://carolinacoastpricing.com/ | sed -n '1,40p'
    npx vercel alias list | rg 'topsailpricing\.com|carolinacoastpricing\.com'

Expected: TopsailPricing redirects to Carolina Coast Pricing; rollback deployment is topsail-pricing-p92vzptn6-isaacbeachfun-9768s-projects.vercel.app; Carolina Coast Pricing returns 200.

## Task 2: Rebrand the Application Shell

**Files:**
- Modify: tests/App.test.tsx
- Modify: src/App.tsx
- Modify: src/styles.css

- [ ] **Step 1: Write the failing test**

Replace tests/App.test.tsx:

    import { render, screen } from "@testing-library/react";
    import { describe, expect, it } from "vitest";
    import App from "../src/App";

    describe("App", () => {
      it("presents Topsail Beach Access as a free Carolina Coast Pricing tool", () => {
        const { container } = render(<App />);

        expect(screen.getByRole("navigation", {
          name: "Topsail Beach Access navigation",
        })).toBeInTheDocument();
        expect(screen.getByRole("link", {
          name: "Topsail Beach Access",
        })).toHaveAttribute("href", "#finder");
        expect(screen.getByRole("link", {
          name: "A free tool from Carolina Coast Pricing",
        })).toHaveAttribute("href", "https://carolinacoastpricing.com");
        expect(screen.getByRole("heading", {
          name: "Find the beach access closest to your Topsail stay.",
        })).toBeInTheDocument();
        expect(container.textContent).not.toMatch(/Treasure Vacation Rentals/i);
        expect(container.textContent).not.toMatch(/prototype|Example Rental/i);
      });
    });

- [ ] **Step 2: Prove it fails**

    npx vitest run tests/App.test.tsx

Expected: FAIL on the old Treasure navigation and missing attribution.

- [ ] **Step 3: Implement public shell**

Replace src/App.tsx:

    import { AccessFinderPage } from "./components/AccessFinderPage";
    import accessesData from "./data/accesses.json";
    import type { BeachAccess } from "./types/access";

    const accesses = accessesData as BeachAccess[];

    export default function App() {
      return (
        <main className="app-shell">
          <nav className="top-nav" aria-label="Topsail Beach Access navigation">
            <a className="brand" href="#finder">Topsail Beach Access</a>
            <div className="nav-links">
              <a href="#finder">Find Access</a>
              <a href="https://carolinacoastpricing.com">Carolina Coast Pricing</a>
            </div>
          </nav>
          <section className="page-hero">
            <a
              className="eyebrow brand-attribution"
              href="https://carolinacoastpricing.com"
            >
              A free tool from Carolina Coast Pricing
            </a>
            <h1>
              Find the beach access closest to your <span>Topsail stay.</span>
            </h1>
            <p>
              Search any Topsail Island address, see the closest public beach
              access, and compare larger nearby options with parking and facilities.
            </p>
            <div className="hero-actions">
              <a className="hero-cta" href="#finder">Start with your address</a>
              <span className="hero-fact">
                {accesses.length} public accesses mapped across 3 island towns
              </span>
            </div>
          </section>
          <AccessFinderPage />
        </main>
      );
    }

Add after .eyebrow in src/styles.css:

    .brand-attribution {
      display: inline-flex;
      width: fit-content;
      text-decoration-color: rgba(255, 255, 255, 0.45);
      text-underline-offset: 4px;
    }

    .brand-attribution:hover {
      color: var(--parrot-teal);
    }

- [ ] **Step 4: Prove it passes and commit**

    npx vitest run tests/App.test.tsx
    git add src/App.tsx src/styles.css tests/App.test.tsx
    git commit -m "feat: rebrand beach access public shell"

Expected: PASS and one focused commit.

## Task 3: Remove Treasure and Prototype Finder Copy

**Files:**
- Modify: tests/AccessFinderPage.test.tsx
- Modify: src/components/AccessFinderPage.tsx

- [ ] **Step 1: Write the failing test**

Add inside the existing describe:

    test("uses public launch copy and excludes prototype-only media", () => {
      const { container } = render(<AccessFinderPage />);

      expect(screen.getByRole("heading", {
        name: "Type an address. We’ll find the beach path.",
      })).toBeInTheDocument();
      expect(container.textContent).not.toMatch(/Treasure|prototype/i);
      expect(container.textContent).not.toMatch(/Prototype only/i);
    });

- [ ] **Step 2: Prove it fails**

    npx vitest run tests/AccessFinderPage.test.tsx

Expected: FAIL on the Treasure heading and prototype town copy.

- [ ] **Step 3: Implement launch-safe composition**

Change the media declaration:

    const media = (mediaCandidatesData as AccessMedia[]).filter(
      (item) => item.status !== "prototype-only",
    );

Replace the finder copy:

    <h2 id="finder-heading">
      Type an address. We&rsquo;ll find the beach path.
    </h2>
    <p>
      Use a house address or pick one of the sample addresses. Results prioritize
      the closest public path, then nearby accesses with better parking and
      facilities.
    </p>

Replace the North Topsail paragraph:

    <p>
      North Topsail Beach has{" "}
      {townAccessCounts["North Topsail Beach"].toLocaleString()} mapped public
      ocean accesses, including quiet Island Drive walkovers and larger
      county-style parking options such as Onslow Co. Beach Access #2.
    </p>

Replace the Topsail Beach paragraph:

    <p>
      Topsail Beach has{" "}
      {townAccessCounts["Topsail Beach"].toLocaleString()} mapped public ocean
      accesses, useful for visitors comparing North Anderson Boulevard walkovers,
      small lots, and the closest route from a rental address.
    </p>

- [ ] **Step 4: Verify and commit**

    npx vitest run tests/AccessFinderPage.test.tsx tests/AccessMediaGallery.test.tsx
    rg -n -i 'Treasure|prototype|Example Rental' src/App.tsx src/components/AccessFinderPage.tsx
    git add src/components/AccessFinderPage.tsx tests/AccessFinderPage.test.tsx
    git commit -m "feat: make finder copy launch ready"

Expected: tests PASS, scan has no matches, focused commit succeeds.

## Task 4: Metadata, Favicon, and Vercel Contract

**Files:**
- Create: tests/publicLaunch.test.ts
- Modify: index.html
- Create: public/favicon.svg
- Create: vercel.json
- Modify: .gitignore

- [ ] **Step 1: Write failing contract test**

Create tests/publicLaunch.test.ts:

    import { readFileSync } from "node:fs";
    import { describe, expect, test } from "vitest";

    const indexHtml = readFileSync(
      new URL("../index.html", import.meta.url), "utf8",
    );
    const vercelConfig = JSON.parse(
      readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
    ) as {
      buildCommand: string;
      framework: string;
      outputDirectory: string;
    };

    describe("public launch contract", () => {
      test("publishes canonical Topsail metadata", () => {
        expect(indexHtml).toContain("<title>Topsail Beach Access");
        expect(indexHtml).toContain(
          '<link rel="canonical" href="https://topsailpricing.com/" />',
        );
        expect(indexHtml).toContain(
          '<meta property="og:url" content="https://topsailpricing.com/" />',
        );
        expect(indexHtml).toContain('<link rel="icon" href="/favicon.svg" />');
        expect(indexHtml).not.toMatch(/Treasure|prototype/i);
      });

      test("uses a dedicated Vite build", () => {
        expect(vercelConfig).toMatchObject({
          buildCommand: "npm run build",
          framework: "vite",
          outputDirectory: "dist",
        });
      });
    });

- [ ] **Step 2: Prove it fails**

    npx vitest run tests/publicLaunch.test.ts

Expected: FAIL because vercel.json and canonical metadata do not exist.

- [ ] **Step 3: Update index.html**

Keep charset, viewport, theme-color, color-scheme, and keywords. Use:

    <link rel="icon" href="/favicon.svg" />
    <link rel="canonical" href="https://topsailpricing.com/" />
    <meta
      name="description"
      content="Find the closest public beach access to any Topsail Island address. Compare parking, restrooms, accessibility, and walking directions across North Topsail Beach, Surf City, and Topsail Beach."
    />
    <meta property="og:title" content="Topsail Beach Access" />
    <meta
      property="og:description"
      content="Search a Topsail Island address and find the closest public beach access, parking options, facilities, and walking directions."
    />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://topsailpricing.com/" />
    <title>Topsail Beach Access | Parking, Facilities & Walking Directions</title>

- [ ] **Step 4: Create public/favicon.svg**

    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#163d45"/>
      <path d="M8 36c8-8 16-8 24 0s16 8 24 0v10c-8 8-16 8-24 0s-16-8-24 0V36Z" fill="#88d8e8"/>
      <circle cx="44" cy="19" r="8" fill="#d7ad66"/>
    </svg>

- [ ] **Step 5: Create vercel.json and ignore local linkage**

vercel.json:

    {
      "$schema": "https://openapi.vercel.sh/vercel.json",
      "buildCommand": "npm run build",
      "framework": "vite",
      "outputDirectory": "dist",
      "headers": [
        {
          "source": "/(.*)",
          "headers": [
            {
              "key": "Referrer-Policy",
              "value": "strict-origin-when-cross-origin"
            },
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            }
          ]
        }
      ]
    }

Append to .gitignore:

    .vercel/

- [ ] **Step 6: Verify and commit**

    npx vitest run tests/publicLaunch.test.ts
    npm run build
    rg -n 'https://topsailpricing.com/|favicon.svg|Topsail Beach Access' dist/index.html
    git add .gitignore index.html public/favicon.svg tests/publicLaunch.test.ts vercel.json
    git commit -m "feat: prepare TopsailPricing public deployment"

Expected: test/build PASS and built HTML contains all launch markers.

## Task 5: Full Local and Visual Verification

- [ ] **Step 1: Run full checks**

    npm test
    npm run build
    git diff --check aa61093..HEAD

Expected: all tests/build PASS, no whitespace errors.

- [ ] **Step 2: Start preview**

    npm run preview -- --host 127.0.0.1 --port 4173

Expected: http://127.0.0.1:4173/ serves production build.

- [ ] **Step 3: Inspect desktop and mobile**

Use the Playwright skill at 1440x1000 and 390x844. Save screenshots under artifacts/launch/. Confirm brand, attribution, finder, sample buttons, map controls, icon key, directory, and guide fit; no Treasure/prototype/example section; no console errors.

- [ ] **Step 4: Test representative addresses**

Select autocomplete results:

    305 S Shore Dr, Surf City, NC
    2950 Island Dr, North Topsail Beach, NC
    915 N Anderson Blvd, Topsail Beach, NC

Expected: each produces a closest-access card; map controls work; failed routing never draws a fake line.

- [ ] **Step 5: Commit only necessary corrections**

Write a focused failing regression test, make the smallest correction, rerun npm test and npm run build, then:

    git add src tests
    git commit -m "fix: polish public beach access launch"

Do not create an empty commit.

## Task 6: Dedicated Vercel Preview

**Files:**
- Local only: .vercel/project.json
- Read secrets from /Users/isaac/Documents/Projects/Beach Access Topsail/.env.local

- [ ] **Step 1: Create and link project**

    npx vercel project add topsail-beach-access
    npx vercel link --yes --team team_HOPQx5udIEaDl2UUBGBVtFkd --project topsail-beach-access
    npx vercel project inspect topsail-beach-access

Expected: dedicated Vite project; .vercel/project.json names only it.

- [ ] **Step 2: Transfer browser-safe variables without printing**

    set -a
    source "/Users/isaac/Documents/Projects/Beach Access Topsail/.env.local"
    set +a
    test -n "${VITE_GOOGLE_MAPS_API_KEY:-}"
    test -n "${VITE_GOOGLE_MAPS_MAP_ID:-}"
    for target in preview production; do
      npx vercel env add VITE_GOOGLE_MAPS_API_KEY "$target" --value "$VITE_GOOGLE_MAPS_API_KEY" --sensitive --force --yes
      npx vercel env add VITE_GOOGLE_MAPS_MAP_ID "$target" --value "$VITE_GOOGLE_MAPS_MAP_ID" --sensitive --force --yes
    done
    unset VITE_GOOGLE_MAPS_API_KEY VITE_GOOGLE_MAPS_MAP_ID

Expected: both targets configured; no values printed or tracked.

- [ ] **Step 3: Extend Google Maps referrers**

Retain existing restrictions and add:

    https://topsailpricing.com/*
    https://www.topsailpricing.com/*

Keep localhost/GitHub Pages during transition and never make the key unrestricted.

- [ ] **Step 4: Deploy without moving domains**

    npx vercel deploy --prod --skip-domain --yes > /tmp/topsail-beach-access-deploy.txt
    DEPLOY_URL="$(rg -o 'https://[^[:space:]]+\.vercel\.app' /tmp/topsail-beach-access-deploy.txt | tail -1)"
    test -n "$DEPLOY_URL"
    printf '%s\n' "$DEPLOY_URL"
    curl -sSIL "$DEPLOY_URL/" | sed -n '1,40p'

Expected: dedicated Vercel URL returns 200; domains have not moved.

- [ ] **Step 5: Verify remote preview logged out**

Use fresh Playwright context. Confirm no protection/login/password, map has no referrer error, attribution is correct, and all three address flows work.

## Task 7: Domain Cutover and Rollback

- [ ] **Step 1: Reconfirm rollback and CCP baseline**

    npx vercel alias list | rg 'topsailpricing\.com|carolinacoastpricing\.com'
    curl -sSL https://carolinacoastpricing.com/ | rg 'Stop guessing whether your open weeks are priced right|Pricing software login'
    curl -sS -o /dev/null -w '%{http_code}\n' https://carolinacoastpricing.com/login

Expected: old Topsail aliases still target topsail-pricing-p92vzptn6-isaacbeachfun-9768s-projects.vercel.app; CCP markers exist.

- [ ] **Step 2: Repoint only Topsail aliases**

    npx vercel alias set "$DEPLOY_URL" topsailpricing.com
    npx vercel alias set "$DEPLOY_URL" www.topsailpricing.com

Expected: success. Do not touch DNS, MX, SPF, DKIM, DMARC, or CCP aliases.

- [ ] **Step 3: Verify HTTP behavior**

    curl -sSIL https://topsailpricing.com/ | sed -n '1,80p'
    curl -sSIL https://www.topsailpricing.com/ | sed -n '1,80p'
    curl -sSL https://topsailpricing.com/ | rg 'Topsail Beach Access|A free tool from Carolina Coast Pricing'

Expected: apex 200; www 200 or redirect only to Topsail apex; neither redirects to CCP/login.

- [ ] **Step 4: Verify both products logged out**

Check topsailpricing.com finder, maps, mobile, console; carolinacoastpricing.com headline/login; carolinacoastpricing.com/units redirects to login rather than 404.

- [ ] **Step 5: Roll back on any failure**

    npx vercel alias set topsail-pricing-p92vzptn6-isaacbeachfun-9768s-projects.vercel.app topsailpricing.com
    npx vercel alias set topsail-pricing-p92vzptn6-isaacbeachfun-9768s-projects.vercel.app www.topsailpricing.com

Expected: old redirect restored while diagnosis stays off-domain.

## Task 8: Document, Merge, and Push

**Files:**
- Modify: README.md
- Modify: PROJECT_STATUS.md

- [ ] **Step 1: Update deployment docs**

Use this README production section:

    ## Public URL

    Production: https://topsailpricing.com/

    The app is deployed as dedicated Vercel project topsail-beach-access.
    The TopsailPricing domains belong only to that project.
    carolinacoastpricing.com is a separate pricing application.

    Historical fallback:
    https://isaacbeachfun-ship-it.github.io/beach-access-topsail/

Update PROJECT_STATUS.md with actual launch timestamp, production URL, Vercel project, rollback deployment, tests/build, and CCP regression result. Record only checks that passed.

- [ ] **Step 2: Commit docs**

    git add README.md PROJECT_STATUS.md
    git commit -m "docs: record TopsailPricing beach access launch"

- [ ] **Step 3: Final verification**

Invoke superpowers:verification-before-completion, then:

    npm test
    npm run build
    git status --short --branch
    curl -sSIL https://topsailpricing.com/ | sed -n '1,60p'
    curl -sSL https://topsailpricing.com/ | rg 'Topsail Beach Access|A free tool from Carolina Coast Pricing'
    curl -sSL https://carolinacoastpricing.com/ | rg 'Stop guessing whether your open weeks are priced right|Pricing software login'

Expected: tests/build pass, feature tree clean, both sites retain correct markers.

- [ ] **Step 4: Merge without disturbing user changes**

In /Users/isaac/Documents/Projects/Beach Access Topsail, confirm dirty inventory still matches Task 1 and no feature file overlaps. Then:

    git merge --ff-only codex/topsailpricing-beach-access-launch
    git status --short --branch

Expected: fast-forward; pre-existing user modifications remain unstaged.

- [ ] **Step 5: Push source**

    git push origin main

Expected: origin/main contains design, implementation, deployment contract, and launch docs. .vercel/ and .env.local are absent.
