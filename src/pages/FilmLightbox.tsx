import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { ResponsivePicture } from "@/components/ui/ResponsivePicture";
import type { FilmPhoto } from "@/photography/library";

type FilmLightboxProps = {
  photos: FilmPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

const FOCUSABLE = 'button, [href], [tabindex]:not([tabindex="-1"])';

function pad(n: number) {
  return String(n).padStart(3, "0");
}

/**
 * Full-bleed viewer for a single frame.
 *
 * Rendered through a portal into <body> so no ancestor transform or stacking
 * context can trap `position: fixed`. `data-lenis-prevent` is the hook
 * `LenisGsapProvider` looks for — without it, global smooth scroll keeps
 * driving the page underneath the overlay.
 */
export function FilmLightbox({ photos, index, onIndexChange, onClose }: FilmLightboxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const count = photos.length;
  const photo = photos[index];

  const step = useCallback(
    (delta: number) => {
      if (count === 0) return;
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange],
  );

  /* Keyboard: step, close, and trap Tab inside the dialog. */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
        return;
      }
      if (e.key !== "Tab") return;

      const root = rootRef.current;
      if (!root) return;
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;

      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, step]);

  /* Lock the page behind the overlay. */
  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  /* Warm the neighbours so stepping does not flash. */
  useEffect(() => {
    if (count < 2) return;
    for (const neighbour of [photos[(index + 1) % count], photos[(index - 1 + count) % count]]) {
      if (!neighbour) continue;
      const img = new Image();
      img.src = neighbour.image.img.src;
    }
  }, [count, index, photos]);

  const onBackdropMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if ((e.target as HTMLElement).dataset.filmBackdrop !== undefined) onClose();
    },
    [onClose],
  );

  if (!photo) return null;

  return createPortal(
    <div
      ref={rootRef}
      className="film-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.title}, frame ${index + 1} of ${count}`}
      data-lenis-prevent
      data-film-backdrop
      onMouseDown={onBackdropMouseDown}
    >
      <div className="film-lightbox__bar">
        <span className="film-lightbox__counter">
          {pad(index + 1)} / {pad(count)}
        </span>
        <button ref={closeRef} type="button" className="film-lightbox__close" onClick={onClose}>
          close <span aria-hidden>(esc)</span>
        </button>
      </div>

      <div className="film-lightbox__stage" data-film-backdrop>
        <ResponsivePicture
          key={photo.id}
          image={photo.image}
          alt={photo.title}
          sizes="100vw"
          loading="eager"
          decoding="async"
        />
      </div>

      <div className="film-lightbox__foot">
        <div className="film-lightbox__caption">
          <h2 className="film-lightbox__title">{photo.title}</h2>
          {photo.location || photo.blurb ? (
            <p className="film-lightbox__meta">
              {photo.location ? <span>{photo.location}</span> : null}
              {photo.blurb ? <span>{photo.blurb}</span> : null}
            </p>
          ) : null}
        </div>

        <div className="film-lightbox__nav">
          <button type="button" className="film-lightbox__step" onClick={() => step(-1)}>
            <span aria-hidden>←</span> prev
          </button>
          <button type="button" className="film-lightbox__step" onClick={() => step(1)}>
            next <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
