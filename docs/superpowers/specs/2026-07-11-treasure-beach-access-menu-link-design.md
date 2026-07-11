# Treasure Beach Access Menu Link Design

## Goal

Add a clear navigation path from Treasure Rentals' shared desktop/mobile menu to the new public beach-access finder.

## Live menu target

The production primary menu currently contains:

- Parent: **Plan Your Stay** (menu item 431)
- First child: **FAQ** (menu item 409)
- Next child: **Guest Portal** (menu item 411)
- Next child: **Blog** (menu item 222)

The same WordPress menu renders the desktop navigation and the mobile menu shown in the supplied screenshot.

## Approved change

Create one child menu item under **Plan Your Stay** with:

- Label: **Topsail Beach Access Lookup**
- URL: /public-beach-access/
- Position: directly after **FAQ** and before **Guest Portal**
- Target: same tab
- Relationship attributes: none

Do not rename, reorder, remove, or modify any existing menu item.

## Safe production workflow

1. Open the exact WordPress primary menu in the authenticated admin session.
2. Capture the current Plan Your Stay child-item order before editing.
3. Add one custom link with the approved label and relative URL.
4. Nest it under Plan Your Stay between FAQ and Guest Portal.
5. Save the menu once.
6. Read the public menu markup back and verify the new item appears exactly once.
7. Verify both desktop and 390-pixel mobile navigation.
8. Open the link and confirm same-tab navigation to the published Treasure page.

## Verification

- The desktop menu shows the item beneath Plan Your Stay.
- The mobile menu shows it beneath FAQ and above Guest Portal.
- The link resolves to https://treasurerentals.com/public-beach-access/.
- The destination returns HTTP 200 and displays the Treasure beach-access page.
- No sibling item changes position or destination.
- No duplicate menu item is created.

## Rollback

If the menu renders incorrectly, delete only the newly created **Topsail Beach Access Lookup** item, save the menu, and verify the original FAQ → Guest Portal → Blog order is restored.

