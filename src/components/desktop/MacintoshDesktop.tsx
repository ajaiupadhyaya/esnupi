import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import gsap from "gsap";
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
  playDiskSeekChirps,
  playMacTrashEmpty,
  setMacSoundsMuted,
} from "@/lib/retroMacSounds";

import {
  type DesktopIconDef,
  DESKTOP_ICONS,
  FELT_FRAME,
  type WindowId,
} from "./desktopIconConfig";
import { DesktopWindow } from "./DesktopWindow";
import { ContextMenuProvider, useContextMenu } from "./ContextMenu";
import { TrashCan } from "./TrashCan";
import { MagneticDock } from "./MagneticDock";
import { BootSequence } from "./BootSequence";
import { ShutdownScreen } from "./ShutdownScreen";
import { MobileAlert } from "./MobileAlert";
import { MacMenuBar, type MenuAction, type OpenWindowInfo } from "./MacMenuBar";
import { useKonamiCode } from "./useKonamiCode";
import { hydraStage } from "@/lib/hydraStage";
import {
  restartAmbient,
  setAmbientMuted,
  startAmbient,
  stopAmbient,
} from "@/lib/ambientAudio";
import { getControlSettings, useControlSettings } from "./controlSettings";
import {
  accumulateTime,
  beginVisit,
  incrementWindowsOpened,
  markKonamiUsed,
  markSecretFound,
} from "@/lib/visitMemory";
import { useRouteTransition } from "@/components/layout/RouteTransition";
import { CursorTrails } from "./overlays/CursorTrails";
import { DustMotes } from "./overlays/DustMotes";
import { ScreenFlicker } from "./overlays/ScreenFlicker";
import { MacNotifications } from "./overlays/Notifications";
import { AboutThisMacPanel } from "./panels/AboutThisMacPanel";
import { SecretPanel } from "./panels/SecretPanel";
import { StickyNotePanel } from "./panels/StickyNotePanel";
import {
  AboutPanel as NewAboutPanel,
  WorkPanel,
  FindPanel,
  LabStubPanel,
} from "./panels/ContentPanels";
import type { MusicTrack } from "./panels/MusicPlayerPanel";
import { DefragScreensaver } from "./overlays/DefragScreensaver";
import { DesktopPet } from "./overlays/DesktopPet";
import { MemoryLeakOverlay } from "./overlays/MemoryLeakOverlay";

/* Heavy / app-like panels load on demand so the desktop boots fast. */
const MacTerminalApp = lazy(() =>
  import("./MacTerminalApp").then((m) => ({ default: m.MacTerminalApp })),
);
const PhotoboothPanel = lazy(() =>
  import("./panels/PhotoboothPanel").then((m) => ({ default: m.PhotoboothPanel })),
);
const ScrapbookPanel = lazy(() =>
  import("./panels/ScrapbookPanel").then((m) => ({ default: m.ScrapbookPanel })),
);
const MusicPlayerPanel = lazy(() =>
  import("./panels/MusicPlayerPanel").then((m) => ({ default: m.MusicPlayerPanel })),
);
const WebBrowserPanel = lazy(() =>
  import("./panels/WebBrowserPanel").then((m) => ({ default: m.WebBrowserPanel })),
);
const MinesweeperPanel = lazy(() =>
  import("./panels/MinesweeperPanel").then((m) => ({ default: m.MinesweeperPanel })),
);
const ControlPanelsPanel = lazy(() =>
  import("./panels/ControlPanelsPanel").then((m) => ({ default: m.ControlPanelsPanel })),
);
const ClockPanel = lazy(() =>
  import("./programs/ClockPanel").then((m) => ({ default: m.ClockPanel })),
);
const TypistPanel = lazy(() =>
  import("./programs/TypistPanel").then((m) => ({ default: m.TypistPanel })),
);
const NotepadPanel = lazy(() =>
  import("./programs/NotepadPanel").then((m) => ({ default: m.NotepadPanel })),
);
const KaleidoscopePanel = lazy(() =>
  import("./programs/KaleidoscopePanel").then((m) => ({ default: m.KaleidoscopePanel })),
);
const SlideshowPanel = lazy(() =>
  import("./programs/SlideshowPanel").then((m) => ({ default: m.SlideshowPanel })),
);
const InternalsPanel = lazy(() =>
  import("./panels/InternalsPanel").then((m) => ({ default: m.InternalsPanel })),
);
const FinderPanel = lazy(() =>
  import("./panels/FinderPanel").then((m) => ({ default: m.FinderPanel })),
);


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
  | "getinfo"
  | "controls"
  | "clock"
  | "typist"
  | "notepad"
  | "kaleidoscope"
  | "slideshow"
  | "internals"
  | "finder";

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
  { id: "projects", label: "Profiler", icon: PLACEHOLDER_DOCK_ICON },
  { id: "contact", label: "Contact", icon: PLACEHOLDER_DOCK_ICON },
  { id: "lab", label: "Lab", icon: PLACEHOLDER_DOCK_ICON },
  { id: "terminal", label: "Terminal", icon: PLACEHOLDER_DOCK_ICON },
  { id: "photobooth", label: "Photobooth", icon: PLACEHOLDER_DOCK_ICON },
  { id: "photobook", label: "Photobook", icon: PLACEHOLDER_DOCK_ICON },
  { id: "music", label: "Music", icon: MUSIC_DOCK_ICON },
  { id: "browser", label: "Browser", icon: BROWSER_DOCK_ICON },
];

const INITIAL: Record<AnyWindowId, { title: string; w: number; h: number }> = {
  about: { title: "About", w: 520, h: 440 },
  projects: { title: "System Profiler", w: 620, h: 500 },
  contact: { title: "Find", w: 520, h: 420 },
  lab: { title: "Lab", w: 560, h: 420 },
  terminal: { title: "Terminal", w: 820, h: 520 },
  photobooth: { title: "Photobooth", w: 720, h: 620 },
  photobook: { title: "Scrapbook", w: 960, h: 640 },
  music: { title: "Jukebox", w: 620, h: 520 },
  browser: { title: "Browser", w: 1020, h: 680 },
  aboutMac: { title: "About this Mac", w: 480, h: 440 },
  secret: { title: "— private collection —", w: 640, h: 520 },
  sticky: { title: "Note", w: 260, h: 220 },
  minesweeper: { title: "Minefield", w: 560, h: 520 },
  getinfo: { title: "Get Info", w: 360, h: 300 },
  controls: { title: "Control Panels", w: 520, h: 520 },
  clock: { title: "Clock", w: 280, h: 360 },
  typist: { title: "Typist", w: 640, h: 520 },
  notepad: { title: "Notepad", w: 560, h: 480 },
  kaleidoscope: { title: "Kaleidoscope", w: 620, h: 560 },
  slideshow: { title: "Slideshow", w: 880, h: 620 },
  internals: { title: "INTERNALS", w: 720, h: 560 },
  finder: { title: "Desktop", w: 620, h: 440 },
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


// =========================================================================
// Main component
// =========================================================================

/** Registered once per page load — everything else derives from this. */
const initialVisit = typeof window === "undefined" ? null : beginVisit();

export function MacintoshDesktop() {
  return (
    <ContextMenuProvider>
      <MacintoshDesktopInner />
    </ContextMenuProvider>
  );
}

function MacintoshDesktopInner() {
  const [bootKey, setBootKey] = useState(0);
  const contextMenu = useContextMenu();
  const [trashedIcons, setTrashedIcons] = useState<Set<string>>(new Set());
  const [booting, setBooting] = useState(true);
  /* shortForm boot after the very first visit — the machine remembers you. */
  const [shortBoot, setShortBoot] = useState(
    (initialVisit?.visitCount ?? 1) > 1,
  );
  const [shutdownMode, setShutdownMode] = useState<null | "shutdown" | "restart">(null);
  const [balloonHelp, setBalloonHelp] = useState(false);
  const [sound, setSound] = useState(!isMacSoundsMuted());
  const [controlSettings] = useControlSettings();
  const [showFps, setShowFps] = useState(false);
  const [konamiUnlocked, setKonamiUnlocked] = useState(false);
  const [matrixMode, setMatrixMode] = useState(false);
  const [iconsWobble, setIconsWobble] = useState(false);
  const [iconPositions, setIconPositions] = useState<IconPositions>(() => loadIconPositions());
  const [, setAppleClicks] = useState(0);
  const [, setSessionOpenCount] = useState(0);
  const [beachBall, setBeachBall] = useState(false);
  const [corruptedActive, setCorruptedActive] = useState(false);
  const [getInfoTarget, setGetInfoTarget] = useState<AnyWindowId | null>(null);
  const [lightNorm, setLightNorm] = useState({ x: 0.5, y: 0.5 });
  const [memoryLeakActive, setMemoryLeakActive] = useState(false);
  const [midnightDrift, setMidnightDrift] = useState(false);
  const lastActiveRef = useRef(Date.now());

  const [open, setOpen] = useState<Record<AnyWindowId, boolean>>({
    about: false, projects: false, contact: false, lab: false,
    terminal: false, photobooth: false, photobook: false, music: false,
    browser: false, aboutMac: false, secret: false, sticky: false,
    minesweeper: false, getinfo: false, controls: false,
    clock: false, typist: false, notepad: false, kaleidoscope: false,
    slideshow: false, internals: false, finder: false,
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

  const routeTransition = useRouteTransition();
  const navigateToLab = useCallback(() => {
    routeTransition.goto("/lab");
  }, [routeTransition]);

  const navigateToGallery = useCallback(() => {
    routeTransition.goto("/gallery");
  }, [routeTransition]);

  const navigateToArchive = useCallback(
    (projectId?: string) => {
      routeTransition.goto(projectId ? `/archive#project-${projectId}` : "/archive");
    },
    [routeTransition],
  );

  /* --- Persist icon positions ------------------------------------------- */
  useEffect(() => {
    localStorage.setItem(ICON_STORAGE_KEY, JSON.stringify(iconPositions));
  }, [iconPositions]);

  /* --- Cursor / “light source” for window shadows ----------------------- */
  useEffect(() => {
    const bump = () => {
      lastActiveRef.current = Date.now();
    };
    const onMove = (e: MouseEvent) => {
      bump();
      setLightNorm({
        x: e.clientX / Math.max(1, window.innerWidth),
        y: e.clientY / Math.max(1, window.innerHeight),
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("pointerdown", bump, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("pointerdown", bump);
    };
  }, []);

  /* --- Midnight drift: rare idle “gravity” on desktop icons ------------- */
  useEffect(() => {
    const tick = window.setInterval(() => {
      if (Date.now() - lastActiveRef.current < 120_000) return;
      if (Math.random() >= 0.01) return;
      setMidnightDrift(true);
      window.clearInterval(tick);
      window.setTimeout(() => setMidnightDrift(false), 100_000);
    }, 5000);
    return () => window.clearInterval(tick);
  }, []);

  /* --- Set sounds muted mirror ------------------------------------------ */
  useEffect(() => {
    setMacSoundsMuted(!sound);
  }, [sound]);

  /* --- Ambient audio room-tone: start on first user gesture ------------- */
  useEffect(() => {
    let started = false;
    const boot = () => {
      if (started) return;
      started = true;
      if (getControlSettings().ambientSounds) startAmbient();
      window.removeEventListener("pointerdown", boot);
      window.removeEventListener("keydown", boot);
    };
    window.addEventListener("pointerdown", boot);
    window.addEventListener("keydown", boot);
    return () => {
      window.removeEventListener("pointerdown", boot);
      window.removeEventListener("keydown", boot);
      stopAmbient();
    };
  }, []);

  /* --- Ambient toggles ---------------------------------------------------- */
  const prevAmbientRef = useRef({
    ambientSounds: controlSettings.ambientSounds,
    reduceMotion: controlSettings.reduceMotion,
  });
  useEffect(() => {
    const prev = prevAmbientRef.current;
    if (prev.ambientSounds !== controlSettings.ambientSounds) {
      setAmbientMuted(!controlSettings.ambientSounds);
    } else if (
      controlSettings.ambientSounds &&
      prev.reduceMotion !== controlSettings.reduceMotion
    ) {
      /* Reduce-motion toggle only affects the CRT whine chain; restart for clarity. */
      restartAmbient();
    }
    prevAmbientRef.current = {
      ambientSounds: controlSettings.ambientSounds,
      reduceMotion: controlSettings.reduceMotion,
    };
  }, [controlSettings.ambientSounds, controlSettings.reduceMotion]);

  /* --- Konami --------------------------------------------------------- */
  useKonamiCode(() => {
    if (konamiUnlocked) return;
    setKonamiUnlocked(true);
    markKonamiUsed();
    playKonamiFanfare();
    hydraStage.setMood("ARCHIVE");
    openWindow("secret");
  });

  /* --- Accumulate total-time-on-site every 30 s while tab is visible --- */
  useEffect(() => {
    let sessionStart = Date.now();
    const tick = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        accumulateTime(now - sessionStart);
        sessionStart = now;
      }
    };
    const onVisibility = () => {
      sessionStart = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const id = window.setInterval(tick, 30_000);
    const onBeforeUnload = () => tick();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(id);
      window.removeEventListener("beforeunload", onBeforeUnload);
      tick();
    };
  }, []);

  /* --- Dynamic body classes ------------------------------------------- */
  useEffect(() => {
    document.body.classList.toggle("mac-matrix-mode", matrixMode);
    document.body.classList.toggle("mac-icons-wobble", iconsWobble);
    document.body.classList.toggle("mac-balloon-help", balloonHelp);
    document.body.classList.toggle("mac-konami-unlocked", konamiUnlocked);
    hydraStage.setMatrix(matrixMode);
  }, [matrixMode, iconsWobble, balloonHelp, konamiUnlocked]);

  /* --- Preload desktop icon artwork so the first arrival animation is instant. */
  useEffect(() => {
    const urls = new Set<string>();
    for (const def of DESKTOP_ICONS) urls.add(def.src);
    urls.add(FELT_FRAME.blob1);
    urls.add(FELT_FRAME.blob2);
    for (const url of urls) {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    }
  }, []);

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
      const wasAlreadyOpen = open[id];
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
      setOpen((o) => {
        const wasOpen = o[id];
        if (!wasOpen) incrementWindowsOpened();
        return { ...o, [id]: true };
      });
      setMinimized((m) => ({ ...m, [id]: false }));
      bringToFront(id);
      if (!wasAlreadyOpen) {
        playDiskSeekChirps({ count: 5 + Math.floor(Math.random() * 4), spreadMs: 480 });
        document.body.classList.add("mac-loading-jitter");
        window.setTimeout(() => document.body.classList.remove("mac-loading-jitter"), 720);
      }
      hydraStage.pulse();
      if (id === "secret") markSecretFound();
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

  /* Global Escape — closes the frontmost window unless focus is inside a
     text input/textarea (so typing Esc there doesn't kill the window). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (activeId) closeWindow(activeId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, closeWindow]);

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
          openWindow("finder");
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
        case "open-controls":
          openWindow("controls");
          break;
        case "open-lab":
          navigateToLab();
          break;
        case "open-clock":
          openWindow("clock");
          break;
        case "open-typist":
          openWindow("typist");
          break;
        case "open-notepad":
          openWindow("notepad");
          break;
        case "open-kaleidoscope":
          openWindow("kaleidoscope");
          break;
        case "open-slideshow":
          openWindow("slideshow");
          break;
        case "export-note":
          void import("./programs/TypistPanel").then((m) => m.exportTypistNote());
          break;
        case "empty-trash":
          playMacTrashEmpty();
          hydraStage.invert();
          setTrashedIcons(new Set());
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

  /* --- Pause Hydra under window-coverage heuristic -------------------- */
  useEffect(() => {
    hydraStage.setPaused(visibleWindows.length > 4);
  }, [visibleWindows.length]);

  useEffect(() => {
    document.body.dataset.macWindows = String(visibleWindows.length);
  }, [visibleWindows.length]);

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
      DESKTOP_ICONS.filter((def) => !trashedIcons.has(def.id)).map((def) => {
        const override = iconPositions[def.id];
        return override ? { ...def, xPct: override.xPct, yPct: override.yPct } : def;
      }),
    [iconPositions, trashedIcons],
  );

  /* Reading-order sequence (top-to-bottom, then left-to-right) for the
     "Finder is drawing the desktop" materialization effect. */
  const iconSequence = useMemo(() => {
    const order = [...icons]
      .map((i, originalIndex) => ({ id: i.id, originalIndex, y: i.yPct, x: i.xPct }))
      .sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));
    const m: Record<string, number> = {};
    order.forEach((item, i) => {
      m[item.id] = i;
    });
    return m;
  }, [icons]);

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
          shortForm={shortBoot}
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
        activeId === null && "mac-desktop-root--defocused",
        midnightDrift && "mac-desktop-root--midnight-drift",
      )}
      onPointerDown={(e) => {
        lastActiveRef.current = Date.now();
        /* Clicks that land on the desktop root itself (not a window or icon)
           remove focus so open windows desaturate per the v4 brief. */
        if (e.target === e.currentTarget) setActiveId(null);
      }}
      onDoubleClick={(e) => {
        if (e.target === e.currentTarget) openWindow("finder");
      }}
      onContextMenu={(e) => {
        if (e.target !== e.currentTarget) return;
        contextMenu.show(e, [
          { label: "New Note", onClick: () => openWindow("sticky") },
          { label: "Open Desktop…", onClick: () => openWindow("finder") },
          { kind: "divider" },
          {
            label: "Change Wallpaper",
            onClick: () => hydraStage.pulse(),
          },
          { label: "Clean Up Icons", onClick: () => undefined, disabled: true },
          { kind: "divider" },
          { label: "About This Mac", onClick: () => openWindow("aboutMac") },
        ]);
      }}
    >
      <MacMenuBar
        onAction={handleMenuAction}
        onSelectWindow={(id) => bringToFront(id as AnyWindowId)}
        openWindows={openWindowsInfo}
        frontmost={activeId}
        balloonHelp={balloonHelp}
        sound={sound}
        appleClicksDispatch={handleAppleClicks}
        pet={<DesktopPet />}
      />

      <div className="mac-crt-overlay" aria-hidden />
      <div className="hydra-breathing-overlay" aria-hidden />
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
          {icons.map((def) => (
            <DesktopFeltIcon
              key={def.id}
              def={def}
              index={iconSequence[def.id] ?? 0}
              selected={selectedIconId === def.id}
              midnightDrift={midnightDrift}
              onSelect={() => setSelectedIconId(def.id)}
              onDragEnd={(xPct, yPct) => handleIconDragEnd(def.id, xPct, yPct)}
              onMoveToTrash={() => {
                setTrashedIcons((prev) => {
                  const next = new Set(prev);
                  next.add(def.id);
                  return next;
                });
                playMacIconSelect();
              }}
              onGetInfo={() => {
                setGetInfoTarget(def.windowId as AnyWindowId);
                openWindow("getinfo");
              }}
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
              windowId={id}
              title={title}
              x={g.x}
              y={g.y}
              width={g.w}
              height={g.h}
              zIndex={zFor(id)}
              active={activeId === id}
              minimized={minimized[id]}
              spawnAnchor={spawnAnchors.current[id]}
              lightX={lightNorm.x}
              lightY={lightNorm.y}
              onActivate={() => bringToFront(id)}
              onClose={() => closeWindow(id)}
              onMinimizeToggle={() => toggleMinimize(id)}
              onMove={(nx, ny) => moveWindow(id, nx, ny)}
              onTitleContextMenu={(e) =>
                contextMenu.show(e, [
                  { label: "Close", onClick: () => closeWindow(id) },
                  { label: "Minimize", onClick: () => toggleMinimize(id) },
                  { kind: "divider" },
                  {
                    label: "Get Info",
                    onClick: () => {
                      setGetInfoTarget(id);
                      openWindow("getinfo");
                    },
                  },
                ])
              }
            >
              {id === "about" && <NewAboutPanel />}
              {id === "projects" && <WorkPanel onOpenArchive={navigateToArchive} />}
              {id === "contact" && <FindPanel onOpenStudy={navigateToGallery} />}
              {id === "lab" && <LabStubPanel onNavigateLab={() => navigateToLab()} />}
              <Suspense fallback={<div className="mac-panel-fallback" aria-hidden />}>
                {id === "terminal" && (
                  <MacTerminalApp
                    onOpenWindow={(w) => openWindow(w)}
                    onGlitch={wobbleIcons}
                    onMatrixMode={() => {
                      setMatrixMode(true);
                      window.setTimeout(() => setMatrixMode(false), 10_000);
                    }}
                    onMemoryLeak={() => {
                      setMemoryLeakActive(true);
                      window.setTimeout(() => setMemoryLeakActive(false), 10_000);
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
                  <ScrapbookPanel
                    photos={photos}
                    loading={loadingPhotos}
                    error={photoError}
                    sharedEnabled={hasSupabaseConfig}
                  />
                )}
                {id === "music" && <MusicPlayerPanel library={MUSIC_LIBRARY} />}
                {id === "browser" && <WebBrowserPanel />}
                {id === "controls" && <ControlPanelsPanel />}
                {id === "minesweeper" && <MinesweeperPanel />}
                {id === "clock" && <ClockPanel />}
                {id === "typist" && (
                  <TypistPanel
                    onMagicWord={() => {
                      openWindow("internals");
                      window.setTimeout(() => hydraStage.pulse(), 80);
                    }}
                  />
                )}
                {id === "notepad" && <NotepadPanel />}
                {id === "kaleidoscope" && <KaleidoscopePanel />}
                {id === "slideshow" && <SlideshowPanel />}
              </Suspense>
              {id === "aboutMac" && <AboutThisMacPanel />}
              {id === "secret" && <SecretPanel />}
              {id === "sticky" && <StickyNotePanel />}
              {id === "getinfo" && <GetInfoPanel target={getInfoTarget ?? "about"} />}
              {id === "internals" && <InternalsPanel />}
              {id === "finder" && (
                <FinderPanel
                  onOpen={(target) => openWindow(target as AnyWindowId)}
                />
              )}
            </DesktopWindow>
          );
        })}

        <TrashCan
          count={trashedIcons.size}
          onEmpty={() => {
            setTrashedIcons(new Set());
            hydraStage.invert();
          }}
        />

        <MagneticDock
          items={DOCK_APPS.map((app) => ({
            id: app.id,
            label: app.label,
            icon: app.icon,
            open: open[app.id],
            onOpen: (rect) => {
              playMacIconOpen();
              openWindow(app.id, {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              });
            },
          }))}
        />
      </div>

      <MacNotifications />
      <DefragScreensaver />
      <MobileAlert />
      <MemoryLeakOverlay active={memoryLeakActive} />

      {shutdownMode && (
        <ShutdownScreen
          mode={shutdownMode}
          onDismiss={() => setShutdownMode(null)}
          onRestart={() => {
            setShutdownMode(null);
            setBootKey((k) => k + 1);
            /* The brief: the full POST runs ONLY on first visit, or after Restart. */
            setShortBoot(false);
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
  midnightDrift,
  onSelect,
  onOpen,
  onDragEnd,
  onGetInfo,
  onMoveToTrash,
}: {
  def: DesktopIconDef;
  index: number;
  selected: boolean;
  midnightDrift?: boolean;
  onSelect: () => void;
  onOpen: (anchor?: { x: number; y: number }) => void;
  onDragEnd: (xPct: number, yPct: number) => void;
  onGetInfo?: () => void;
  onMoveToTrash?: () => void;
}) {
  const contextMenu = useContextMenu();
  const frameSrc = def.frame === "blob1" ? FELT_FRAME.blob1 : FELT_FRAME.blob2;
  const rootRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ pid: number; startX: number; startY: number; origLeft: number; origTop: number } | null>(null);
  const [dragXY, setDragXY] = useState<{ x: number; y: number } | null>(null);
  const [arrived, setArrived] = useState(false);
  const [activating, setActivating] = useState(false);

  /* Reading-order materialization: each icon expands from a 1px dot.
     ~66ms per step × 12 icons ≈ 800ms total sequence. */
  useEffect(() => {
    const id = window.setTimeout(() => setArrived(true), index * 66 + 60);
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
      const frame = rootRef.current.querySelector(".mac-felt-frame");
      if (frame) {
        gsap.fromTo(
          frame,
          { scaleX: 1, scaleY: 1 },
          {
            scaleX: 1.08,
            scaleY: 0.86,
            duration: 0.12,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          },
        );
      }
    }
    setDragXY(null);
    dragRef.current = null;
  };

  const driftStyle: React.CSSProperties | undefined =
    midnightDrift && !dragXY
      ? {
          transition: "transform 100s linear",
          transform: `translate(${(50 - def.xPct) * 0.12}vw, ${(40 - def.yPct) * 0.1}vh)`,
        }
      : undefined;

  const posStyle: React.CSSProperties = dragXY
    ? { left: dragXY.x, top: dragXY.y }
    : { left: `${def.xPct}%`, top: `${def.yPct}%`, ...driftStyle };

  return (
    <button
      ref={rootRef}
      type="button"
      className={cn(
        "mac-desktop-icon",
        selected && "mac-desktop-icon--selected",
        arrived && "mac-desktop-icon--arrived",
        dragXY && "mac-desktop-icon--dragging",
        activating && "mac-desktop-icon--activating",
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
        const anchor = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        setActivating(true);
        window.setTimeout(() => {
          setActivating(false);
          onOpen(anchor);
        }, 320);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onSelect();
        contextMenu.show(e, [
          { kind: "header", label: def.label },
          { label: "Open", onClick: () => onOpen() },
          { label: "Get Info", onClick: () => onGetInfo?.() },
          { kind: "divider" },
          {
            label: "Move to Trash",
            onClick: () => onMoveToTrash?.(),
            disabled: !onMoveToTrash,
          },
        ]);
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
    case "projects": return "Drives and kernel extensions — portfolio as hardware.";
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

/* Content panels live in ./panels/ContentPanels.tsx */

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
