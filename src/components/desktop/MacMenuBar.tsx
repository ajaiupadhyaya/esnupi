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
  | "open-about";

export type OpenWindowInfo = { id: WindowId | "aboutMac" | "secret" | "sticky" | "minesweeper"; title: string; active: boolean };

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
          onClick={() => {
            appleClicksDispatch();
            toggle("apple");
          }}
        >
          &#63743;
        </button>
        {openMenu === "apple" && (
          <DropdownMenu>
            <MenuItem onClick={() => run("about-mac")}>About This Mac…</MenuItem>
            <Divider />
            <MenuItem onClick={() => run("open-music")}>Jukebox…</MenuItem>
            <MenuItem onClick={() => run("open-about")}>Home / About…</MenuItem>
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
