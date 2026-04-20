import { useEffect, useState } from "react";

/**
 * Occasional full-viewport flicker every 45–120s. When active, the element
 * plays a short CSS animation that dips opacity briefly.
 */
export function ScreenFlicker() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let timer: number | undefined;
    const schedule = () => {
      const wait = 45_000 + Math.random() * 75_000;
      timer = window.setTimeout(() => {
        setTick((n) => n + 1);
        schedule();
      }, wait);
    };
    schedule();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return <div key={tick} className="mac-screen-flicker" aria-hidden />;
}
