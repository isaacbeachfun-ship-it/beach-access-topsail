import { formatDistanceFeet, toAccessMatch } from "../lib/accessLookup";
import type { AccessMedia, BeachAccess, RentalSample } from "../types/access";
import { AccessFacts } from "./AccessFacts";
import { AccessMediaGallery } from "./AccessMediaGallery";

interface BeachAccessModuleProps {
  rental: RentalSample;
  closestAccess: BeachAccess;
  alternates: BeachAccess[];
  media: AccessMedia[];
}

export function BeachAccessModule({
  rental,
  closestAccess,
  alternates,
  media,
}: BeachAccessModuleProps) {
  const origin = {
    latitude: rental.latitude,
    longitude: rental.longitude,
    address: rental.address,
  };
  const closest = toAccessMatch(origin, closestAccess);

  return (
    <section
      className="beach-module"
      id="rental"
      aria-labelledby="beach-module-heading"
    >
      <div className="module-copy">
        <p className="eyebrow">Closest public beach access</p>
        <h2 id="beach-module-heading">Your Beach Path</h2>
        <p>
          From <strong>{rental.name}</strong>, the closest public access is{" "}
          <strong>{closestAccess.name}</strong>. Use the bigger alternatives if
          your group needs more parking, restrooms, showers, or accessibility
          support.
        </p>
      </div>

      <div className="module-grid">
        <article className="answer-card">
          <p className="eyebrow">Nearest access</p>
          <h3>{closestAccess.name}</h3>
          <p>{closestAccess.address || "Address not listed"}</p>
          <div className="metric-row">
            <div>
              <b>{formatDistanceFeet(closest.distanceFeet)}</b>
              <span>estimated distance</span>
            </div>
            <div>
              <b>{closest.estimatedWalkMinutes} min</b>
              <span>estimated walk</span>
            </div>
            <div>
              <b>{closestAccess.parkingSpots}</b>
              <span>parking spaces</span>
            </div>
          </div>
          <a className="primary-action" href={closest.directionsUrl}>
            Get walking directions
          </a>
          <p className="accuracy-note">
            Distance is estimated from coordinates unless exact Supabase
            walk-distance data is available for this listing.
          </p>
        </article>

        <AccessMediaGallery media={media} />

        <AccessFacts access={closestAccess} />

        <section
          className="alternates-panel"
          aria-labelledby="alternates-heading"
        >
          <h3 id="alternates-heading">Bigger nearby accesses</h3>
          {alternates.map((access) => (
            <article className="alternate-access" key={access.id}>
              <span>{access.parkingSpots >= 30 ? "Major" : "Facilities"}</span>
              <div>
                <b>{access.name}</b>
                <small>
                  {access.parkingSpots} spaces
                  {access.restroom ? " - restroom" : ""}
                  {access.shower ? " - shower" : ""}
                </small>
              </div>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}
