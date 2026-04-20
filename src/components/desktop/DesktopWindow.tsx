import gsap from "gsap";
import {
  playMacMaximize,
  playMacMinimize,
  playMacWindowClose,
} from "@/lib/retroMacSounds";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { hydraStage } from "@/lib/hydraStage";

/** Must match `--mac-menu-h` and dock reserve used in `MacintoshDesktop` positioning. */
const MENU_BAR_H = 28;
const VIEW_MARGIN = 10;
/** Space reserved above bottom edge so windows open above the dock. */
const DOCK_RESERVE_PX = 150;

/** Zoom-rect phase durations — match Mac OS's "draw outline, then fill". */
const OPEN_RECT_MS = 120;
const OPEN_FADE_MS = 80;
const CLOSE_FADE_MS = 60;
const CLOSE_RECT_MS = 100;

export type DesktopWindowProps = {
  title: string;
  children: ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  active: boolean;
  minimized?: boolean;
  /** Optional anchor (screen coords) used to play a "zoom rect" open animation. */
  spawnAnchor?: { x: number; y: number };
  /** Optional dock anchor — target for minimize genie effect. */
  dockAnchor?: { x: number; y: number };
  onActivate: () => void;
  onClose: () => void;
  onMinimizeToggle?: () => void;
  onMove: (x: number, y: number) => void;
  /** Signal from parent that this window is about to unmount (close with animation). */
  closing?: boolean;
  onClosed?: () => void;
  /** Stable ID for CSS targeting (e.g. INTERNALS black title bar). */
  windowId?: string;
  /** Right-click on the title bar opens the caller's context menu. */
  onTitleContextMenu?: (e: React.MouseEvent) => void;
};

export function DesktopWindow({
  title,
  children,
  x,
  y,
  width,
  height,
  zIndex,
  active,
  minimized,
  spawnAnchor,
  onActivate,
  onClose,
  onMinimizeToggle,
  onMove,
  windowId,
  onTitleContextMenu,
}: DesktopWindowProps) {
  const sizeRef = useRef({ width, height });
  sizeRef.current = { width, height };

  const rectRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [contentVisible, setContentVisible] = useState(false);
  const [rectVisible, setRectVisible] = useState(true);
  const [dragShadow, setDragShadow] = useState(false);

  /* ---- Two-phase zoom rect on open ------------------------------------ */
  useEffect(() => {
    const rect = rectRef.current;
    if (!rect) {
      setContentVisible(true);
      return;
    }
    const ax = spawnAnchor?.x ?? x + width / 2;
    const ay = spawnAnchor?.y ?? y + height / 2;
    const startLeft = ax - x;
    const startTop = ay - y;
    gsap.set(rect, {
      left: startLeft,
      top: startTop,
      width: 1,
      height: 1,
      opacity: 1,
    });
    const tl = gsap.timeline();
    tl.to(rect, {
      left: 0,
      top: 0,
      width,
      height,
      duration: OPEN_RECT_MS / 1000,
      ease: "power2.out",
    }).to(rect, {
      opacity: 0,
      duration: 0.04,
      onComplete: () => setRectVisible(false),
    });
    const showId = window.setTimeout(() => setContentVisible(true), OPEN_RECT_MS);
    return () => {
      tl.kill();
      window.clearTimeout(showId);
    };
    // Intentionally only run once on mount — further size changes come from user drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const clampToViewport = useCallback((nx: number, ny: number) => {
    const { width: w, height: h } = sizeRef.current;
    const maxX = Math.max(VIEW_MARGIN, window.innerWidth - w - VIEW_MARGIN);
    const maxY = Math.max(
      MENU_BAR_H + VIEW_MARGIN,
      window.innerHeight - h - VIEW_MARGIN - DOCK_RESERVE_PX,
    );
    return {
      x: Math.min(Math.max(VIEW_MARGIN, nx), maxX),
      y: Math.min(Math.max(MENU_BAR_H + VIEW_MARGIN, ny), maxY),
    };
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      e.preventDefault();
      const nx = d.origX + (e.clientX - d.startX);
      const ny = d.origY + (e.clientY - d.startY);
      const next = clampToViewport(nx, ny);
      onMove(next.x, next.y);
    },
    [clampToViewport, onMove],
  );

  const endDrag = useCallback(
    (e?: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (e && e.pointerId !== d.pointerId) return;
      dragRef.current = null;
      setDragShadow(false);
      hydraStage.setBlur(0);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", endDrag, true);
      document.removeEventListener("pointercancel", endDrag, true);
    },
    [onPointerMove],
  );

  const onTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    onActivate();
    setDragShadow(true);
    hydraStage.setBlur(3);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: x,
      origY: y,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", endDrag, true);
    document.addEventListener("pointercancel", endDrag, true);
  };

  useEffect(() => {
    return () => endDrag();
  }, [endDrag]);

  /* ---- Close: content fade 60ms, then border collapse 100ms ---------- */
  const runCloseAnim = useCallback(() => {
    const root = rootRef.current;
    const rect = rectRef.current;
    const ax = spawnAnchor?.x ?? x + width / 2;
    const ay = spawnAnchor?.y ?? y + height / 2;

    const tl = gsap.timeline({ onComplete: onClose });
    if (root) {
      tl.to(root, { opacity: 0, duration: CLOSE_FADE_MS / 1000, ease: "power1.in" });
    }
    if (rect) {
      gsap.set(rect, {
        opacity: 1,
        left: 0,
        top: 0,
        width,
        height,
      });
      setRectVisible(true);
      tl.to(rect, {
        left: ax - x,
        top: ay - y,
        width: 1,
        height: 1,
        duration: CLOSE_RECT_MS / 1000,
        ease: "power2.in",
      });
    }
  }, [onClose, spawnAnchor?.x, spawnAnchor?.y, width, height, x, y]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "mac-window-stage",
        !active && "mac-window-stage--inactive",
        dragShadow && "mac-window-stage--dragging",
      )}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height: minimized ? 28 : height,
        zIndex,
        transition: "height 300ms ease",
      }}
      onPointerDown={(ev) => {
        onActivate();
        ev.stopPropagation();
      }}
      role="dialog"
      aria-label={title}
    >
      {/* Phase-A border rectangle — covers the full window during zoom */}
      {rectVisible && (
        <div
          ref={rectRef}
          className="mac-window__rect"
          aria-hidden
          style={{ position: "absolute", pointerEvents: "none" }}
        />
      )}

      <div
        data-window-id={windowId}
        className={cn(
          "mac-window",
          windowId && `mac-window--id-${windowId}`,
          !active && "mac-window--inactive",
          minimized && "mac-window--shaded",
          dragShadow && "mac-window--dragging",
        )}
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: `opacity ${OPEN_FADE_MS}ms ease`,
          width: "100%",
          height: "100%",
        }}
      >
        <div
          className="mac-window__titlebar"
          onPointerDown={onTitlePointerDown}
          onContextMenu={(e) => {
            if (onTitleContextMenu) {
              e.preventDefault();
              e.stopPropagation();
              onTitleContextMenu(e);
            }
          }}
        >
          <button
            type="button"
            className="mac-window__close"
            aria-label={`Close ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              playMacWindowClose();
              runCloseAnim();
            }}
          >
            <span className="sr-only">Close</span>
          </button>
          <div className="mac-window__title">{title}</div>
          {onMinimizeToggle && (
            <button
              type="button"
              className="mac-window__zoom"
              aria-label={`${minimized ? "Expand" : "Collapse"} ${title}`}
              onClick={(e) => {
                e.stopPropagation();
                if (minimized) playMacMaximize();
                else playMacMinimize();
                onMinimizeToggle();
              }}
            >
              <span className="sr-only">Zoom</span>
            </button>
          )}
        </div>
        {!minimized && <div className="mac-window__body">{children}</div>}
      </div>
    </div>
  );
}
