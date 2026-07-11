# Treasure Guide Menu Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three approved public guide links to the Treasure Rentals primary navigation under Plan Your Stay without changing existing menu items.

**Architecture:** Make one scoped update to the existing WordPress primary menu through the authenticated administration interface. Preserve the current parent-child structure and verify the saved result from the public site at desktop and mobile widths.

**Tech Stack:** WordPress navigation menus, authenticated WordPress admin, public HTML/browser verification, HTTP status checks.

---

### Task 1: Capture the production menu baseline

**Files:**
- Read only: live WordPress primary navigation menu
- Reference: `docs/superpowers/specs/2026-07-11-treasure-beach-access-menu-link-design.md`

- [x] **Step 1: Open the primary menu editor**

Open `https://treasurerentals.com/wp-admin/nav-menus.php` in the authenticated browser session and select the menu assigned to the primary navigation location.

- [x] **Step 2: Record the existing Plan Your Stay children**

Confirm the existing child order is exactly:

```text
FAQ
Guest Portal
Blog
```

If the live order differs, stop before writing and report the drift.

### Task 2: Add the three approved custom links

**Files:**
- Modify: live WordPress primary navigation menu only

- [x] **Step 1: Add the custom links**

Create these exact custom-link items:

```text
Topsail Beach Access Lookup | /public-beach-access/
Topsail Restaurants         | /restaurants-topsail-islan/
Topsail After Dark          | /nightlife-topsail-island/
```

- [x] **Step 2: Nest and order the items**

Place all three beneath Plan Your Stay so the complete child order is:

```text
FAQ
Topsail Beach Access Lookup
Topsail Restaurants
Topsail After Dark
Guest Portal
Blog
```

- [x] **Step 3: Save once**

Save the menu once after confirming that no existing item label, URL, parent, or order changed.

Execution note: WordPress hid the first two newly added pending rows in the admin interface. The items were saved once to make all three rows visible, then the exact parent/order values were applied and saved again. The final saved hierarchy was read back from WordPress before public verification.

### Task 3: Verify the public result

**Files:**
- Read only: `https://treasurerentals.com/`
- Read only: the three linked destination pages

- [x] **Step 1: Verify public desktop navigation**

Reload the public home page, open Plan Your Stay, and confirm all six child items appear once in the approved order.

- [x] **Step 2: Verify public mobile navigation**

At a 390-pixel viewport, open the mobile menu and Plan Your Stay. Confirm the same six items appear once in the same order and all three new items are tappable.

- [x] **Step 3: Verify destination responses**

Run:

```bash
curl -I -L https://treasurerentals.com/public-beach-access/
curl -I -L https://treasurerentals.com/restaurants-topsail-islan/
curl -I -L https://treasurerentals.com/nightlife-topsail-island/
```

Expected: each final response is HTTP 200.

- [x] **Step 4: Verify no duplicate or sibling drift**

Inspect the public menu markup and confirm each new label appears exactly once beneath Plan Your Stay, while FAQ, Guest Portal, and Blog retain their original destinations and relative order.

### Task 4: Record completion evidence

**Files:**
- Modify: this plan file only to mark completed checkboxes after fresh verification

- [x] **Step 1: Mark verified steps complete**

Change only completed checklist markers from `[ ]` to `[x]` after the corresponding production evidence has been observed.

- [x] **Step 2: Commit the completed plan record**

Run:

```bash
git add docs/superpowers/plans/2026-07-11-treasure-guide-menu-links.md
git commit -m "docs: record Treasure guide menu rollout"
```

Expected: one documentation commit recording the verified rollout.
