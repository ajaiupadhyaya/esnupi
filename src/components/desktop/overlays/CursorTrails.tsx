import { useEffect, useRef } from "react";

/**
 * Three ghost-copies of the cursor trailing behind at 50/100/150ms.
 * We stash pointer samples in a rolling buffer and position the ghosts on
 * each animation frame by picking the appropriate time-offset sample.
 *
 * Uses a fixed/hidden container with pointer-events none; ghosts sit above
 * Hydra but below menu/windows (z-index 15).
 */
export function CursorTrails() {
  const rootRef = useRef<HTMLDivElement>(null);
  const samples = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const lastMove = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ghosts = Array.from(root.querySelectorAll<HTMLDivElement>(".mac-cursor-ghost"));

    const onMove = (e: PointerEvent) => {
      lastMove.current = performance.now();
      samples.current.push({ x: e.clientX, y: e.clientY, t: lastMove.current });
      if (samples.current.length > 120) samples.current.shift();
    };

    const findSampleAt = (targetT: number) => {
      const buf = samples.current;
      for (let i = buf.length - 1; i >= 0; i -= 1) {
        if (buf[i]!.t <= targetT) return buf[i];
      }
      return buf[0];
    };

    let raf = 0;
    const tick = () => {
      const now = performance.now();
      const delays = [50, 100, 150];
      delays.forEach((d, i) => {
        const el = ghosts[i];
        if (!el) return;
        const s = findSampleAt(now - d);
        if (!s) return;
        el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
        el.style.opacity = now - lastMove.current > 800 ? "0" : String([0.3, 0.15, 0.06][i]);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={rootRef} className="mac-cursor-trails" aria-hidden>
      <div className="mac-cursor-ghost" />
      <div className="mac-cursor-ghost" />
      <div className="mac-cursor-ghost" />
    </div>
  );
}
