import { useEffect, useRef, useState } from "react";

const WIDTH = 240;
const HEIGHT = 264;
const INITIAL_COUNT = 14;
const MAX_COUNT = 60;
const LINK_DISTANCE = 88;

type Particle = { x: number; y: number; vx: number; vy: number; radius: number };
type Point = { x: number; y: number };

/** A small spring network, drawn directly on the blue panel. No external renderer. */
export function ParticleFigure() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const spawnRef = useRef<(point: Point) => void>(() => {});
  const [count, setCount] = useState(INITIAL_COUNT);

  useEffect(() => {
    const canvas = canvasRef.current;
    const button = buttonRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !button || !ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pointer: Point | null = null;
    let attached: Particle | null = null;
    let frame = 0;
    let previous = 0;
    let visible = true;
    const particles: Particle[] = Array.from({ length: INITIAL_COUNT }, (_, i) => ({
      x: 25 + ((i * 73) % 190),
      y: 26 + ((i * 97) % 212),
      vx: Math.cos(i * 2.4) * 0.3,
      vy: Math.sin(i * 2.4) * 0.3,
      radius: 4 + (i % 4) * 0.8,
    }));

    const paint = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.setTransform(w / WIDTH, 0, 0, h / HEIGHT, 0, 0);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.lineWidth = 0.65;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const distance = Math.hypot(b.x - a.x, b.y - a.y);
          if (distance >= LINK_DISTANCE) continue;
          ctx.strokeStyle = `rgba(255,255,255,${0.55 * (1 - distance / LINK_DISTANCE)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      if (pointer && attached && !motion.matches) {
        ctx.strokeStyle = "rgba(255,255,255,0.65)";
        ctx.beginPath();
        ctx.moveTo(attached.x, attached.y);
        ctx.lineTo(pointer.x, pointer.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
      ctx.fillStyle = "#fff";
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = (time: number) => {
      frame = 0;
      const dt = previous ? Math.min((time - previous) / (1000 / 60), 2) : 1;
      previous = time;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        // Gentle short-range repulsion keeps the network open and organic.
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.max(Math.hypot(dx, dy), 0.1);
          if (distance > LINK_DISTANCE) continue;
          const rest = a.radius + b.radius + 20;
          const force = Math.min(0, distance - rest) * 0.004 * dt;
          a.vx += (dx / distance) * force;
          a.vy += (dy / distance) * force;
          b.vx -= (dx / distance) * force;
          b.vy -= (dy / distance) * force;
        }
      }
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx += Math.cos(time * 0.0003 + i * 2.4) * 0.009 * dt;
        p.vy += Math.sin(time * 0.0004 + i * 2.4) * 0.009 * dt;
        if (pointer && p === attached) {
          p.vx += (pointer.x - p.x) * 0.018 * dt;
          p.vy += (pointer.y - p.y) * 0.018 * dt;
        }
        const damping = Math.pow(0.96, dt);
        p.vx *= damping;
        p.vy *= damping;
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 4) { p.vx *= 4 / speed; p.vy *= 4 / speed; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const margin = p.radius + 2;
        if (p.x < margin || p.x > WIDTH - margin) p.vx *= -0.8;
        if (p.y < margin || p.y > HEIGHT - margin) p.vy *= -0.8;
        p.x = Math.max(margin, Math.min(WIDTH - margin, p.x));
        p.y = Math.max(margin, Math.min(HEIGHT - margin, p.y));
      }
      paint();
      frame = requestAnimationFrame(tick);
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      paint();
      if (!motion.matches && !document.hidden && visible) frame = requestAnimationFrame(tick);
    };
    const clearPointer = () => { pointer = null; attached = null; };
    const move = (event: PointerEvent) => {
      if (motion.matches) return;
      const rect = button.getBoundingClientRect();
      pointer = { x: (event.clientX - rect.left) / rect.width * WIDTH, y: (event.clientY - rect.top) / rect.height * HEIGHT };
      if (!attached) {
        const point = pointer;
        attached = particles.reduce((nearest, p) =>
          Math.hypot(p.x - point.x, p.y - point.y) < Math.hypot(nearest.x - point.x, nearest.y - point.y) ? p : nearest,
        );
      }
    };
    spawnRef.current = (point) => {
      for (let i = 0; i < 3; i++) {
        const angle = i * Math.PI * 2 / 3 + Math.random();
        const radius = 4 + Math.random() * 3;
        if (particles.length >= MAX_COUNT) {
          const removed = particles.shift();
          if (removed === attached) attached = null;
        }
        particles.push({
          x: Math.max(radius + 2, Math.min(WIDTH - radius - 2, point.x + Math.cos(angle) * 14)),
          y: Math.max(radius + 2, Math.min(HEIGHT - radius - 2, point.y + Math.sin(angle) * 14)),
          vx: Math.cos(angle) * 1.5, vy: Math.sin(angle) * 1.5, radius,
        });
      }
      setCount(particles.length);
      paint();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(button);
    const resize = new ResizeObserver(paint);
    resize.observe(canvas);
    button.addEventListener("pointermove", move);
    button.addEventListener("pointerleave", clearPointer);
    button.addEventListener("pointercancel", clearPointer);
    const releaseTouch = (event: PointerEvent) => { if (event.pointerType !== "mouse") clearPointer(); };
    button.addEventListener("pointerup", releaseTouch);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      button.removeEventListener("pointermove", move);
      button.removeEventListener("pointerleave", clearPointer);
      button.removeEventListener("pointercancel", clearPointer);
      button.removeEventListener("pointerup", releaseTouch);
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      spawnRef.current = () => {};
    };
  }, []);

  return (
    <figure className="ajh-fig">
      <figcaption className="ajh-cap ajh-fig__cap">
        Fig. 1: Particle network,<br />
        move to connect, click to grow<br />
        <span aria-live="polite">{count} particles</span>
      </figcaption>
      <button
        ref={buttonRef}
        type="button"
        className="ajh-fig__plate"
        aria-label="Interactive particle network. Move the pointer to pull a particle. Click, tap, or press Enter or Space to add three particles."
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          spawnRef.current(event.detail === 0
            ? { x: WIDTH / 2, y: HEIGHT / 2 }
            : { x: (event.clientX - rect.left) / rect.width * WIDTH, y: (event.clientY - rect.top) / rect.height * HEIGHT });
        }}
      >
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-hidden="true" />
      </button>
    </figure>
  );
}
