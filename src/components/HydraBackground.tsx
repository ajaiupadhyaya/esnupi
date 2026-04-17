import Hydra from "hydra-synth";
import { useEffect, useMemo, useRef, useState } from "react";
import { getVisitSeed } from "../lib/random";
import { buildFallbackSketch, buildRandomHydraSketch } from "../lib/randomHydraSketch";

import "./HydraBackground.css";

/**
 * Full-viewport WebGL background via hydra-synth. Sketch is chosen from a
 * seeded pool on each full page load so every visit gets a different look.
 * Falls back to a CSS gradient if WebGL / Hydra cannot start.
 */
export function HydraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seed = useMemo(() => getVisitSeed(), []);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (useFallback) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      return { w, h };
    };

    const { w, h } = size();
    canvas.width = w;
    canvas.height = h;

    let hydra: InstanceType<typeof Hydra> | null = null;
    try {
      hydra = new Hydra({
        canvas,
        width: w,
        height: h,
        detectAudio: false,
        // Sketches from `buildRandomHydraSketch` call `osc`, `noise`, etc.; they must exist in eval scope.
        makeGlobal: true,
      });
    } catch (e) {
      console.warn("[HydraBackground] WebGL / Hydra init failed, using CSS fallback.", e);
      setUseFallback(true);
      return;
    }

    const sketch = buildRandomHydraSketch(seed);
    try {
      hydra.eval(sketch);
    } catch {
      hydra.eval(buildFallbackSketch());
    }

    const onResize = () => {
      const { w: nw, h: nh } = size();
      canvas.width = nw;
      canvas.height = nh;
      hydra?.setResolution(nw, nh);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      try {
        hydra?.hush();
      } catch {
        /* ignore */
      }
    };
  }, [seed, useFallback]);

  if (useFallback) {
    return <div className="hydra-backdrop hydra-fallback" aria-hidden />;
  }

  return <canvas ref={canvasRef} className="hydra-backdrop" aria-hidden />;
}
