import { useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

export type MagneticDockItem = {
  id: string;
  label: string;
  icon: string;
  open?: boolean;
  onOpen: (rect: DOMRect) => void;
  title?: string;
  ariaLabel?: string;
};

/**
 * Mac OS X–style magnetic dock. Mouse proximity within 200px scales items via
 * a gaussian falloff (σ=60), peaking at ~1.4× under the cursor. Dock lifts 4px
 * when active and returns with a spring on deactivation.
 *
 * All math is done in document coordinates against each button's getBoundingClientRect().
 */
export function MagneticDock({
  items,
  ariaLabel = "Applications dock",
}: {
  items: readonly MagneticDockItem[];
  ariaLabel?: string;
}) {
  const navRef = useRef<HTMLElement | null>(null);
  const shellRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [active, setActive] = useState(false);
  /** Track whether the user explicitly prefers reduced motion. */
  const reducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches;
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    let rafId = 0;
    let pending: { x: number; y: number } | null = null;

    const SIGMA = 60;
    const PEAK = 0.4;
    const RANGE = 200;
    const APPROACH = 80;

    const apply = () => {
      rafId = 0;
      if (reducedMotion.current || !pending) {
        shellRefs.current.forEach((el) => {
          if (el) el.style.transform = "";
        });
        return;
      }
      const { x, y } = pending;
      const navRect = nav.getBoundingClientRect();
      const proximity = Math.max(0, navRect.top - y);
      const isActive = y >= navRect.top - APPROACH && y <= window.innerHeight;
      setActive(isActive);

      shellRefs.current.forEach((el) => {
        if (!el) return;
        if (!isActive || proximity > APPROACH + 40) {
          el.style.transform = "";
          return;
        }
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const dist = Math.abs(x - cx);
        if (dist > RANGE) {
          el.style.transform = "";
          return;
        }
        const scale = 1 + PEAK * Math.exp(-(dist * dist) / (2 * SIGMA * SIGMA));
        /* Anchor the transform to the bottom so items grow upward, like OS X. */
        el.style.transform = `translateY(${((1 - scale) * 28).toFixed(2)}px) scale(${scale.toFixed(3)})`;
      });
    };

    const onMove = (e: MouseEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!rafId) rafId = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      pending = null;
      if (!rafId) rafId = requestAnimationFrame(apply);
      setActive(false);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className={cn("mac-dock", active && "mac-dock--active")}
      aria-label={ariaLabel}
    >
      {items.map((app, index) => {
        const style: CSSProperties = {};
        return (
          <button
            key={app.id}
            type="button"
            className={cn("mac-dock__item", app.open && "mac-dock__item--open")}
            onClick={(e) => app.onOpen(e.currentTarget.getBoundingClientRect())}
            title={app.title ?? `Open ${app.label}`}
            aria-label={app.ariaLabel ?? `Open ${app.label}`}
            style={style}
          >
            <span
              ref={(el) => {
                shellRefs.current[index] = el;
              }}
              className="mac-dock__icon-shell"
              aria-hidden
            >
              <img
                src={app.icon}
                alt=""
                className="mac-dock__icon"
                draggable={false}
              />
            </span>
            <span className="mac-dock__label">{app.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
