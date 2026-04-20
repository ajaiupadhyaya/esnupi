import { useEffect, useRef, useState } from "react";
import { getControlSettings } from "../controlSettings";

const IDLE_MS = 90_000;
const GRID_COLS = 40;
const GRID_ROWS = 20;
const FILL_MS = 12_000;
const HOLD_MS = 3_000;

type Phase = "idle" | "filling" | "complete";

/**
 * The machine gets bored. 90 seconds without input, it starts defragmenting
 * an imaginary disk. Any input returns you to the desktop.
 */
export function DefragScreensaver() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [filled, setFilled] = useState(0);
  const timerRef = useRef<number | null>(null);

  /* ---- idle detection ---- */
  useEffect(() => {
    const reset = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        const settings = getControlSettings();
        if (!settings.defragScreensaver || settings.reduceMotion) return;
        setActive(true);
        setPhase("filling");
      }, IDLE_MS);
    };
    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "pointerdown",
      "wheel",
      "touchstart",
    ];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, reset));
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  /* ---- exit on any input while active ---- */
  useEffect(() => {
    if (!active) return;
    const dismiss = () => {
      setActive(false);
      setPhase("idle");
      setFilled(0);
    };
    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "pointerdown",
      "wheel",
      "touchstart",
    ];
    events.forEach((ev) => window.addEventListener(ev, dismiss, { passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, dismiss));
  }, [active]);

  /* ---- fill the grid ---- */
  useEffect(() => {
    if (phase !== "filling") return;
    const total = GRID_COLS * GRID_ROWS;
    const step = Math.max(10, FILL_MS / total);
    const id = window.setInterval(() => {
      setFilled((f) => {
        if (f + 1 >= total) {
          window.clearInterval(id);
          setPhase("complete");
          window.setTimeout(() => {
            setActive(false);
            setPhase("idle");
            setFilled(0);
          }, HOLD_MS);
          return total;
        }
        return f + 1;
      });
    }, step);
    return () => window.clearInterval(id);
  }, [phase]);

  if (!active) return null;

  return (
    <div className="mac-defrag" role="presentation" aria-hidden>
      <div className="mac-defrag__title">
        {phase === "complete" ? "OPTIMIZATION COMPLETE." : "DEFRAGMENTING DISK\u2026"}
      </div>
      <div
        className="mac-defrag__grid"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
      >
        {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => (
          <span
            key={i}
            className={`mac-defrag__cell${i < filled ? " mac-defrag__cell--on" : ""}`}
          />
        ))}
      </div>
      <div className="mac-defrag__sub">
        press any key to return to desktop
      </div>
    </div>
  );
}
