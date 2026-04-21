import Hydra from "hydra-synth";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { AUTHORED_HYDRA_SKETCHES, MATRIX_SKETCH, type HydraMoodId } from "../lib/authoredHydraSketches";
import { buildFallbackSketch } from "../lib/randomHydraSketch";
import { incrementVisitCount, pickHydraMood } from "../lib/hydraMood";
import { hydraStage, installHydraStage } from "../lib/hydraStage";
import {
  buildShaderLabSketch,
  loadShaderLabState,
  saveShaderLabState,
  type ShaderLabParams,
} from "../lib/shaderLab";

import "./HydraBackground.css";

/**
 * Full-viewport WebGL wallpaper. Picks one of five authored moods (plus a
 * Konami-only ARCHIVE), responds to the cursor, pulses when a window opens,
 * inverts when trash is emptied, and pauses under load.
 */
export function HydraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  const initialMood = useMemo<HydraMoodId>(() => {
    const count = incrementVisitCount();
    return pickHydraMood({ visitCount: count });
  }, []);

  useEffect(() => {
    if (useFallback) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let dprCap = Math.min(window.devicePixelRatio ?? 1, 2);
    const size = () => {
      const w = Math.max(1, Math.floor(window.innerWidth * dprCap));
      const h = Math.max(1, Math.floor(window.innerHeight * dprCap));
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
        makeGlobal: true,
      });
    } catch (e) {
      console.warn("[HydraBackground] WebGL / Hydra init failed, using CSS fallback.", e);
      setUseFallback(true);
      return;
    }

    let activeMood: HydraMoodId = initialMood;
    const labState = loadShaderLabState();
    let shaderLabEngaged = labState.engaged;
    let shaderLabParams: ShaderLabParams = labState.params;

    const runSketch = (src: string) => {
      try {
        hydra?.eval(src);
      } catch {
        hydra?.eval(buildFallbackSketch());
      }
    };

    const activeBackdropSrc = () => {
      if (shaderLabEngaged) return buildShaderLabSketch(activeMood, shaderLabParams);
      return AUTHORED_HYDRA_SKETCHES[activeMood];
    };

    runSketch(activeBackdropSrc());

    const onResize = () => {
      const { w: nw, h: nh } = size();
      canvas.width = nw;
      canvas.height = nh;
      hydra?.setResolution(nw, nh);
    };
    window.addEventListener("resize", onResize);

    /* ---- performance: step down DPR if first frames are slow ---- */
    let frameTimes: number[] = [];
    let lastT = performance.now();
    let perfRaf = 0;
    const perfCheck = () => {
      const now = performance.now();
      frameTimes.push(now - lastT);
      lastT = now;
      if (frameTimes.length >= 3) {
        if (frameTimes.every((dt) => dt > 16)) {
          dprCap = Math.max(0.5, dprCap * 0.5);
          onResize();
        }
        return;
      }
      perfRaf = requestAnimationFrame(perfCheck);
    };
    perfRaf = requestAnimationFrame(perfCheck);

    /* ---- mouse wiring: subtle canvas transform tracking the cursor ---- */
    let targetX = 0.5;
    let targetY = 0.5;
    gsap.set(canvas, { transformOrigin: "50% 50%" });
    const mouseTween = gsap.to(
      {},
      {
        duration: 0.2,
        repeat: -1,
        onRepeat: () => {
          const tx = (targetX - 0.5) * 6;
          const ty = (targetY - 0.5) * 6;
          gsap.to(canvas, { x: tx, y: ty, duration: 0.6, ease: "sine.out", overwrite: "auto" });
        },
      },
    );

    /* ---- stage impl (desktop talks to us through this) ---- */
    let paused = false;
    let matrixOn = false;

    /* Composed filter state. Each value is animated separately via gsap and
       the composed string is written back to wrap.style.filter. */
    const fx = {
      blur: 0,
      hue: 0,
      brightness: 1,
      invert: 0,
      grayscale: 0,
    };
    const composeFilter = () => {
      const parts: string[] = [];
      if (fx.blur > 0.01) parts.push(`blur(${fx.blur.toFixed(2)}px)`);
      if (Math.abs(fx.hue) > 0.01) parts.push(`hue-rotate(${fx.hue.toFixed(1)}deg)`);
      if (Math.abs(fx.brightness - 1) > 0.001) parts.push(`brightness(${fx.brightness.toFixed(3)})`);
      if (fx.invert > 0.001) parts.push(`invert(${fx.invert.toFixed(3)})`);
      if (fx.grayscale > 0.001) parts.push(`grayscale(${fx.grayscale.toFixed(3)})`);
      wrap.style.filter = parts.length ? parts.join(" ") : "";
    };
    const animFx = (target: Partial<typeof fx>, duration = 0.3, ease = "power2.out") =>
      gsap.to(fx, {
        ...target,
        duration,
        ease,
        onUpdate: composeFilter,
      });

    const release = installHydraStage({
      pulse: () => {
        gsap.fromTo(
          fx,
          { brightness: 1 },
          { brightness: 1.4, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut", onUpdate: composeFilter },
        );
      },
      invert: () => {
        gsap.fromTo(
          fx,
          { invert: 1 },
          { invert: 0, duration: 1.5, ease: "power2.out", onUpdate: composeFilter },
        );
      },
      setMouse: (x, y) => {
        targetX = x;
        targetY = y;
      },
      setHueRotation: (deg) => {
        animFx({ hue: deg == null ? 0 : deg });
      },
      setPaused: (p) => {
        paused = p;
        try {
          if (p) hydra?.hush();
          else runSketch(matrixOn ? MATRIX_SKETCH : activeBackdropSrc());
        } catch {
          /* ignore */
        }
      },
      setMood: (mood) => {
        activeMood = mood;
        if (!paused && !matrixOn) runSketch(activeBackdropSrc());
      },
      setMatrix: (on) => {
        matrixOn = on;
        if (paused) return;
        runSketch(on ? MATRIX_SKETCH : activeBackdropSrc());
      },
      setBlur: (px) => {
        animFx({ blur: Math.max(0, px) }, 0.18);
      },
      spinHue: (durationMs = 2000) => {
        const durS = durationMs / 1000;
        gsap.to(fx, {
          hue: 360,
          duration: durS * 0.5,
          ease: "power2.inOut",
          onUpdate: composeFilter,
          onComplete: () => {
            gsap.to(fx, {
              hue: 0,
              duration: durS * 0.5,
              ease: "power2.inOut",
              onUpdate: composeFilter,
            });
          },
        });
      },
      setShaderLabEngaged: (engaged) => {
        shaderLabEngaged = engaged;
        saveShaderLabState({ engaged: shaderLabEngaged, params: shaderLabParams });
        if (paused || matrixOn) return;
        runSketch(activeBackdropSrc());
      },
      setShaderLabParams: (patch) => {
        shaderLabParams = { ...shaderLabParams, ...patch };
        saveShaderLabState({ engaged: shaderLabEngaged, params: shaderLabParams });
        if (!shaderLabEngaged || paused || matrixOn) return;
        runSketch(activeBackdropSrc());
      },
    });

    /* ---- pause on visibility change ---- */
    const onVisibility = () => {
      if (document.hidden) {
        animFx({ grayscale: 1, brightness: 0.75 }, 1.2);
      } else {
        animFx({ grayscale: 0, brightness: 1 }, 0.6);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(perfRaf);
      mouseTween.kill();
      release();
      try {
        hydra?.hush();
      } catch {
        /* ignore */
      }
    };
  }, [initialMood, useFallback]);

  /* ---- surface mouse position to the stage ---- */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const xn = e.clientX / Math.max(1, window.innerWidth);
      const yn = e.clientY / Math.max(1, window.innerHeight);
      hydraStage.setMouse(xn, yn);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (useFallback) {
    return <div className="hydra-backdrop hydra-fallback" aria-hidden />;
  }
  return (
    <div ref={wrapRef} className="hydra-backdrop-wrap" aria-hidden>
      <canvas ref={canvasRef} className="hydra-backdrop" aria-hidden />
    </div>
  );
}
