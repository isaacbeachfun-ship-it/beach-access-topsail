import { type FormEvent, useMemo, useState } from "react";
import accessesData from "../data/accesses.json";
import { sampleRentals } from "../data/sampleRentals";
import { geocodeTopsailAddress } from "../lib/geocode";
import {
  findNearestAccess,
  formatDistanceFeet,
  rankMajorAlternates,
} from "../lib/accessLookup";
import type { AccessMatch, BeachAccess } from "../types/access";

const accesses = accessesData as BeachAccess[];

export function AccessFinderPage() {
  const [address, setAddress] = useState("");
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

    if (!address.trim()) {
      setMatch(null);
      setError("Enter a Topsail Island address to find the closest beach access.");
      return;
    }

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
        <p>
          Use a house address or pick one of the sample rental addresses. Results
          prioritize the closest public path, then nearby accesses with better
          parking and facilities.
        </p>
      </div>
      <form className="finder-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          aria-label="Topsail address"
          placeholder="305 S Shore Dr, Surf City, NC 28445"
          autoComplete="street-address"
          enterKeyHint="search"
        />
        <button type="submit">Find Access</button>
      </form>
      <div className="sample-addresses" aria-label="Sample rental addresses">
        {sampleRentals.map((rental) => (
          <button
            key={rental.id}
            type="button"
            onClick={() => {
              setAddress(rental.address);
              setMatch(null);
              setError(null);
            }}
          >
            {rental.town}
          </button>
        ))}
      </div>
      {error ? <p className="error-message">{error}</p> : null}
      {match ? (
        <article className="finder-result">
          <h3>{match.access.name}</h3>
          <p>
            {formatDistanceFeet(match.distanceFeet)} estimated from this address
            - {match.estimatedWalkMinutes} min walk
          </p>
          <a
            href={match.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open walking directions
          </a>
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
