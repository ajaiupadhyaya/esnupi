import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { playMacIconSelect, playMacTrashEmpty } from "@/lib/retroMacSounds";

/**
 * TrashCan — the classic Mac trash icon. Tracks whether it contains items
 * (full vs empty art), shows an optional badge count, reacts to drag-over
 * by opening its lid, and plays an "empty" animation when cleared.
 */

type TrashCanProps = {
  count: number;
  onEmpty: () => void;
  /** Bounding rect is reported upward so the parent can detect drops. */
  onMount?: (rect: () => DOMRect | null) => void;
  /** Whether the pointer is currently dragging an icon over the trash. */
  hot?: boolean;
};

export function TrashCan({ count, onEmpty, onMount, hot = false }: TrashCanProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [emptying, setEmptying] = useState(false);

  useEffect(() => {
    if (!onMount) return;
    onMount(() => ref.current?.getBoundingClientRect() ?? null);
  }, [onMount]);

  const open = count > 0;

  const empty = () => {
    if (count === 0) return;
    setEmptying(true);
    playMacTrashEmpty();
    window.setTimeout(() => {
      setEmptying(false);
      onEmpty();
    }, 700);
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "mac-trash",
        open && "mac-trash--full",
        !open && "mac-trash--empty",
        hot && "mac-trash--hot",
        emptying && "mac-trash--emptying",
      )}
      onClick={() => {
        playMacIconSelect();
      }}
      onDoubleClick={empty}
      onContextMenu={(e) => {
        e.preventDefault();
        empty();
      }}
      aria-label={`Trash${count > 0 ? ` — ${count} item${count > 1 ? "s" : ""}` : " — empty"}`}
    >
      <svg
        className="mac-trash__art"
        width="48"
        height="56"
        viewBox="0 0 48 56"
        aria-hidden
        focusable="false"
      >
        {/* Lid (tilts up when hot or full) */}
        <g className="mac-trash__lid">
          <rect x="6" y="10" width="36" height="6" rx="1" fill="#d4d0c8" stroke="#000" strokeWidth="1.2" />
          <rect x="18" y="7" width="12" height="5" rx="1" fill="#b0ada5" stroke="#000" strokeWidth="1.2" />
        </g>
        {/* Body */}
        <path
          d="M8 16 L10 52 C10 53 11 54 12 54 L36 54 C37 54 38 53 38 52 L40 16 Z"
          fill="#d4d0c8"
          stroke="#000"
          strokeWidth="1.2"
        />
        {/* Ribs */}
        <line x1="16" y1="20" x2="16.5" y2="50" stroke="#000" strokeOpacity="0.4" strokeWidth="1" />
        <line x1="24" y1="20" x2="24" y2="50" stroke="#000" strokeOpacity="0.4" strokeWidth="1" />
        <line x1="32" y1="20" x2="31.5" y2="50" stroke="#000" strokeOpacity="0.4" strokeWidth="1" />
        {/* "Bulging" when full: a little extra weight at the bottom */}
        {open && !emptying && (
          <path
            d="M14 40 C18 38 30 38 34 40 L32 48 L16 48 Z"
            fill="#9e978e"
            stroke="#000"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
        )}
      </svg>
      <span className="mac-trash__label">Trash</span>
      {count > 0 && <span className="mac-trash__badge" aria-hidden>{count}</span>}
    </button>
  );
}
