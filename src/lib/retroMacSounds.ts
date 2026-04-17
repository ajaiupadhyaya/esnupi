/**
 * Short UI sounds inspired by classic Mac OS — Web Audio, no asset files.
 * Uses a shared AudioContext; resumes on first user gesture (browser policy).
 */

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedCtx) {
      sharedCtx = new AudioContext();
    }
    if (sharedCtx.state === "suspended") {
      void sharedCtx.resume();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

/** Single click / selection on desktop icon (soft tick) */
export function playMacIconSelect() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1400, t);
  osc.frequency.exponentialRampToValueAtTime(520, t + 0.045);
  g.gain.setValueAtTime(0.11, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.055);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.06);
}

/** Double-click open / launch (brighter two-stage blip) */
export function playMacIconOpen() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;

  const blip = (start: number, freq: number, dur: number, vol: number) => {
    const o = ctx.createOscillator();
    const ga = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(freq, start);
    ga.gain.setValueAtTime(vol, start);
    ga.gain.exponentialRampToValueAtTime(0.0008, start + dur);
    o.connect(ga);
    ga.connect(ctx.destination);
    o.start(start);
    o.stop(start + dur + 0.01);
  };

  blip(t, 920, 0.028, 0.07);
  blip(t + 0.032, 620, 0.036, 0.055);
}

/** Window close box */
export function playMacWindowClose() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(320, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
  g.gain.setValueAtTime(0.09, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.07);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.08);
}

/** Menu bar / Apple menu item */
export function playMacMenuClick() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(880, t);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.04);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.045);
}
