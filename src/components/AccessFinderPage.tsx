import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useMemo,
  useState,
} from "react";
import accessesData from "../data/accesses.json";
import propertyAddressesData from "../data/propertyAddresses.json";
import { sampleRentals } from "../data/sampleRentals";
import { geocodeTopsailAddress } from "../lib/geocode";
import {
  findNearestAccess,
  formatAccessAddress,
  formatDistanceFeet,
  rankMajorAlternates,
} from "../lib/accessLookup";
import {
  formatPropertyAddressLabel,
  findExactPropertyAddress,
  propertyToLookupPoint,
  searchPropertyAddresses,
} from "../lib/propertySearch";
import type { AccessMatch, BeachAccess, PropertyAddress } from "../types/access";

const accesses = accessesData as BeachAccess[];
const propertyAddresses = propertyAddressesData as PropertyAddress[];
const SUGGESTION_LIST_ID = "property-address-suggestions";

function amenityTags(access: BeachAccess): string[] {
  const tags: string[] = [];
  if (access.restroom) tags.push("Restroom");
  if (access.shower) tags.push("Shower");
  if (access.lifeguards) tags.push("Lifeguards");
  if (access.handicapAccessible) tags.push("ADA");
  if (access.beachMat || access.mobiMat) tags.push("Beach mat");
  return tags;
}

export function AccessFinderPage() {
  const [address, setAddress] = useState("");
  const [match, setMatch] = useState<AccessMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyAddress | null>(null);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const majorAccesses = useMemo(
    () =>
      accesses
        .filter((access) => (access.usefulnessScore || 0) >= 70)
        .sort((a, b) => (b.usefulnessScore || 0) - (a.usefulnessScore || 0))
        .slice(0, 8),
    [],
  );
  const suggestions = useMemo(
    () => searchPropertyAddresses(propertyAddresses, address, 8),
    [address],
  );
  const showSuggestions =
    isSuggestionOpen && address.trim().length > 0 && suggestions.length > 0;

  function applyLookupPoint(point: {
    address: string;
    latitude: number;
    longitude: number;
  }) {
    setMatch(findNearestAccess(point, accesses));
  }

  async function runLookup(lookupAddress: string) {
    setError(null);

    if (!lookupAddress.trim()) {
      setMatch(null);
      setError("Enter a Topsail Island address to find the closest beach access.");
      return;
    }

    const propertyMatch =
      selectedProperty &&
      formatPropertyAddressLabel(selectedProperty) === lookupAddress
        ? selectedProperty
        : findExactPropertyAddress(propertyAddresses, lookupAddress);

    if (propertyMatch) {
      applyLookupPoint(propertyToLookupPoint(propertyMatch));
      setIsSuggestionOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const point = await geocodeTopsailAddress(lookupAddress);
      applyLookupPoint(point);
    } catch (lookupError) {
      setMatch(null);
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "Address lookup failed.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void runLookup(address);
  }

  function handleAddressChange(event: ChangeEvent<HTMLInputElement>) {
    setAddress(event.target.value);
    setSelectedProperty(null);
      setIsSuggestionOpen(true);
    setActiveSuggestionIndex(-1);
  }

  function handleAddressKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((current) =>
        current >= suggestions.length - 1 ? 0 : current + 1,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
    } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      selectProperty(suggestions[activeSuggestionIndex]);
    } else if (event.key === "Escape") {
      setIsSuggestionOpen(false);
      setActiveSuggestionIndex(-1);
    }
  }

  function selectProperty(property: PropertyAddress) {
    const label = formatPropertyAddressLabel(property);
    setAddress(label);
    setSelectedProperty(property);
    setIsSuggestionOpen(false);
    setActiveSuggestionIndex(-1);
    setError(null);
    applyLookupPoint(propertyToLookupPoint(property));
  }

  const alternates = match ? rankMajorAlternates(match.access, accesses, 3) : [];
  const matchAmenities = match ? amenityTags(match.access) : [];

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
      <div className="finder-search-shell">
        <form className="finder-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={address}
            onChange={handleAddressChange}
            onFocus={() => setIsSuggestionOpen(true)}
            onKeyDown={handleAddressKeyDown}
            aria-label="Topsail property address"
            aria-autocomplete="list"
            aria-controls={SUGGESTION_LIST_ID}
            aria-expanded={showSuggestions}
            aria-activedescendant={
              activeSuggestionIndex >= 0
                ? `${SUGGESTION_LIST_ID}-${suggestions[activeSuggestionIndex].id}`
                : undefined
            }
            role="combobox"
            placeholder="4444 Island Dr, North Topsail Beach"
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="submit" disabled={isSearching}>
            {isSearching ? "Finding..." : "Find Access"}
          </button>
        </form>
        <p className="address-index-note">
          Search {propertyAddresses.length.toLocaleString()} main-island property
          addresses from Onslow and Pender GIS.
        </p>
        {showSuggestions ? (
          <div
            className="address-suggestions"
            id={SUGGESTION_LIST_ID}
            role="listbox"
            aria-label="Matching Topsail property addresses"
          >
            {suggestions.map((property, index) => (
              <button
                aria-selected={index === activeSuggestionIndex}
                className={
                  index === activeSuggestionIndex
                    ? "address-suggestion is-active"
                    : "address-suggestion"
                }
                id={`${SUGGESTION_LIST_ID}-${property.id}`}
                key={property.id}
                onClick={() => selectProperty(property)}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
                type="button"
              >
                <span>
                  <b>{property.address}</b>
                  <small>{property.town}</small>
                </span>
                <small>
                  {property.parcelCount > 1
                    ? `${property.parcelCount} parcels`
                    : property.source}
                </small>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="sample-addresses" aria-label="Sample rental addresses">
        <span className="sample-label">No address handy? Try a sample:</span>
        {sampleRentals.map((rental) => (
          <button
            key={rental.id}
            type="button"
            disabled={isSearching}
            onClick={() => {
              setAddress(rental.address);
              setSelectedProperty(null);
              setIsSuggestionOpen(false);
              void runLookup(rental.address);
            }}
          >
            <b>{rental.town}</b>
            <small>{rental.address.split(",")[0]}</small>
          </button>
        ))}
      </div>
      {error ? (
        <p className="error-message" role="alert">
          {error}
        </p>
      ) : null}
      {match ? (
        <article className="finder-result" aria-live="polite">
          <p className="eyebrow">Closest public access</p>
          <h3>{match.access.name}</h3>
          <p className="finder-result-address">
            {formatAccessAddress(match.access)}
          </p>
          <div className="metric-row">
            <div>
              <b>{formatDistanceFeet(match.distanceFeet)}</b>
              <span>estimated distance</span>
            </div>
            <div>
              <b>{match.estimatedWalkMinutes} min</b>
              <span>estimated walk</span>
            </div>
            <div>
              <b>{match.access.parkingSpots}</b>
              <span>parking spaces</span>
            </div>
          </div>
          {matchAmenities.length > 0 ? (
            <div className="finder-amenities">
              {matchAmenities.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
          <a
            className="primary-action"
            href={match.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open walking directions
          </a>
          {alternates.length > 0 ? (
            <div className="finder-alternates">
              <p>Bigger options nearby</p>
              {alternates.map((alternate) => (
                <span key={alternate.access.id}>
                  <b>{alternate.access.name}</b>
                  {" - "}
                  {alternate.access.parkingSpots} spaces
                </span>
              ))}
            </div>
          ) : null}
        </article>
      ) : null}
      {!match && !error ? (
        <p className="finder-hint">
          You&rsquo;ll get the nearest public walkover, an estimated walk time,
          and bigger nearby options with parking and restrooms.
        </p>
      ) : null}
      <div className="major-heading">
        <p className="eyebrow">Guest favorites</p>
        <h3>Bigger accesses with real parking</h3>
        <p>
          When the closest walkover is tight, these larger public accesses
          across the island have the most parking and the best facilities.
        </p>
      </div>
      <div className="major-directory">
        {majorAccesses.map((access) => (
          <article key={access.id}>
            <b>{access.name}</b>
            <span className="major-town">{access.town}</span>
            <div className="major-tags">
              <span className="tag tag-parking">
                {access.parkingSpots} spaces
              </span>
              {amenityTags(access).map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
