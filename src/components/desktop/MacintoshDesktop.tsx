import { DateTime } from "luxon";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import {
  addSharedPhoto,
  loadSharedPhotos,
  subscribeToSharedPhotos,
  type SharedPhoto,
  unsubscribeSharedPhotos,
} from "@/lib/photobookStore";
import { hasSupabaseConfig } from "@/lib/supabaseClient";
import {
  playMacIconOpen,
  playMacIconSelect,
  playMacMenuClick,
} from "@/lib/retroMacSounds";

import {
  type DesktopIconDef,
  DESKTOP_ICONS,
  FELT_FRAME,
  type WindowId,
} from "./desktopIconConfig";
import { MacTerminalApp } from "./MacTerminalApp";
import { DesktopWindow } from "./DesktopWindow";

import "./macintosh-desktop.css";

const P5RetroDesktop = lazy(() =>
  import("./P5RetroDesktop").then((m) => ({ default: m.P5RetroDesktop })),
);

const PLACEHOLDER_DOCK_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='4' y='4' width='56' height='56' rx='11' fill='%23dfdfdf' stroke='%23686868' stroke-width='2'/%3E%3Crect x='11' y='13' width='42' height='30' rx='5' fill='%23f6f6f6' stroke='%23929292'/%3E%3Crect x='17' y='21' width='30' height='4' fill='%23bdbdbd'/%3E%3Crect x='17' y='28' width='21' height='4' fill='%23c8c8c8'/%3E%3Crect x='16' y='48' width='32' height='5' rx='2' fill='%23a7a7a7'/%3E%3C/svg%3E";
const MUSIC_DOCK_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='5' y='5' width='54' height='54' rx='8' fill='%23d7d7d7' stroke='%23000'/%3E%3Crect x='13' y='12' width='38' height='18' fill='%23f8f8f8' stroke='%23555'/%3E%3Crect x='16' y='15' width='32' height='3' fill='%238a8a8a'/%3E%3Ccircle cx='22' cy='43' r='8' fill='%23fbfbfb' stroke='%23000'/%3E%3Ccircle cx='42' cy='43' r='8' fill='%23fbfbfb' stroke='%23000'/%3E%3Ccircle cx='22' cy='43' r='2' fill='%23000'/%3E%3Ccircle cx='42' cy='43' r='2' fill='%23000'/%3E%3C/svg%3E";
const BROWSER_DOCK_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='5' y='6' width='54' height='52' rx='6' fill='%23d8d8d8' stroke='%23000'/%3E%3Crect x='10' y='12' width='44' height='7' fill='%23eeeeee' stroke='%23707070'/%3E%3Ccircle cx='14' cy='15.5' r='1.2' fill='%23000'/%3E%3Ccircle cx='18' cy='15.5' r='1.2' fill='%23000'/%3E%3Crect x='11' y='22' width='42' height='30' fill='%23ffffff' stroke='%23545454'/%3E%3Cpath d='M14 48l11-12 8 7 7-8 10 13' stroke='%23000' stroke-width='1.6' fill='none'/%3E%3C/svg%3E";
/** Visual stack offset for cascaded window open; matches CSS chrome. */
const WINDOW_STACK_OFFSET = 32;
const CHROME_MENU_H = 28;
const CHROME_MARGIN = 10;
/** Keep new windows in the area above the dock (see DesktopWindow drag clamp). */
const CHROME_DOCK_RESERVE = 150;

type MusicTrack = {
  id: string;
  title: string;
  src: string;
};

const musicModules = import.meta.glob("/src/music/*.{mp3,wav,ogg,m4a,flac,aac}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const MUSIC_LIBRARY: MusicTrack[] = Object.entries(musicModules)
  .map(([path, src]) => {
    const name = path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "Untitled";
    const title = name
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return {
      id: path,
      title: title.length ? title : "Untitled",
      src,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

const BROWSER_HOME = "https://example.com";
const BROWSER_PRESETS = [
  "https://example.com",
  "https://en.wikipedia.org/wiki/Mac_OS_8",
  "https://archive.org",
  "https://developer.mozilla.org",
];

const DOCK_APPS: Array<{ id: WindowId; label: string; icon: string }> = [
  { id: "about", label: "Home", icon: PLACEHOLDER_DOCK_ICON },
  { id: "projects", label: "Projects", icon: PLACEHOLDER_DOCK_ICON },
  { id: "contact", label: "Contact", icon: PLACEHOLDER_DOCK_ICON },
  { id: "lab", label: "Lab", icon: PLACEHOLDER_DOCK_ICON },
  { id: "terminal", label: "Terminal", icon: PLACEHOLDER_DOCK_ICON },
  { id: "photobooth", label: "Photobooth", icon: PLACEHOLDER_DOCK_ICON },
  { id: "photobook", label: "Photobook", icon: PLACEHOLDER_DOCK_ICON },
  { id: "music", label: "Music", icon: MUSIC_DOCK_ICON },
  { id: "browser", label: "Browser", icon: BROWSER_DOCK_ICON },
];

const INITIAL: Record<
  WindowId,
  { title: string; x: number; y: number; w: number; h: number }
> = {
  about: { title: "Home / About", x: 48, y: 52, w: 560, h: 420 },
  projects: { title: "Projects Studio", x: 88, y: 92, w: 620, h: 460 },
  contact: { title: "Contact + Links", x: 128, y: 132, w: 520, h: 400 },
  lab: { title: "Writing / Lab", x: 168, y: 172, w: 600, h: 440 },
  terminal: { title: "Terminal", x: 124, y: 68, w: 820, h: 520 },
  photobooth: { title: "Photobooth", x: 180, y: 86, w: 720, h: 560 },
  photobook: { title: "Museum Photobook", x: 94, y: 72, w: 920, h: 640 },
  music: { title: "Music Player", x: 210, y: 100, w: 620, h: 500 },
  browser: { title: "Web Browser", x: 92, y: 66, w: 1020, h: 680 },
};

function clampWindowPosition(anchorX: number, anchorY: number, width: number, height: number) {
  const nx = anchorX - width / 2;
  const ny = anchorY - height / 2;
  const maxX = Math.max(CHROME_MARGIN, window.innerWidth - width - CHROME_MARGIN);
  const maxY = Math.max(
    CHROME_MENU_H + CHROME_MARGIN,
    window.innerHeight - height - CHROME_MARGIN - CHROME_DOCK_RESERVE,
  );
  return {
    x: Math.min(Math.max(CHROME_MARGIN, nx), maxX),
    y: Math.min(Math.max(CHROME_MENU_H + CHROME_MARGIN, ny), maxY),
  };
}

function stackedWindowPosition(width: number, height: number, openCount: number) {
  const availH = window.innerHeight - CHROME_MENU_H - CHROME_DOCK_RESERVE - CHROME_MARGIN * 2;
  const centerY = CHROME_MENU_H + CHROME_MARGIN + Math.max(0, (availH - height) / 2);
  const baseX = window.innerWidth / 2;
  const baseY = centerY + height / 2;
  const offset = openCount * WINDOW_STACK_OFFSET;
  return clampWindowPosition(baseX + offset, baseY + offset, width, height);
}

type ScaffoldWindowId = "about" | "projects" | "contact" | "lab" | "terminal";

const WINDOW_CONTENT: Record<
  ScaffoldWindowId,
  {
    intro: string;
    sections: Array<{ heading: string; items: string[] }>;
    links?: Array<{ label: string; href: string }>;
  }
> = {
  about: {
    intro:
      "esnupi is a portfolio playground built like a late-90s Macintosh desktop: Hydra live wallpaper, draggable platinum windows, and little apps that feel at home on System 7–8. Use Home as your front door—say who you are, what you make, and what a visitor should click first.",
    sections: [
      {
        heading: "At a glance",
        items: [
          "Creative technologist / designer-developer (edit to match you)",
          "Focus: interactive web, real-time graphics, and tactile UI craft",
          "Based in [your city] · Open to [remote / collaboration / full-time]",
        ],
      },
      {
        heading: "On this desktop",
        items: [
          "Projects — case studies and build notes",
          "Lab — longer writing and experiments (/lab)",
          "Photobooth & Photobook — visitor-facing mini apps",
          "Music & Browser — desktop-toy utilities with retro chrome",
        ],
      },
      {
        heading: "Colophon",
        items: [
          "Vite · React · TypeScript · Tailwind · MDX",
          "Wallpaper: hydra-synth; grain: p5 overlay",
          "Replace this copy in `MacintoshDesktop.tsx` when you ship",
        ],
      },
    ],
  },
  projects: {
    intro:
      "Treat each card below as a chapter you can swap for a real project: title, one-liner, stack, link, and what you learned. Short paragraphs beat buzzwords—let the work carry the page.",
    sections: [
      {
        heading: "Featured — [Project name]",
        items: [
          "One-line pitch: what it does and for whom",
          "Role: design, front-end, shaders, collaboration",
          "Stack: e.g. React, Three.js, WebGL, custom tooling",
          "Outcome: metric, launch, or personal takeaway",
        ],
      },
      {
        heading: "Featured — [Project name]",
        items: [
          "Interactive installation / site / tool (describe the medium)",
          "Problem → approach → result in plain language",
          "Link: case study, demo, or video",
        ],
      },
      {
        heading: "More on the shelf",
        items: [
          "Smaller experiments and repos",
          "Talks, workshops, or teaching",
          "Archive / older work you still stand behind",
        ],
      },
    ],
  },
  contact: {
    intro:
      "Give people a single place to start a conversation. Lead with the channel you actually monitor; keep socials secondary. Swap the placeholders below for your real links when you publish.",
    sections: [
      {
        heading: "Primary",
        items: [
          "Email — best for inquiries and project briefs",
          "Calendar or booking link — optional",
          "Timezone — so async feels human",
        ],
      },
      {
        heading: "Elsewhere",
        items: [
          "GitHub / code",
          "Are.na / reference library",
          "LinkedIn or other profile you keep current",
        ],
      },
    ],
    links: [
      { label: "Email", href: "mailto:hello@example.com" },
      { label: "GitHub", href: "https://github.com/" },
      { label: "Open Lab (MDX)", href: "/lab" },
    ],
  },
  lab: {
    intro:
      "The Lab route is for writing that does not fit in a window: essays, tutorials, dev logs, and links out. Keep the desktop windows punchy; use /lab when you need room to think on the page.",
    sections: [
      {
        heading: "What lives here",
        items: [
          "Longer posts (MDX) with code and images",
          "Process notes: sketches, shaders, failed ideas worth saving",
          "Reading lists and references for future you",
        ],
      },
      {
        heading: "Draft prompts",
        items: [
          "What broke last week and what fixed it?",
          "One interaction you are proud of—why?",
          "What should a collaborator know before they DM you?",
        ],
      },
    ],
    links: [{ label: "Go to Lab →", href: "/lab" }],
  },
  terminal: {
    intro:
      "A toy shell inside the browser: list files, change directories, and sketch notes without leaving the desktop metaphor. It is not a real OS—just a fun, self-contained space for copy-paste experiments.",
    sections: [
      { heading: "Try", items: ["help", "ls", "cd", "cat", "mkdir", "touch", "rm", "clear"] },
      {
        heading: "Tip",
        items: ["Type `help` first; paths are virtual and reset on refresh."],
      },
    ],
  },
};

export function MacintoshDesktop() {
  const [booting, setBooting] = useState(true);
  const [clock, setClock] = useState(() => DateTime.now().toLocaleString(DateTime.TIME_SIMPLE));
  const [open, setOpen] = useState<Record<WindowId, boolean>>({
    about: false,
    projects: false,
    contact: false,
    lab: false,
    terminal: false,
    photobooth: false,
    photobook: false,
    music: false,
    browser: false,
  });
  const [photos, setPhotos] = useState<SharedPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [geom, setGeom] = useState(INITIAL);
  const [zOrder, setZOrder] = useState<WindowId[]>([]);
  const [activeId, setActiveId] = useState<WindowId | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [appleOpen, setAppleOpen] = useState(false);
  const appleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setClock(DateTime.now().toLocaleString(DateTime.TIME_SIMPLE));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setBooting(false), 1150);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!appleRef.current?.contains(e.target as Node)) setAppleOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const refreshPhotos = useCallback(async () => {
    try {
      setPhotoError(null);
      const data = await loadSharedPhotos();
      setPhotos(data);
    } catch {
      setPhotoError("Unable to load shared gallery right now.");
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoadingPhotos(false);
      setPhotoError("Shared gallery is not configured yet.");
      return;
    }
    void refreshPhotos();
    const channel = subscribeToSharedPhotos(() => {
      void refreshPhotos();
    });
    return () => {
      unsubscribeSharedPhotos(channel);
    };
  }, [refreshPhotos]);

  const bringToFront = useCallback((id: WindowId) => {
    setZOrder((prev) => [...prev.filter((x) => x !== id), id]);
    setActiveId(id);
  }, []);

  const openWindow = useCallback(
    (id: WindowId, anchor?: { x: number; y: number }) => {
      setGeom((g) => {
        const cur = g[id];
        const isAlreadyOpen = open[id];
        if (isAlreadyOpen) return g;
        const nextPos = anchor
          ? clampWindowPosition(anchor.x, anchor.y, cur.w, cur.h)
          : stackedWindowPosition(cur.w, cur.h, zOrder.length);
        return {
          ...g,
          [id]: { ...cur, ...nextPos },
        };
      });
      setOpen((o) => ({ ...o, [id]: true }));
      bringToFront(id);
    },
    [bringToFront, open, zOrder.length],
  );

  const closeWindow = useCallback((id: WindowId) => {
    setOpen((o) => ({ ...o, [id]: false }));
    setZOrder((prev) => {
      const next = prev.filter((x) => x !== id);
      setActiveId((cur) => {
        if (cur !== id) return cur;
        return next.length ? next[next.length - 1]! : null;
      });
      return next;
    });
  }, []);

  const zFor = useCallback(
    (id: WindowId) => {
      const i = zOrder.indexOf(id);
      /* Above dock (z ~35); below menu bar (z 60) so the menu stays on top. */
      return 42 + (i >= 0 ? i : 0);
    },
    [zOrder],
  );

  const moveWindow = useCallback((id: WindowId, x: number, y: number) => {
    setGeom((g) => ({
      ...g,
      [id]: { ...g[id], x, y },
    }));
  }, []);

  const addPhoto = useCallback(async (src: string) => {
    if (!hasSupabaseConfig) {
      setPhotoError("Missing Supabase keys. Add env vars to enable shared museum storage.");
      return;
    }
    try {
      const created = await addSharedPhoto(src);
      setPhotos((prev) => [created, ...prev]);
      setPhotoError(null);
    } catch {
      setPhotoError("Upload failed. Please try again.");
    }
  }, []);

  const windows = useMemo(
    () =>
      ([
        "about",
        "projects",
        "contact",
        "lab",
        "terminal",
        "photobooth",
        "photobook",
        "music",
        "browser",
      ] as const).filter(
        (id) => open[id],
      ),
    [open],
  );

  return (
    <div className="mac-desktop-root">
      {booting && (
        <div
          className="mac-boot"
          role="presentation"
          onClick={() => setBooting(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setBooting(false);
          }}
        >
          <div className="mac-boot__title">Welcome</div>
          <div className="mac-boot__bar" aria-hidden>
            <div className="mac-boot__bar-fill" />
          </div>
          <p className="mac-boot__hint">Click to skip</p>
        </div>
      )}

      <header className="mac-menu-bar">
        <div className="relative" ref={appleRef}>
          <button
            type="button"
            className="mac-menu-bar__apple mac-menu-item"
            aria-expanded={appleOpen}
            aria-haspopup="true"
            onClick={() => {
              playMacMenuClick();
              setAppleOpen((v) => !v);
            }}
          >
            &#63743;
          </button>
          {appleOpen && (
            <div
              className="absolute left-0 top-full z-[60] mt-0.5 min-w-[200px] border border-black bg-[#d8d8d8] py-1 shadow-[2px_2px_0_rgba(0,0,0,0.35)]"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className="mac-menu-item block w-full text-left"
                onClick={() => {
                  playMacMenuClick();
                  setAppleOpen(false);
                  playMacIconOpen();
                  openWindow("about");
                }}
              >
                About This Site…
              </button>
            </div>
          )}
        </div>
        <button type="button" className="mac-menu-item" onClick={playMacMenuClick}>
          File
        </button>
        <button type="button" className="mac-menu-item" onClick={playMacMenuClick}>
          Edit
        </button>
        <button type="button" className="mac-menu-item" onClick={playMacMenuClick}>
          View
        </button>
        <button type="button" className="mac-menu-item" onClick={playMacMenuClick}>
          Special
        </button>
        <button type="button" className="mac-menu-item" onClick={playMacMenuClick}>
          Help
        </button>
        <span className="mac-menu-bar__spacer" aria-hidden />
        <span className="mac-menu-bar__clock">{clock}</span>
      </header>

      <div className="mac-crt-overlay" aria-hidden />
      <div className="mac-desktop-dither" aria-hidden />
      <Suspense fallback={null}>
        <P5RetroDesktop />
      </Suspense>

      <div className="mac-desktop-surface">
        <nav
          className="mac-desktop-icons"
          aria-label="Desktop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedIconId(null);
          }}
        >
          {DESKTOP_ICONS.map((def) => (
            <DesktopFeltIcon
              key={def.id}
              def={def}
              selected={selectedIconId === def.id}
              onSelect={() => setSelectedIconId(def.id)}
              onOpen={(anchor) => {
                playMacIconOpen();
                openWindow(def.windowId, anchor);
              }}
            />
          ))}
        </nav>

        {windows.map((id) => {
          const g = geom[id];
          return (
            <DesktopWindow
              key={id}
              title={g.title}
              x={g.x}
              y={g.y}
              width={g.w}
              height={g.h}
              zIndex={zFor(id)}
              active={activeId === id}
              onActivate={() => bringToFront(id)}
              onClose={() => closeWindow(id)}
              onMove={(nx, ny) => moveWindow(id, nx, ny)}
            >
              {id === "about" && <AboutPanel />}
              {id === "projects" && <ProjectsPanel />}
              {id === "contact" && <ContactPanel />}
              {id === "lab" && <LabPanel />}
              {id === "terminal" && <TerminalPanel />}
              {id === "photobooth" && (
                <PhotoboothPanel onCapture={addPhoto} onOpenPhotobook={() => openWindow("photobook")} />
              )}
              {id === "photobook" && (
                <PhotobookPanel
                  photos={photos}
                  loading={loadingPhotos}
                  error={photoError}
                  sharedEnabled={hasSupabaseConfig}
                />
              )}
              {id === "music" && <MusicPlayerPanel />}
              {id === "browser" && <WebBrowserPanel />}
            </DesktopWindow>
          );
        })}

        <nav className="mac-dock" aria-label="Applications dock">
          {DOCK_APPS.map((app) => (
            <button
              key={app.id}
              type="button"
              className={cn("mac-dock__item", open[app.id] && "mac-dock__item--open")}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                playMacIconOpen();
                openWindow(app.id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
              }}
              title={`Open ${app.label}`}
              aria-label={`Open ${app.label}`}
            >
              <span className="mac-dock__icon-shell" aria-hidden>
                <img src={app.icon} alt="" className="mac-dock__icon" draggable={false} />
              </span>
              <span className="mac-dock__label">{app.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function DesktopFeltIcon({
  def,
  selected,
  onSelect,
  onOpen,
}: {
  def: DesktopIconDef;
  selected: boolean;
  onSelect: () => void;
  onOpen: (anchor?: { x: number; y: number }) => void;
}) {
  const frameSrc = def.frame === "blob1" ? FELT_FRAME.blob1 : FELT_FRAME.blob2;

  return (
    <button
      type="button"
      className={cn("mac-desktop-icon", selected && "mac-desktop-icon--selected")}
      style={{ left: `${def.xPct}%`, top: `${def.yPct}%` }}
      onPointerDown={() => {
        playMacIconSelect();
      }}
      onClick={(e) => {
        onSelect();
        if (def.windowId === "photobooth" || def.windowId === "photobook") {
          const rect = e.currentTarget.getBoundingClientRect();
          onOpen({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        }
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        onOpen({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      title="Double-click to open"
      aria-label={`${def.label}. Double-click to open, or press Enter when focused.`}
    >
      <span
        className={cn("mac-felt-frame", "mac-felt-frame--landscape")}
        style={{ backgroundImage: `url(${frameSrc})` }}
        aria-hidden
      >
        <img src={def.src} alt="" className="mac-felt-frame__icon" draggable={false} />
      </span>
      <span className="mac-desktop-icon__label">{def.label}</span>
    </button>
  );
}

function AboutPanel() {
  const data = WINDOW_CONTENT.about;
  return (
    <WindowScaffold title="Welcome — esnupi" intro={data.intro} sections={data.sections} />
  );
}

function ProjectsPanel() {
  const data = WINDOW_CONTENT.projects;
  return (
    <WindowScaffold title="Projects" intro={data.intro} sections={data.sections} />
  );
}

function ContactPanel() {
  const data = WINDOW_CONTENT.contact;
  return (
    <WindowScaffold title="Contact" intro={data.intro} sections={data.sections} links={data.links} />
  );
}

function LabPanel() {
  const data = WINDOW_CONTENT.lab;
  return (
    <WindowScaffold title="Lab & writing" intro={data.intro} sections={data.sections} links={data.links} />
  );
}

function TerminalPanel() {
  return <MacTerminalApp />;
}

function PhotoboothPanel({ onCapture, onOpenPhotobook }: { onCapture: (src: string) => void; onOpenPhotobook: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastShot, setLastShot] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 12, max: 15 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const videoEl = videoRef.current;
      if (videoEl) {
        videoEl.srcObject = stream;
        await videoEl.play();
      }
      setCameraReady(true);
    } catch {
      setErrorMsg("Camera access is blocked. Please allow camera permission and try again.");
      setCameraReady(false);
    }
  }, []);

  const capture = useCallback(() => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    const fxCanvas = fxCanvasRef.current;
    if (!videoEl || !canvasEl || !fxCanvas) return;
    const width = 320;
    const height = 240;
    canvasEl.width = width;
    canvasEl.height = height;
    fxCanvas.width = width;
    fxCanvas.height = height;
    const ctx = canvasEl.getContext("2d");
    const fxCtx = fxCanvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoEl, 0, 0, width, height);
    const frame = ctx.getImageData(0, 0, width, height);
    const pixels = frame.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const y = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      const level = Math.round((y / 255) * 7) * (255 / 7);
      pixels[i] = level * 0.95;
      pixels[i + 1] = level * 0.97;
      pixels[i + 2] = level;
      pixels[i + 3] = 255;
    }
    ctx.putImageData(frame, 0, 0);
    if (fxCtx) {
      fxCtx.imageSmoothingEnabled = false;
      fxCtx.drawImage(canvasEl, 0, 0, width, height);
      fxCtx.fillStyle = "rgba(0,0,0,0.17)";
      for (let y = 0; y < height; y += 2) {
        fxCtx.fillRect(0, y, width, 1);
      }
      fxCtx.fillStyle = "rgba(255,255,255,0.06)";
      for (let n = 0; n < 220; n += 1) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        fxCtx.fillRect(x, y, 1, 1);
      }
    }
    const src = (fxCtx ? fxCanvas : canvasEl).toDataURL("image/jpeg", 0.6);
    setLastShot(src);
    void onCapture(src);
  }, [onCapture]);

  useEffect(() => {
    void startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = window.setTimeout(() => {
      if (countdown === 1) {
        capture();
        setCountdown(0);
        return;
      }
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [capture, countdown]);

  return (
    <section className="mac-photobooth">
      <header className="mac-photobooth__header">
        <p>Old-computer camera booth. Click capture, pose, and collect portraits in the museum photobook.</p>
      </header>
      <div className="mac-photobooth__screen-frame">
        <div className="mac-photobooth__screen">
          <video ref={videoRef} className="mac-photobooth__video" playsInline muted />
          {countdown > 0 ? <div className="mac-photobooth__countdown">{countdown}</div> : null}
          {!cameraReady ? <div className="mac-photobooth__overlay">Camera is starting…</div> : null}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={fxCanvasRef} className="hidden" />
      {errorMsg ? <p className="mac-photobooth__error">{errorMsg}</p> : null}
      <div className="mac-photobooth__controls">
        <button type="button" className="mac-photobooth__button" disabled={!cameraReady || countdown > 0} onClick={() => setCountdown(3)}>
          {countdown > 0 ? "Capturing..." : "Take picture (3s)"}
        </button>
        <button type="button" className="mac-photobooth__button" onClick={onOpenPhotobook}>
          Open photobook
        </button>
      </div>
      {lastShot ? (
        <figure className="mac-photobooth__last-shot">
          <img src={lastShot} alt="Most recent capture" />
          <figcaption>Last captured portrait</figcaption>
        </figure>
      ) : null}
    </section>
  );
}

function PhotobookPanel({
  photos,
  loading,
  error,
  sharedEnabled,
}: {
  photos: SharedPhoto[];
  loading: boolean;
  error: string | null;
  sharedEnabled: boolean;
}) {
  const items = useMemo(() => photos, [photos]);

  return (
    <section className="mac-photobook">
      <header className="mac-photobook__header">
        <h3>Museum Photobook</h3>
        <p>{photos.length} portraits archived in the shared museum collection.</p>
      </header>
      {!sharedEnabled ? (
        <p className="mac-photobook__warning">
          Add Supabase env vars (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` or
          `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) to enable shared
          storage.
        </p>
      ) : null}
      {error ? <p className="mac-photobook__warning">{error}</p> : null}
      {loading ? <p className="mac-photobook__empty">Loading shared collection…</p> : null}
      {!loading && !items.length ? (
        <p className="mac-photobook__empty">No portraits yet. Open Photobooth to add the first visitor photo.</p>
      ) : (
        <div className="mac-photobook__grid">
          {items.map((photo) => (
            <figure key={photo.id} className="mac-photobook__item">
              <img
                src={photo.image_url}
                alt={`Visitor portrait taken ${DateTime.fromISO(photo.created_at).toLocaleString(DateTime.DATETIME_MED)}`}
                loading="lazy"
              />
              <figcaption>{DateTime.fromISO(photo.created_at).toLocaleString(DateTime.DATETIME_MED)}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

function formatTrackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function MusicPlayerPanel() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.78);

  const hasTracks = MUSIC_LIBRARY.length > 0;
  const currentTrack = hasTracks ? MUSIC_LIBRARY[Math.min(trackIndex, MUSIC_LIBRARY.length - 1)] : null;

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.src;
    setCurrentTime(0);
    setDuration(0);
    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack, isPlaying]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentTrack, isPlaying]);

  const nextTrack = useCallback(() => {
    if (!hasTracks) return;
    setTrackIndex((idx) => (idx + 1) % MUSIC_LIBRARY.length);
    setIsPlaying(true);
  }, [hasTracks]);

  const prevTrack = useCallback(() => {
    if (!hasTracks) return;
    setTrackIndex((idx) => (idx - 1 + MUSIC_LIBRARY.length) % MUSIC_LIBRARY.length);
    setIsPlaying(true);
  }, [hasTracks]);

  return (
    <section className="mac-music-player">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={nextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <header className="mac-music-player__header">
        <h3>Classic Music Player</h3>
        <p>Drop tracks into `src/music` and restart dev/build to refresh the playlist.</p>
      </header>

      {!hasTracks ? (
        <p className="mac-music-player__empty">
          No songs found. Add files to `src/music` (mp3, wav, ogg, m4a, flac, aac).
        </p>
      ) : (
        <>
          <article className="mac-music-player__deck">
            <p className="mac-music-player__now">Now Playing</p>
            <p className="mac-music-player__title">{currentTrack?.title}</p>
            <p className="mac-music-player__time">
              {formatTrackTime(currentTime)} / {formatTrackTime(duration)}
            </p>
            <input
              type="range"
              className="mac-music-player__slider"
              min={0}
              max={Math.max(duration, 1)}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => {
                const target = Number(e.target.value);
                if (audioRef.current) {
                  audioRef.current.currentTime = target;
                }
                setCurrentTime(target);
              }}
              aria-label="Seek position"
            />
            <div className="mac-music-player__controls">
              <button type="button" className="mac-music-player__button" onClick={prevTrack}>
                ◀◀
              </button>
              <button type="button" className="mac-music-player__button" onClick={togglePlay}>
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button type="button" className="mac-music-player__button" onClick={nextTrack}>
                ▶▶
              </button>
            </div>
            <label className="mac-music-player__volume">
              Volume
              <input
                type="range"
                className="mac-music-player__slider"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume"
              />
            </label>
          </article>
          <article className="mac-music-player__playlist" aria-label="Playlist">
            <h4>Playlist</h4>
            <ul>
              {MUSIC_LIBRARY.map((track, idx) => (
                <li key={track.id}>
                  <button
                    type="button"
                    className={cn("mac-music-player__track", idx === trackIndex && "mac-music-player__track--active")}
                    onClick={() => {
                      setTrackIndex(idx);
                      setIsPlaying(true);
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")} - {track.title}
                  </button>
                </li>
              ))}
            </ul>
          </article>
        </>
      )}
    </section>
  );
}

function normalizeBrowserUrl(input: string) {
  const raw = input.trim();
  if (!raw) return BROWSER_HOME;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z0-9-]+\.[a-z]{2,}/i.test(raw)) return `https://${raw}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`;
}

function originLabel(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

function WebBrowserPanel() {
  const [history, setHistory] = useState<string[]>([BROWSER_HOME]);
  const [index, setIndex] = useState(0);
  const [addressInput, setAddressInput] = useState(BROWSER_HOME);
  const [isLoading, setIsLoading] = useState(true);

  const currentUrl = history[index] ?? BROWSER_HOME;

  const navigateTo = useCallback((next: string) => {
    const normalized = normalizeBrowserUrl(next);
    setHistory((prev) => [...prev.slice(0, index + 1), normalized]);
    setIndex((prev) => prev + 1);
    setAddressInput(normalized);
    setIsLoading(true);
  }, [index]);

  useEffect(() => {
    setAddressInput(currentUrl);
  }, [currentUrl]);

  return (
    <section className="mac-browser">
      <header className="mac-browser__toolbar">
        <div className="mac-browser__toolbar-row">
          <button
            type="button"
            className="mac-browser__button"
            disabled={index <= 0}
            onClick={() => {
              if (index <= 0) return;
              setIndex((i) => i - 1);
              setIsLoading(true);
            }}
          >
            Back
          </button>
          <button
            type="button"
            className="mac-browser__button"
            disabled={index >= history.length - 1}
            onClick={() => {
              if (index >= history.length - 1) return;
              setIndex((i) => i + 1);
              setIsLoading(true);
            }}
          >
            Forward
          </button>
          <button
            type="button"
            className="mac-browser__button"
            onClick={() => {
              setIsLoading(true);
              setHistory((prev) => {
                const clone = [...prev];
                clone[index] = `${currentUrl}${currentUrl.includes("?") ? "&" : "?"}_r=${Date.now()}`;
                return clone;
              });
            }}
          >
            Reload
          </button>
          <button type="button" className="mac-browser__button" onClick={() => navigateTo(BROWSER_HOME)}>
            Home
          </button>
        </div>
        <form
          className="mac-browser__address-form"
          onSubmit={(e) => {
            e.preventDefault();
            navigateTo(addressInput);
          }}
        >
          <label htmlFor="mac-browser-address" className="mac-browser__address-label">
            Address
          </label>
          <input
            id="mac-browser-address"
            className="mac-browser__address-input"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            spellCheck={false}
          />
          <button type="submit" className="mac-browser__button">
            Go
          </button>
        </form>
        <div className="mac-browser__presets">
          {BROWSER_PRESETS.map((url) => (
            <button key={url} type="button" className="mac-browser__preset" onClick={() => navigateTo(url)}>
              {originLabel(url)}
            </button>
          ))}
        </div>
      </header>
      <div className="mac-browser__viewport">
        {isLoading ? <div className="mac-browser__loading">Loading page...</div> : null}
        <iframe
          key={currentUrl}
          src={currentUrl}
          title="Old School Browser"
          className="mac-browser__frame"
          onLoad={() => setIsLoading(false)}
          referrerPolicy="no-referrer"
          sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      </div>
      <footer className="mac-browser__status">
        <span>{isLoading ? "Connecting..." : "Done."}</span>
        <span>{originLabel(currentUrl)}</span>
      </footer>
    </section>
  );
}

function WindowScaffold({
  title,
  intro,
  sections,
  links,
}: {
  title: string;
  intro: string;
  sections: Array<{ heading: string; items: string[] }>;
  links?: Array<{ label: string; href: string }>;
}) {
  return (
    <section className="mac-content-grid" aria-label={title}>
      <p>{intro}</p>
      {sections.map((section) => (
        <article key={section.heading} className="mac-content-card">
          <h3>{section.heading}</h3>
          <ul>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ))}
      {links?.length ? (
        <article className="mac-content-card">
          <h3>Links</h3>
          <ul>
            {links.map((link) => (
              <li key={link.label}>
                {link.href.startsWith("/") ? (
                  <Link to={link.href} className="text-blue-800 underline">
                    {link.label}
                  </Link>
                ) : (
                  <a className="text-blue-800 underline" href={link.href}>
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </article>
      ) : null}
      <article className="mac-content-card">
        <h3>Working notes</h3>
        <textarea
          className="mac-content-notes"
          placeholder="Paste rough copy, links, and ideas here while shaping this section..."
          rows={5}
        />
      </article>
    </section>
  );
}
