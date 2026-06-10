import { AccessFinderPage } from "./components/AccessFinderPage";
import { AccessMap } from "./components/AccessMap";
import { BeachAccessModule } from "./components/BeachAccessModule";
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
  const exactMedia = media.filter((item) => item.accessId === closest.access.id);
  const mediaForClosest = exactMedia.length > 0 ? exactMedia : media.slice(0, 1);

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Treasure demo navigation">
        <a className="brand" href="#rental">
          Treasure Vacation Rentals
        </a>
        <div className="nav-links">
          <a href="#rental">Rental Detail</a>
          <a href="#finder">Beach Access Finder</a>
        </div>
      </nav>
      <section className="page-hero">
        <p className="eyebrow">Topsail Island, North Carolina</p>
        <h1>
          Find your rental. Find your <span>beach path.</span>
        </h1>
        <p>
          A Treasure-branded prototype for helping guests understand the closest
          access, bigger nearby alternatives, parking, amenities, and media.
        </p>
      </section>
      <BeachAccessModule
        rental={rental}
        closestAccess={closest.access}
        alternates={alternates.map((alternate) => alternate.access)}
        media={mediaForClosest}
      />
      <AccessMap rental={rental} closest={closest} alternates={alternates} />
      <AccessFinderPage />
    </main>
  );
}
