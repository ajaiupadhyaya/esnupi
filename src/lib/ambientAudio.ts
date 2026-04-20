/**
 * Ambient audio — the room the machine sits in.
 *
 * Three continuous Web Audio chains:
 *   FAN HUM  — highpassed white noise @ ~0.012 gain, the Power Mac G4 idle.
 *   CRT WHINE — 15 734 Hz oscillator (NTSC horizontal sync) with a slow LFO,
 *                gated by Reduce Motion.
 *   ROOM TONE — quiet noise bursts every 8–14s through a synthesized reverb.
 *
 * Only ever instantiated after the first user gesture (browsers require it).
 * Hooks into control settings for mute/unmute and `dipAmbient()` for the
 * silence-philosophy pause during boot.
 */

import { getControlSettings } from "@/components/desktop/controlSettings";

type AmbientState = {
  ctx: AudioContext;
  master: GainNode;
  nodes: Array<{
    stop: () => void;
    setGain: (value: number, time: number) => void;
  }>;
  roomToneTimer: number | null;
  started: boolean;
  /** Last commanded base gain (excluding dip multiplier). */
  baseGain: number;
  /** Extra multiplier for temporary dips, 0..1. */
  dipMultiplier: number;
};

let state: AmbientState | null = null;

const BASE_GAIN = 0.015; /* Overall ambient target, per brief */
const FAN_GAIN = 0.012;
const CRT_GAIN = 0.004;
const ROOM_GAIN = 0.008;

function whiteNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const frames = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/* ------------------------------------------------------------------ */
/* Chain 1 — fan hum                                                   */
/* ------------------------------------------------------------------ */

function buildFanHum(ctx: AudioContext, out: AudioNode) {
  const src = ctx.createBufferSource();
  src.buffer = whiteNoiseBuffer(ctx, 3);
  src.loop = true;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 60;
  const gain = ctx.createGain();
  gain.gain.value = FAN_GAIN;
  src.connect(hp).connect(gain).connect(out);
  src.start();
  return {
    stop: () => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    },
    setGain: (value: number, time: number) => {
      gain.gain.cancelScheduledValues(time);
      gain.gain.linearRampToValueAtTime(value * FAN_GAIN, time);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Chain 2 — CRT whine                                                 */
/* ------------------------------------------------------------------ */

function buildCrtWhine(ctx: AudioContext, out: AudioNode) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 15_734;
  const gain = ctx.createGain();
  gain.gain.value = 0; /* ramp up below */
  /* LFO modulating the oscillator frequency by ±40 Hz at 0.08 Hz */
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 40;
  lfo.connect(lfoGain).connect(osc.frequency);
  osc.connect(gain).connect(out);
  osc.start();
  lfo.start();
  const now = ctx.currentTime;
  gain.gain.linearRampToValueAtTime(CRT_GAIN, now + 2.0);
  return {
    stop: () => {
      try {
        osc.stop();
        lfo.stop();
      } catch {
        /* already stopped */
      }
    },
    setGain: (value: number, time: number) => {
      gain.gain.cancelScheduledValues(time);
      gain.gain.linearRampToValueAtTime(value * CRT_GAIN, time);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Chain 3 — room tone bursts through synthesized reverb              */
/* ------------------------------------------------------------------ */

function makeReverbImpulse(ctx: AudioContext, durationS = 3.2): AudioBuffer {
  const frames = Math.floor(ctx.sampleRate * durationS);
  const buffer = ctx.createBuffer(2, frames, ctx.sampleRate);
  for (let c = 0; c < 2; c += 1) {
    const data = buffer.getChannelData(c);
    const attackFrames = Math.floor(ctx.sampleRate * 0.005);
    for (let i = 0; i < frames; i += 1) {
      const envAttack = Math.min(1, i / attackFrames);
      const envDecay = Math.pow(1 - i / frames, 3);
      data[i] = (Math.random() * 2 - 1) * envAttack * envDecay;
    }
  }
  return buffer;
}

function buildRoomTone(ctx: AudioContext, out: AudioNode) {
  const convolver = ctx.createConvolver();
  convolver.buffer = makeReverbImpulse(ctx);
  const gain = ctx.createGain();
  gain.gain.value = ROOM_GAIN;
  convolver.connect(gain).connect(out);

  let timeoutId: number | null = null;
  let cancelled = false;

  const scheduleBurst = () => {
    if (cancelled) return;
    const delay = 8_000 + Math.random() * 6_000; /* 8–14s per brief */
    timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      const src = ctx.createBufferSource();
      const burstDur = 0.05 + Math.random() * 0.15;
      src.buffer = whiteNoiseBuffer(ctx, burstDur);
      const burstGain = ctx.createGain();
      burstGain.gain.value = 0.25;
      src.connect(burstGain).connect(convolver);
      src.start();
      src.stop(ctx.currentTime + burstDur + 0.02);
      scheduleBurst();
    }, delay);
  };
  scheduleBurst();

  return {
    stop: () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    },
    setGain: (value: number, time: number) => {
      gain.gain.cancelScheduledValues(time);
      gain.gain.linearRampToValueAtTime(value * ROOM_GAIN, time);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */

function rampMaster(target: number, durationMs: number) {
  if (!state) return;
  const { ctx, master } = state;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
  master.gain.linearRampToValueAtTime(target, now + durationMs / 1000);
}

function readSettings() {
  try {
    return getControlSettings();
  } catch {
    return null;
  }
}

export function startAmbient() {
  if (state?.started || typeof window === "undefined") return;
  const settings = readSettings();
  if (settings && !settings.ambientSounds) return;
  try {
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    const chains: AmbientState["nodes"] = [];
    chains.push(buildFanHum(ctx, master));
    if (!settings?.reduceMotion) chains.push(buildCrtWhine(ctx, master));
    chains.push(buildRoomTone(ctx, master));
    state = {
      ctx,
      master,
      nodes: chains,
      roomToneTimer: null,
      started: true,
      baseGain: BASE_GAIN,
      dipMultiplier: 1,
    };
    rampMaster(BASE_GAIN, 1_200);
  } catch {
    /* swallow — audio is a nicety, never critical */
  }
}

export function stopAmbient() {
  if (!state) return;
  const { ctx, nodes } = state;
  try {
    rampMaster(0.0001, 300);
    window.setTimeout(() => {
      nodes.forEach((n) => n.stop());
      void ctx.close();
      state = null;
    }, 350);
  } catch {
    state = null;
  }
}

/**
 * Shape the silence. Drop master gain to 0 over `fadeMs`, hold for `holdMs`,
 * then ramp back up. Used around the 600 ms black beat in the boot sequence.
 */
export function dipAmbient(fadeMs = 200, holdMs = 600) {
  if (!state) return;
  const { ctx, master, baseGain } = state;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(0.0001, now + fadeMs / 1000);
  master.gain.linearRampToValueAtTime(
    baseGain,
    now + (fadeMs + holdMs + fadeMs) / 1000,
  );
}

export function setAmbientMuted(muted: boolean) {
  if (muted) {
    stopAmbient();
  } else {
    startAmbient();
  }
}

/* Handle Reduce Motion flipping: easiest is to just restart the layer. */
export function restartAmbient() {
  stopAmbient();
  window.setTimeout(startAmbient, 400);
}
