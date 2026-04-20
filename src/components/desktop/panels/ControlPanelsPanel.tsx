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
  return (
    <section className="mac-controls" aria-label="Control Panels">
      <header className="mac-controls__header">
        <h3 className="mac-type-metadata">Control Panels</h3>
        <p className="mac-controls__note">
          Extensions loaded at startup. Changes take effect immediately.
        </p>
      </header>
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
