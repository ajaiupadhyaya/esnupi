/**
 * Entropy — particle field split down the middle into an "order" half
 * (lattice grid drifting back to rest) and a "chaos" half (brownian
 * wanderers). Chaos particles within reach push the ordered lattice
 * off its points; the lattice springs back when the influence fades.
 *
 * Supports two placements:
 *   • Bounded — pass `size` (square, pixels) for a fixed card-style
 *     canvas. This is the original, drop-in primitive.
 *   • Fullscreen — pass `fullscreen` to let the field fill the entire
 *     viewport as a living background. Resizes with the window.
 *
 * Interactive by default: the pointer behaves like a stirrer. Ordered
 * particles within the pointer's reach have their lattice bond weakened
 * and are nudged radially outward; chaos particles are pushed away and
 * also inherit a fraction of the cursor velocity, producing a visible
 * wake when you drag across the page.
 *
 * A simple spatial hash keeps neighbour queries O(N·k) at viewport
 * scale so the full-screen mode stays cheap even on large displays.
 */

import { useEffect, useRef } from "react";

interface EntropyProps {
  className?: string;
  /** Square pixel size when `fullscreen` is false. Default 400. */
  size?: number;
  /** Fill the viewport as a fixed background layer. */
  fullscreen?: boolean;
  /** CSS colour for particles + link lines + divider. Default: white. */
  particleColor?: string;
  /** CSS colour for the wrapper background. Default: black. */
  background?: string;
  /** Alpha (0..1) for the centre divider line. Default 0.3. */
  dividerAlpha?: number;
  /** Target pixel spacing between grid points. Default 16 (bounded)
   *  or 42 (fullscreen) — keeps particle count sane on big screens. */
  spacing?: number;
  /** React to cursor motion. Default true. */
  interactive?: boolean;
}

type Particle = {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  order: boolean;
  vx: number;
  vy: number;
  influence: number;
  /** Index in the particles array — used for the bucket index map. */
  i: number;
};

type Cursor = {
  x: number;
  y: number;
  /** Smoothed velocity in px/frame (ish). */
  vx: number;
  vy: number;
  lastT: number;
  active: boolean;
};

export function Entropy({
  className = "",
  size = 400,
  fullscreen = false,
  particleColor = "#ffffff",
  background = "#000000",
  dividerAlpha = 0.3,
  spacing,
  interactive = true,
}: EntropyProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Keep cursor in a ref so pointer events don't re-run the whole sim effect. */
  const cursorRef = useRef<Cursor | null>(null);

  /* ----- Pointer tracking ---------------------------------------------
   * Kept in its own effect so toggling `interactive` doesn't tear down
   * the simulation. We read window-level pointer events because the
   * canvas itself has pointer-events: none (so it doesn't swallow clicks
   * on UI layered above). Coordinates are converted to canvas-local
   * space so the same logic works for fullscreen and bounded instances.
   */
  useEffect(() => {
    if (!interactive) {
      cursorRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const onMove = (e: PointerEvent) => {
      const { x, y } = toLocal(e.clientX, e.clientY);
      const now = performance.now();
      const prev = cursorRef.current;
      if (prev) {
        const dt = Math.max(8, now - prev.lastT);
        // Exponential smoothing so a sudden jump doesn't fling particles.
        prev.vx = prev.vx * 0.7 + ((x - prev.x) / dt) * 16 * 0.3;
        prev.vy = prev.vy * 0.7 + ((y - prev.y) / dt) * 16 * 0.3;
        prev.x = x;
        prev.y = y;
        prev.lastT = now;
        prev.active = true;
      } else {
        cursorRef.current = {
          x,
          y,
          vx: 0,
          vy: 0,
          lastT: now,
          active: true,
        };
      }
    };

    const onLeave = () => {
      if (cursorRef.current) cursorRef.current.active = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const NEIGHBOR_RADIUS = 100;
    const LINK_RADIUS = 50;
    const CURSOR_RADIUS = 180;

    /** Current canvas logical dimensions (CSS pixels, pre-DPR). */
    let width = 0;
    let height = 0;
    /** Particle grid & spatial bucket storage are rebuilt on resize. */
    let particles: Particle[] = [];
    let bucketCols = 0;
    let bucketRows = 0;
    let buckets: number[][] = [];

    const defaultSpacing = fullscreen ? 42 : Math.max(12, size / 25);
    const targetSpacing = spacing ?? defaultSpacing;

    const measure = () => {
      if (fullscreen) {
        const wrapper = wrapperRef.current;
        width = wrapper?.clientWidth || window.innerWidth;
        height = wrapper?.clientHeight || window.innerHeight;
      } else {
        width = size;
        height = size;
      }
    };

    const sizeCanvas = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const buildParticles = () => {
      particles = [];
      const cols = Math.max(4, Math.round(width / targetSpacing));
      const rows = Math.max(4, Math.round(height / targetSpacing));
      const sx = width / cols;
      const sy = height / rows;
      let idx = 0;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = sx * i + sx / 2;
          const y = sy * j + sy / 2;
          const order = x < width / 2;
          particles.push({
            x,
            y,
            originalX: x,
            originalY: y,
            order,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            influence: 0,
            i: idx++,
          });
        }
      }
    };

    const rebuildBuckets = () => {
      bucketCols = Math.max(1, Math.ceil(width / NEIGHBOR_RADIUS));
      bucketRows = Math.max(1, Math.ceil(height / NEIGHBOR_RADIUS));
      buckets = new Array(bucketCols * bucketRows);
      for (let k = 0; k < buckets.length; k++) buckets[k] = [];
      for (const p of particles) {
        const cx = Math.min(
          bucketCols - 1,
          Math.max(0, Math.floor(p.x / NEIGHBOR_RADIUS)),
        );
        const cy = Math.min(
          bucketRows - 1,
          Math.max(0, Math.floor(p.y / NEIGHBOR_RADIUS)),
        );
        buckets[cy * bucketCols + cx]!.push(p.i);
      }
    };

    /** Yield candidate neighbour indices from the particle's 3x3 bucket neighbourhood. */
    const forNeighbors = (p: Particle, fn: (q: Particle) => void) => {
      const cx = Math.min(
        bucketCols - 1,
        Math.max(0, Math.floor(p.x / NEIGHBOR_RADIUS)),
      );
      const cy = Math.min(
        bucketRows - 1,
        Math.max(0, Math.floor(p.y / NEIGHBOR_RADIUS)),
      );
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const bx = cx + dx;
          const by = cy + dy;
          if (bx < 0 || by < 0 || bx >= bucketCols || by >= bucketRows) continue;
          const bucket = buckets[by * bucketCols + bx];
          if (!bucket) continue;
          for (const idx of bucket) {
            const q = particles[idx]!;
            if (q === p) continue;
            fn(q);
          }
        }
      }
    };

    const init = () => {
      measure();
      sizeCanvas();
      buildParticles();
      rebuildBuckets();
    };

    init();

    /* ----- Resize handling -------------------------------------------
     * Only rebuild when dimensions actually change enough to matter —
     * avoids thrashing when mobile URL bars cause tiny viewport
     * oscillations during scroll.
     */
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const prevW = width;
        const prevH = height;
        measure();
        if (Math.abs(prevW - width) < 2 && Math.abs(prevH - height) < 2) return;
        sizeCanvas();
        buildParticles();
        rebuildBuckets();
      }, 120);
    };
    if (fullscreen) window.addEventListener("resize", onResize);

    let time = 0;
    let animationId = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      if (time % 30 === 0) rebuildBuckets();

      const cursor = cursorRef.current;
      // Cursor velocity decays each frame so motion fades when idle.
      if (cursor) {
        cursor.vx *= 0.9;
        cursor.vy *= 0.9;
      }

      for (const p of particles) {
        // -- Pointer force ------------------------------------------------
        if (cursor && cursor.active) {
          const dx = p.x - cursor.x;
          const dy = p.y - cursor.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CURSOR_RADIUS) {
            const strength = 1 - dist / CURSOR_RADIUS;
            const nx = dist > 0.001 ? dx / dist : 0;
            const ny = dist > 0.001 ? dy / dist : 0;
            if (p.order) {
              p.influence = Math.max(p.influence, strength * 0.9);
              const push = strength * strength * 3.2;
              p.x += nx * push + cursor.vx * strength * 0.25;
              p.y += ny * push + cursor.vy * strength * 0.25;
            } else {
              p.vx += nx * strength * 0.6 + cursor.vx * strength * 0.08;
              p.vy += ny * strength * 0.6 + cursor.vy * strength * 0.08;
            }
          }
        }

        // -- Core update (order returning, chaos wandering) --------------
        if (p.order) {
          const dx = p.originalX - p.x;
          const dy = p.originalY - p.y;

          let chaosX = 0;
          let chaosY = 0;
          forNeighbors(p, (n) => {
            if (n.order) return;
            const d = Math.hypot(p.x - n.x, p.y - n.y);
            if (d >= NEIGHBOR_RADIUS) return;
            const strength = 1 - d / NEIGHBOR_RADIUS;
            chaosX += n.vx * strength;
            chaosY += n.vy * strength;
            if (strength > p.influence) p.influence = strength;
          });

          p.x += dx * 0.05 * (1 - p.influence) + chaosX * p.influence;
          p.y += dy * 0.05 * (1 - p.influence) + chaosY * p.influence;
          p.influence *= 0.99;
        } else {
          p.vx += (Math.random() - 0.5) * 0.5;
          p.vy += (Math.random() - 0.5) * 0.5;
          p.vx *= 0.95;
          p.vy *= 0.95;
          p.x += p.vx;
          p.y += p.vy;

          const midline = width / 2;
          if (p.x < midline || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          p.x = Math.max(midline, Math.min(width, p.x));
          p.y = Math.max(0, Math.min(height, p.y));
        }
      }

      // -- Draw particles + links -------------------------------------
      for (const p of particles) {
        const alpha = p.order ? 0.8 - p.influence * 0.5 : 0.8;
        ctx.fillStyle = withAlpha(particleColor, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Links — only draw each edge once by requiring n.i > p.i.
        forNeighbors(p, (n) => {
          if (n.i <= p.i) return;
          const d = Math.hypot(p.x - n.x, p.y - n.y);
          if (d >= LINK_RADIUS) return;
          const lineAlpha = 0.2 * (1 - d / LINK_RADIUS);
          ctx.strokeStyle = withAlpha(particleColor, lineAlpha);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
        });
      }

      // -- Divider ----------------------------------------------------
      if (dividerAlpha > 0) {
        ctx.strokeStyle = withAlpha(particleColor, dividerAlpha);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
      }

      time++;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.clearTimeout(resizeTimer);
      if (fullscreen) window.removeEventListener("resize", onResize);
    };
  }, [size, particleColor, fullscreen, dividerAlpha, spacing]);

  const style: React.CSSProperties = fullscreen
    ? {
        position: "fixed",
        inset: 0,
        background,
        pointerEvents: "none",
      }
    : { width: size, height: size, background };

  return (
    <div
      ref={wrapperRef}
      className={`${fullscreen ? "" : "relative"} ${className}`.trim()}
      style={style}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className={
          fullscreen
            ? "block h-full w-full"
            : "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        }
      />
    </div>
  );
}

/**
 * Accepts any CSS color string and appends an alpha channel. Keeps the
 * path fast for hex (most common here) and falls back to color-mix for
 * anything else the browser can parse.
 */
function withAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const hexMatch = /^#([0-9a-f]{6})$/i.exec(color);
  if (hexMatch) {
    const hex = Math.round(a * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${hexMatch[1]}${hex}`;
  }
  const shortHex = /^#([0-9a-f]{3})$/i.exec(color);
  if (shortHex) {
    const [r, g, b] = shortHex[1]!.split("");
    const hex = Math.round(a * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${r}${r}${g}${g}${b}${b}${hex}`;
  }
  return `color-mix(in srgb, ${color} ${Math.round(a * 100)}%, transparent)`;
}
