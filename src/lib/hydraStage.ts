/**
 * Module-level bus so non-provider components (Desktop, menu actions,
 * Projects hover, Control Panels) can drive the Hydra canvas without
 * prop-drilling a ref. `HydraBackground` installs the implementation on mount.
 */

import type { HydraMoodId } from "./authoredHydraSketches";
import type { ShaderLabParams } from "./shaderLab";

export type HydraSetMode = "matrix" | "konami-off" | null;

type HydraStageImpl = {
  /** Short brightness spike on the canvas (window-open pulse). */
  pulse: () => void;
  /** Invert for ~1.5s (empty-trash rupture). */
  invert: () => void;
  /** Update normalized mouse (0..1, 0..1). */
  setMouse: (xNorm: number, yNorm: number) => void;
  /** Hue-rotate on project hover, or clear when project === null. */
  setHueRotation: (deg: number | null) => void;
  /** Pause / resume the underlying Hydra loop. */
  setPaused: (paused: boolean) => void;
  /** Switch authored mood (Konami → ARCHIVE, matrix override, etc.). */
  setMood: (mood: HydraMoodId) => void;
  /** Toggle matrix-mode tint (green shader override + CSS). */
  setMatrix: (on: boolean) => void;
  /** Blur the wallpaper (e.g. while dragging a window). 0 = off. */
  setBlur: (px: number) => void;
  /** Transient hue-rotate spin (minesweeper win celebration). */
  spinHue: (durationMs?: number) => void;
  /** When true, Hydra uses Shader Lab parametric sketch instead of authored mood. */
  setShaderLabEngaged: (engaged: boolean) => void;
  setShaderLabParams: (patch: Partial<ShaderLabParams>) => void;
};

const NOOP: HydraStageImpl = {
  pulse: () => {},
  invert: () => {},
  setMouse: () => {},
  setHueRotation: () => {},
  setPaused: () => {},
  setMood: () => {},
  setMatrix: () => {},
  setBlur: () => {},
  spinHue: () => {},
  setShaderLabEngaged: () => {},
  setShaderLabParams: () => {},
};

let current: HydraStageImpl = NOOP;

export const hydraStage: HydraStageImpl = {
  pulse: () => current.pulse(),
  invert: () => current.invert(),
  setMouse: (x, y) => current.setMouse(x, y),
  setHueRotation: (deg) => current.setHueRotation(deg),
  setPaused: (p) => current.setPaused(p),
  setMood: (m) => current.setMood(m),
  setMatrix: (on) => current.setMatrix(on),
  setBlur: (px) => current.setBlur(px),
  spinHue: (ms) => current.spinHue(ms),
  setShaderLabEngaged: (e) => current.setShaderLabEngaged(e),
  setShaderLabParams: (p) => current.setShaderLabParams(p),
};

export function installHydraStage(impl: HydraStageImpl) {
  current = impl;
  return () => {
    if (current === impl) current = NOOP;
  };
}
