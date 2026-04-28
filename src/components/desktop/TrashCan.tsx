import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { playMacIconSelect, playMacTrashEmpty } from "@/lib/retroMacSounds";

import felttrashcan from "../../../images/felttrashcan.png";

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
      <img
        className="mac-trash__art"
        src={felttrashcan}
        width={116}
        height={116}
        alt=""
        draggable={false}
      />
      <span className="mac-trash__label">Trash</span>
      {count > 0 && <span className="mac-trash__badge" aria-hidden>{count}</span>}
    </button>
  );
}
