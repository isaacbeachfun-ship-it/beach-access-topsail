import { useEffect, useState } from "react";
import aerialViewVideos from "../data/aerialViewVideos.json";
import streetViewStills from "../data/streetViewStills.json";
import { lookupAerialView, type AerialViewResult } from "../lib/aerialView";
import { getGoogleMapsApiKey } from "../lib/mapConfig";
import {
  buildStreetViewStillUrl,
  type StreetViewStill,
} from "../lib/streetView";
import type { AccessMedia, BeachAccess } from "../types/access";

interface AccessMediaGalleryProps {
  access: BeachAccess;
  media: AccessMedia[];
}

type AerialViewState = AerialViewResult | { state: "loading" };
type AerialViewVideoRegistry = Record<
  string,
  {
    state?: string;
    videoId?: string;
    addressSource?: string;
    fallbackDistanceFeet?: number;
  }
>;
type StreetViewStillRegistry = Record<string, StreetViewStill>;
const FAILED_AERIAL_VIEW_STATES = new Set([
  "FAILED",
  "NOT_FOUND",
  "PERMISSION_DENIED",
]);

function statusLabel(status: AccessMedia["status"]): string {
  if (status === "launch-safe") return "Launch safe";
  if (status === "prototype-only") return "Prototype only";
  return "Needs replacement";
}

export function AccessMediaGallery({ access, media }: AccessMediaGalleryProps) {
  const [aerialView, setAerialView] = useState<AerialViewState>({
    state: "unavailable",
  });
  const primary = media[0];
  const aerialRecord = (aerialViewVideos as AerialViewVideoRegistry)[access.id];
  const streetViewStill = (streetViewStills as StreetViewStillRegistry)[access.id];
  const apiKey = getGoogleMapsApiKey();
  const hasApiKey = Boolean(apiKey);
  const streetViewUrl = streetViewStill
    ? buildStreetViewStillUrl(streetViewStill, apiKey)
    : "";
  const isNearbyAerialView = aerialRecord?.addressSource === "nearby-property";
  const aerialBadge = isNearbyAerialView
    ? "Nearby Google Aerial View"
    : "Google Aerial View";
  const aerialLinkLabel = isNearbyAerialView
    ? "View nearby Google aerial video"
    : "View Google aerial video";
  const aerialDescription = isNearbyAerialView
    ? `Nearby photorealistic aerial view around ${access.name} provided by Google Maps.`
    : `Photorealistic aerial view of ${access.name} provided by Google Maps.`;
  const hasKnownFailedAerialView = FAILED_AERIAL_VIEW_STATES.has(
    aerialRecord?.state ?? "",
  );
  const aerialVideoId = hasKnownFailedAerialView
    ? undefined
    : aerialRecord?.videoId;
  const hasAerialMedia =
    aerialView.state === "available" &&
    Boolean(aerialView.thumbnailUrl || aerialView.videoUrl);
  const aerialVideoUrl =
    aerialView.state === "available" ? aerialView.videoUrl : undefined;

  useEffect(() => {
    const currentApiKey = getGoogleMapsApiKey();
    if (!currentApiKey || hasKnownFailedAerialView) {
      setAerialView({ state: "unavailable" });
      return;
    }

    let isCurrent = true;
    setAerialView({ state: "loading" });

    lookupAerialView(access, currentApiKey, fetch, {
      videoId: aerialVideoId,
    }).then((result) => {
      if (isCurrent) setAerialView(result);
    });

    return () => {
      isCurrent = false;
    };
  }, [access, aerialVideoId, hasApiKey, hasKnownFailedAerialView]);

  return (
    <section className="media-panel" aria-labelledby="media-heading">
      <h3 id="media-heading">What it looks like</h3>
      {primary ? (
        <>
          <div className="media-image-wrap">
            <img
              src={primary.url}
              alt={primary.title}
              loading="lazy"
              decoding="async"
            />
            <span className={`media-status media-status-${primary.status}`}>
              {statusLabel(primary.status)}
            </span>
          </div>
          <p className="source-tag">
            {primary.sourceLabel} -{" "}
            <a
              href={primary.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              source
            </a>
          </p>
        </>
      ) : streetViewUrl ? (
        <>
          <div className="media-image-wrap street-view-wrap">
            <img
              src={streetViewUrl}
              alt={`Street View still facing ${access.name} from the nearest Google panorama.`}
              loading="lazy"
              decoding="async"
            />
            <div className="media-overlay-actions">
              <span className="media-status media-status-launch-safe">
                Google Street View
              </span>
              {aerialVideoUrl ? (
                <a
                  className="media-aerial-link"
                  href={aerialVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {aerialLinkLabel}
                </a>
              ) : null}
            </div>
          </div>
          <p className="source-tag aerial-source-tag">
            Google Maps Street View
            {streetViewStill?.date ? (
              <span>Captured {streetViewStill.date}</span>
            ) : null}
            {streetViewStill?.copyright ? (
              <span>{streetViewStill.copyright}</span>
            ) : null}
          </p>
        </>
      ) : hasAerialMedia ? (
        <>
          <div className="media-image-wrap aerial-view-wrap">
            {aerialView.videoUrl ? (
              <video
                aria-label={aerialDescription}
                controls
                muted
                playsInline
                poster={aerialView.thumbnailUrl}
                preload="metadata"
                src={aerialView.videoUrl}
              />
            ) : (
              <img
                src={aerialView.thumbnailUrl}
                alt={aerialDescription}
                loading="lazy"
                decoding="async"
              />
            )}
            <span className="media-status media-status-launch-safe">
              {aerialBadge}
            </span>
          </div>
          <p className="source-tag aerial-source-tag">
            {isNearbyAerialView
              ? "Nearby Google Maps Aerial View"
              : "Google Maps Aerial View"}
            {isNearbyAerialView && aerialRecord?.fallbackDistanceFeet ? (
              <span>{aerialRecord.fallbackDistanceFeet} ft from access</span>
            ) : null}
            {aerialView.captureLabel ? (
              <span>Captured {aerialView.captureLabel}</span>
            ) : null}
            {aerialView.duration ? <span>{aerialView.duration}</span> : null}
          </p>
        </>
      ) : aerialView.state === "loading" ? (
        <div className="media-placeholder">
          <p>Checking Google aerial media.</p>
          <span>Finding the best available view for this access.</span>
        </div>
      ) : (
        <div className="media-placeholder">
          <p>No access-specific media yet.</p>
          <span>
            Use official, owned, embedded, or replacement-ready media before
            launch.
          </span>
        </div>
      )}
    </section>
  );
}
