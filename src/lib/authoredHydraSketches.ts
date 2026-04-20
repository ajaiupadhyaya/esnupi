/**
 * Five authored Hydra moods + one Konami-only "ARCHIVE" sixth mood.
 * Each one is deliberately composed to sit behind Platinum chrome.
 *
 * Keep every sketch terminated with `.out(o0)` — `HydraBackground` renders o0.
 */

export type HydraMoodId =
  | "DEAD_CHANNEL"
  | "AQUARIUM"
  | "THERMAL"
  | "INTERFERENCE"
  | "EMPTY_ROOM"
  | "ARCHIVE";

/** Static noise, near-black, slow horizontal drift. TV between stations. */
const DEAD_CHANNEL = `
solid(0, 0, 0).out(o0);
noise(64, 0.02)
  .color(0.9, 0.9, 0.9)
  .luma(0.52, 0.0)
  .brightness(-0.28)
  .modulate(osc(0.4, 0, 0).rotate(Math.PI / 2), 0.01)
  .blend(osc(0, 0.02, 0).rotate(Math.PI / 2).thresh(0.985, 0.0), 0.6)
  .out(o0);
`;

/** Slow blue-green voronoi, underwater calm. Desktop floats above like a raft. */
const AQUARIUM = `
voronoi(8, 0.1, 0.6)
  .color(0.08, 0.52, 0.55)
  .modulate(noise(2, 0.08), 0.06)
  .rotate(0.05, 0.02)
  .brightness(-0.05)
  .saturate(0.9)
  .out(o0);
`;

/** Deep orange-red gradient with slow noise warp. The machine is warm. Too warm. */
const THERMAL = `
gradient(0.04)
  .color(1.1, 0.35, 0.08)
  .modulate(noise(3, 0.05), 0.12)
  .rotate(0.25)
  .saturate(1.15)
  .brightness(-0.08)
  .out(o0);
`;

/** Two osc signals beating. Thin chromatic lines. Migraine-adjacent. Beautiful. */
const INTERFERENCE = `
osc(22, 0.02, 0.9)
  .diff(osc(19, 0.018, 0.9).rotate(Math.PI / 2))
  .thresh(0.42, 0.03)
  .color(0.95, 0.4, 1.1)
  .brightness(-0.15)
  .modulate(noise(1, 0.02), 0.005)
  .out(o0);
`;

/** Near-white noise with a single slow-drifting dark shape. A room with one piece of furniture. */
const EMPTY_ROOM = `
noise(12, 0.02)
  .color(0.92, 0.92, 0.9)
  .brightness(0.2)
  .blend(
    shape(60, 0.18, 0.22)
      .color(0.08, 0.08, 0.08)
      .scrollX(() => Math.sin(time * 0.05) * 0.25)
      .scrollY(() => Math.cos(time * 0.04) * 0.12),
    0.35
  )
  .out(o0);
`;

/** ARCHIVE — Konami-only. Deep indigo + gold, slow and ceremonial. */
const ARCHIVE = `
osc(3, 0.01, 0.0)
  .color(0.18, 0.1, 0.42)
  .modulate(osc(5, 0.02, 1.2).rotate(0.4), 0.08)
  .add(
    voronoi(20, 0.05, 0.8)
      .color(1.0, 0.75, 0.2)
      .thresh(0.92, 0.01),
    0.9
  )
  .saturate(1.1)
  .brightness(-0.05)
  .out(o0);
`;

export const AUTHORED_HYDRA_SKETCHES: Record<HydraMoodId, string> = {
  DEAD_CHANNEL,
  AQUARIUM,
  THERMAL,
  INTERFERENCE,
  EMPTY_ROOM,
  ARCHIVE,
};

/** Matrix-mode override (terminal `matrix` command): green-dominant. */
export const MATRIX_SKETCH = `
noise(8, 0.08)
  .color(0.05, 1.0, 0.2)
  .brightness(-0.15)
  .luma(0.3, 0.05)
  .modulate(osc(4, 0.02).rotate(Math.PI / 2), 0.02)
  .out(o0);
`;
