import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { playMacErrorBeep, playMacMenuClick, playMacTrashEmpty } from "@/lib/retroMacSounds";
import type { WindowId } from "./desktopIconConfig";

export type MenuAction =
  | "about-mac"
  | "open-sticky"
  | "open-finder"
  | "open-getinfo"
  | "edit-copy"
  | "edit-paste"
  | "edit-selectall"
  | "empty-trash"
  | "restart"
  | "shutdown"
  | "toggle-balloon-help"
  | "toggle-fps"
  | "toggle-sound"
  | "open-minesweeper"
  | "open-music"
  | "open-about"
  | "open-controls"
  | "open-lab"
  | "open-clock"
  | "open-typist"
  | "open-notepad"
  | "open-kaleidoscope"
  | "open-slideshow"
  | "export-note";

export type OpenWindowInfo = {
  id:
    | WindowId
    | "aboutMac"
    | "secret"
    | "sticky"
    | "minesweeper"
    | "controls"
    | "clock"
    | "typist"
    | "notepad"
    | "kaleidoscope"
    | "slideshow"
    | "internals"
    | "finder";
  title: string;
  active: boolean;
};

type MenuBarProps = {
  onAction: (action: MenuAction) => void;
  onSelectWindow: (id: string) => void;
  openWindows: OpenWindowInfo[];
  frontmost: string | null;
  balloonHelp: boolean;
  sound: boolean;
  appleClicksDispatch: () => void;
};

export function MacMenuBar({
  onAction,
  onSelectWindow,
  openWindows,
  frontmost,
  balloonHelp,
  sound,
  appleClicksDispatch,
}: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [clock, setClock] = useState(() => DateTime.now().toLocaleString(DateTime.TIME_SIMPLE));
  const [sleepNag, setSleepNag] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setClock(DateTime.now().toLocaleString(DateTime.TIME_SIMPLE));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const hour = DateTime.now().hour;
    if (hour >= 2 && hour < 4) {
      setSleepNag(true);
      const id = window.setTimeout(() => setSleepNag(false), 3000);
      return () => window.clearTimeout(id);
    }
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = (name: string) => {
    playMacMenuClick();
    setOpenMenu((cur) => (cur === name ? null : name));
  };

  const run = (action: MenuAction) => {
    playMacMenuClick();
    setOpenMenu(null);
    onAction(action);
  };

  const beep = () => {
    playMacErrorBeep();
    setOpenMenu(null);
  };

  return (
    <header className="mac-menu-bar" ref={ref}>
      <div className="mac-menu-bar__group">
        <button
          type="button"
          className={cn("mac-menu-bar__apple mac-menu-item", openMenu === "apple" && "mac-menu-item--active")}
          aria-expanded={openMenu === "apple"}
          aria-haspopup="true"
          aria-label="Apple menu"
          onClick={() => {
            appleClicksDispatch();
            toggle("apple");
          }}
        >
          <RainbowApple />
        </button>
        {openMenu === "apple" && (
          <DropdownMenu>
            <MenuItem onClick={() => run("about-mac")}>About This Mac</MenuItem>
            <Divider />
            <MenuItem onClick={() => run("open-controls")}>Control Panels</MenuItem>
            <Submenu label="Programs">
              <MenuItem onClick={() => run("open-clock")}>Clock</MenuItem>
              <MenuItem onClick={() => run("open-typist")}>Typist</MenuItem>
              <MenuItem onClick={() => run("open-notepad")}>Notepad</MenuItem>
              <MenuItem onClick={() => run("open-kaleidoscope")}>Kaleidoscope</MenuItem>
              <MenuItem onClick={() => run("open-slideshow")}>Slideshow</MenuItem>
            </Submenu>
            <MenuItem onClick={() => run("open-music")}>Jukebox</MenuItem>
            <MenuItem onClick={() => run("open-about")}>About</MenuItem>
            <MenuItem onClick={() => run("open-lab")}>Lab</MenuItem>
            <Divider />
            <MenuItem onClick={beep} subtle>Calculator</MenuItem>
            <MenuItem onClick={beep} subtle>Key Caps</MenuItem>
            <MenuItem onClick={beep} subtle>Chooser</MenuItem>
          </DropdownMenu>
        )}
      </div>

      <MenuBarItem label="File" open={openMenu === "file"} onToggle={() => toggle("file")}>
        <MenuItem onClick={() => run("open-sticky")}>New Note…</MenuItem>
        <MenuItem onClick={() => run("open-finder")}>Open…</MenuItem>
        <Divider />
        <MenuItem onClick={() => run("open-getinfo")}>Get Info</MenuItem>
        <MenuItem onClick={() => run("export-note")}>Export Note…</MenuItem>
        <MenuItem onClick={beep} subtle>Print…</MenuItem>
      </MenuBarItem>

      <MenuBarItem label="Edit" open={openMenu === "edit"} onToggle={() => toggle("edit")}>
        <MenuItem onClick={() => run("edit-copy")} shortcut="⌘C">Copy</MenuItem>
        <MenuItem onClick={() => run("edit-paste")} shortcut="⌘V">Paste</MenuItem>
        <MenuItem onClick={() => run("edit-selectall")} shortcut="⌘A">Select All</MenuItem>
        <Divider />
        <MenuItem onClick={beep} subtle>Undo</MenuItem>
        <MenuItem onClick={beep} subtle>Redo</MenuItem>
      </MenuBarItem>

      <MenuBarItem label="View" open={openMenu === "view"} onToggle={() => toggle("view")}>
        <MenuItem onClick={() => run("toggle-balloon-help")}>
          {balloonHelp ? "✓ " : ""}Show Balloons
        </MenuItem>
        <MenuItem onClick={() => run("toggle-fps")} subtle>Show FPS</MenuItem>
        <MenuItem onClick={beep} subtle>As Icons</MenuItem>
        <MenuItem onClick={beep} subtle>As List</MenuItem>
      </MenuBarItem>

      <MenuBarItem label="Special" open={openMenu === "special"} onToggle={() => toggle("special")}>
        <MenuItem
          onClick={() => {
            playMacTrashEmpty();
            run("empty-trash");
          }}
        >
          Empty Trash…
        </MenuItem>
        <MenuItem onClick={() => run("open-minesweeper")}>Minefield…</MenuItem>
        <MenuItem onClick={() => run("toggle-sound")}>
          {sound ? "✓ " : ""}Sound
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => run("restart")}>Restart…</MenuItem>
        <MenuItem onClick={() => run("shutdown")}>Shut Down…</MenuItem>
      </MenuBarItem>

      <MenuBarItem label="Window" open={openMenu === "window"} onToggle={() => toggle("window")}>
        {openWindows.length === 0 ? (
          <MenuItem onClick={() => undefined} subtle>(no open windows)</MenuItem>
        ) : (
          openWindows.map((w) => (
            <MenuItem
              key={w.id}
              onClick={() => {
                playMacMenuClick();
                setOpenMenu(null);
                onSelectWindow(w.id);
              }}
            >
              {frontmost === w.id ? "✓ " : "   "}
              {w.title}
            </MenuItem>
          ))
        )}
      </MenuBarItem>

      <MenuBarItem label="Help" open={openMenu === "help"} onToggle={() => toggle("help")}>
        <MenuItem onClick={() => run("toggle-balloon-help")}>
          {balloonHelp ? "✓ " : ""}Balloon Help
        </MenuItem>
        <MenuItem onClick={beep} subtle>esnupi Help…</MenuItem>
      </MenuBarItem>

      <span className="mac-menu-bar__spacer" aria-hidden />
      <span className="mac-menu-bar__clock">
        {sleepNag ? "you should sleep" : clock}
      </span>
    </header>
  );
}

function MenuBarItem({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mac-menu-bar__group">
      <button
        type="button"
        className={cn("mac-menu-item", open && "mac-menu-item--active")}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={onToggle}
      >
        {label}
      </button>
      {open && <DropdownMenu>{children}</DropdownMenu>}
    </div>
  );
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  return (
    <div className="mac-menu-dropdown" role="menu">
      {children}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  shortcut,
  subtle,
}: {
  children: React.ReactNode;
  onClick: () => void;
  shortcut?: string;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn("mac-menu-dropdown__item", subtle && "mac-menu-dropdown__item--subtle")}
      onClick={onClick}
    >
      <span>{children}</span>
      {shortcut && <span className="mac-menu-dropdown__shortcut">{shortcut}</span>}
    </button>
  );
}

function Divider() {
  return <div className="mac-menu-dropdown__divider" role="separator" />;
}

/**
 * Submenu — opens on hover to the right. Accessibility: acts as a menuitem
 * with aria-haspopup. Keyboard opens on Enter/Right.
 */
function Submenu({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn("mac-menu-dropdown__submenu", open && "mac-menu-dropdown__submenu--open")}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        className="mac-menu-dropdown__item mac-menu-dropdown__item--has-submenu"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "Enter") setOpen(true);
          if (e.key === "ArrowLeft" || e.key === "Escape") setOpen(false);
        }}
      >
        <span>{label}</span>
        <span className="mac-menu-dropdown__submenu-arrow" aria-hidden>▸</span>
      </button>
      {open && (
        <div className="mac-menu-dropdown mac-menu-dropdown--submenu" role="menu">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * The six-stripe rainbow Apple logo (1977–1998 mark). Stripes are realised by
 * clipping a stack of coloured bands to an outlined apple silhouette. Only one
 * set of path data defines the silhouette; the stripes are horizontal rects
 * inside that clip, so colours are crisp and the bite + leaf stay negative.
 */
function RainbowApple() {
  const stripes = [
    { color: "#61BB46", y: 0, h: 3.6 },
    { color: "#FDB827", y: 3.6, h: 3.6 },
    { color: "#F5821F", y: 7.2, h: 3.6 },
    { color: "#E03A3E", y: 10.8, h: 3.6 },
    { color: "#963D97", y: 14.4, h: 3.6 },
    { color: "#009DDC", y: 18.0, h: 4.0 },
  ];
  return (
    <svg
      className="mac-menu-bar__apple-svg"
      width="18"
      height="22"
      viewBox="0 0 18 22"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="mac-apple-clip">
          {/* Hand-tuned path that matches the classic rainbow Apple silhouette. */}
          <path
            d="M12.1 6.3c.9-.9 1.5-2.2 1.4-3.5-1.2.1-2.5.8-3.2 1.7-.7.8-1.3 2.1-1.2 3.4 1.3.1 2.1-.7 3-1.6zM17 16.4c-.5 1.1-.8 1.6-1.4 2.5-.9 1.3-2.2 2.9-3.8 2.9-1.4 0-1.8-.9-3.7-.9-1.9 0-2.3.9-3.7.9-1.6 0-2.8-1.5-3.7-2.8C1 16.9 0 14 0 11.2c0-3.8 2.5-5.8 4.9-5.8 1.6 0 2.6.9 3.9.9 1.3 0 2.1-.9 3.9-.9 1.4 0 2.9.8 3.9 2.1-3.4 1.9-2.9 6.8.4 8.9z"
            fill="#000"
          />
        </clipPath>
      </defs>
      <g clipPath="url(#mac-apple-clip)">
        {stripes.map((s) => (
          <rect key={s.color} x="0" y={s.y} width="18" height={s.h} fill={s.color} />
        ))}
      </g>
    </svg>
  );
}
