import { useCallback, useEffect, useRef, useState } from "react";

import { playPageTurn } from "@/lib/retroMacSounds";
import { cn } from "@/lib/utils";

import { SLIDES } from "@/slides/slides";

/**
 * Slideshow — the portfolio viewer, properly.
 *
 *   - Full-bleed image (contain) with a black background.
 *   - Arrow keys or the onscreen buttons navigate.
 *   - Metadata fades in from the bottom over 400 ms, hides after 4 s unless the
 *     user keeps moving the cursor.
 *   - F toggles fullscreen; onFullscreen lifts the window to fill the
 *     desktop area (handled by the parent because we don't own geometry).
 *   - Crossfade on slide change.
 *   - The ¶ glyph surfaces the note overlay for slides that carry one.
 *   - A soft paper burst plays on every advance.
 */

type SlideshowPanelProps = {
  /** When set, invokes `onToggleFullscreen` to signal the window to maximize. */
  onToggleFullscreen?: (next: boolean) => void;
  isFullscreen?: boolean;
};

export function SlideshowPanel({
  onToggleFullscreen,
  isFullscreen = false,
}: SlideshowPanelProps) {
  const [index, setIndex] = useState(0);
  const [metaVisible, setMetaVisible] = useState(true);
  const [noteOpen, setNoteOpen] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const total = SLIDES.length;
  const slide = SLIDES[index] ?? SLIDES[0];

  const showMeta = useCallback(() => {
    setMetaVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setMetaVisible(false), 4_000);
  }, []);

  const advance = useCallback(
    (direction: 1 | -1) => {
      setIndex((i) => (i + direction + total) % total);
      setNoteOpen(false);
      playPageTurn();
      showMeta();
    },
    [total, showMeta],
  );

  /* Reveal metadata on each slide change. */
  useEffect(() => {
    showMeta();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [index, showMeta]);

  /* Keyboard shortcuts when window is focused. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        advance(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        advance(-1);
      } else if (e.key === "f" || e.key === "F") {
        onToggleFullscreen?.(!isFullscreen);
      } else if (e.key === "Escape" && noteOpen) {
        setNoteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, onToggleFullscreen, isFullscreen, noteOpen]);

  if (!slide) return null;

  const counter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  return (
    <section
      className="prog-slideshow"
      aria-label="Slideshow"
      onMouseMove={showMeta}
    >
      <div className="prog-slideshow__stage">
        {SLIDES.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.title}
            className={cn(
              "prog-slideshow__image",
              i === index && "prog-slideshow__image--visible",
            )}
            draggable={false}
          />
        ))}
      </div>

      <button
        type="button"
        className="prog-slideshow__nav prog-slideshow__nav--prev"
        onClick={() => advance(-1)}
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        type="button"
        className="prog-slideshow__nav prog-slideshow__nav--next"
        onClick={() => advance(1)}
        aria-label="Next slide"
      >
        ›
      </button>

      <div
        className={cn(
          "prog-slideshow__meta",
          metaVisible && "prog-slideshow__meta--visible",
        )}
      >
        <div className="prog-slideshow__meta-title">{slide.title}</div>
        <div className="prog-slideshow__meta-row">
          {slide.year} · {slide.medium}
          {slide.dimensions ? ` · ${slide.dimensions}` : ""}
        </div>
      </div>

      <div className="prog-slideshow__counter">{counter}</div>

      {slide.note && (
        <button
          type="button"
          className="prog-slideshow__note-toggle"
          aria-label="Show note"
          onClick={() => setNoteOpen((v) => !v)}
        >
          ¶
        </button>
      )}

      {onToggleFullscreen && (
        <button
          type="button"
          className="prog-slideshow__fullscreen"
          onClick={() => onToggleFullscreen(!isFullscreen)}
        >
          {isFullscreen ? "EXIT FULL SCREEN" : "FULL SCREEN"}
        </button>
      )}

      {slide.note && noteOpen && (
        <div
          className="prog-slideshow__note"
          role="note"
          onClick={() => setNoteOpen(false)}
        >
          <p>{slide.note}</p>
        </div>
      )}
    </section>
  );
}
