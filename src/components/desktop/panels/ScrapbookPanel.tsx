import { DateTime } from "luxon";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SharedPhoto } from "@/lib/photobookStore";
import { playMacTypeTick } from "@/lib/retroMacSounds";

type Props = {
  photos: SharedPhoto[];
  loading: boolean;
  error: string | null;
  sharedEnabled: boolean;
};

type Lightbox = { photo: SharedPhoto; rect: DOMRect } | null;

/** Deterministic pseudo-random hash for layout parameters. */
function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

type PolaroidPos = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
};

/** Scatter photos across a corkboard, letting them overlap by design. */
function computeLayout(photos: SharedPhoto[], cols: number): { positions: PolaroidPos[]; height: number } {
  const cardW = 200;
  const cardH = 240;
  const stepX = cardW * 0.85;
  const stepY = cardH * 0.7;
  const positions: PolaroidPos[] = photos.map((p, i) => {
    const h = hashString(p.id);
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = ((h % 31) - 15) * 0.6;
    const jitterY = (((h >> 2) % 29) - 14) * 0.8;
    const rotation = (((h >> 4) % 61) - 30) / 10;
    return {
      id: p.id,
      x: col * stepX + jitterX + 20,
      y: row * stepY + jitterY + 20,
      rotation,
      zIndex: (h % 20) + 1,
    };
  });
  const height = Math.max(400, Math.ceil(photos.length / cols) * stepY + 60);
  return { positions, height };
}

export function ScrapbookPanel({ photos, loading, error, sharedEnabled }: Props) {
  const cols = 4;
  const { positions, height } = useMemo(() => computeLayout(photos, cols), [photos]);
  const posById = useMemo(
    () => Object.fromEntries(positions.map((p) => [p.id, p])),
    [positions],
  );
  const [lightbox, setLightbox] = useState<Lightbox>(null);
  const lightboxImgRef = useRef<HTMLImageElement>(null);
  const corkRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set());

  /* Fall-into-place + pin sound when new polaroids appear. The first batch
     is staggered so the whole board assembles; subsequent additions drop
     individually. Respects prefers-reduced-motion. */
  useEffect(() => {
    const cork = corkRef.current;
    if (!cork) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const firstBatch = seenIds.current.size === 0;
    const newEls: HTMLElement[] = [];
    photos.forEach((photo) => {
      if (!seenIds.current.has(photo.id)) {
        seenIds.current.add(photo.id);
        const el = cork.querySelector<HTMLElement>(`[data-polaroid-id="${photo.id}"]`);
        if (el) newEls.push(el);
      }
    });
    if (reduced || newEls.length === 0) return;
    newEls.forEach((el, i) => {
      const delay = firstBatch ? i * 0.06 : 0;
      gsap.fromTo(
        el,
        { y: -60, opacity: 0, rotate: -8, scale: 0.94 },
        {
          y: 0,
          opacity: 1,
          rotate: 0,
          scale: 1,
          duration: 0.6,
          delay,
          ease: "back.out(1.6)",
          onComplete: () => {
            /* soft pin sound on settle */
            playMacTypeTick();
          },
        },
      );
    });
  }, [photos]);

  const openLightbox = (photo: SharedPhoto, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setLightbox({ photo, rect });
    requestAnimationFrame(() => {
      const img = lightboxImgRef.current;
      if (!img) return;
      const targetW = Math.min(window.innerWidth * 0.8, 900);
      const targetH = Math.min(window.innerHeight * 0.8, 1100);
      gsap.fromTo(
        img,
        {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          rotation: 0,
        },
        {
          top: window.innerHeight / 2 - targetH / 2,
          left: window.innerWidth / 2 - targetW / 2,
          width: targetW,
          height: targetH,
          rotation: 0,
          duration: 0.6,
          ease: "expo.out",
        },
      );
    });
  };

  const closeLightbox = () => {
    const img = lightboxImgRef.current;
    if (!img || !lightbox) {
      setLightbox(null);
      return;
    }
    gsap.to(img, {
      top: lightbox.rect.top,
      left: lightbox.rect.left,
      width: lightbox.rect.width,
      height: lightbox.rect.height,
      duration: 0.45,
      ease: "power3.in",
      onComplete: () => setLightbox(null),
    });
  };

  return (
    <section className="mac-scrapbook">
      <header className="mac-scrapbook__header">
        <h3 className="mac-type-metadata">Scrapbook</h3>
        <p className="mac-scrapbook__note">
          {photos.length} portraits pinned to cork. Some catch the light.
        </p>
      </header>

      {!sharedEnabled && (
        <p className="mac-scrapbook__warning">Shared storage is not configured.</p>
      )}
      {error && <p className="mac-scrapbook__warning">{error}</p>}
      {loading && <p className="mac-scrapbook__empty">Loading shared collection…</p>}

      {!loading && photos.length === 0 ? (
        <p className="mac-scrapbook__empty">
          No portraits yet. Open Photobooth to add the first visitor photo.
        </p>
      ) : (
        <div ref={corkRef} className="mac-scrapbook__cork" style={{ height }}>
          {photos.map((photo) => {
            const p = posById[photo.id];
            if (!p) return null;
            return (
              <button
                key={photo.id}
                data-polaroid-id={photo.id}
                type="button"
                className="mac-scrapbook__polaroid"
                style={{
                  left: p.x,
                  top: p.y,
                  zIndex: p.zIndex,
                  ["--rot" as never]: `${p.rotation}deg`,
                }}
                onClick={(e) => openLightbox(photo, e.currentTarget)}
              >
                <img src={photo.image_url} alt="" loading="lazy" />
                <figcaption className="mac-scrapbook__stamp">
                  {DateTime.fromISO(photo.created_at).toFormat("dd LLL yyyy")}
                </figcaption>
              </button>
            );
          })}
        </div>
      )}

      {lightbox && (
        <div
          className="mac-scrapbook__backdrop"
          role="dialog"
          aria-label="Photo lightbox"
          onClick={closeLightbox}
        >
          <img
            ref={lightboxImgRef}
            className="mac-scrapbook__lightbox-img"
            src={lightbox.photo.image_url}
            alt=""
          />
        </div>
      )}
    </section>
  );
}
