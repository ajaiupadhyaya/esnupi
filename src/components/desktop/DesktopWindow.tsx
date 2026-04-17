import { playMacWindowClose } from "@/lib/retroMacSounds";
import { type ReactNode, useCallback, useEffect, useRef } from "react";

export type DesktopWindowProps = {
  title: string;
  children: ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  active: boolean;
  onActivate: () => void;
  onClose: () => void;
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
  onActivate,
  onClose,
  onMove,
}: DesktopWindowProps) {
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const nx = d.origX + (e.clientX - d.startX);
      const ny = d.origY + (e.clientY - d.startY);
      const margin = 8;
      const menuH = 24;
      const maxX = Math.max(margin, window.innerWidth - width - margin);
      const maxY = Math.max(menuH + margin, window.innerHeight - height - margin);
      onMove(Math.min(Math.max(margin, nx), maxX), Math.min(Math.max(menuH + margin, ny), maxY));
    },
    [height, onMove, width],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  }, [onPointerMove]);

  const onTitlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    onActivate();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: x,
      origY: y,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  useEffect(() => {
    return () => endDrag();
  }, [endDrag]);

  return (
    <div
      className={`mac-window ${active ? "" : "mac-window--inactive"}`}
      style={{ left: x, top: y, width, height, zIndex }}
      role="dialog"
      aria-label={title}
      onPointerDown={onActivate}
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
      </div>
      <div className="mac-window__body">{children}</div>
    </div>
  );
}
