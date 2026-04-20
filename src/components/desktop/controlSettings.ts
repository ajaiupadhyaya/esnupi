import { useCallback, useEffect, useState } from "react";

/** A single, typed, persisted settings object that drives every effect toggle. */
export type ControlSettings = {
  ambientSounds: boolean;
  dustMotes: boolean;
  screenFlicker: boolean;
  crtScanlines: boolean;
  cursorTrails: boolean;
  hydraWallpaper: boolean;
  notificationHaikus: boolean;
  defragScreensaver: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  eightBitColor: boolean;
};

export const CONTROL_DEFAULTS: ControlSettings = {
  ambientSounds: true,
  dustMotes: true,
  screenFlicker: true,
  crtScanlines: true,
  cursorTrails: true,
  hydraWallpaper: true,
  notificationHaikus: true,
  defragScreensaver: true,
  highContrast: false,
  reduceMotion: false,
  eightBitColor: false,
};

const STORAGE_KEY = "esnupi.controlSettings.v1";

function load(): ControlSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return CONTROL_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<ControlSettings>;
    return { ...CONTROL_DEFAULTS, ...parsed };
  } catch {
    return CONTROL_DEFAULTS;
  }
}

function save(s: ControlSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** Reflect toggles on document.body so stylesheets + overlays can gate themselves. */
export function applyBodyClasses(s: ControlSettings) {
  const body = document.body;
  body.classList.toggle("mac-opt-no-dust", !s.dustMotes);
  body.classList.toggle("mac-opt-no-flicker", !s.screenFlicker);
  body.classList.toggle("mac-opt-no-scanlines", !s.crtScanlines);
  body.classList.toggle("mac-opt-no-trails", !s.cursorTrails);
  body.classList.toggle("mac-opt-no-hydra", !s.hydraWallpaper);
  body.classList.toggle("mac-opt-high-contrast", s.highContrast);
  body.classList.toggle("mac-opt-reduce-motion", s.reduceMotion);
  body.classList.toggle("mac-opt-eight-bit", s.eightBitColor);
}

/** Module-level broadcast so every listener updates when one panel changes state. */
const listeners = new Set<(s: ControlSettings) => void>();
let current: ControlSettings = typeof window === "undefined" ? CONTROL_DEFAULTS : load();
if (typeof window !== "undefined") applyBodyClasses(current);

export function useControlSettings(): [
  ControlSettings,
  (patch: Partial<ControlSettings>) => void,
] {
  const [state, setState] = useState<ControlSettings>(current);
  useEffect(() => {
    const listener = (s: ControlSettings) => setState(s);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  const update = useCallback((patch: Partial<ControlSettings>) => {
    current = { ...current, ...patch };
    save(current);
    applyBodyClasses(current);
    listeners.forEach((l) => l(current));
  }, []);
  return [state, update];
}

export function getControlSettings(): ControlSettings {
  return current;
}
