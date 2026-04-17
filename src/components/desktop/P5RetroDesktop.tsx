import P5 from "p5";
import { useEffect, useRef } from "react";

type P5Instance = InstanceType<typeof P5>;

/**
 * Subtle full-screen p5 layer: chunky noise grain + soft drift (CRT / old LCD feel).
 * Sits between the Hydra wallpaper and the desktop UI; pointer-events disabled.
 */
export function P5RetroDesktop() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (typeof window.matchMedia === "function") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) return;
    }

    const GW = 88;
    const GH = 60;

    const sketch = (p: P5Instance) => {
      let grain: ReturnType<P5Instance["createGraphics"]>;

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.pixelDensity(1);
        p.frameRate(18);
        grain = p.createGraphics(GW, GH);
      };

      p.draw = () => {
        p.clear();
        grain.loadPixels();
        const t = p.frameCount * 0.014;
        const w = GW;
        const h = GH;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = 4 * (y * w + x);
            const n = p.noise(x * 0.14 + t * 0.4, y * 0.14 - t * 0.2);
            const v = 175 + n * 80;
            grain.pixels[i] = v;
            grain.pixels[i + 1] = v;
            grain.pixels[i + 2] = v;
            grain.pixels[i + 3] = 14;
          }
        }
        grain.updatePixels();
        p.image(grain, 0, 0, p.width, p.height);
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
    };

    const instance = new P5(sketch, host);
    return () => {
      instance.remove();
    };
  }, []);

  return <div ref={hostRef} className="mac-p5-overlay" aria-hidden />;
}
