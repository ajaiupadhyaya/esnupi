import { mulberry32, pick, range } from "./random";

/**
 * Builds Hydra code that is fully determined by `seed` (one variant per visit).
 * Keep outputs as `.out()` on o0 — Hydra defaults to the first output.
 */
export function buildRandomHydraSketch(seed: number): string {
  const r = mulberry32(seed);

  const templates: (() => string)[] = [
    () => {
      const f = range(r, 2, 28);
      const sy = range(r, 0.01, 0.25);
      const off = range(r, 0.2, 2.8);
      const rot = range(r, 0.02, 0.6);
      const k = Math.floor(range(r, 3, 9));
      return `osc(${f}, ${sy}, ${off}).rotate(${rot}).kaleid(${k}).colorama(${range(r, 0.1, 0.9)}).out()`;
    },
    () => {
      const sc = range(r, 2, 18);
      const sm = range(r, 0.05, 0.35);
      return `noise(${sc}, ${sm}).color(${range(r, 0.2, 1)}, ${range(r, 0.2, 1)}, ${range(r, 0.2, 1)}).rotate(${range(r, 0.05, 0.4)}).out()`;
    },
    () => {
      const sides = Math.floor(range(r, 3, 9));
      return `shape(${sides}, ${range(r, 0.2, 0.9)}, ${range(r, 0.01, 0.3)})
  .repeat(${range(r, 2, 5)}, ${range(r, 2, 5)})
  .scrollX(${range(r, 0.05, 0.35)}, ${range(r, 0.01, 0.12)})
  .colorama(${range(r, 0.15, 0.85)})
  .out()`;
    },
    () => {
      return `voronoi(${range(r, 5, 35)}, ${range(r, 0.01, 0.2)}, ${range(r, 0.05, 0.9)})
  .rotate(${range(r, 0.05, 0.5)})
  .color(${range(r, 0.3, 1)}, ${range(r, 0.1, 0.8)}, ${range(r, 0.2, 1)})
  .out()`;
    },
    () => {
      return `gradient(${range(r, 0.05, 0.35)})
  .rotate(${range(r, 0.05, 0.35)})
  .saturate(${range(r, 0.5, 2)})
  .colorama(${range(r, 0.1, 0.7)})
  .out()`;
    },
    () => {
      const a = range(r, 6, 22);
      const b = range(r, 3, 14);
      return `osc(${a}, ${range(r, 0.05, 0.2)}, ${range(r, 0.5, 2)})
  .modulate(osc(${b}, ${range(r, 0.02, 0.15)}, ${range(r, 0.3, 1.8)}), ${range(r, 0.05, 0.35)})
  .rotate(${range(r, 0.02, 0.25)})
  .out()`;
    },
    () => {
      return `noise(${range(r, 8, 24)}, ${range(r, 0.1, 0.4)})
  .modulateScale(osc(${range(r, 8, 18)}, ${range(r, 0.05, 0.2)}, ${range(r, 0.5, 2)}), ${range(r, 0.1, 0.6)})
  .thresh(${range(r, 0.2, 0.75)})
  .out()`;
    },
    () => {
      return `osc(${range(r, 10, 30)}, ${range(r, 0.02, 0.18)}, ${range(r, 0.8, 2.2)})
  .add(noise(${range(r, 4, 14)}, ${range(r, 0.05, 0.25)}), ${range(r, 0.1, 0.5)})
  .pixelate(${Math.floor(range(r, 10, 120))}, ${Math.floor(range(r, 10, 120))})
  .out()`;
    },
    () => {
      return `shape(${Math.floor(range(r, 4, 8))}, ${range(r, 0.25, 0.75)}, ${range(r, 0.02, 0.2)})
  .modulate(voronoi(${range(r, 8, 28)}, ${range(r, 0.02, 0.15)}, ${range(r, 0.2, 0.8)}), ${range(r, 0.08, 0.35)})
  .kaleid(${Math.floor(range(r, 3, 7))})
  .out()`;
    },
    () => {
      return `osc(${range(r, 4, 16)}, ${range(r, 0.01, 0.12)}, ${range(r, 0.5, 2)})
  .scrollY(${range(r, 0.1, 0.5)}, ${range(r, 0.02, 0.1)})
  .diff(noise(${range(r, 6, 18)}, ${range(r, 0.1, 0.35)}))
  .colorama(${range(r, 0.2, 0.95)})
  .out()`;
    },
  ];

  const base = pick(r, templates)();

  const extras = [
    "",
    `speed = ${range(r, 0.6, 1.4)}`,
    `speed = ${range(r, 0.4, 1.2)}; bpm = ${Math.floor(range(r, 20, 90))}`,
  ];
  const pre = pick(r, extras);
  return pre ? `${pre}\n${base}` : base;
}

export function buildFallbackSketch(): string {
  return "osc(10, 0.05, 1.2).rotate(0.15).out()";
}
