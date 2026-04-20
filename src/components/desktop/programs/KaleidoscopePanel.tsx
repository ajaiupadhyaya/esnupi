import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { playInkDrop } from "@/lib/retroMacSounds";

/**
 * Kaleidoscope — After Dark by way of 2026. A radial-symmetric painting toy.
 *
 *   - Mouse movement paints a trail of colored dots. The canvas is reflected
 *     across N radial segments (2–16, even values only, default 8).
 *   - Colour cycles through the HSL hue wheel at 0.5 degrees per frame.
 *   - Paint persists until CLEAR fades the canvas to black over 800ms.
 *   - SAVE exports a PNG via canvas.toBlob.
 *   - Canvas state survives minimize/restore because we hold the raw pixels
 *     in a ref that outlives the visible component.
 */

const DEFAULT_SEGMENTS = 8;
const MIN_SEGMENTS = 2;
const MAX_SEGMENTS = 16;

export function KaleidoscopePanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hueRef = useRef(0);
  const lastPaintRef = useRef({ x: 0, y: 0, time: 0, moving: false });
  const symmetryRef = useRef(DEFAULT_SEGMENTS);
  const [segments, setSegments] = useState<number>(DEFAULT_SEGMENTS);
  /* When the window becomes visible again we blit the preserved pixel data
     back onto the freshly mounted canvas. */
  const imageSnapshotRef = useRef<ImageData | null>(null);
  const fadingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  /* Set up the canvas at mount, restore any preserved paint. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const host = canvas.parentElement;
    if (!host) return;
    const { width, height } = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    if (imageSnapshotRef.current) {
      ctx.putImageData(imageSnapshotRef.current, 0, 0);
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      paintAt(ctx, canvas, x, y);
      const now = performance.now();
      if (!lastPaintRef.current.moving || now - lastPaintRef.current.time > 200) {
        playInkDrop();
        lastPaintRef.current.time = now;
      }
      lastPaintRef.current.x = x;
      lastPaintRef.current.y = y;
      lastPaintRef.current.moving = true;
      window.clearTimeout(stopTimer);
      stopTimer = window.setTimeout(() => {
        lastPaintRef.current.moving = false;
      }, 120);
    };
    let stopTimer: number = 0;
    canvas.addEventListener("pointermove", onMove);

    /* Hue cycle regardless of mouse motion. */
    const loop = () => {
      hueRef.current = (hueRef.current + 0.5) % 360;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      canvas.removeEventListener("pointermove", onMove);
      window.clearTimeout(stopTimer);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      try {
        /* Save pixels so the next mount (after minimize/restore) can restore. */
        imageSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        imageSnapshotRef.current = null;
      }
    };
  }, []);

  const paintAt = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    x: number,
    y: number,
  ) => {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const n = symmetryRef.current;
    const hue = hueRef.current;
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < n; i += 1) {
      const rot = (i / n) * Math.PI * 2;
      ctx.save();
      ctx.rotate(rot);
      ctx.fillStyle = `hsl(${hue + i * (360 / n)}, 85%, 60%)`;
      ctx.beginPath();
      ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      /* Mirror every other segment for true kaleidoscope reflection. */
      ctx.scale(-1, 1);
      ctx.beginPath();
      ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };

  const onSymmetryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    let n = Number.parseInt(e.target.value, 10);
    if (!Number.isFinite(n)) n = DEFAULT_SEGMENTS;
    if (n % 2 !== 0) n += 1;
    n = Math.max(MIN_SEGMENTS, Math.min(MAX_SEGMENTS, n));
    symmetryRef.current = n;
    setSegments(n);
  }, []);

  const onClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || fadingRef.current) return;
    fadingRef.current = true;
    const start = performance.now();
    const duration = 800;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.08 + p * 0.12})`;
      const rect = canvas.getBoundingClientRect();
      ctx.fillRect(0, 0, rect.width, rect.height);
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, rect.width, rect.height);
        fadingRef.current = false;
      }
    };
    requestAnimationFrame(step);
  }, []);

  const onSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `esnupi-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    });
  }, []);

  return (
    <section className="prog-kaleidoscope" aria-label="Kaleidoscope">
      <div className="prog-kaleidoscope__canvas-wrap">
        <canvas ref={canvasRef} className="prog-kaleidoscope__canvas" />
      </div>
      <div className="prog-kaleidoscope__controls">
        <label className="prog-kaleidoscope__symmetry">
          <span>SYMMETRY</span>
          <input
            type="range"
            min={MIN_SEGMENTS}
            max={MAX_SEGMENTS}
            step={2}
            value={segments}
            onChange={onSymmetryChange}
          />
          <span className="prog-kaleidoscope__symmetry-value">{segments}</span>
        </label>
        <button type="button" className="prog-kaleidoscope__btn" onClick={onClear}>
          CLEAR
        </button>
        <button type="button" className="prog-kaleidoscope__btn" onClick={onSave}>
          SAVE
        </button>
      </div>
    </section>
  );
}
