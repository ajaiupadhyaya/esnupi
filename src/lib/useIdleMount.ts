import { useEffect, useState } from "react";

/**
 * `false` until the browser is idle (or `timeout` ms have passed), then `true`.
 *
 * Used to keep purely decorative, heavyweight work — the p5/Hydra live
 * wallpapers, which together are the largest JS payload on the site — off the
 * critical path. The desktop paints first; the wallpaper's chunk is fetched
 * afterwards with whatever bandwidth is left over.
 */
export function useIdleMount(timeout = 2000): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    const go = () => {
      if (!cancelled) setReady(true);
    };

    // requestIdleCallback is still missing on Safari < 17.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(go, { timeout });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }

    const id = window.setTimeout(go, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [timeout]);

  return ready;
}
