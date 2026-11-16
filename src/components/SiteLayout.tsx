import type { SiteConfig } from "../tenant/types";

export function SiteLayout({ site }: { site: SiteConfig }) {
  return (
    <div className="page">
      <header className="header">
        <img
          src={site.logo}
          alt={`${site.companyName} logo`}
          className="logo"
        />
        <span className="brand">{site.companyName}</span>
      </header>

      <section className="hero">
        <h1>{site.title}</h1>
        <p>{site.description}</p>
      </section>

      <main className="content">
        <article>
          <h2>About us</h2>
          <p>{site.companyName} is committed to quality service.</p>
        </article>
        <article>
          <h2>Our services</h2>
          <p>Placeholder content for services.</p>
        </article>
        <article>
          <h2>Contact</h2>
          <p>Reach out to learn more.</p>
        </article>
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} {site.companyName}
      </footer>
    </div>
  );
}
