import p5 from "p5";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { hydraStage, installHydraStage } from "../lib/hydraStage";
import { p5collageSketch } from "../p5mac/p5collageSketch";
import { p5dominoesSketch } from "../p5mac/p5dominoesSketch";
import { p5earthBandsSketch } from "../p5mac/p5earthBandsSketch";
import { pickP5MacVariant, type P5MacVariant } from "../p5mac/pickP5MacVariant";

import "./P5MacBackground.css";

/* 0 = macbackground3 (dominoes), 1 = macbackground (earth), 2 = macbackground2 (collage) */
const SKETCH: Record<P5MacVariant, (p: p5) => void> = {
  0: p5dominoesSketch,
  1: p5earthBandsSketch,
  2: p5collageSketch,
};

/**
 * p5.js wallpaper for the classic Mac desktop. One of three sketches
 * (from macbackground.md · macbackground2.md · macbackground3.md) is chosen at random per visit.
 * Exposes the same `hydraStage` hooks as HydraBackground, driving CSS filters and loop/pause on the p5 instance.
 */
export function P5MacBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<InstanceType<typeof p5> | null>(null);
  const [failed, setFailed] = useState(false);
  const variant = useMemo(() => pickP5MacVariant(), []);

  useEffect(() => {
    if (failed) return;
    const el = containerRef.current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return;
    const sketch = SKETCH[variant] ?? p5dominoesSketch;
    let inst: InstanceType<typeof p5> | null = null;
    try {
      inst = new p5(sketch, el);
      p5Ref.current = inst;
    } catch (e) {
      console.warn("[P5MacBackground] p5 init failed.", e);
      setFailed(true);
      return;
    }

    const canvas = el.querySelector("canvas");
    if (canvas) {
      gsap.set(canvas, { transformOrigin: "50% 50%" });
    }

    const fx = { blur: 0, hue: 0, brightness: 1, invert: 0, grayscale: 0 };
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
      gsap.to(fx, { ...target, duration, ease, onUpdate: composeFilter });

    let paused = false;
    const mouseTween = gsap.to(
      {},
      {
        duration: 0.2,
        repeat: -1,
        onRepeat: () => {
          if (!canvas) return;
          const tx = (targetX - 0.5) * 6;
          const ty = (targetY - 0.5) * 6;
          gsap.to(canvas, { x: tx, y: ty, duration: 0.6, ease: "sine.out", overwrite: "auto" });
        },
      },
    );
    let targetX = 0.5;
    let targetY = 0.5;

    const release = installHydraStage({
      pulse: () => {
        gsap.fromTo(
          fx,
          { brightness: 1 },
          {
            brightness: 1.4,
            duration: 0.12,
            yoyo: true,
            repeat: 1,
            ease: "power1.inOut",
            onUpdate: composeFilter,
          },
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
      setPaused: (pause) => {
        paused = pause;
        try {
          if (pause) inst?.noLoop();
          else inst?.loop();
        } catch {
          /* ignore */
        }
      },
      setMood: () => {
        /* p5 backdrops are not Hydra mood sketches */
      },
      setMatrix: (_on) => {
        if (paused) return;
        try {
          inst?.loop();
        } catch {
          /* ignore */
        }
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
      setShaderLabEngaged: () => {
        /* N/A for p5 */
      },
      setShaderLabParams: () => {
        /* N/A for p5 */
      },
    });

    const onVisibility = () => {
      if (document.hidden) {
        animFx({ grayscale: 1, brightness: 0.75 }, 1.2);
      } else {
        animFx({ grayscale: 0, brightness: 1 }, 0.6);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      p5Ref.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
      mouseTween.kill();
      release();
      try {
        inst?.remove();
      } catch {
        /* ignore */
      }
    };
  }, [variant, failed]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const xn = e.clientX / Math.max(1, window.innerWidth);
      const yn = e.clientY / Math.max(1, window.innerHeight);
      hydraStage.setMouse(xn, yn);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (failed) {
    return <div className="p5-mac-fallback" aria-hidden />;
  }

  return (
    <div ref={wrapRef} className="p5-mac-backdrop-wrap" data-p5-mac-variant={variant} aria-hidden>
      <div ref={containerRef} className="p5-mac-canvas-host" />
    </div>
  );
}
