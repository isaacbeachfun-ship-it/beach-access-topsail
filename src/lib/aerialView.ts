import type { BeachAccess } from "../types/access";

type AerialViewFetch = (
  input: string,
  init?: RequestInit,
) => Promise<Pick<Response, "json" | "ok" | "status">>;

interface AerialViewUriSet {
  landscapeUri?: string;
  portraitUri?: string;
}

interface AerialViewCaptureDate {
  year?: number;
  month?: number;
  day?: number;
}

interface AerialViewMetadata {
  state?: string;
  videoId?: string;
  captureDate?: AerialViewCaptureDate;
  duration?: string;
}

interface AerialViewPayload {
  state?: string;
  videoId?: string;
  metadata?: AerialViewMetadata;
  uris?: {
    IMAGE?: AerialViewUriSet;
    MP4_HIGH?: AerialViewUriSet;
    MP4_LOW?: AerialViewUriSet;
  };
}

export interface AerialViewAvailable {
  state: "available";
  videoId?: string;
  thumbnailUrl?: string;
  portraitThumbnailUrl?: string;
  videoUrl?: string;
  captureLabel?: string;
  duration?: string;
}

export type AerialViewResult =
  | AerialViewAvailable
  | { state: "processing"; videoId?: string }
  | { state: "unavailable" }
  | { state: "error" };

interface LookupAerialViewOptions {
  videoId?: string;
}

const AERIAL_VIEW_ENDPOINT =
  "https://aerialview.googleapis.com/v1/videos:lookupVideo";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function buildAerialViewAddress(
  access: Pick<BeachAccess, "address" | "town">,
): string | null {
  const cleanedAddress = access.address?.replace(/\s*,+\s*$/, "").trim();
  if (!cleanedAddress) return null;
  return `${cleanedAddress}, ${access.town}, NC`;
}

export function extractAerialViewMedia(
  payload: AerialViewPayload,
): AerialViewResult {
  const metadata: AerialViewMetadata = payload.metadata ?? {
    state: payload.state,
    videoId: payload.videoId,
  };
  const state = metadata.state ?? payload.state;
  const videoId = metadata.videoId ?? payload.videoId;

  if (state === "PROCESSING") {
    return { state: "processing", videoId };
  }

  const image = payload.uris?.IMAGE;
  const video = payload.uris?.MP4_HIGH ?? payload.uris?.MP4_LOW;
  const thumbnailUrl = image?.landscapeUri ?? image?.portraitUri;
  const videoUrl = video?.landscapeUri ?? video?.portraitUri;

  if (state !== "ACTIVE" || (!thumbnailUrl && !videoUrl)) {
    return { state: "unavailable" };
  }

  return {
    state: "available",
    videoId,
    thumbnailUrl,
    portraitThumbnailUrl: image?.portraitUri,
    videoUrl,
    captureLabel: formatCaptureDate(metadata.captureDate),
    duration: metadata.duration,
  };
}

export async function lookupAerialView(
  access: Pick<BeachAccess, "address" | "town">,
  apiKey: string,
  fetcher: AerialViewFetch = fetch,
  options: LookupAerialViewOptions = {},
): Promise<AerialViewResult> {
  const address = buildAerialViewAddress(access);
  const videoId = options.videoId?.trim();
  if (!apiKey || (!address && !videoId)) return { state: "unavailable" };

  const url = new URL(AERIAL_VIEW_ENDPOINT);
  url.searchParams.set("key", apiKey);
  if (videoId) {
    url.searchParams.set("videoId", videoId);
  } else if (address) {
    url.searchParams.set("address", address);
  }

  try {
    const response = await fetcher(url.toString());
    if (response.status === 404) return { state: "unavailable" };
    if (!response.ok) return { state: "error" };

    return extractAerialViewMedia((await response.json()) as AerialViewPayload);
  } catch {
    return { state: "error" };
  }
}

function formatCaptureDate(date?: AerialViewCaptureDate): string | undefined {
  if (!date?.year || !date.month || !date.day) return undefined;
  const month = MONTH_LABELS[date.month - 1];
  if (!month) return undefined;
  return `${month} ${date.day}, ${date.year}`;
}
