# Treasure Beach Access Finder Design

## Context

This repo is currently a blank project workspace for a Treasure Vacation Rentals beach-access concept. The feature should feel like part of the existing Treasure website mockup at `https://isaacbeachfun-ship-it.github.io/treasure-rentals-website-mockup/#home-video`, with the rental-detail experience as the primary surface.

Live Supabase read-only checks found `public.beach_walk_distances` in project `olxxtivntwntswipfelz`. The table currently has 9,434 rows overall. For Topsail access places, it has 550 property-to-access rows and 96 distinct access locations used as nearest accesses.

The canonical all-access inventory is the local CSV at `/Users/isaac/Projects/topsail-scrape/data/beach_access/beach_access_master.csv`. It contains 129 Topsail access rows, 112 ocean/beach access rows, all with GPS coordinates. By town: North Topsail Beach has 56 rows, Surf City has 45, and Topsail Beach has 28.

Official source pages used for public/amenity context:

- `https://www.surfcitync.gov/2395/Public-Beach-Accesses`
- `https://www.northtopsailbeachnc.gov/community/page/beach-access-parking`
- `https://topsailbeachnc.gov/Visitors/Public-Accesses-and-Parking`
- `https://coastalaccess.nc.gov`

## Product Goal

Give Treasure guests an accurate, delightful answer to: "Where do I go to get to the beach from this house?"

The primary experience is a rental-detail module. Each listing should show the closest public beach access, practical guest facts, and bigger nearby alternatives. A standalone Beach Access Finder page can reuse the same data so visitors can type any Topsail address and browse the island-wide access inventory.

The prototype must be shareable outside the local machine. The default deployment target is GitHub Pages under the same GitHub Pages account used by the Treasure mockup, with an expected public URL shaped like `https://isaacbeachfun-ship-it.github.io/beach-access-topsail/`.

## Primary User Experience

On a rental detail page, show a "Your Beach Path" module:

1. The closest public beach access from the rental.
2. Estimated distance and walk time.
3. Access address and directions link.
4. Parking details, including paid/free status, app/rate hints, space count, and no-parking warnings.
5. Amenities: restroom, shower, lifeguards if known, dune walkover, beach wheelchair, mats/mobi-mats, ADA accessibility.
6. Media: best available prototype visuals with source labels, plus launch-safe replacement status.
7. Bigger nearby alternatives when the closest access is not the best choice for a guest with gear, accessibility needs, children, or parking needs.

The module should be honest about tradeoffs. If the closest access is a small neighborhood walkover with no parking, say so and highlight a bigger access nearby.

## Access Highlighting

Accesses should not be visually equal. The interface should classify and style them by guest usefulness:

- `Closest`: nearest walking access for the rental or typed address.
- `Major`: large parking lots, restrooms, showers, ADA support, mats, or county/town lots.
- `Facilities`: smaller accesses with restrooms/showers or special accessibility value.
- `Quiet`: small neighborhood walkovers, best on foot and often poor for parking.

Known high-value major accesses from the local master data include:

- Onslow Co. Beach Access #2, North Topsail Beach: 250 spaces, restroom, shower, ADA, beach wheelchair.
- North Topsail Beach Access #34: 217 spaces, ADA, beach wheelchair.
- North Topsail Beach Access #4: 150 spaces, restroom, shower, ADA, beach wheelchair.
- North Topsail Beach Access #33: 100 spaces, ADA, beach wheelchair.
- Surf City Broadway / Access #5: parking, restroom, shower, beach mat, beach wheelchair.
- Surf City Roland / Access #18: restroom, shower, beach wheelchair.

## Data Model

Use a normalized local dataset generated during build/development:

- `data/accesses.json`: canonical Topsail public access inventory from `beach_access_master.csv`.
- `data/access_stats.json`: optional popularity/nearest-property counts derived from Supabase `beach_walk_distances`.
- `data/media_candidates.json`: manually/research-collected media candidates, each with source URL, source type, license/status, and launch-readiness.

Each access object should include:

- Stable id.
- Town/place.
- Name.
- Address.
- Latitude and longitude.
- Access type and water type.
- Parking space count and parking notes.
- Paid parking fields/rates when known.
- Amenity booleans.
- Guest category labels.
- Source and source_detail.
- Media candidate references.

## Lookup Logic

For the first prototype, optimize for fast magical feel:

1. Let the user type a Topsail address.
2. Geocode the address or use a known rental/listing coordinate.
3. Find the nearest access by coordinate distance for instant response.
4. If the address/listing exists in Supabase `beach_walk_distances`, prefer the exact stored walk distance and nearest access.
5. Show a Google Maps directions link for real walking route confirmation.
6. Show bigger nearby alternatives ranked by guest usefulness, not just distance.

Do not pretend straight-line distance is a guaranteed walking route. Label estimates clearly unless the value comes from the existing Supabase walking-distance table.

## Media Policy

For internal concept work, the prototype may use best-looking external/reference images when useful, but every non-owned/non-official image must be visibly marked as `prototype only` or `needs replacement before launch`.

Launch-safe media should come from:

- Owned Treasure photography.
- Official town/government media where usage is allowed.
- Generated placeholder imagery only when it is clearly illustrative.
- Google Street View/Maps embeds or API-rendered views with required attribution, not downloaded screenshots or cached images.

The app should never silently ship scraped copyrighted photos as if they are owned assets.

## Components

- `BeachAccessModule`: rental-detail guest module.
- `AddressLookup`: address input and result trigger.
- `AccessAnswerCard`: closest access result with distance, time, directions, and warnings.
- `AccessMap`: island map with nearest access and major access highlights.
- `MajorAccessAlternates`: practical alternatives for parking/facilities/accessibility.
- `AccessFacts`: amenities, parking, accessibility, rates, source details.
- `AccessMediaGallery`: media candidates with source and launch-readiness status.
- `AccessDirectory`: reusable full island list/filter surface for the standalone guide page.

## Visual Direction

Match the Treasure mockup:

- Coastal Treasure palette: teal, dark teal, parrot teal, shell, foam, sand.
- 8px-radius cards, restrained utility layout, not a generic travel-blog grid.
- Georgia/script accents where the existing mockup uses them.
- Use map + answer-card interaction as the magical centerpiece.
- Highlight major access points with warmer/gold badges so they stand out from smaller walkovers.

Avoid making the page a bland table. Guests should immediately understand "closest," "best parking," and "best facilities."

## Testing And Verification

Before calling the prototype complete:

- Verify source row counts from the local CSV.
- Verify Supabase read-only query results are still accessible or fall back cleanly to local static data.
- Unit-test access scoring/classification and nearest-access lookup.
- Test known sample addresses in North Topsail Beach, Surf City, and Topsail Beach.
- Browser-test the rental-detail module and address lookup on desktop and mobile.
- Verify no non-launch-safe media is unlabeled.
- Verify Google/Street View usage is embed/API-based with attribution, not stored screenshots.
- Verify the production build works under a GitHub Pages subpath.
- Verify the deployed public URL loads and can be shared.

## Non-Goals

- No Supabase writes in the prototype phase.
- No claiming scraped photos are launch-safe.
- No exact walking-route engine in the first version unless existing Supabase walking-distance data covers the address/listing.
- No unrelated Treasure website redesign.
- No local-only final handoff.

## Implementation Plan Direction

Build this as a static or lightweight Vite app first, using generated JSON from the local master CSV and optional read-only Supabase stats. The first visible implementation should be a Treasure-branded rental-detail module with a full island finder page available as a secondary route. The completed prototype should be deployed as a shareable static site, with GitHub Pages as the recommended default.
