import { useEffect, useRef } from "react";

/**
 * Tiny 1px particles drifting across the screen on a pseudo-Perlin path.
 * Uses a single canvas element. Respects prefers-reduced-motion.
 */
export function DustMotes({ count = 10 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window.matchMedia === "function") {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Mote = { x: number; y: number; vx: number; vy: number; r: number; o: number; seed: number };
    const motes: Mote[] = Array.from({ length: count }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.08,
      r: Math.random() < 0.25 ? 1.4 : 1,
      o: 0.25 + Math.random() * 0.45,
      seed: Math.random() * 1000,
    }));

    let raf = 0;
    const tick = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      motes.forEach((m) => {
        const nx = Math.sin((t + m.seed) * 0.0004) * 0.25;
        const ny = Math.cos((t + m.seed) * 0.0003) * 0.15;
        m.x += m.vx + nx;
        m.y += m.vy + ny;
        if (m.x < -4) m.x = canvas.width + 4;
        if (m.x > canvas.width + 4) m.x = -4;
        if (m.y < -4) m.y = canvas.height + 4;
        if (m.y > canvas.height + 4) m.y = -4;
        ctx.globalAlpha = m.o;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(Math.round(m.x), Math.round(m.y), m.r, m.r);
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return <canvas ref={canvasRef} className="mac-dust-motes" aria-hidden />;
}
