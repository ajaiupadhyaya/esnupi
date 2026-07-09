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

  return (
    <main className="film-root">
      <header className="film-header">
        <button
          type="button"
          className="film-header__home"
          onClick={() => routeTransition.goto("/")}
        >
          <span aria-hidden>←</span> Ajai Upadhyaya — Film
        </button>
        <span className="film-header__count">{String(PHOTOS.length).padStart(3, "0")} Frames</span>
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

      <footer className="film-footer">
        <span>35mm · 110mm · Scanned</span>
        <span>ajaiupadhyaya.com</span>
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
