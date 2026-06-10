import mediaCandidates from "../data/mediaCandidates.json";
import type { AccessMedia } from "../types/access";

const media = mediaCandidates as AccessMedia[];

function statusLabel(status: AccessMedia["status"]): string {
  if (status === "launch-safe") return "Launch safe";
  if (status === "prototype-only") return "Prototype only";
  return "Needs replacement";
}

export function MediaNotes() {
  return (
    <section className="media-notes" id="media-notes" aria-labelledby="media-notes-heading">
      <div className="media-notes-copy">
        <p className="eyebrow">Current media status</p>
        <h2 id="media-notes-heading">Photos in this mockup</h2>
        <p>
          This prototype currently has {media.length} reference visuals from
          the Treasure mockup. They make the concept feel alive, but they are
          not a complete photo set for every beach access and should be replaced
          with owned, official, embedded, or explicitly licensed access-specific
          media before public launch.
        </p>
      </div>

      <div className="media-note-grid">
        {media.map((item) => (
          <article className="media-note-card" key={item.id}>
            <div className="media-note-image">
              <img src={item.url} alt={item.title} loading="lazy" decoding="async" />
              <span className={`media-status media-status-${item.status}`}>
                {statusLabel(item.status)}
              </span>
            </div>
            <div>
              <h3>{item.title}</h3>
              <p>
                Connected access id: <code>{item.accessId}</code>
              </p>
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                {item.sourceLabel}
              </a>
            </div>
          </article>
        ))}
      </div>

      <p className="media-warning">
        Best next move: photograph the major accesses first, then fill smaller
        walkovers with town or county media only when the usage rights are clear.
      </p>
    </section>
  );
}
