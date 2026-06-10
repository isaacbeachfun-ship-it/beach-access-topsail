export default function App() {
  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Treasure demo navigation">
        <a className="brand" href="#rental">
          Treasure Vacation Rentals
        </a>
        <div className="nav-links">
          <a href="#rental">Rental Detail</a>
          <a href="#finder">Beach Access Finder</a>
        </div>
      </nav>
      <section className="page-hero">
        <p className="eyebrow">Topsail Island, North Carolina</p>
        <h1>
          Find your rental. Find your <span>beach path.</span>
        </h1>
        <p>
          A Treasure-branded prototype for helping guests understand the closest
          access, bigger nearby alternatives, parking, amenities, and media.
        </p>
      </section>
    </main>
  );
}
