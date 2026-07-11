# Oyster Lane Street View Still Design

Date: 2026-07-10
Status: Approved direction, pending implementation

## Goal

Show a real Google Street View still in the existing "What it looks like" card
for the neighborhood beach access at the end of Oyster Lane in North Topsail
Beach.

## Approach

Use the finder’s existing Google Street View Static API integration. Query the
nearest outdoor panorama to the reviewed Oyster Lane access coordinates, aim
the camera at the street-end beach path, and visually review the result before
publishing it.

Store only Google panorama metadata in `src/data/streetViewStills.json`:

- access ID: `north-topsail-beach-oyster-lane-access`
- panorama ID and panorama coordinates
- reviewed heading, pitch, and field of view
- imagery date, copyright, and check timestamp when supplied by Google

Do not download, rehost, or commit a copied Google image. The application will
continue generating the image URL at runtime through the licensed Street View
Static API path already used by other accesses.

## Accuracy Gate

The still must visibly face the Oyster Lane street-end access or the immediate
approach to it. A nearby panorama that shows only New River Inlet Road, a
private driveway, or an unrelated beach access must be rejected. If no accurate
outdoor panorama exists, retain the current no-imagery message rather than show
a misleading picture.

## Scope

- Add or update only the Oyster Lane Street View metadata and any narrowly
  required targeted workflow support.
- Add regression coverage proving the Oyster Lane access uses the Street View
  card when reviewed metadata is present.
- Do not change Oyster Lane routing, Port Drive routing, WordPress content,
  other access imagery, or Google Cloud restrictions.
- Keep the unrelated partial-address search fix as a separate change.

## Verification

1. Confirm Google metadata resolves an outdoor panorama near the Oyster Lane
   access.
2. Review the rendered still and adjust camera heading only if needed to face
   the path.
3. Run the Street View and media-gallery tests plus the full test suite and
   production build.
4. Deploy the tested change and verify the live Treasure embed shows the still
   for `208 Oyster Ln` without changing the access result or directions link.

## Rollback

Remove the Oyster Lane entry from `streetViewStills.json` and redeploy. The
existing no-imagery placeholder will return automatically.
