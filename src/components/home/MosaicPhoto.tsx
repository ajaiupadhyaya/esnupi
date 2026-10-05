import { useEffect, useRef, useState } from "react";
import { ResponsivePicture } from "@/components/ui/ResponsivePicture";
import type { FilmPhoto } from "@/photography/library";

/** Block sizes, coarse to fine — the From outer Space pixelation, run once. */
const STEPS = [40, 26, 16, 10, 6, 3];
const STEP_MS = 110;

/**
 * One frame in the RAW-style grid: a three-line mono caption over a
 * black-and-white print. When it scrolls into view it resolves from big
 * mosaic blocks to the real photograph; hover, focus or a tap develops it to
 * the colour on the negative.
 */
export function MosaicPhoto({ photo, n }: { photo: FilmPhoto; n: number }) {
  const boxRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [resolved, setResolved] = useState(false);
  const [developed, setDeveloped] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const img = box?.querySelector("img");
    if (!box || !canvas || !img) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setResolved(true);
      return;
    }

    let cancelled = false;
    const timers: number[] = [];

    const play = () => {
      if (cancelled) return;
      const w = box.clientWidth;
      const h = box.clientHeight;
      const ctx = canvas.getContext("2d");
      const small = document.createElement("canvas");
      const sctx = small.getContext("2d");
      if (!w || !h || !img.naturalWidth || !ctx || !sctx) {
        setResolved(true);
        return;
      }
      canvas.width = w;
      canvas.height = h;
      // Same placement as object-fit: cover, in destination space. (With a
      // srcset, naturalWidth is density-corrected, so source-rect crops in
      // natural units would land on the wrong bitmap pixels.)
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      STEPS.forEach((b, i) => {
        timers.push(
          window.setTimeout(() => {
            const tw = Math.max(1, Math.ceil(w / b));
            const th = Math.max(1, Math.ceil(h / b));
            small.width = tw;
            small.height = th;
            sctx.drawImage(img, dx / b, dy / b, dw / b, dh / b);
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(small, 0, 0, tw, th, 0, 0, tw * b, th * b);
          }, i * STEP_MS),
        );
      });
      timers.push(window.setTimeout(() => setResolved(true), STEPS.length * STEP_MS + 30));
    };

    const start = () => {
      if (img.complete && img.naturalWidth) play();
      else img.addEventListener("load", play, { once: true });
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(box);

    return () => {
      cancelled = true;
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      img.removeEventListener("load", play);
    };
  }, []);

  return (
    <figure className="ajh-frame">
      <figcaption className="ajh-cap ajh-frame__cap">
        Frame {String(n).padStart(2, "0")}: {photo.title}
        <br />
        {photo.location || "\u00a0"}
        <br />
        {photo.blurb || "\u00a0"}
      </figcaption>
      <button
        ref={boxRef}
        type="button"
        className={`ajh-frame__print${resolved ? " is-resolved" : ""}${developed ? " is-developed" : ""}`}
        aria-pressed={developed}
        aria-label={`${photo.title}. Show in colour`}
        onClick={() => setDeveloped((d) => !d)}
      >
        <ResponsivePicture image={photo.image} alt={photo.title} sizes="(max-width: 900px) 80vw, 260px" />
        <canvas ref={canvasRef} aria-hidden />
      </button>
    </figure>
  );
}
