import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * First-visit loading animation for the home page ("Fig. 0"). On the site's blue,
 * white hairlines string down the screen, then beads fall along them and stack
 * into a real binomial sample (a Galton board), so a bell curve builds itself.
 * After a short hold the beads shrink back to bare wires and the overlay fades,
 * revealing the page underneath, which is unchanged.
 *
 * Once per session. Reduced motion or a repeat visit: never shown. Any input
 * (wheel, key, pointer, touch) skips straight to the fade. Decoration only.
 */

const SESSION_KEY = "ajh:galton-intro";
const LINE_ALPHA = 0.22;
const LINE_START = 0.1;
const LINE_DRAW = 0.5;
const LINE_STAGGER = 0.012;
const BEAD_START = 0.5;
const BEAD_SPREAD = 1.0;
const SETTLE = 0.09;
const HOLD = 0.5;
const EXIT = 0.75; // beads shrink, then the overlay fades (CSS)
const SKIP_EXIT = 0.35;

type Bead = { col: number; y: number; start: number; land: number };
type Field = { w: number; h: number; floor: number; pitch: number; cols: number; n: number; draws: number; firstCol: number; d: number; beads: Bead[] };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutCubic = (v: number) => 1 - (1 - v) ** 3;
const easeInOut = (v: number) => (v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2);

function shouldPlay() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

/** mulberry32: small, fast, seedable. */
function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** P(K = floor(n/2)) for K ~ Binomial(n, 1/2): the tallest column's expected share. */
function peakProbability(n: number) {
  let c = 1;
  const k = Math.floor(n / 2);
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
  return c / 2 ** n;
}

function buildField(w: number, h: number, seed: number): Field {
  const floor = Math.round(h * 0.64);
  const narrow = w < 700;
  const cols = Math.max(9, Math.round(w / (narrow ? 26 : 38)));
  const pitch = w / cols;
  // A large n spreads the draws over more columns: a wide bell rather than a spike.
  const n = Math.min(36, cols - 3);
  const nominalRow = pitch * 0.9;
  // Cap the height against the bell's visible width (±2σ) so it reads wider than tall.
  // Phones have few columns, so there the cap comes from the column count instead.
  const visibleWidth = 2 * Math.sqrt(n) * pitch;
  const usable = Math.max(80, Math.min(floor * 0.8, narrow ? (n + 1) * pitch * 1.2 : visibleWidth * 1.05));
  const draws = Math.min(240, Math.max(24, Math.round(((usable / nominalRow) * 0.82) / peakProbability(n))));

  const rand = rng(seed);
  const counts = new Array<number>(n + 1).fill(0);
  const ks: number[] = [];
  for (let i = 0; i < draws; i++) {
    let k = 0;
    for (let j = 0; j < n; j++) if (rand() < 0.5) k++;
    ks.push(k);
    counts[k]++;
  }

  // Lay out from the sample actually drawn, so an unusually tall column still fits.
  const rowPitch = Math.min(nominalRow, usable / Math.max(...counts));
  const d = Math.min(pitch * 0.78, rowPitch * 0.94);
  const firstCol = Math.max(0, Math.round((cols - (n + 1)) / 2));
  const stacked = new Array<number>(n + 1).fill(0);
  const beads = ks.map((k) => {
    const row = stacked[k]++;
    return { col: firstCol + k, y: floor - rowPitch * (row + 0.5), start: 0, land: 0 };
  });

  // Emission speeds up (sparse, then dense); a bead never lands before the one beneath it.
  const lastLand = new Map<number, number>();
  beads.forEach((bead, i) => {
    const emit = BEAD_START + BEAD_SPREAD * Math.sqrt(i / draws);
    const fall = 0.2 + 0.4 * Math.sqrt((bead.y + d) / floor);
    const land = Math.max(emit + fall, (lastLand.get(bead.col) ?? -Infinity) + 0.035);
    bead.start = land - fall;
    bead.land = land;
    lastLand.set(bead.col, land);
  });
  return { w, h, floor, pitch, cols, n, draws, firstCol, d, beads };
}

export function GaltonIntro({ onDone }: { onDone?: () => void }) {
  const [active, setActive] = useState(shouldPlay);
  const [caption, setCaption] = useState<{ text: string; left: number; top: number } | null>(null);
  const [captionOn, setCaptionOn] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null); // CSS transition once leaving
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!active) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* storage blocked */
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const seed = (crypto.getRandomValues?.(new Uint32Array(1))[0] ?? Date.now()) || 1;
    const f = buildField(w, h, seed);
    const buildEnd = Math.max(...f.beads.map((b) => b.land)) + SETTLE;
    setCaption({
      text: `Fig. 0 — ${f.draws} draws, Binomial(${f.n}, ½)`,
      // Under the bell's visible left edge (mean − 2σ), not its empty outer columns.
      left: Math.max(16, (f.firstCol + f.n / 2 - Math.sqrt(f.n)) * f.pitch),
      top: f.floor + 14,
    });

    const t0 = performance.now();
    let exitAt = buildEnd + HOLD; // seconds on the intro clock
    let exitLen = EXIT;
    let raf = 0;
    let finished = false;
    let fadeTimer = 0;
    let captionShown = false;

    const render = (t: number) => {
      const exit = t > exitAt ? clamp01((t - exitAt) / exitLen) : 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const centre = (f.cols - 1) / 2;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(255,255,255,${LINE_ALPHA * (1 - exit)})`;
      for (let c = 0; c < f.cols; c++) {
        const x = Math.round((c + 0.5) * f.pitch) + 0.5;
        const lp = clamp01((t - LINE_START - Math.abs(c - centre) * LINE_STAGGER) / LINE_DRAW);
        if (lp <= 0) continue;
        const len = easeOutCubic(lp) * f.floor;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, len);
        ctx.stroke();
        if (lp < 1) {
          const tip = ctx.createLinearGradient(0, len - 48, 0, len);
          tip.addColorStop(0, "rgba(255,255,255,0)");
          tip.addColorStop(1, "rgba(255,255,255,0.55)");
          ctx.strokeStyle = tip;
          ctx.beginPath();
          ctx.moveTo(x, Math.max(0, len - 48));
          ctx.lineTo(x, len);
          ctx.stroke();
          ctx.strokeStyle = `rgba(255,255,255,${LINE_ALPHA * (1 - exit)})`;
        }
      }

      const r = (f.d / 2) * (1 - easeInOut(clamp01(exit / 0.65)));
      if (r < 0.3) return;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      for (const bead of f.beads) {
        if (t < bead.start) continue;
        let y = bead.y;
        if (t < bead.land) {
          const s = (t - bead.start) / (bead.land - bead.start);
          y = -f.d + (bead.y + f.d) * s * s;
        } else {
          const u = (t - bead.land) / SETTLE;
          if (u < 1) y += 1.5 * Math.sin(Math.PI * u);
        }
        const x = (bead.col + 0.5) * f.pitch;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.fill();
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      removeSkip();
      setActive(false);
      doneRef.current?.();
    };

    const beginExit = (len: number, fadeDelay: number) => {
      setCaptionOn(false);
      setLeaving(`opacity ${len - fadeDelay}s ease ${fadeDelay}s`);
      window.clearTimeout(fadeTimer);
      fadeTimer = window.setTimeout(finish, len * 1000 + 40);
    };

    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      if (!captionShown && t >= buildEnd) {
        captionShown = true;
        setCaptionOn(true);
      }
      if (t >= exitAt && !fadeTimer) beginExit(EXIT, EXIT * 0.35);
      render(t);
      raf = requestAnimationFrame(tick);
    };

    // Any input skips to a quick fade.
    const skip = () => {
      const t = (performance.now() - t0) / 1000;
      if (t >= exitAt) return;
      exitAt = t;
      exitLen = SKIP_EXIT;
      beginExit(SKIP_EXIT, 0);
    };
    const skipEvents = ["wheel", "keydown", "pointerdown", "touchstart"] as const;
    function removeSkip() {
      skipEvents.forEach((type) => window.removeEventListener(type, skip));
    }
    skipEvents.forEach((type) => window.addEventListener(type, skip, { passive: true }));
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fadeTimer);
      removeSkip();
    };
  }, [active]);

  if (!active) return null;
  return createPortal(
    <div
      className="ajh-intro"
      aria-hidden="true"
      data-leaving={leaving === null ? undefined : ""}
      style={leaving === null ? undefined : { transition: leaving }}
    >
      <canvas ref={canvasRef} />
      {caption && (
        <p className="ajh-intro__fig" data-on={captionOn ? "" : undefined} style={{ left: caption.left, top: caption.top }}>
          {caption.text}
        </p>
      )}
    </div>,
    document.body,
  );
}
