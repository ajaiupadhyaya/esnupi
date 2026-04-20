/**
 * INTERNALS — the final easter egg. A hand-authored ASCII component tree and
 * a film-credits list of the tools used to build the site.
 *
 * Rendered in monospace; the window's title bar is overridden to black via
 * the `mac-window--internals` class that the parent window applies when this
 * panel is shown. (We don't own the title bar here; the effect is expressed
 * via the CSS modifier scoped to the internals window id.)
 */
export function InternalsPanel() {
  const tree = `esnupi/
├─ App
│  ├─ RouteTransitionProvider
│  ├─ MacintoshDesktop
│  │  ├─ BootSequence (bios · post · blackbeat · logo · sadmac)
│  │  ├─ MacMenuBar
│  │  │  └─ RainbowApple · Programs · Window · Help
│  │  ├─ HydraBackground (authoredHydraSketches × 5)
│  │  ├─ P5RetroDesktop (noise grain)
│  │  ├─ DustMotes · ScreenFlicker · CursorTrails
│  │  ├─ DesktopIcons (felt)
│  │  ├─ Windows (DesktopWindow · GSAP zoom rect)
│  │  │  ├─ About · Projects · Contact · Lab · Terminal
│  │  │  ├─ Photobooth · Scrapbook · Music · Browser
│  │  │  └─ Clock · Typist · Notepad · Kaleidoscope · Slideshow
│  │  ├─ MagneticDock (gaussian falloff, σ=60)
│  │  ├─ MacNotifications (haiku · authored opening)
│  │  └─ DefragScreensaver (idle ≥ 30 s)
│  └─ MdxLab
└─ lib/
   ├─ ambientAudio (fan · CRT whine · room tone)
   ├─ visitMemory (first boot · uptime · last active)
   ├─ hydraStage (pulse · invert · mood)
   └─ retroMacSounds (all synthesized)`;

  const credits: Array<[string, string]> = [
    ["HYDRA SYNTH", "Olivia Jack"],
    ["GSAP", "GreenSock"],
    ["LENIS", "darkroom.engineering"],
    ["XTERM.JS", "xtermjs.org"],
    ["SUPABASE", "supabase.io"],
    ["REACT", "Meta Open Source"],
    ["VITE", "Evan You"],
    ["LUXON", "Moment Team"],
    ["TAILWIND CSS", "Adam Wathan"],
    ["P5.JS", "Lauren Lee McCarthy"],
    ["IBM PLEX", "Mike Abbink"],
    ["SOUNDS", "Web Audio API (synthesized on the fly)"],
  ];

  return (
    <section className="prog-internals" aria-label="Internals">
      <pre className="prog-internals__tree">{tree}</pre>
      <p className="prog-internals__built">built with care. {new Date().getFullYear()}.</p>
      <dl className="prog-internals__credits">
        {credits.map(([label, attrib]) => (
          <div key={label} className="prog-internals__credit">
            <dt>{label}</dt>
            <dd>
              <span className="prog-internals__credit-dots" aria-hidden>
                {".".repeat(Math.max(4, 40 - label.length - attrib.length))}
              </span>
              {attrib}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
