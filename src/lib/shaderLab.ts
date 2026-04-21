import type { HydraMoodId } from "./authoredHydraSketches";

export type ShaderLabParams = {
  speed: number;
  noise: number;
  kaleid: number;
};

export const SHADER_LAB_DEFAULTS: ShaderLabParams = {
  speed: 0.5,
  noise: 0.35,
  kaleid: 0.22,
};

const STORAGE_KEY = "esnupi.shaderLab.v1";

export type ShaderLabState = {
  engaged: boolean;
  params: ShaderLabParams;
};

const DEFAULT_STATE: ShaderLabState = {
  engaged: false,
  params: { ...SHADER_LAB_DEFAULTS },
};

export function loadShaderLabState(): ShaderLabState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<ShaderLabState>;
    return {
      engaged: Boolean(parsed.engaged),
      params: { ...SHADER_LAB_DEFAULTS, ...parsed.params },
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveShaderLabState(s: ShaderLabState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** Mood tints for the live “overclock” shader (RGB multipliers). */
const MOOD_RGB: Record<HydraMoodId, [number, number, number]> = {
  DEAD_CHANNEL: [0.85, 0.88, 0.9],
  AQUARIUM: [0.08, 0.55, 0.58],
  THERMAL: [1.05, 0.38, 0.1],
  INTERFERENCE: [0.95, 0.45, 1.05],
  EMPTY_ROOM: [0.9, 0.9, 0.88],
  ARCHIVE: [0.35, 0.28, 0.75],
};

/**
 * Parametric Hydra sketch driven by Control Panel sliders — lets visitors
 * “overclock” the wallpaper while keeping a palette per mood.
 */
export function buildShaderLabSketch(mood: HydraMoodId, p: ShaderLabParams): string {
  const [cr, cg, cb] = MOOD_RGB[mood];
  const spd = 12 + p.speed * 48;
  const nz = 2 + Math.floor(p.noise * 22);
  const nk = 0.018 + p.noise * 0.09;
  const kv = Math.max(2, Math.round(2 + p.kaleid * 14));
  const rot = 0.08 + p.speed * 0.35;
  return `
osc(${spd.toFixed(2)}, ${nk.toFixed(4)}, 0.88)
  .diff(osc(${(spd * 0.92).toFixed(2)}, ${(nk * 0.9).toFixed(4)}, 0.88).rotate(${Math.PI / 2}))
  .kaleid(${kv})
  .color(${cr}, ${cg}, ${cb})
  .modulate(noise(${nz}, ${nk.toFixed(4)}), ${(0.04 + p.kaleid * 0.14).toFixed(3)})
  .rotate(${rot.toFixed(3)}, ${(0.015 + p.noise * 0.04).toFixed(4)})
  .brightness(-0.13)
  .saturate(1.05)
  .out(o0)
`;
}
