import gsap from "gsap";
import { type ReactNode, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Barba.js targets classic multi-page HTML swaps; in a React SPA, route transitions
 * are usually GSAP (or View Transitions API). This wrapper fades the routed view.
 */
export function GsapRouteTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      // Do not animate opacity: 0 → 1 on the whole app shell — if a tween is interrupted
      // or reverted badly, the UI can stay fully invisible (blank black screen).
      gsap.fromTo(
        el,
        { y: 8 },
        {
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          clearProps: "transform",
        },
      );
    });
    return () => ctx.revert();
  }, [location.pathname]);

  return (
    <div ref={ref} className="min-h-dvh opacity-100">
      {children}
    </div>
  );
}
