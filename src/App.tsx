import { AccessFinderPage } from "./components/AccessFinderPage";
import { AccessMap } from "./components/AccessMap";
import { BeachAccessModule } from "./components/BeachAccessModule";
import { MediaNotes } from "./components/MediaNotes";
import accessesData from "./data/accesses.json";
import mediaCandidates from "./data/mediaCandidates.json";
import { sampleRentals } from "./data/sampleRentals";
import { findNearestAccess, rankMajorAlternates } from "./lib/accessLookup";
import type { AccessMedia, BeachAccess } from "./types/access";

const accesses = accessesData as BeachAccess[];
const media = mediaCandidates as AccessMedia[];

export default function App() {
  const rental = sampleRentals[0];
  const closest = findNearestAccess(
    {
      latitude: rental.latitude,
      longitude: rental.longitude,
      address: rental.address,
    },
    accesses,
  );
  const alternates = rankMajorAlternates(closest.access, accesses, 3);
  const mediaForClosest = media.filter((item) => item.accessId === closest.access.id);

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Treasure demo navigation">
        <a className="brand" href="#finder">
          Treasure Vacation Rentals
        </a>
        <div className="nav-links">
          <a href="#finder">Find Access</a>
          <a href="#example-rental">Example Rental</a>
          <a href="#media-notes">Media</a>
        </div>
      </nav>
      <section className="page-hero">
        <p className="eyebrow">Topsail Island, North Carolina</p>
        <h1>
          Find the beach access closest to your <span>Topsail stay.</span>
        </h1>
        <p>
          A Treasure-branded prototype for helping guests type an address, see
          the nearest public access, and spot the bigger nearby options with
          better parking and facilities.
        </p>
      </section>
      <AccessFinderPage />
      <BeachAccessModule
        sectionId="example-rental"
        eyebrow="Example rental detail"
        heading="Example: Your Beach Path"
        intro={
          <>
            This sample uses <strong>{rental.name}</strong> only to show how the
            feature can live on a Treasure listing page. Guests starting from
            the standalone page should use the address finder above.
          </>
        }
        rental={rental}
        closestAccess={closest.access}
        alternates={alternates.map((alternate) => alternate.access)}
        media={mediaForClosest}
      />
      <AccessMap rental={rental} closest={closest} alternates={alternates} />
      <MediaNotes />
    </main>
  );
}
