import type { ReactNode } from "react";
import {
  formatAccessAddress,
  formatDistanceFeet,
  toAccessMatch,
} from "../lib/accessLookup";
import type { AccessMedia, BeachAccess, RentalSample } from "../types/access";
import { AccessFacts } from "./AccessFacts";
import { AccessFeatureList } from "./AccessFeatureIcons";
import { AccessMediaGallery } from "./AccessMediaGallery";

interface BeachAccessModuleProps {
  sectionId?: string;
  eyebrow?: string;
  heading?: string;
  intro?: ReactNode;
  rental: RentalSample;
  closestAccess: BeachAccess;
  alternates: BeachAccess[];
  media: AccessMedia[];
}

export function BeachAccessModule({
  sectionId = "rental",
  eyebrow = "Closest public beach access",
  heading = "Your Beach Path",
  intro,
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
      id={sectionId}
      aria-labelledby="beach-module-heading"
    >
      <div className="module-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="beach-module-heading">{heading}</h2>
        <p>
          {intro ?? (
            <>
              From <strong>{rental.name}</strong>, the closest public access is{" "}
              <strong>{closestAccess.name}</strong>. Use the bigger alternatives
              if your group needs more parking, restrooms, showers, or
              accessibility support.
            </>
          )}
        </p>
      </div>

      <div className="module-grid">
        <article className="answer-card">
          <p className="eyebrow">Nearest access</p>
          <h3>{closestAccess.name}</h3>
          <p>{formatAccessAddress(closestAccess, "Address not listed")}</p>
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
          <AccessFeatureList
            access={closestAccess}
            className="answer-feature-list"
          />
          <a
            className="primary-action"
            href={closest.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Get walking directions
          </a>
          <p className="accuracy-note">
            Distance is estimated from coordinates unless exact Supabase
            walk-distance data is available for this listing.
          </p>
        </article>

        <AccessMediaGallery access={closestAccess} media={media} />

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
                <AccessFeatureList
                  access={access}
                  limit={3}
                  variant="compact"
                  className="alternate-feature-list"
                />
              </div>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}
