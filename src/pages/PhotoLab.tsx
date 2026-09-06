import { useCallback, useMemo } from "react";

import { useRouteTransition } from "@/components/layout/RouteTransition";
import { ResponsivePicture } from "@/components/ui/ResponsivePicture";
import {
  ABOUT_COPY,
  BEFORE_YOU_SEND,
  BULK_DISCOUNT,
  CONTACT_MAILTO,
  FAQ,
  HERO,
  PRICING,
  PROCESS_STEPS,
  RUSH_FEE,
  RUSH_TURNAROUND,
  SCAN_ONLY_PRICING,
  STANDARD_TURNAROUND,
} from "@/lib/photoLabData";
import { buildFilmPhotoLibrary } from "@/photography/library";
import "./photolab.css";

const GALLERY_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

export default function PhotoLab() {
  const routeTransition = useRouteTransition();

  const galleryPhotos = useMemo(() => buildFilmPhotoLibrary().slice(0, 8), []);

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

      <section className="photolab-section">
        <div className="photolab-container">
          <h2 className="photolab-section__heading">Services &amp; pricing</h2>
          <table className="photolab-pricing-table">
            <caption>Prices are per roll. Turnaround: {STANDARD_TURNAROUND}.</caption>
            <thead>
              <tr>
                <th scope="col">Process</th>
                <th scope="col">Format</th>
                <th scope="col">Develop only</th>
                <th scope="col">Develop + scan</th>
              </tr>
            </thead>
            <tbody>
              {PRICING.map((row) => (
                <tr key={`${row.process}-${row.format}`}>
                  <td>{row.label}</td>
                  <td>{row.format}</td>
                  <td>${row.developOnly}</td>
                  <td>${row.developAndScan}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="photolab-pricing-note">
            Already have negatives? Scan-only —{" "}
            {SCAN_ONLY_PRICING.map((row, i) => (
              <span key={row.format}>
                {i > 0 ? ", " : ""}
                {row.format}: ${row.price}
              </span>
            ))}
            . Rush ({RUSH_TURNAROUND}): +${RUSH_FEE} per order. {BULK_DISCOUNT.minRolls}+
            rolls in one order: {BULK_DISCOUNT.percentOff}% off developing.
          </p>
        </div>
      </section>

      <section className="photolab-section">
        <div className="photolab-container">
          <h2 className="photolab-section__heading">How it works</h2>
          <div className="photolab-process">
            {PROCESS_STEPS.map((step) => (
              <article className="photolab-process__step" key={step.step}>
                <p className="photolab-process__number">{String(step.step).padStart(2, "0")}</p>
                <h3 className="photolab-process__title">{step.title}</h3>
                <p className="photolab-process__body">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {galleryPhotos.length > 0 && (
        <section className="photolab-section">
          <div className="photolab-container">
            <h2 className="photolab-section__heading">Scans from the lab</h2>
            <div className="photolab-gallery">
              {galleryPhotos.map((photo) => (
                <div className="photolab-gallery__cell" key={photo.id}>
                  <ResponsivePicture image={photo.image} alt="" sizes={GALLERY_SIZES} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="photolab-section photolab-about">
        <div className="photolab-container">
          <h2 className="photolab-section__heading">{ABOUT_COPY.heading}</h2>
          {ABOUT_COPY.paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="photolab-section">
        <div className="photolab-container">
          <h2 className="photolab-section__heading">Before you send film</h2>
          <ul className="photolab-checklist">
            {BEFORE_YOU_SEND.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="photolab-section">
        <div className="photolab-container">
          <h2 className="photolab-section__heading">FAQ</h2>
          <div className="photolab-faq">
            {FAQ.map((entry) => (
              <div className="photolab-faq__item" key={entry.q}>
                <h3 className="photolab-faq__q">{entry.q}</h3>
                <p className="photolab-faq__a">{entry.a}</p>
              </div>
            ))}
          </div>
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
