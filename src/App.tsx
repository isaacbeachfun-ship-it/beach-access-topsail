import { AccessFinderPage } from "./components/AccessFinderPage";
import accessesData from "./data/accesses.json";
import type { BeachAccess } from "./types/access";

const accesses = accessesData as BeachAccess[];

export default function App() {
  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Topsail Beach Access navigation">
        <a className="brand" href="#finder">
          Topsail Beach Access
        </a>
        <div className="nav-links">
          <a href="#finder">Find Access</a>
          <a href="https://carolinacoastpricing.com">Carolina Coast Pricing</a>
        </div>
      </nav>
      <section className="page-hero">
        <a
          className="eyebrow brand-attribution"
          href="https://carolinacoastpricing.com"
        >
          A free tool from Carolina Coast Pricing
        </a>
        <h1>
          Find the beach access closest to your <span>Topsail stay.</span>
        </h1>
        <p>
          Search any Topsail Island address, see the closest public beach access,
          and compare larger nearby options with parking and facilities.
        </p>
        <div className="hero-actions">
          <a className="hero-cta" href="#finder">
            Start with your address
          </a>
          <span className="hero-fact">
            {accesses.length} public accesses mapped across 3 island towns
          </span>
        </div>
      </section>
      <AccessFinderPage />
    </main>
  );
}
