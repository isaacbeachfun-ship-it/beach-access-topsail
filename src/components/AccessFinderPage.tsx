import { type FormEvent, useMemo, useState } from "react";
import accessesData from "../data/accesses.json";
import { geocodeTopsailAddress } from "../lib/geocode";
import {
  findNearestAccess,
  formatDistanceFeet,
  rankMajorAlternates,
} from "../lib/accessLookup";
import type { AccessMatch, BeachAccess } from "../types/access";

const accesses = accessesData as BeachAccess[];

export function AccessFinderPage() {
  const [address, setAddress] = useState("305 S Shore Dr, Surf City, NC 28445");
  const [match, setMatch] = useState<AccessMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const majorAccesses = useMemo(
    () =>
      accesses
        .filter((access) => (access.usefulnessScore || 0) >= 70)
        .sort((a, b) => (b.usefulnessScore || 0) - (a.usefulnessScore || 0))
        .slice(0, 8),
    [],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const point = await geocodeTopsailAddress(address);
      setMatch(findNearestAccess(point, accesses));
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "Address lookup failed.",
      );
    }
  }

  const alternates = match ? rankMajorAlternates(match.access, accesses, 3) : [];

  return (
    <section className="finder-page" id="finder" aria-labelledby="finder-heading">
      <div className="finder-copy">
        <p className="eyebrow">Beach Access Finder</p>
        <h2 id="finder-heading">Type an address. Treasure finds the beach path.</h2>
      </div>
      <form className="finder-form" onSubmit={handleSubmit}>
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          aria-label="Topsail address"
        />
        <button type="submit">Find Access</button>
      </form>
      {error ? <p className="error-message">{error}</p> : null}
      {match ? (
        <article className="finder-result">
          <h3>{match.access.name}</h3>
          <p>
            {formatDistanceFeet(match.distanceFeet)} estimated from this address
            - {match.estimatedWalkMinutes} min walk
          </p>
          <a href={match.directionsUrl}>Open walking directions</a>
          <div className="finder-alternates">
            {alternates.map((alternate) => (
              <span key={alternate.access.id}>{alternate.access.name}</span>
            ))}
          </div>
        </article>
      ) : null}
      <div className="major-directory">
        {majorAccesses.map((access) => (
          <article key={access.id}>
            <b>{access.name}</b>
            <span>
              {access.town} - {access.parkingSpots} spaces
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
