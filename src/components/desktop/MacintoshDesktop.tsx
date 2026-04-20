import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  isMacSoundsMuted,
  playGlitchBurst,
  playKonamiFanfare,
  playMacDiskInsert,
  playMacIconOpen,
  playMacIconSelect,
  playMacTrashEmpty,
  setMacSoundsMuted,
} from "@/lib/retroMacSounds";

import {
  type DesktopIconDef,
  DESKTOP_ICONS,
  FELT_FRAME,
  type WindowId,
} from "./desktopIconConfig";
import { MacTerminalApp } from "./MacTerminalApp";
import { DesktopWindow } from "./DesktopWindow";
import { BootSequence } from "./BootSequence";
import { ShutdownScreen } from "./ShutdownScreen";
import { MobileAlert } from "./MobileAlert";
import { MacMenuBar, type MenuAction, type OpenWindowInfo } from "./MacMenuBar";
import { useKonamiCode } from "./useKonamiCode";
import { CursorTrails } from "./overlays/CursorTrails";
import { DustMotes } from "./overlays/DustMotes";
import { ScreenFlicker } from "./overlays/ScreenFlicker";
import { MacNotifications } from "./overlays/Notifications";
import { AboutThisMacPanel } from "./panels/AboutThisMacPanel";
import { SecretPanel } from "./panels/SecretPanel";
import { StickyNotePanel } from "./panels/StickyNotePanel";
import { MinesweeperPanel } from "./panels/MinesweeperPanel";
import { PhotoboothPanel } from "./panels/PhotoboothPanel";
import { PhotobookPanel } from "./panels/PhotobookPanel";
import { MusicPlayerPanel, type MusicTrack } from "./panels/MusicPlayerPanel";
import { WebBrowserPanel } from "./panels/WebBrowserPanel";

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
const WINDOW_STACK_OFFSET = 32;
const CHROME_MENU_H = 28;
const CHROME_MARGIN = 10;
const CHROME_DOCK_RESERVE = 150;

type AnyWindowId =
  | WindowId
  | "aboutMac"
  | "secret"
  | "sticky"
  | "minesweeper"
  | "getinfo";

const musicModules = import.meta.glob("/src/music/*.{mp3,wav,ogg,m4a,flac,aac}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const MUSIC_LIBRARY: MusicTrack[] = Object.entries(musicModules)
  .map(([path, src]) => {
    const name = path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "Untitled";
    const title = name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    return {
      id: path,
      title: title.length ? title : "Untitled",
      src,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

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

const INITIAL: Record<AnyWindowId, { title: string; w: number; h: number }> = {
  about: { title: "Home / About", w: 560, h: 420 },
  projects: { title: "Projects Studio", w: 620, h: 460 },
  contact: { title: "Contact + Links", w: 520, h: 400 },
  lab: { title: "Writing / Lab", w: 600, h: 440 },
  terminal: { title: "Terminal", w: 820, h: 520 },
  photobooth: { title: "Photobooth", w: 720, h: 620 },
  photobook: { title: "Museum Photobook", w: 920, h: 640 },
  music: { title: "Music Player", w: 620, h: 520 },
  browser: { title: "Web Browser", w: 1020, h: 680 },
  aboutMac: { title: "About this Mac", w: 480, h: 440 },
  secret: { title: "— private collection —", w: 640, h: 520 },
  sticky: { title: "Note", w: 260, h: 220 },
  minesweeper: { title: "Minefield", w: 560, h: 520 },
  getinfo: { title: "Get Info", w: 360, h: 300 },
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

// --- Persistent icon positions --------------------------------------------
const ICON_STORAGE_KEY = "esnupi.iconPositions.v2";
type IconPositions = Record<string, { xPct: number; yPct: number }>;

function loadIconPositions(): IconPositions {
  try {
    const raw = localStorage.getItem(ICON_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as IconPositions;
  } catch {
    return {};
  }
}

// --- Scaffold copy for panels --------------------------------------------
const WINDOW_CONTENT = {
  about: {
    intro:
      "esnupi is a portfolio playground built like a late-90s Macintosh desktop: a live Hydra shader for a wallpaper, draggable platinum windows, and a handful of small apps that feel right on System 7–8. Look around. Some doors are locked; some doors remember you.",
    sections: [
      {
        heading: "At a glance",
        items: [
          "Creative technologist · designer who writes code",
          "Focus: interactive web, real-time graphics, tactile UI",
          "Based in [your city] · open to [remote / collaboration]",
        ],
      },
      {
        heading: "On this desktop",
        items: [
          "Projects — case studies and build notes",
          "Lab — longer writing and experiments (/lab)",
          "Photobooth & Photobook — visitor-facing mini apps",
          "Terminal — try `neofetch`, `fortune`, or `matrix`",
          "↑↑↓↓←→←→BA — try it. you know you want to.",
        ],
      },
    ],
  },
  projects: {
    intro:
      "Each card below is a chapter waiting for a real project: title, one-line pitch, stack, link, and what you learned. Keep it short — the work should carry the page.",
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
      "Give people a single place to start a conversation. Lead with the channel you actually monitor; keep socials secondary.",
    sections: [
      {
        heading: "Primary",
        items: ["Email — best for inquiries and project briefs", "Calendar or booking link — optional", "Timezone — so async feels human"],
      },
      { heading: "Elsewhere", items: ["GitHub / code", "Are.na / reference library", "LinkedIn / profile you keep current"] },
    ],
    links: [
      { label: "Email", href: "mailto:hello@example.com" },
      { label: "GitHub", href: "https://github.com/" },
      { label: "Open Lab (MDX)", href: "/lab" },
    ],
  },
  lab: {
    intro:
      "The Lab route is for writing that does not fit in a window: essays, tutorials, dev logs, and links out.",
    sections: [
      {
        heading: "What lives here",
        items: ["Longer posts (MDX) with code and images", "Process notes: sketches, shaders, failed ideas worth saving", "Reading lists and references for future you"],
      },
    ],
    links: [{ label: "Go to Lab →", href: "/lab" }],
  },
};

// =========================================================================
// Main component
// =========================================================================

export function MacintoshDesktop() {
  const [bootKey, setBootKey] = useState(0);
  const [booting, setBooting] = useState(true);
  const [shutdownMode, setShutdownMode] = useState<null | "shutdown" | "restart">(null);
  const [balloonHelp, setBalloonHelp] = useState(false);
  const [sound, setSound] = useState(!isMacSoundsMuted());
  const [showFps, setShowFps] = useState(false);
  const [konamiUnlocked, setKonamiUnlocked] = useState(false);
  const [matrixMode, setMatrixMode] = useState(false);
  const [iconsWobble, setIconsWobble] = useState(false);
  const [hydraPaused] = useState(false);
  const [iconPositions, setIconPositions] = useState<IconPositions>(() => loadIconPositions());
  const [, setAppleClicks] = useState(0);
  const [, setSessionOpenCount] = useState(0);
  const [beachBall, setBeachBall] = useState(false);
  const [corruptedActive, setCorruptedActive] = useState(false);
  const [getInfoTarget, setGetInfoTarget] = useState<AnyWindowId | null>(null);

  const [open, setOpen] = useState<Record<AnyWindowId, boolean>>({
    about: false, projects: false, contact: false, lab: false,
    terminal: false, photobooth: false, photobook: false, music: false,
    browser: false, aboutMac: false, secret: false, sticky: false,
    minesweeper: false, getinfo: false,
  });
  const [geom, setGeom] = useState<Record<AnyWindowId, { x: number; y: number; w: number; h: number }>>(
    () => Object.fromEntries(Object.entries(INITIAL).map(([k, v]) => [k, { x: 80, y: 80, w: v.w, h: v.h }])) as never,
  );
  const [minimized, setMinimized] = useState<Record<AnyWindowId, boolean>>({} as never);
  const [photos, setPhotos] = useState<SharedPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [zOrder, setZOrder] = useState<AnyWindowId[]>([]);
  const [activeId, setActiveId] = useState<AnyWindowId | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const spawnAnchors = useRef<Record<string, { x: number; y: number }>>({});

  /* --- Persist icon positions ------------------------------------------- */
  useEffect(() => {
    localStorage.setItem(ICON_STORAGE_KEY, JSON.stringify(iconPositions));
  }, [iconPositions]);

  /* --- Set sounds muted mirror ------------------------------------------ */
  useEffect(() => {
    setMacSoundsMuted(!sound);
  }, [sound]);

  /* --- Visibility: desaturate Hydra on blur ----------------------------- */
  useEffect(() => {
    const apply = () => {
      const canvas = document.querySelector<HTMLCanvasElement>(".hydra-backdrop");
      if (!canvas) return;
      if (document.hidden || hydraPaused) {
        canvas.style.filter = "grayscale(1) brightness(0.75)";
        canvas.style.transition = "filter 2s ease";
      } else {
        canvas.style.filter = "grayscale(0) brightness(1)";
      }
    };
    apply();
    document.addEventListener("visibilitychange", apply);
    return () => document.removeEventListener("visibilitychange", apply);
  }, [hydraPaused]);

  /* --- Konami --------------------------------------------------------- */
  useKonamiCode(() => {
    if (konamiUnlocked) return;
    setKonamiUnlocked(true);
    playKonamiFanfare();
    openWindow("secret");
  });

  /* --- Dynamic body classes ------------------------------------------- */
  useEffect(() => {
    document.body.classList.toggle("mac-matrix-mode", matrixMode);
    document.body.classList.toggle("mac-icons-wobble", iconsWobble);
    document.body.classList.toggle("mac-balloon-help", balloonHelp);
    document.body.classList.toggle("mac-konami-unlocked", konamiUnlocked);
  }, [matrixMode, iconsWobble, balloonHelp, konamiUnlocked]);

  /* --- Fetch shared photos ------------------------------------------- */
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

  /* --- Window management -------------------------------------------- */
  const bringToFront = useCallback((id: AnyWindowId) => {
    setZOrder((prev) => [...prev.filter((x) => x !== id), id]);
    setActiveId(id);
  }, []);

  const openWindow = useCallback(
    (id: AnyWindowId, anchor?: { x: number; y: number }) => {
      const initial = INITIAL[id];
      setGeom((g) => {
        if (open[id]) return g;
        const cur = g[id];
        const nextPos = anchor
          ? clampWindowPosition(anchor.x, anchor.y, cur.w, cur.h)
          : stackedWindowPosition(cur.w, cur.h, zOrder.length);
        return {
          ...g,
          [id]: { ...cur, w: initial.w, h: initial.h, ...nextPos },
        };
      });
      if (anchor) spawnAnchors.current[id] = anchor;
      setOpen((o) => ({ ...o, [id]: true }));
      setMinimized((m) => ({ ...m, [id]: false }));
      bringToFront(id);
      setSessionOpenCount((c) => {
        const next = c + 1;
        if (next === 5) {
          setBeachBall(true);
          window.setTimeout(() => setBeachBall(false), 3000);
        }
        return next;
      });
    },
    [bringToFront, open, zOrder.length],
  );

  const closeWindow = useCallback((id: AnyWindowId) => {
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
    (id: AnyWindowId) => {
      const i = zOrder.indexOf(id);
      return 42 + (i >= 0 ? i : 0);
    },
    [zOrder],
  );

  const moveWindow = useCallback((id: AnyWindowId, x: number, y: number) => {
    setGeom((g) => ({ ...g, [id]: { ...g[id], x, y } }));
  }, []);

  const toggleMinimize = useCallback((id: AnyWindowId) => {
    setMinimized((m) => ({ ...m, [id]: !m[id] }));
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

  /* --- Menu actions -------------------------------------------------- */
  const handleMenuAction = useCallback(
    (action: MenuAction) => {
      switch (action) {
        case "about-mac":
          openWindow("aboutMac");
          break;
        case "open-about":
          openWindow("about");
          break;
        case "open-sticky":
          openWindow("sticky");
          break;
        case "open-finder":
          openWindow("about"); // fake "Open…" dialog — route to about for now
          break;
        case "open-getinfo":
          setGetInfoTarget(activeId);
          openWindow("getinfo");
          break;
        case "open-minesweeper":
          openWindow("minesweeper");
          break;
        case "open-music":
          openWindow("music");
          break;
        case "empty-trash":
          playMacTrashEmpty();
          break;
        case "restart":
          setShutdownMode("restart");
          break;
        case "shutdown":
          setShutdownMode("shutdown");
          break;
        case "toggle-balloon-help":
          setBalloonHelp((v) => !v);
          break;
        case "toggle-sound":
          setSound((v) => !v);
          break;
        case "toggle-fps":
          setShowFps((v) => !v);
          break;
        case "edit-copy":
          document.execCommand?.("copy");
          break;
        case "edit-paste":
          document.execCommand?.("paste");
          break;
        case "edit-selectall":
          document.execCommand?.("selectAll");
          break;
      }
    },
    [activeId, openWindow],
  );

  /* --- Apple logo 7-click easter egg ---------------------------------- */
  const handleAppleClicks = useCallback(() => {
    setAppleClicks((c) => {
      const next = c + 1;
      if (next === 7) {
        openWindow("aboutMac");
      }
      return next;
    });
  }, [openWindow]);

  /* --- Visible windows in order -------------------------------------- */
  const visibleWindows = useMemo(
    () => (Object.keys(open) as AnyWindowId[]).filter((id) => open[id]),
    [open],
  );

  const openWindowsInfo: OpenWindowInfo[] = useMemo(
    () =>
      visibleWindows.map((id) => ({
        id: id as OpenWindowInfo["id"],
        title: INITIAL[id].title,
        active: activeId === id,
      })),
    [activeId, visibleWindows],
  );

  /* --- Icons computed with overrides --------------------------------- */
  const icons = useMemo(
    () =>
      DESKTOP_ICONS.map((def) => {
        const override = iconPositions[def.id];
        return override ? { ...def, xPct: override.xPct, yPct: override.yPct } : def;
      }),
    [iconPositions],
  );

  const handleIconDragEnd = useCallback((id: string, xPct: number, yPct: number) => {
    setIconPositions((pos) => ({ ...pos, [id]: { xPct, yPct } }));
  }, []);

  /* --- Corrupted floppy -------------------------------------------- */
  const triggerCorruption = useCallback(() => {
    setCorruptedActive(true);
    playGlitchBurst();
    window.setTimeout(() => setCorruptedActive(false), 1800);
    window.setTimeout(() => openWindow("secret"), 900);
  }, [openWindow]);

  /* --- Body wobble when sudo rm -rf / ------------------------------ */
  const wobbleIcons = useCallback(() => {
    setIconsWobble(true);
    window.setTimeout(() => setIconsWobble(false), 2000);
  }, []);

  if (booting) {
    return (
      <div className="mac-desktop-root mac-desktop-root--booting">
        <BootSequence
          key={bootKey}
          onDone={() => {
            setBooting(false);
            playMacDiskInsert();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mac-desktop-root",
        beachBall && "mac-beachball",
        corruptedActive && "mac-corrupted",
      )}
    >
      <MacMenuBar
        onAction={handleMenuAction}
        onSelectWindow={(id) => bringToFront(id as AnyWindowId)}
        openWindows={openWindowsInfo}
        frontmost={activeId}
        balloonHelp={balloonHelp}
        sound={sound}
        appleClicksDispatch={handleAppleClicks}
      />

      <div className="mac-crt-overlay" aria-hidden />
      <div className="mac-desktop-dither" aria-hidden />
      <div className="mac-vignette-scanlines" aria-hidden />
      <Suspense fallback={null}>
        <P5RetroDesktop />
      </Suspense>
      <DustMotes count={10} />
      <ScreenFlicker />
      <CursorTrails />

      {showFps && <FpsCounter />}

      <div className="mac-desktop-surface">
        <nav
          className="mac-desktop-icons"
          aria-label="Desktop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedIconId(null);
          }}
        >
          {icons.map((def, i) => (
            <DesktopFeltIcon
              key={def.id}
              def={def}
              index={i}
              selected={selectedIconId === def.id}
              onSelect={() => setSelectedIconId(def.id)}
              onDragEnd={(xPct, yPct) => handleIconDragEnd(def.id, xPct, yPct)}
              onOpen={(anchor) => {
                playMacIconOpen();
                if (def.id === "heart4" && def.windowId === "lab") {
                  // "corrupted" easter egg: one heart opens secret
                  if (Math.random() < 0.25) {
                    triggerCorruption();
                    return;
                  }
                }
                openWindow(def.windowId, anchor);
              }}
            />
          ))}
        </nav>

        {visibleWindows.map((id) => {
          const g = geom[id];
          const title = id === "getinfo" && getInfoTarget ? `Info: ${INITIAL[getInfoTarget].title}` : INITIAL[id].title;
          return (
            <DesktopWindow
              key={id}
              title={title}
              x={g.x}
              y={g.y}
              width={g.w}
              height={g.h}
              zIndex={zFor(id)}
              active={activeId === id}
              minimized={minimized[id]}
              spawnAnchor={spawnAnchors.current[id]}
              onActivate={() => bringToFront(id)}
              onClose={() => closeWindow(id)}
              onMinimizeToggle={() => toggleMinimize(id)}
              onMove={(nx, ny) => moveWindow(id, nx, ny)}
            >
              {id === "about" && <AboutPanel />}
              {id === "projects" && <ProjectsPanel />}
              {id === "contact" && <ContactPanel />}
              {id === "lab" && <LabPanel />}
              {id === "terminal" && (
                <MacTerminalApp
                  onOpenWindow={(w) => openWindow(w)}
                  onGlitch={wobbleIcons}
                  onMatrixMode={() => {
                    setMatrixMode(true);
                    window.setTimeout(() => setMatrixMode(false), 10_000);
                  }}
                />
              )}
              {id === "photobooth" && (
                <PhotoboothPanel
                  onCapture={addPhoto}
                  onOpenPhotobook={() => openWindow("photobook")}
                />
              )}
              {id === "photobook" && (
                <PhotobookPanel
                  photos={photos}
                  loading={loadingPhotos}
                  error={photoError}
                  sharedEnabled={hasSupabaseConfig}
                />
              )}
              {id === "music" && <MusicPlayerPanel library={MUSIC_LIBRARY} />}
              {id === "browser" && <WebBrowserPanel />}
              {id === "aboutMac" && <AboutThisMacPanel />}
              {id === "secret" && <SecretPanel />}
              {id === "sticky" && <StickyNotePanel />}
              {id === "minesweeper" && <MinesweeperPanel />}
              {id === "getinfo" && <GetInfoPanel target={getInfoTarget ?? "about"} />}
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

      <MacNotifications />
      <MobileAlert />

      {shutdownMode && (
        <ShutdownScreen
          mode={shutdownMode}
          onDismiss={() => setShutdownMode(null)}
          onRestart={() => {
            setShutdownMode(null);
            setBootKey((k) => k + 1);
            setBooting(true);
            setOpen((o) => Object.fromEntries(Object.keys(o).map((k) => [k, false])) as never);
            setZOrder([]);
            setActiveId(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Desktop icon with drag-to-place + fall-in animation + breathing          */
/* ------------------------------------------------------------------------ */
function DesktopFeltIcon({
  def,
  index,
  selected,
  onSelect,
  onOpen,
  onDragEnd,
}: {
  def: DesktopIconDef;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onOpen: (anchor?: { x: number; y: number }) => void;
  onDragEnd: (xPct: number, yPct: number) => void;
}) {
  const frameSrc = def.frame === "blob1" ? FELT_FRAME.blob1 : FELT_FRAME.blob2;
  const rootRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ pid: number; startX: number; startY: number; origLeft: number; origTop: number } | null>(null);
  const [dragXY, setDragXY] = useState<{ x: number; y: number } | null>(null);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setArrived(true), index * 80 + 120);
    return () => window.clearTimeout(id);
  }, [index]);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    if (!rootRef.current) return;
    playMacIconSelect();
    onSelect();
    const layer = rootRef.current.parentElement;
    if (!layer) return;
    const layerRect = layer.getBoundingClientRect();
    dragRef.current = {
      pid: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: (def.xPct / 100) * layerRect.width,
      origTop: (def.yPct / 100) * layerRect.height,
    };
    try {
      rootRef.current.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || !rootRef.current?.parentElement) return;
    if (e.pointerId !== d.pid) return;
    const layer = rootRef.current.parentElement;
    const layerRect = layer.getBoundingClientRect();
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) < 6) return;
    setDragXY({
      x: Math.max(0, Math.min(layerRect.width - 120, d.origLeft + dx)),
      y: Math.max(0, Math.min(layerRect.height - 120, d.origTop + dy)),
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (e.pointerId !== d.pid) return;
    if (dragXY && rootRef.current?.parentElement) {
      const layer = rootRef.current.parentElement;
      const layerRect = layer.getBoundingClientRect();
      const xPct = (dragXY.x / layerRect.width) * 100;
      const yPct = (dragXY.y / layerRect.height) * 100;
      onDragEnd(xPct, yPct);
    }
    setDragXY(null);
    dragRef.current = null;
  };

  const posStyle: React.CSSProperties = dragXY
    ? { left: dragXY.x, top: dragXY.y }
    : { left: `${def.xPct}%`, top: `${def.yPct}%` };

  return (
    <button
      ref={rootRef}
      type="button"
      className={cn(
        "mac-desktop-icon",
        selected && "mac-desktop-icon--selected",
        arrived && "mac-desktop-icon--arrived",
        dragXY && "mac-desktop-icon--dragging",
      )}
      style={posStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        if (dragXY) return;
        onSelect();
        if (def.windowId === "photobooth" || def.windowId === "photobook") {
          const rect = e.currentTarget.getBoundingClientRect();
          onOpen({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        }
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        if (dragXY) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onOpen({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      title={balloonText(def.windowId)}
      aria-label={`${def.label}. Double-click to open, or press Enter when focused.`}
    >
      <span
        className={cn("mac-felt-frame", "mac-felt-frame--landscape")}
        style={{ backgroundImage: `url(${frameSrc})` }}
        aria-hidden
      >
        <img src={def.src} alt="" className="mac-felt-frame__icon" draggable={false} />
        {def.id === "moon" || def.id === "heart2" ? (
          <span className="mac-felt-frame__alias" aria-hidden>↗</span>
        ) : null}
      </span>
      <span className="mac-desktop-icon__label">{def.label}</span>
    </button>
  );
}

function balloonText(id: WindowId) {
  switch (id) {
    case "about": return "Who lives here. Click to find out.";
    case "projects": return "A wall of things made.";
    case "contact": return "Say hi. The machine will pass it on.";
    case "lab": return "Essays, notes, long thoughts.";
    case "terminal": return "Try `matrix`, `neofetch`, `fortune`.";
    case "photobooth": return "Become part of the museum wall.";
    case "photobook": return "Visitors who came before you.";
    case "music": return "A small jukebox. Volume: yours.";
    case "browser": return "An old internet, slightly haunted.";
    default: return "Double-click to open";
  }
}

/* ------------------------------------------------------------------------ */
/* Panels                                                                    */
/* ------------------------------------------------------------------------ */

function AboutPanel() {
  return <WindowScaffold title="Welcome — esnupi" intro={WINDOW_CONTENT.about.intro} sections={WINDOW_CONTENT.about.sections} />;
}
function ProjectsPanel() {
  return <WindowScaffold title="Projects" intro={WINDOW_CONTENT.projects.intro} sections={WINDOW_CONTENT.projects.sections} />;
}
function ContactPanel() {
  return <WindowScaffold title="Contact" intro={WINDOW_CONTENT.contact.intro} sections={WINDOW_CONTENT.contact.sections} links={WINDOW_CONTENT.contact.links} />;
}
function LabPanel() {
  return <WindowScaffold title="Lab & writing" intro={WINDOW_CONTENT.lab.intro} sections={WINDOW_CONTENT.lab.sections} links={WINDOW_CONTENT.lab.links} />;
}

function GetInfoPanel({ target }: { target: AnyWindowId }) {
  const info = INITIAL[target];
  return (
    <section className="mac-getinfo">
      <h3 className="mac-getinfo__title">Info — {info.title}</h3>
      <dl>
        <div><dt>Kind</dt><dd>desktop window</dd></div>
        <div><dt>Where</dt><dd>/esnupi/windows/{String(target)}</dd></div>
        <div><dt>Size</dt><dd>{info.w}×{info.h} px</dd></div>
        <div><dt>Created</dt><dd>1998-09-21 03:41</dd></div>
        <div><dt>Modified</dt><dd>when you opened it</dd></div>
        <div><dt>Locked</dt><dd>no. but it knows you are reading this.</dd></div>
      </dl>
      <p className="mac-getinfo__comment">
        Comments: a window is a polite request to look inside. thank you for knocking.
      </p>
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
                <a className="text-blue-800 underline" href={link.href}>
                  {link.label}
                </a>
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

/* ------------------------------------------------------------------------ */
/* FPS counter                                                               */
/* ------------------------------------------------------------------------ */
function FpsCounter() {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let last = performance.now();
    let frames = 0;
    let raf = 0;
    const loop = () => {
      frames += 1;
      const now = performance.now();
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div className="mac-fps-counter">{fps} fps</div>;
}
