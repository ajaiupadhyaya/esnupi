import { playMacMaximize, playMacMinimize, playMacWindowClose } from "@/lib/retroMacSounds";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Must match `--mac-menu-h` and dock reserve used in `MacintoshDesktop` positioning. */
const MENU_BAR_H = 28;
const VIEW_MARGIN = 10;
/** Space reserved above bottom edge so windows open above the dock. */
const DOCK_RESERVE_PX = 150;

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
  onActivate: () => void;
  onClose: () => void;
  onMinimizeToggle?: () => void;
  onMove: (x: number, y: number) => void;
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
}: DesktopWindowProps) {
  const sizeRef = useRef({ width, height });
  sizeRef.current = { width, height };
  const [mounted, setMounted] = useState(false);
  const [dragShadow, setDragShadow] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
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

  const endDrag = useCallback((e?: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    if (e && e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    setDragShadow(false);
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerup", endDrag, true);
    document.removeEventListener("pointercancel", endDrag, true);
  }, [onPointerMove]);

  const onTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    onActivate();
    setDragShadow(true);
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

  // Zoom-rect open animation — scale from spawnAnchor if given
  const transformOrigin = spawnAnchor
    ? `${spawnAnchor.x - x}px ${spawnAnchor.y - y}px`
    : "50% 50%";
  const openScale = mounted ? 1 : 0.08;

  return (
    <div
      className={cn(
        "mac-window",
        !active && "mac-window--inactive",
        minimized && "mac-window--shaded",
        dragShadow && "mac-window--dragging",
      )}
      style={{
        left: x,
        top: y,
        width,
        height: minimized ? 28 : height,
        zIndex,
        transformOrigin,
        transform: `scale(${openScale})`,
        opacity: mounted ? 1 : 0,
        transition:
          "transform 180ms cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 120ms ease, height 300ms ease",
      }}
      role="dialog"
      aria-label={title}
      onPointerDown={(ev) => {
        onActivate();
        ev.stopPropagation();
      }}
    >
      <div className="mac-window__titlebar" onPointerDown={onTitlePointerDown}>
        <button
          type="button"
          className="mac-window__close"
          aria-label={`Close ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            playMacWindowClose();
            onClose();
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
  );
}
