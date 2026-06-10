import type { AccessMedia } from "../types/access";

interface AccessMediaGalleryProps {
  media: AccessMedia[];
}

function statusLabel(status: AccessMedia["status"]): string {
  if (status === "launch-safe") return "Launch safe";
  if (status === "prototype-only") return "Prototype only";
  return "Needs replacement";
}

export function AccessMediaGallery({ media }: AccessMediaGalleryProps) {
  const primary = media[0];

  return (
    <section className="media-panel" aria-labelledby="media-heading">
      <h3 id="media-heading">What it looks like</h3>
      {primary ? (
        <>
          <div className="media-image-wrap">
            <img src={primary.url} alt={primary.title} />
            <span className={`media-status media-status-${primary.status}`}>
              {statusLabel(primary.status)}
            </span>
          </div>
          <p className="source-tag">
            {primary.sourceLabel} - <a href={primary.sourceUrl}>source</a>
          </p>
        </>
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
