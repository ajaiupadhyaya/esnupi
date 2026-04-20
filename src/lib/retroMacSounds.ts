/**
 * Web Audio sound library — no audio files, all synthesized on the fly.
 * All public `play*` helpers return quickly and never throw.
 * Uses a single shared AudioContext; resumes on first user gesture.
 */

let sharedCtx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (muted) return null;
  try {
    if (!sharedCtx) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx: typeof AudioContext = (window as any).AudioContext ?? (window as any).webkitAudioContext;
      if (!Ctx) return null;
      sharedCtx = new Ctx();
    }
    if (sharedCtx.state === "suspended") {
      void sharedCtx.resume();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

export function setMacSoundsMuted(next: boolean) {
  muted = next;
}

export function isMacSoundsMuted() {
  return muted;
}

/* -------------------------------------------------------- */
/* Small oscillator helper                                  */
/* -------------------------------------------------------- */

type Env = {
  start: number;
  attack?: number;
  decay?: number;
  sustain?: number;
  release: number;
  peak?: number;
};

function makeEnv(ctx: AudioContext, env: Env) {
  const g = ctx.createGain();
  const peak = env.peak ?? 0.12;
  const attack = env.attack ?? 0.002;
  const decay = env.decay ?? 0.02;
  const sustain = env.sustain ?? 0.6;
  g.gain.setValueAtTime(0.0001, env.start);
  g.gain.exponentialRampToValueAtTime(peak, env.start + attack);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sustain), env.start + attack + decay);
  g.gain.exponentialRampToValueAtTime(0.0001, env.start + attack + decay + env.release);
  return g;
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  peak = 0.12,
) {
  const osc = ctx.createOscillator();
  const env = makeEnv(ctx, { start, release: dur, peak });
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.connect(env);
  env.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/* -------------------------------------------------------- */
/* UI ticks                                                 */
/* -------------------------------------------------------- */

export function playMacIconSelect() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1400, t);
  osc.frequency.exponentialRampToValueAtTime(520, t + 0.045);
  g.gain.setValueAtTime(0.09, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.055);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.06);
}

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
  blip(t, 920, 0.028, 0.06);
  blip(t + 0.032, 620, 0.036, 0.05);
}

export function playMacWindowClose() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(320, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.07);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.08);
}

export function playMacMenuClick() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(880, t);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.04);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.045);
}

/* -------------------------------------------------------- */
/* Window minimize / maximize — pitch chirp                 */
/* -------------------------------------------------------- */

export function playMacMinimize() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(240, t + 0.18);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.2);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.22);
}

export function playMacMaximize() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(240, t);
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.18);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.2);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.22);
}

/* -------------------------------------------------------- */
/* Error beep ("sosumi" approximation)                      */
/* -------------------------------------------------------- */

export function playMacErrorBeep() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, 900, t, 0.16, "sine", 0.14);
  tone(ctx, 600, t + 0.18, 0.22, "sine", 0.12);
}

/* -------------------------------------------------------- */
/* Typing tick (3 random pitch variants)                    */
/* -------------------------------------------------------- */

const TYPE_FREQS = [1800, 2100, 2400];
export function playMacTypeTick() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  const f = TYPE_FREQS[Math.floor(Math.random() * TYPE_FREQS.length)] ?? 2000;
  osc.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.02, t);
  g.gain.exponentialRampToValueAtTime(0.0005, t + 0.025);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.03);
}

/* -------------------------------------------------------- */
/* Camera shutter — noise burst + bright transient          */
/* -------------------------------------------------------- */

function noiseBurst(ctx: AudioContext, start: number, dur: number, peak = 0.18) {
  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    const env = 1 - i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(peak, start);
  g.gain.exponentialRampToValueAtTime(0.0008, start + dur);
  src.connect(g);
  g.connect(ctx.destination);
  src.start(start);
  src.stop(start + dur + 0.02);
}

export function playCameraShutter() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  noiseBurst(ctx, t, 0.06, 0.22);
  tone(ctx, 2800, t, 0.02, "triangle", 0.09);
  noiseBurst(ctx, t + 0.08, 0.1, 0.1);
}

/* -------------------------------------------------------- */
/* Trash empty — low thud + crinkle                         */
/* -------------------------------------------------------- */

export function playMacTrashEmpty() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, 90, t, 0.18, "sine", 0.22);
  noiseBurst(ctx, t + 0.04, 0.28, 0.14);
}

/* -------------------------------------------------------- */
/* Disk insert — 3 mechanical clicks                        */
/* -------------------------------------------------------- */

export function playMacDiskInsert() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i += 1) {
    noiseBurst(ctx, t + i * 0.08, 0.02, 0.16);
    tone(ctx, 1200 - i * 300, t + i * 0.08, 0.04, "square", 0.06);
  }
}

/* -------------------------------------------------------- */
/* Boot chime — synthesized Mac startup chord               */
/* Slow attack, long release, C major 7                     */
/* -------------------------------------------------------- */

export function playMacBootChime() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const chord = [130.81, 164.81, 196.0, 246.94, 329.63];
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(0.3, t + 0.6);
  master.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
  master.connect(ctx.destination);
  chord.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = idx % 2 === 0 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 - idx * 0.03, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 3.5);
  });
  // soft detuned "chorus" partial
  const part = ctx.createOscillator();
  const pg = ctx.createGain();
  part.type = "sine";
  part.frequency.setValueAtTime(261.63, t);
  pg.gain.setValueAtTime(0.0001, t);
  pg.gain.exponentialRampToValueAtTime(0.1, t + 0.8);
  pg.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);
  part.connect(pg);
  pg.connect(master);
  part.start(t);
  part.stop(t + 3.2);
}

/* -------------------------------------------------------- */
/* Sad Mac — dissonant descending thirds                    */
/* -------------------------------------------------------- */

export function playSadMacChord() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [220, 277.18];
  notes.forEach((f) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.5, t + 1.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.85);
  });
}

/* -------------------------------------------------------- */
/* Konami success fanfare                                   */
/* -------------------------------------------------------- */

export function playKonamiFanfare() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const seq = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  seq.forEach((f, idx) => {
    tone(ctx, f, t + idx * 0.09, 0.18, "square", 0.12);
  });
}

/* -------------------------------------------------------- */
/* Notification ping                                        */
/* -------------------------------------------------------- */

export function playMacNotification() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, 880, t, 0.14, "sine", 0.08);
  tone(ctx, 1320, t + 0.08, 0.2, "sine", 0.07);
}

/* -------------------------------------------------------- */
/* Generic ascending/descending chirp                       */
/* -------------------------------------------------------- */

export function playMacChirp(up = true) {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  if (up) {
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.14);
  } else {
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.14);
  }
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.16);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.18);
}

/* -------------------------------------------------------- */
/* Pong-style beep                                          */
/* -------------------------------------------------------- */

export function playPongBeep(hz = 640) {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, hz, t, 0.08, "square", 0.1);
}

/* -------------------------------------------------------- */
/* Short "glitch" static burst                              */
/* -------------------------------------------------------- */

export function playGlitchBurst() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  noiseBurst(ctx, t, 0.25, 0.18);
  tone(ctx, 120, t, 0.1, "square", 0.09);
  tone(ctx, 1800, t + 0.06, 0.06, "square", 0.06);
}
