import { useCallback, useEffect, useRef, useState } from "react";

import { useRouteTransition } from "@/components/layout/RouteTransition";
import { ResponsivePicture } from "@/components/ui/ResponsivePicture";
import { buildFilmPhotoLibrary } from "@/photography/library";
import { FilmLightbox } from "./FilmLightbox";
import "./film.css";

/* Built once at module scope. `library.ts` runs an eager `import.meta.glob`, so
 * this shares the desktop Photos window's catalog rather than re-globbing. */
const PHOTOS = buildFilmPhotoLibrary();

/* imagetools only emits 1024w and 2048w (commit 2629995 dropped 480w to hold
 * the Vercel build under three minutes), so a cell downloads the 1024w file.
 * `sizes` still lets the browser pick the smaller of the two. */
const GRID_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1440px) 25vw, 20vw";

/* The count here is authored, not derived — "seventy-five" reads better than a
 * numeral in a Times paragraph. The numeral beside it IS derived, so if the
 * manifest grows, this sentence is the one thing that needs a human. */
const DESCRIPTION =
  "Seventy-five frames on 35mm and 110 — Ektar 400, Kodak Gold, unlabelled Fuji, one roll of Lomochrome. Scanned at home. In no order.";

export default function Film() {
  const routeTransition = useRouteTransition();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /* The site is dark-only; `body` carries a dark Tailwind background. Flag the
   * root element so the field, overscroll, and scrollbars follow the device. */
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-film-page", "");
    return () => el.removeAttribute("data-film-page");
  }, []);

  /* Focus lands on the frame the viewer was *last showing*, not the cell that
   * opened it. Stepping to 017 and closing should leave you at 017 — the grid
   * stays in sync with what you were looking at, and `focus()` scrolls it into
   * view. Returning to the invoking cell would jump the page backwards. */
  const close = useCallback(() => {
    const lastViewed = openIndex;
    setOpenIndex(null);
    if (lastViewed !== null) {
      window.requestAnimationFrame(() => cellRefs.current[lastViewed]?.focus());
    }
  }, [openIndex]);

  /* A real <a>, so it can be middle-clicked and copied, but routed through the
   * CRT transition on a plain click. */
  const goHome = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      routeTransition.goto("/");
    },
    [routeTransition],
  );

  return (
    <main className="film-root">
      <header className="film-masthead">
        <nav className="film-nav">
          <a href="/" className="film-nav__home" onClick={goHome}>
            <span aria-hidden>←</span> ajaiupadhyaya.com
          </a>
          <span className="film-nav__count">{String(PHOTOS.length).padStart(3, "0")} frames</span>
        </nav>

        <div className="film-title-block">
          <h1 className="film-title">Film</h1>
          <p className="film-desc">{DESCRIPTION}</p>
        </div>
      </header>

      <div className="film-grid">
        {PHOTOS.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            className="film-cell"
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
            aria-label={
              photo.location ? `Open ${photo.title}, ${photo.location}` : `Open ${photo.title}`
            }
            onClick={() => setOpenIndex(i)}
          >
            <ResponsivePicture image={photo.image} alt="" sizes={GRID_SIZES} />
            <span className="film-cell__caption" aria-hidden="true">
              <span className="film-cell__index">{String(i + 1).padStart(3, "0")}</span>
              <span className="film-cell__title">{photo.title}</span>
            </span>
          </button>
        ))}
      </div>

      <hr className="film-hr" />

      <footer className="film-footer">
        <span>35mm · 110 · scanned at home</span>
        <span>ajai upadhyaya</span>
      </footer>

      {openIndex !== null ? (
        <FilmLightbox
          photos={PHOTOS}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={close}
        />
      ) : null}
    </main>
  );
}
