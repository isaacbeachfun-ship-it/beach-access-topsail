# Treasure Beach Access Menu Link Design

## Goal

Add clear navigation paths from Treasure Rentals' shared desktop/mobile menu to the new public beach-access finder, restaurant guide, and nightlife guide.

## Live menu target

The production primary menu currently contains:

- Parent: **Plan Your Stay** (menu item 431)
- First child: **FAQ** (menu item 409)
- Next child: **Guest Portal** (menu item 411)
- Next child: **Blog** (menu item 222)

The same WordPress menu renders the desktop navigation and the mobile menu shown in the supplied screenshot.

## Approved change

Create three child menu items under **Plan Your Stay**:

1. **Topsail Beach Access Lookup** → /public-beach-access/
2. **Topsail Restaurants** → /restaurants-topsail-islan/
3. **Topsail After Dark** → /nightlife-topsail-island/

The restaurant slug is intentionally preserved as the currently published URL, including its missing final "d" in "islan". Changing that live slug is outside this menu update.

The final **Plan Your Stay** order must be:

1. FAQ
2. Topsail Beach Access Lookup
3. Topsail Restaurants
4. Topsail After Dark
5. Guest Portal
6. Blog

All three new links open in the same tab and have no relationship attributes.

Do not rename, reorder, remove, or modify any existing menu item.

## Safe production workflow

1. Open the exact WordPress primary menu in the authenticated admin session.
2. Capture the current Plan Your Stay child-item order before editing.
3. Add the three approved custom links with their exact labels and relative URLs.
4. Nest them under Plan Your Stay after FAQ in the approved order.
5. Save the menu once.
6. Read the public menu markup back and verify the new item appears exactly once.
7. Verify both desktop and 390-pixel mobile navigation.
8. Open the link and confirm same-tab navigation to the published Treasure page.

## Verification

- The desktop menu shows all three new items beneath Plan Your Stay.
- The mobile menu shows them beneath FAQ and above Guest Portal in the approved order.
- The links resolve to the published Treasure beach-access, restaurant, and nightlife pages.
- All three destinations return HTTP 200.
- No sibling item changes position or destination.
- No duplicate menu items are created.

## Rollback

If the menu renders incorrectly, delete only the three newly created items, save the menu, and verify the original FAQ → Guest Portal → Blog order is restored.
