import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { playMacMenuClick } from "@/lib/retroMacSounds";

/**
 * Context menu system.
 *
 * Consumers call `useContextMenu().show(event, items)` (or `show({x,y}, items)`)
 * to open a menu anchored to the cursor. Items can be ordinary menuitems,
 * dividers, or disabled entries. Escape / click-outside dismisses.
 *
 * The menu renders through a portal at document.body so it always appears on
 * top of windows, regardless of DOM ancestry.
 */

export type ContextMenuItem =
  | {
      kind?: "item";
      label: string;
      onClick: () => void;
      disabled?: boolean;
      shortcut?: string;
    }
  | { kind: "divider" }
  | { kind: "header"; label: string };

type Anchor = { x: number; y: number };

type Ctx = {
  show: (
    eventOrAnchor: React.MouseEvent | MouseEvent | Anchor,
    items: ContextMenuItem[],
  ) => void;
  close: () => void;
};

const ContextMenuCtx = createContext<Ctx | null>(null);

export function useContextMenu(): Ctx {
  const ctx = useContext(ContextMenuCtx);
  if (!ctx) throw new Error("useContextMenu must be used inside ContextMenuProvider");
  return ctx;
}

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ anchor: Anchor; items: ContextMenuItem[] } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [adjusted, setAdjusted] = useState<Anchor | null>(null);

  const close = useCallback(() => {
    setState(null);
    setAdjusted(null);
  }, []);

  const show = useCallback<Ctx["show"]>((eventOrAnchor, items) => {
    let anchor: Anchor;
    if ("preventDefault" in eventOrAnchor) {
      eventOrAnchor.preventDefault();
      anchor = { x: (eventOrAnchor as MouseEvent).clientX, y: (eventOrAnchor as MouseEvent).clientY };
    } else {
      anchor = eventOrAnchor;
    }
    setAdjusted(null);
    setState({ anchor, items });
    playMacMenuClick();
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [state, close]);

  // Re-anchor inside viewport after measure
  useEffect(() => {
    if (!state) return;
    const el = menuRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    let x = state.anchor.x;
    let y = state.anchor.y;
    const pad = 6;
    if (x + width > window.innerWidth - pad) x = window.innerWidth - width - pad;
    if (y + height > window.innerHeight - pad) y = window.innerHeight - height - pad;
    setAdjusted({ x, y });
  }, [state]);

  const value = useMemo<Ctx>(() => ({ show, close }), [show, close]);

  return (
    <ContextMenuCtx.Provider value={value}>
      {children}
      {state &&
        createPortal(
          <div
            ref={menuRef}
            className="mac-ctx-menu"
            role="menu"
            style={{
              left: (adjusted ?? state.anchor).x,
              top: (adjusted ?? state.anchor).y,
              visibility: adjusted ? "visible" : "hidden",
            }}
          >
            {state.items.map((it, idx) => {
              if (it.kind === "divider") {
                return <div key={idx} className="mac-ctx-menu__divider" role="separator" />;
              }
              if (it.kind === "header") {
                return (
                  <div key={idx} className="mac-ctx-menu__header">
                    {it.label}
                  </div>
                );
              }
              return (
                <button
                  key={idx}
                  type="button"
                  role="menuitem"
                  disabled={it.disabled}
                  className={cn(
                    "mac-ctx-menu__item",
                    it.disabled && "mac-ctx-menu__item--disabled",
                  )}
                  onClick={() => {
                    if (it.disabled) return;
                    const fn = it.onClick;
                    playMacMenuClick();
                    close();
                    fn();
                  }}
                >
                  <span>{it.label}</span>
                  {it.shortcut && (
                    <span className="mac-ctx-menu__shortcut">{it.shortcut}</span>
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </ContextMenuCtx.Provider>
  );
}
