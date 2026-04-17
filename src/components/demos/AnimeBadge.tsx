import { animate } from "animejs";
import { useEffect, useRef } from "react";

/** Anime.js v4 — subtle pulse on a “felt” chip. */
export function AnimeBadge() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctrl = animate(el, {
      scale: [1, 1.06, 1],
      duration: 2200,
      loop: true,
      ease: "inOut",
    });
    return () => {
      ctrl.revert();
    };
  }, []);

  return (
    <span
      ref={ref}
      className="inline-flex items-center rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground shadow-[2px_2px_0_0_rgba(0,0,0,0.35)]"
    >
      anime.js
    </span>
  );
}
