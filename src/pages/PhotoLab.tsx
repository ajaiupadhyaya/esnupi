import { useCallback } from "react";

import { useRouteTransition } from "@/components/layout/RouteTransition";
import { CONTACT_MAILTO, HERO } from "@/lib/photoLabData";
import "./photolab.css";

export default function PhotoLab() {
  const routeTransition = useRouteTransition();

  const goHome = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      routeTransition.goto("/");
    },
    [routeTransition],
  );

  return (
    <main className="photolab-root">
      <header className="photolab-masthead">
        <div className="photolab-container">
          <nav className="photolab-nav">
            <a href="/" className="photolab-nav__home" onClick={goHome}>
              <span aria-hidden>←</span> ajaiupadhyaya.com
            </a>
            <span>Film developing &amp; scanning</span>
          </nav>
        </div>
      </header>

      <section className="photolab-hero">
        <div className="photolab-container">
          <h1 className="photolab-hero__name">{HERO.name}</h1>
          <p className="photolab-hero__tagline">{HERO.tagline}</p>
          <p className="photolab-hero__area">{HERO.serviceArea}</p>
          <a className="photolab-cta" href={CONTACT_MAILTO}>
            {HERO.ctaLabel}
          </a>
        </div>
      </section>

      <footer className="photolab-footer">
        <div className="photolab-container">
          <a className="photolab-cta" href={CONTACT_MAILTO}>
            {HERO.ctaLabel}
          </a>
          <p className="photolab-footer__area">{HERO.serviceArea}</p>
        </div>
      </footer>
    </main>
  );
}
