import { useEffect, useState } from "react";
import { hydraStage } from "@/lib/hydraStage";
import { loadShaderLabState, type ShaderLabParams } from "@/lib/shaderLab";
import { useControlSettings, type ControlSettings } from "../controlSettings";

type ToggleDef = {
  key: keyof ControlSettings;
  label: string;
  hint?: string;
};

const GROUPS: Array<{ heading: string; items: ToggleDef[] }> = [
  {
    heading: "Ambience",
    items: [
      { key: "ambientSounds", label: "Ambient Sounds" },
      { key: "dustMotes", label: "Dust Motes" },
      { key: "screenFlicker", label: "Screen Flicker" },
      { key: "crtScanlines", label: "CRT Scanlines" },
      { key: "cursorTrails", label: "Cursor Trails" },
    ],
  },
  {
    heading: "Wallpaper",
    items: [
      { key: "hydraWallpaper", label: "Hydra Wallpaper" },
      { key: "notificationHaikus", label: "Notification Haikus" },
      { key: "defragScreensaver", label: "Defrag Screensaver" },
    ],
  },
  {
    heading: "Appearance",
    items: [
      { key: "highContrast", label: "High Contrast" },
      { key: "reduceMotion", label: "Reduce Motion" },
      { key: "eightBitColor", label: "8-bit Color" },
    ],
  },
];

export function ControlPanelsPanel() {
  const [settings, update] = useControlSettings();
  const [shaderLab, setShaderLab] = useState(() => loadShaderLabState());

  useEffect(() => {
    hydraStage.setShaderLabEngaged(shaderLab.engaged);
    hydraStage.setShaderLabParams(shaderLab.params);
  }, [shaderLab]);

  const setLabParam = (key: keyof ShaderLabParams, value: number) => {
    setShaderLab((s) => ({
      ...s,
      engaged: true,
      params: { ...s.params, [key]: value },
    }));
  };

  return (
    <section className="mac-controls" aria-label="Control Panels">
      <header className="mac-controls__header">
        <h3 className="mac-type-metadata">Control Panels</h3>
        <p className="mac-controls__note">
          Extensions loaded at startup. Changes take effect immediately.
        </p>
      </header>

      <fieldset className="mac-controls__group mac-controls__group--shader">
        <legend className="mac-type-metadata">Appearance · Shader Lab</legend>
        <p className="mac-controls__shader-hint">
          Live-tweak the Hydra wallpaper (overclock). Disable to restore the authored mood sketch.
        </p>
        <label className="mac-controls__row">
          <input
            type="checkbox"
            checked={shaderLab.engaged}
            onChange={(e) => {
              setShaderLab((s) => ({ ...s, engaged: e.target.checked }));
            }}
          />
          <span className="mac-controls__label">Shader Lab (live parameters)</span>
          <span className={`mac-controls__state${shaderLab.engaged ? " mac-controls__state--on" : ""}`}>
            {shaderLab.engaged ? "on" : "off"}
          </span>
        </label>
        {(["speed", "noise", "kaleid"] as const).map((key) => (
          <label key={key} className="mac-controls__slider-row">
            <span className="mac-controls__label">{key}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={shaderLab.params[key]}
              disabled={!shaderLab.engaged}
              onChange={(e) => setLabParam(key, Number(e.target.value))}
            />
            <span className="mac-controls__slider-val">{shaderLab.params[key].toFixed(2)}</span>
          </label>
        ))}
      </fieldset>

      {GROUPS.map((group) => (
        <fieldset key={group.heading} className="mac-controls__group">
          <legend className="mac-type-metadata">{group.heading}</legend>
          {group.items.map((item) => (
            <label key={item.key} className="mac-controls__row">
              <input
                type="checkbox"
                checked={Boolean(settings[item.key])}
                onChange={(e) => update({ [item.key]: e.target.checked } as Partial<ControlSettings>)}
              />
              <span className="mac-controls__label">{item.label}</span>
              <span
                className={`mac-controls__state${settings[item.key] ? " mac-controls__state--on" : ""}`}
              >
                {settings[item.key] ? "on" : "off"}
              </span>
            </label>
          ))}
        </fieldset>
      ))}
    </section>
  );
}
