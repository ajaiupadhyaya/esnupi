import { DateTime } from "luxon";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
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
import { BrutalistScatter } from "./BrutalistScatter";
import { DesktopWindow } from "./DesktopWindow";

import "./macintosh-desktop.css";

const P5RetroDesktop = lazy(() =>
  import("./P5RetroDesktop").then((m) => ({ default: m.P5RetroDesktop })),
);

const INITIAL: Record<
  WindowId,
  { title: string; x: number; y: number; w: number; h: number }
> = {
  about: { title: "About", x: 48, y: 52, w: 320, h: 220 },
  projects: { title: "Projects", x: 88, y: 92, w: 360, h: 260 },
  contact: { title: "Contact", x: 128, y: 132, w: 300, h: 200 },
  lab: { title: "MDX Lab", x: 168, y: 172, w: 340, h: 240 },
};

export function MacintoshDesktop() {
  const [booting, setBooting] = useState(true);
  const [clock, setClock] = useState(() => DateTime.now().toLocaleString(DateTime.TIME_SIMPLE));
  const [open, setOpen] = useState<Record<WindowId, boolean>>({
    about: false,
    projects: false,
    contact: false,
    lab: false,
  });
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

  const bringToFront = useCallback((id: WindowId) => {
    setZOrder((prev) => [...prev.filter((x) => x !== id), id]);
    setActiveId(id);
  }, []);

  const openWindow = useCallback(
    (id: WindowId) => {
      setOpen((o) => ({ ...o, [id]: true }));
      bringToFront(id);
    },
    [bringToFront],
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
      return 20 + (i >= 0 ? i : 0);
    },
    [zOrder],
  );

  const moveWindow = useCallback((id: WindowId, x: number, y: number) => {
    setGeom((g) => ({
      ...g,
      [id]: { ...g[id], x, y },
    }));
  }, []);

  const windows = useMemo(
    () =>
      (["about", "projects", "contact", "lab"] as const).filter((id) => open[id]),
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
      <BrutalistScatter />
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
              onOpen={() => {
                playMacIconOpen();
                openWindow(def.windowId);
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
            </DesktopWindow>
          );
        })}
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
  onOpen: () => void;
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
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.preventDefault();
        onOpen();
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
        className="mac-felt-frame"
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
  return (
    <>
      <p>
        This page is a browser-native nod to classic <strong>Mac OS 8</strong> — a spatial desktop
        with draggable windows instead of a scrolling landing page.
      </p>
      <p>
        The full <strong>Macintosh.js</strong> project (
        <a
          href="https://github.com/felixrieseberg/macintosh.js"
          target="_blank"
          rel="noreferrer"
          className="text-blue-800 underline"
        >
          felixrieseberg/macintosh.js
        </a>
        ) runs System 8 inside Electron; here we only borrow the look-and-feel so the site stays
        lightweight in the browser.
      </p>
    </>
  );
}

function ProjectsPanel() {
  return (
    <>
      <p>
        Portfolio projects can live here — wire each icon or list row to real case studies when
        you are ready.
      </p>
      <p className="text-[11px] text-neutral-600">Tip: keep one window per project, or use a list with deep links.</p>
    </>
  );
}

function ContactPanel() {
  return (
    <>
      <p>Replace with your preferred contact flow (email, form, social).</p>
      <p>
        Example:{" "}
        <a className="text-blue-800 underline" href="mailto:hello@example.com">
          hello@example.com
        </a>
      </p>
    </>
  );
}

function LabPanel() {
  return (
    <>
      <p>
        The <strong>MDX Lab</strong> route demos routed content with MDX. Open it full-screen for
        reading, or keep tinkering on the desktop.
      </p>
      <p>
        <Link to="/lab" className="text-blue-800 underline">
          Open MDX Lab →
        </Link>
      </p>
    </>
  );
}
