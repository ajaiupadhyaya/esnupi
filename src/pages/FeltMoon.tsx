/**
 * /feltmoon — hyper-brutalist, MoMA-inspired film photography gallery.
 *
 * Design spec: see /feltmoon.md at repo root.
 *
 *  - Pure white plaster wall
 *  - Horizontal-scrolling strip of film photographs
 *  - The image closest to the viewport center enters a "framed" state
 *    (thin aluminum frame, subtle shadow, slight scale-up); others dim.
 *  - Museum wall label (title / year / medium / credit) fades in for the
 *    active image.
 *  - Graffiti "intervention" mode: full-page canvas overlay with spray,
 *    marker, eraser, colors, stroke size, undo/redo, clear, export.
 *    Strokes persist to localStorage.
 *  - Subtle film grain + index counter.
 */

import feltmoonImg from "../../images/feltmoon.png";
import { useRouteTransition } from "@/components/layout/RouteTransition";
import { Entropy } from "@/components/ui/entropy";
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./feltmoon.css";

type Work = {
  id: string;
  title: string;
  year: string;
  location: string;
  stock?: string;
  description: string;
  src: string;
  /** Aspect ratio hint so the strip lays out predictably before images load. */
  aspect: number;
};

/** Film-photography leaning imagery; swap with your own when the scans exist. */
const WORKS: Work[] = [
  {
    id: "01",
    title: "Room, before morning",
    year: "2024",
    location: "Brooklyn, NY",
    stock: "Kodak Portra 400 · 35mm",
    description:
      "A curtain holds the light and then releases it, carefully, like a name.",
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=max&w=2400&q=88",
    aspect: 3 / 2,
  },
  {
    id: "02",
    title: "Paper sky",
    year: "2023",
    location: "Marfa, TX",
    stock: "Ilford HP5+ · pushed 1 stop",
    description:
      "Abstraction as refusal. There is no subject here, only viscosity and edge.",
    src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57f90?auto=format&fit=max&w=2400&q=88",
    aspect: 16 / 9,
  },
  {
    id: "03",
    title: "Field note",
    year: "2022",
    location: "Unknown coast",
    stock: "Fuji Superia 200",
    description:
      "What looks like noise is a list of intentions. Ideas staged as texture.",
    src: "https://images.unsplash.com/photo-1500534314211-6a8a052b84e0?auto=format&fit=max&w=2400&q=88",
    aspect: 3 / 2,
  },
  {
    id: "04",
    title: "Altitude",
    year: "2024",
    location: "Highway 9, CA",
    stock: "Kodak Ektar 100",
    description:
      "Distance collapses into tone. The frame decides what weather is allowed inside.",
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=2400&q=88",
    aspect: 3 / 2,
  },
  {
    id: "05",
    title: "Chorus, interior",
    year: "2023",
    location: "Lisbon, PT",
    stock: "Cinestill 800T",
    description:
      "A room that only makes sense at night — the tungsten translates it.",
    src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=max&w=2400&q=88",
    aspect: 16 / 10,
  },
  {
    id: "06",
    title: "Negative, quiet",
    year: "2022",
    location: "Studio, home",
    stock: "Kodak Tri-X 400",
    description:
      "The grain does the describing. I stopped trying to explain it in colour.",
    src: "https://images.unsplash.com/photo-1504198322253-cfa87a0ff25f?auto=format&fit=max&w=2400&q=88",
    aspect: 3 / 2,
  },
  {
    id: "07",
    title: "Still life, with moon",
    year: "2025",
    location: "Felt, linen",
    stock: "Digital, archival print",
    description:
      "The accompanying piece. Fabric as a substitute for sky, at rest.",
    src: feltmoonImg,
    aspect: 1,
  },
];

type Tool = "spray" | "marker" | "eraser";

const COLORS = ["#ff1f1f", "#000000", "#1f5cff", "#ffdd00", "#16a34a", "#ffffff"];
const STORAGE_KEY = "esnupi.feltmoon.graffiti.v1";

export default function FeltMoon() {
  const routeTransition = useRouteTransition();
  const wallRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [labelVisible, setLabelVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [interventionOpen, setInterventionOpen] = useState(false);
  const [curatorMode, setCuratorMode] = useState(false);

  /* -------- Horizontal scroll driver --------------------------------- */
  useEffect(() => {
    const wall = wallRef.current;
    const strip = stripRef.current;
    if (!wall || !strip) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const recompute = () => {
      const stripWidth = strip.scrollWidth;
      const scrollLen = Math.max(stripWidth - window.innerWidth, 0);
      wall.style.height = `${window.innerHeight + scrollLen}px`;
    };

    recompute();
    window.addEventListener("resize", recompute);

    /* Drive a smooth translate; wheel → horizontal. */
    let current = 0;
    let target = 0;
    let raf = 0;

    const maxShift = () =>
      Math.max(strip.scrollWidth - window.innerWidth, 0);

    const onScroll = () => {
      const wallTop = wall.offsetTop;
      const y = window.scrollY - wallTop;
      const shift = Math.max(0, Math.min(maxShift(), y));
      target = shift;
      setProgress(
        maxShift() > 0 ? Math.min(1, Math.max(0, shift / maxShift())) : 0,
      );
    };

    const loop = () => {
      current += (target - current) * (reduced ? 1 : 0.14);
      strip.style.transform = `translate3d(${-current}px, 0, 0)`;
      updateActive(current, strip);
      raf = requestAnimationFrame(loop);
    };

    const updateActive = (x: number, el: HTMLDivElement) => {
      const center = x + window.innerWidth / 2;
      const children = Array.from(el.querySelectorAll<HTMLElement>(".fm-slot"));
      let best = 0;
      let bestDist = Infinity;
      children.forEach((node, i) => {
        const c = node.offsetLeft + node.offsetWidth / 2;
        const d = Math.abs(c - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActiveIndex((prev) => (prev === best ? prev : best));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", recompute);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* -------- Arrow keys + Home/End paging ----------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        window.scrollBy({ top: window.innerHeight * 0.7, behavior: "smooth" });
      } else if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowUp" ||
        e.key === "PageUp"
      ) {
        window.scrollBy({ top: -window.innerHeight * 0.7, behavior: "smooth" });
      } else if (e.key === "Home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (e.key === "End") {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth",
        });
      } else if (e.key === "g" || e.key === "G") {
        setInterventionOpen((v) => !v);
      } else if (e.key === "c" || e.key === "C") {
        setCuratorMode((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* -------- Museum label fade on active-change ----------------------- */
  useLayoutEffect(() => {
    setLabelVisible(false);
    const id = window.setTimeout(() => setLabelVisible(true), 140);
    return () => window.clearTimeout(id);
  }, [activeIndex]);

  /* -------- Redirect wheel to vertical scroll (native behaviour) ---- */
  /* Vertical scroll already drives the wall because of the tall outer
     container, so we don't need a custom wheel handler. Touch devices
     also work because native scroll still advances scrollY. */

  const active = WORKS[activeIndex]!;

  return (
    <main className={`fm-root${curatorMode ? " fm-root--curator" : ""}`}>
      {/* Living plaster: particle field, split order / chaos, reacts to
          the cursor. Sits behind everything at z-index 0. */}
      <Entropy
        fullscreen
        particleColor="#0a0a0a"
        background="var(--fm-wall)"
        dividerAlpha={0.12}
        className="fm-bg-entropy"
      />

      <FmGrain />

      <header className="fm-bar">
        <span className="fm-bar__accession">
          ESNUPI / MOON ROOM · {String(activeIndex + 1).padStart(2, "0")} /
          {" "}
          {String(WORKS.length).padStart(2, "0")}
        </span>
        <span className="fm-bar__title">Light, material, film</span>
        <button
          type="button"
          className="fm-bar__back"
          onClick={() => routeTransition.goto("/")}
          aria-label="Back to desktop"
        >
          ← desktop
        </button>
      </header>

      <div
        className="fm-progress"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />

      {/* Tall outer container — body scrolls vertically, strip translates
          horizontally via JS. Height is updated in the effect above. */}
      <div className="fm-wall" ref={wallRef}>
        <div className="fm-sticky">
          <div className="fm-strip" ref={stripRef}>
            {/* Opening plaque — a beat of silence before the first photo. */}
            <article className="fm-slot fm-slot--intro" aria-hidden>
              <div className="fm-intro">
                <p className="fm-intro__kicker">Temporary exhibition</p>
                <h1 className="fm-intro__title">
                  Light,
                  <br />
                  material,
                  <br />
                  film.
                </h1>
                <p className="fm-intro__lede">
                  A horizontal room. Scroll (or use the arrow keys) to walk
                  the wall. One picture at a time is framed; the rest are
                  waiting. Press <kbd>G</kbd> to deface the wall.
                </p>
                <div className="fm-intro__rule" aria-hidden />
                <p className="fm-intro__foot">
                  Companion piece: <em>Moon, at rest</em> — felt on linen, 2025.
                </p>
              </div>
            </article>

            {WORKS.map((w, i) => (
              <FmImage
                key={w.id}
                work={w}
                active={i === activeIndex}
              />
            ))}

            {/* Closing colophon */}
            <article className="fm-slot fm-slot--colophon" aria-hidden>
              <div className="fm-colophon">
                <p className="fm-colophon__kicker">Colophon</p>
                <p className="fm-colophon__body">
                  Set in IBM Plex Mono, Playfair Display, Public Sans, and La
                  Belle Aurore. Photographs printed as archival pigment. Wall,
                  plaster. Scroll, felt.
                </p>
                <button
                  type="button"
                  className="fm-colophon__back"
                  onClick={() => routeTransition.goto("/")}
                >
                  return to desktop ↗
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>

      {/* Museum wall label for active image (skips intro/colophon indices) */}
      <aside
        className={`fm-label${labelVisible ? " fm-label--on" : ""}${
          curatorMode ? " fm-label--hidden" : ""
        }`}
        aria-live="polite"
      >
        <span className="fm-label__index">
          {active.id} · {String(activeIndex + 1).padStart(2, "0")}/
          {String(WORKS.length).padStart(2, "0")}
        </span>
        <h2 className="fm-label__title">{active.title}</h2>
        <p className="fm-label__meta">
          {active.location} · {active.year}
        </p>
        {active.stock ? (
          <p className="fm-label__meta fm-label__meta--muted">{active.stock}</p>
        ) : null}
        <p className="fm-label__desc">{active.description}</p>
      </aside>

      <GraffitiLayer
        open={interventionOpen}
        onToggle={() => setInterventionOpen((v) => !v)}
        curatorMode={curatorMode}
      />

      {/* Bottom rail: curator toggle + intervention toggle */}
      <div className={`fm-rail${curatorMode ? " fm-rail--clean" : ""}`}>
        <button
          type="button"
          className={`fm-rail__btn${curatorMode ? " is-on" : ""}`}
          onClick={() => setCuratorMode((v) => !v)}
          aria-pressed={curatorMode}
          title="Curator mode (C) — hide UI"
        >
          {curatorMode ? "● Curator" : "Curator"}
        </button>
        <button
          type="button"
          className={`fm-rail__btn${interventionOpen ? " is-on" : ""}`}
          onClick={() => setInterventionOpen((v) => !v)}
          aria-pressed={interventionOpen}
          title="Intervention mode (G) — draw on the wall"
        >
          {interventionOpen ? "● Intervening" : "Intervene"}
        </button>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------- */
/* Slot: one image on the wall                                          */
/* -------------------------------------------------------------------- */

function FmImage({ work, active }: { work: Work; active: boolean }) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(el, {
      scale: active ? 1.05 : 1,
      duration: reduced ? 0 : 0.7,
      ease: "power3.out",
    });
  }, [active]);

  /* Each slot has a stable width derived from aspect ratio; strip's scrollWidth
     is then well-defined for the horizontal driver. */
  const heightVh = 72;
  const widthPx = `calc(${heightVh}vh * ${work.aspect.toFixed(4)})`;

  return (
    <article
      className={`fm-slot fm-slot--photo${active ? " fm-slot--active" : ""}`}
      style={{ width: widthPx, minWidth: widthPx }}
      data-id={work.id}
      aria-label={`${work.title}, ${work.year}`}
    >
      <div className="fm-photo">
        <div className="fm-photo__frame" ref={frameRef}>
          <img
            src={work.src}
            alt={work.title}
            className="fm-photo__img"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>
        <p className="fm-photo__accession">{work.id}</p>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------- */
/* Film grain overlay (lightweight, animated via a noise SVG)           */
/* -------------------------------------------------------------------- */

function FmGrain() {
  return (
    <>
      <div className="fm-grain" aria-hidden />
      <div className="fm-vignette" aria-hidden />
    </>
  );
}

/* -------------------------------------------------------------------- */
/* Graffiti / intervention layer                                        */
/* -------------------------------------------------------------------- */

type Stroke = {
  tool: Tool;
  color: string;
  size: number;
  points: Array<[number, number]>;
};

function GraffitiLayer({
  open,
  onToggle,
  curatorMode,
}: {
  open: boolean;
  onToggle: () => void;
  curatorMode: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("spray");
  const [color, setColor] = useState<string>(COLORS[0]!);
  const [size, setSize] = useState<number>(14);
  const [strokes, setStrokes] = useState<Stroke[]>(() => loadStrokes());
  const [, setRedoStack] = useState<Stroke[]>([]);
  const drawingRef = useRef<{ stroke: Stroke; last: [number, number] } | null>(null);

  /* Persist */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(strokes));
    } catch {
      /* quota etc. — silently ignore */
    }
  }, [strokes]);

  /* Resize canvas to viewport (device pixel aware) */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    for (const s of strokes) paintStroke(ctx, s);
  }, [strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!open) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const p: [number, number] = [e.clientX, e.clientY];
    const stroke: Stroke = {
      tool,
      color: tool === "eraser" ? "#00000000" : color,
      size,
      points: [p],
    };
    drawingRef.current = { stroke, last: p };
    setStrokes((prev) => [...prev, stroke]);
    setRedoStack([]);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drawingRef.current;
    if (!d) return;
    const p: [number, number] = [e.clientX, e.clientY];
    d.stroke.points.push(p);
    /* Incremental paint — avoid full redraw per move for perf. */
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    paintSegment(ctx, d.stroke, d.last, p);
    d.last = p;
  };

  const endStroke = () => {
    drawingRef.current = null;
  };

  const undo = () => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      setRedoStack((r) => [...r, prev[prev.length - 1]!]);
      return next;
    });
  };

  const redo = () => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const last = r[r.length - 1]!;
      setStrokes((s) => [...s, last]);
      return r.slice(0, -1);
    });
  };

  const clear = () => {
    setStrokes([]);
    setRedoStack([]);
  };

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `feltmoon-intervention-${Date.now()}.png`;
    a.click();
  };

  /* Keyboard shortcuts while the intervention is open */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`fm-canvas${open ? " fm-canvas--live" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={endStroke}
        aria-hidden={!open}
      />
      {open && !curatorMode ? (
        <div className="fm-tools" role="toolbar" aria-label="Intervention tools">
          <div className="fm-tools__row">
            <FmToolBtn current={tool} value="spray" onSet={setTool} label="spray" />
            <FmToolBtn current={tool} value="marker" onSet={setTool} label="marker" />
            <FmToolBtn current={tool} value="eraser" onSet={setTool} label="eraser" />
          </div>
          <div className="fm-tools__row fm-tools__row--colors">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`fm-tools__color${color === c ? " is-on" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`colour ${c}`}
              />
            ))}
          </div>
          <label className="fm-tools__size" aria-label="stroke size">
            <span>size</span>
            <input
              type="range"
              min={2}
              max={60}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
            <span className="fm-tools__size-num">{size}</span>
          </label>
          <div className="fm-tools__row fm-tools__row--actions">
            <button type="button" className="fm-tools__action" onClick={undo}>
              undo
            </button>
            <button type="button" className="fm-tools__action" onClick={redo}>
              redo
            </button>
            <button type="button" className="fm-tools__action" onClick={clear}>
              clear
            </button>
            <button type="button" className="fm-tools__action" onClick={exportPng}>
              export ↓
            </button>
          </div>
          <button
            type="button"
            className="fm-tools__dismiss"
            onClick={onToggle}
            aria-label="close intervention"
          >
            ×
          </button>
        </div>
      ) : null}
    </>
  );
}

function FmToolBtn({
  current,
  value,
  label,
  onSet,
}: {
  current: Tool;
  value: Tool;
  label: string;
  onSet: (t: Tool) => void;
}) {
  return (
    <button
      type="button"
      className={`fm-tools__tool${current === value ? " is-on" : ""}`}
      onClick={() => onSet(value)}
    >
      {label}
    </button>
  );
}

/* -------- Drawing helpers ------------------------------------------- */

function paintStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  if (s.points.length === 0) return;
  let prev = s.points[0]!;
  for (let i = 1; i < s.points.length; i++) {
    const p = s.points[i]!;
    paintSegment(ctx, s, prev, p);
    prev = p;
  }
}

function paintSegment(
  ctx: CanvasRenderingContext2D,
  s: Stroke,
  from: [number, number],
  to: [number, number],
) {
  ctx.save();
  if (s.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = s.size * 1.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
  } else if (s.tool === "marker") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
  } else {
    /* Spray: scatter dots perpendicular to the motion vector for that
       slightly imperfect, aerosol quality. */
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = s.color;
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const steps = Math.max(1, Math.round(Math.hypot(dx, dy) / 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from[0] + dx * t;
      const y = from[1] + dy * t;
      const density = Math.max(6, Math.round(s.size * 0.9));
      for (let k = 0; k < density; k++) {
        const r = Math.random() * s.size * 0.9;
        const a = Math.random() * Math.PI * 2;
        const jx = Math.cos(a) * r;
        const jy = Math.sin(a) * r;
        ctx.globalAlpha = 0.12 + Math.random() * 0.18;
        ctx.beginPath();
        ctx.arc(x + jx, y + jy, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function loadStrokes(): Stroke[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Stroke[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s) => s && typeof s === "object" && Array.isArray(s.points),
    );
  } catch {
    return [];
  }
}

/* Silence the unused-import warning when React strict checks want useMemo. */
void useMemo;
