import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import accessesData from "../data/accesses.json";
import mediaCandidatesData from "../data/mediaCandidates.json";
import { sampleRentals } from "../data/sampleRentals";
import { geocodeTopsailAddress } from "../lib/geocode";
import { loadPropertyAddresses } from "../lib/propertyAddressIndex";
import {
  type LookupPoint,
  findNearestAccessByWalkingRoute,
  formatAccessAddress,
  formatDistanceFeet,
  rankMajorAlternates,
} from "../lib/accessLookup";
import { getGoogleMapsApiKey } from "../lib/mapConfig";
import {
  formatPropertyAddressLabel,
  findExactPropertyAddress,
  propertyToLookupPoint,
  searchPropertyAddresses,
} from "../lib/propertySearch";
import { formatParkingRateSummary } from "../lib/parkingRates";
import type {
  AccessMatch,
  AccessMedia,
  BeachAccess,
  MapLocation,
  PropertyAddress,
} from "../types/access";
import { AccessFeatureList } from "./AccessFeatureIcons";
import { AccessMapSection } from "./AccessMapSection";
import { AccessMediaGallery } from "./AccessMediaGallery";

const accesses = accessesData as BeachAccess[];

export function isLaunchSafeMedia(item: AccessMedia) {
  return item.status === "launch-safe";
}

const media = (mediaCandidatesData as AccessMedia[]).filter(isLaunchSafeMedia);
const SUGGESTION_LIST_ID = "property-address-suggestions";
const townAccessCounts = accesses.reduce<Record<BeachAccess["town"], number>>(
  (counts, access) => {
    counts[access.town] += 1;
    return counts;
  },
  {
    "North Topsail Beach": 0,
    "Surf City": 0,
    "Topsail Beach": 0,
  },
);

interface AccessFinderPageProps {
  embedded?: boolean;
}

export function AccessFinderPage({ embedded = false }: AccessFinderPageProps) {
  const [address, setAddress] = useState("");
  const [match, setMatch] = useState<AccessMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyAddress | null>(null);
  const [lookupPoint, setLookupPoint] = useState<LookupPoint | null>(null);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [propertyAddresses, setPropertyAddresses] = useState<
    PropertyAddress[]
  >([]);

  useEffect(() => {
    let isMounted = true;
    void loadPropertyAddresses().then((addresses) => {
      if (isMounted) setPropertyAddresses(addresses);
    });
    return () => {
      isMounted = false;
    };
  }, []);
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
    [address, propertyAddresses],
  );
  const showSuggestions =
    isSuggestionOpen && address.trim().length > 0 && suggestions.length > 0;

  async function applyLookupPoint(point: LookupPoint) {
    setLookupPoint(point);
    setIsSearching(true);

    try {
      const routeAwareMatch = await findNearestAccessByWalkingRoute(point, accesses, {
        apiKey: getGoogleMapsApiKey(),
      });
      setMatch(routeAwareMatch);
    } finally {
      setIsSearching(false);
    }
  }

  async function runLookup(lookupAddress: string) {
    setError(null);

    if (!lookupAddress.trim()) {
      setMatch(null);
      setLookupPoint(null);
      setError("Enter a Topsail Island address to find the closest beach access.");
      return;
    }

    const exactPropertyMatch = findExactPropertyAddress(
      propertyAddresses,
      lookupAddress,
    );
    const localSuggestions = searchPropertyAddresses(
      propertyAddresses,
      lookupAddress,
      2,
    );
    const propertyMatch =
      selectedProperty &&
      formatPropertyAddressLabel(selectedProperty) === lookupAddress
        ? selectedProperty
        : exactPropertyMatch ??
          (localSuggestions.length === 1 ? localSuggestions[0] : null);

    if (propertyMatch) {
      setSelectedProperty(propertyMatch);
      await applyLookupPoint(propertyToLookupPoint(propertyMatch));
      setIsSuggestionOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const point = await geocodeTopsailAddress(lookupAddress);
      await applyLookupPoint(point);
    } catch (lookupError) {
      setMatch(null);
      setLookupPoint(null);
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
    void applyLookupPoint(propertyToLookupPoint(property));
  }

  const alternates = match ? rankMajorAlternates(match.access, accesses, 3) : [];
  const parkingRateSummary = match
    ? formatParkingRateSummary(match.access)
    : null;
  const mediaForMatch = match
    ? media.filter((item) => item.accessId === match.access.id)
    : [];
  const mapOrigin: MapLocation | undefined = lookupPoint
    ? {
        id: selectedProperty?.id ?? "entered-topsail-address",
        name: selectedProperty
          ? formatPropertyAddressLabel(selectedProperty)
          : "Entered Topsail address",
        address: lookupPoint.address,
        town: selectedProperty?.town,
        latitude: lookupPoint.latitude,
        longitude: lookupPoint.longitude,
      }
    : undefined;

  return (
    <section className="finder-page" id="finder" aria-labelledby="finder-heading">
      <div className="finder-workspace">
        <div className="finder-tool">
          <div className="finder-copy">
            <p className="eyebrow">Beach Access Finder</p>
            <h2 id="finder-heading">
              Type an address. We&rsquo;ll find the beach path.
            </h2>
            <p>
              Use a house address or pick one of the sample addresses. Results
              prioritize the closest public path, then nearby accesses with
              better parking and facilities.
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
                placeholder="204 Goldsboro Dr, North Topsail Beach"
                autoComplete="off"
                enterKeyHint="search"
              />
              <button type="submit" disabled={isSearching}>
                {isSearching ? "Finding..." : "Find Access"}
              </button>
            </form>
            <p className="address-index-note">
              {propertyAddresses.length > 0
                ? `Search ${propertyAddresses.length.toLocaleString()} main-island property addresses from Onslow and Pender GIS.`
                : "Loading the main-island property address index..."}
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
          {isSearching ? (
            <p className="finder-hint" role="status">
              Measuring walking routes to nearby public accesses...
            </p>
          ) : null}
          {match ? (
            <article className="finder-result" aria-live="polite">
              <p className="eyebrow">
                {match.access.accessType === "Neighborhood Beach Access"
                  ? "Neighborhood beach access"
                  : "Closest public access"}
              </p>
              <h3>{match.access.name}</h3>
              <p className="finder-result-address">
                {formatAccessAddress(match.access)}
              </p>
              <div className="metric-row">
                <div>
                  <b>{formatDistanceFeet(match.distanceFeet)}</b>
                  <span>
                    {match.isRouteDistance
                      ? "walking distance"
                      : "straight-line estimate"}
                  </span>
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
              <AccessFeatureList
                access={match.access}
                className="finder-amenities"
              />
              {parkingRateSummary ? (
                <p className="parking-rate-note">{parkingRateSummary}</p>
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
          {match ? (
            <AccessMediaGallery access={match.access} media={mediaForMatch} />
          ) : null}
          {!match && !error ? (
            <p className="finder-hint">
              You&rsquo;ll get the nearest public walkover, an estimated walk
              time, and bigger nearby options with parking and restrooms.
            </p>
          ) : null}
        </div>
        <AccessMapSection
          className="finder-map-panel"
          origin={mapOrigin}
          closest={match}
          alternates={alternates}
          accesses={accesses}
          eyebrow="Interactive Google map"
          heading="Explore every Topsail Island access"
        />
      </div>
      {!embedded ? (
        <>
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
                  <AccessFeatureList
                    access={access}
                    limit={5}
                    variant="compact"
                  />
                </div>
              </article>
            ))}
          </div>
          <section className="seo-guide" aria-labelledby="topsail-access-guide">
            <p className="eyebrow">Topsail Island beach access guide</p>
            <h2 id="topsail-access-guide">
              Find public beach access in North Topsail Beach, Surf City, and
              Topsail Beach
            </h2>
            <p>
              Search a Topsail Island address to find the nearest public beach
              access, compare parking and restroom options, and open walking
              directions. This guide is built for guests looking for North
              Topsail Beach beach accesses, Surf City beach accesses, Topsail
              Beach beach accesses, public beach walkovers, ADA beach access,
              and beach parking before they leave the house.
            </p>
            <div className="seo-town-grid">
              <article>
                <h3>North Topsail Beach beach accesses</h3>
                <p>
                  North Topsail Beach has{" "}
                  {townAccessCounts["North Topsail Beach"].toLocaleString()} mapped
                  public ocean accesses, including quiet Island Drive walkovers
                  and larger county-style parking options such as Onslow Co.
                  Beach Access #2.
                </p>
              </article>
              <article>
                <h3>Surf City beach accesses</h3>
                <p>
                  Surf City has {townAccessCounts["Surf City"].toLocaleString()}{" "}
                  mapped public ocean accesses here, with practical guest choices
                  around Broadway Avenue, Roland Avenue, restrooms, showers, and
                  paid seasonal parking.
                </p>
              </article>
              <article>
                <h3>Topsail Beach beach accesses</h3>
                <p>
                  Topsail Beach has{" "}
                  {townAccessCounts["Topsail Beach"].toLocaleString()} mapped
                  public ocean accesses, useful for visitors comparing North
                  Anderson Boulevard walkovers, small lots, and the closest
                  route from a rental address.
                </p>
              </article>
            </div>
            <p className="seo-disclaimer">
              Parking rules, seasonal fees, ADA mats, and restroom availability
              can change. Use posted town and county signage as the final
              authority when you arrive.
            </p>
          </section>
        </>
      ) : null}
    </section>
  );
}
