import { useState } from "react";
import type { SiteConfig } from "../tenant/types";

// Stock imagery (Unsplash) used only in the hero section.
const unsplash = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const HERO_IMAGES = {
  primary: {
    src: unsplash("photo-1479839672679-a46483c0e7c8", 900),
    alt: "Modern white architecture against a blue sky",
  },
  secondary: {
    src: unsplash("photo-1758873269811-4e62e346b4b7", 800),
    alt: "Team collaborating in a modern office",
  },
  tertiary: {
    src: unsplash("photo-1579487785973-74d2ca7abdd5", 700),
    alt: "Minimal workspace interior",
  },
};

function Logo({ site, className }: { site: SiteConfig; className: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !site.logo) {
    return (
      <span className={`${className} logo-fallback`} aria-hidden="true">
        {site.companyName.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={site.logo}
      alt={`${site.companyName} logo`}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export function SiteLayout({ site }: { site: SiteConfig }) {
  return (
    <main className="hero">
      <div className="hero-glow" aria-hidden="true" />

      <header className="hero-bar">
        <Logo site={site} className="logo" />
        <span className="brand">{site.companyName}</span>
      </header>

      <div className="hero-inner">
        <div className="hero-copy">
          <h1 className="hero-title">{site.title}</h1>
          <p className="hero-desc">{site.description}</p>
        </div>

        <div className="hero-media">
          <figure className="media media-primary">
            <img
              src={HERO_IMAGES.primary.src}
              alt={HERO_IMAGES.primary.alt}
              loading="eager"
              fetchPriority="high"
            />
          </figure>
          <figure className="media media-secondary">
            <img
              src={HERO_IMAGES.secondary.src}
              alt={HERO_IMAGES.secondary.alt}
              loading="eager"
            />
          </figure>
          <figure className="media media-tertiary">
            <img
              src={HERO_IMAGES.tertiary.src}
              alt={HERO_IMAGES.tertiary.alt}
              loading="eager"
            />
          </figure>
        </div>
      </div>
    </main>
  );
}
