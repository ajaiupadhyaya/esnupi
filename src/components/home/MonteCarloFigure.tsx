import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fig. 1 on the home panel. Six hundred geometric Brownian motion paths are
 * rasterised into a density field, then printed 1-bit with a per-pixel random
 * threshold, so the fan reads like the photocopied static on the RAW covers
 * rather than a chart. Hover reads the 5th/95th percentile at that day; click
 * (or Enter) pixelates the plate away and runs a new seed.
 */

const W = 240;
const H = 264;
const N = 600;
const BATCH = 6;
const LO = Math.log(50);
const HI = Math.log(195);
const INK = 0.07;
const DAYS = 252;

type Params = { seed: number; vol: number; drift: number };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function yOf(price: number) {
  return (1 - (Math.log(price) - LO) / (HI - LO)) * (H - 1);
}

function simulate({ seed, vol, drift }: Params) {
  const r = rng(seed);
  const gauss = () => {
    const u = 1 - r();
    const v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const dt = 1 / (W - 1);
  const mu = (drift - 0.5 * vol * vol) * dt;
  const sd = vol * Math.sqrt(dt);
  const paths = new Float32Array(N * W);
  for (let i = 0; i < N; i++) {
    let s = 100;
    paths[i * W] = s;
    for (let x = 1; x < W; x++) {
      s *= Math.exp(mu + sd * gauss());
      paths[i * W + x] = s;
    }
  }
  // Threshold plate: uniform noise plus a little photocopier dust.
  const thresh = new Float32Array(W * H);
  for (let i = 0; i < thresh.length; i++) thresh[i] = r() < 0.006 ? -1 : r();
  return { paths, thresh };
}

function caption(p: Params) {
  return `seed ${p.seed}, vol ${Math.round(p.vol * 100)}%`;
}

export function MonteCarloFigure() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sim = useRef<{ paths: Float32Array; thresh: Float32Array; density: Float32Array; drawn: number } | null>(null);
  const raf = useRef(0);
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const [params, setParams] = useState<Params>({ seed: 2027, vol: 0.22, drift: 0.06 });
  const [hover, setHover] = useState<{ left: number; y5: number; y95: number; text: string } | null>(null);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const s = sim.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !s || !ctx) return;
    const img = ctx.createImageData(W, H);
    const px = img.data;
    for (let i = 0; i < W * H; i++) {
      const tone = 1 - Math.exp(-s.density[i] * INK);
      const v = tone > s.thresh[i] ? 0 : 255;
      const o = i * 4;
      px[o] = v;
      px[o + 1] = v;
      px[o + 2] = v;
      px[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  const inkPaths = useCallback((from: number, to: number) => {
    const s = sim.current;
    if (!s) return;
    for (let i = from; i < to; i++) {
      let prev = Math.round(yOf(s.paths[i * W]));
      for (let x = 1; x < W; x++) {
        const y = Math.round(yOf(s.paths[i * W + x]));
        const a = Math.max(0, Math.min(prev, y));
        const b = Math.min(H - 1, Math.max(prev, y));
        for (let yy = a; yy <= b; yy++) s.density[yy * W + x] += 1;
        prev = y;
      }
    }
    s.drawn = to;
  }, []);

  const run = useCallback(
    (p: Params) => {
      cancelAnimationFrame(raf.current);
      const { paths, thresh } = simulate(p);
      sim.current = { paths, thresh, density: new Float32Array(W * H), drawn: 0 };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        inkPaths(0, N);
        paint();
        busy.current = false;
        return;
      }
      const step = () => {
        const s = sim.current;
        if (!s) return;
        inkPaths(s.drawn, Math.min(N, s.drawn + BATCH));
        paint();
        if (s.drawn < N) raf.current = requestAnimationFrame(step);
        else busy.current = false;
      };
      raf.current = requestAnimationFrame(step);
    },
    [inkPaths, paint],
  );

  useEffect(() => {
    busy.current = true;
    run(params);
    const pending = timers.current;
    return () => {
      cancelAnimationFrame(raf.current);
      pending.forEach((t) => window.clearTimeout(t));
    };
    // First plate only; reseeds are driven by `reseed`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reseed = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    const r = Math.random;
    const next: Params = {
      seed: 1000 + Math.floor(r() * 9000),
      vol: 0.12 + r() * 0.42,
      drift: -0.04 + r() * 0.16,
    };
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canvas || !ctx || reduce) {
      setParams(next);
      run(next);
      return;
    }
    // Pixelate the current plate away (the From outer Space mosaic), then run.
    const snap = document.createElement("canvas");
    snap.width = W;
    snap.height = H;
    snap.getContext("2d")?.drawImage(canvas, 0, 0);
    const small = document.createElement("canvas");
    const sctx = small.getContext("2d");
    [3, 6, 12, 20, 32].forEach((b, i) => {
      timers.current.push(
        window.setTimeout(() => {
          if (!sctx) return;
          small.width = Math.ceil(W / b);
          small.height = Math.ceil(H / b);
          sctx.drawImage(snap, 0, 0, small.width, small.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(small, 0, 0, small.width, small.height, 0, 0, small.width * b, small.height * b);
        }, i * 50),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, W, H);
        setParams(next);
        run(next);
      }, 280),
    );
  }, [run]);

  const onMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const s = sim.current;
    if (!s || s.drawn < 20) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.max(0, Math.min(W - 1, Math.floor(((e.clientX - rect.left) / rect.width) * W)));
    const vals = new Float32Array(s.drawn);
    for (let i = 0; i < s.drawn; i++) vals[i] = s.paths[i * W + col];
    vals.sort();
    const p5 = vals[Math.floor(0.05 * (s.drawn - 1))];
    const p95 = vals[Math.floor(0.95 * (s.drawn - 1))];
    const day = Math.round((col / (W - 1)) * DAYS);
    setHover({
      left: (col / W) * 100,
      y5: (yOf(p5) / H) * 100,
      y95: (yOf(p95) / H) * 100,
      text: `day ${day}: 5% ${p5.toFixed(1)}, 95% ${p95.toFixed(1)}`,
    });
  }, []);

  return (
    <figure className="ajh-fig">
      <figcaption className="ajh-cap ajh-fig__cap">
        Fig. 1: Monte Carlo,
        <br />
        {N} price paths, one year
        <br />
        {hover ? hover.text : caption(params)}
      </figcaption>
      <button
        type="button"
        className="ajh-fig__plate"
        onClick={reseed}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        aria-label={`Monte Carlo simulation, ${caption(params)}. Press to run a new seed.`}
      >
        <canvas ref={canvasRef} width={W} height={H} />
        {hover && (
          <span className="ajh-fig__x" style={{ left: `${hover.left}%` }} aria-hidden>
            <i style={{ top: `${hover.y95}%` }} />
            <i style={{ top: `${hover.y5}%` }} />
          </span>
        )}
      </button>
    </figure>
  );
}
