import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";

/** Hero title + felt-ish underline driven by GSAP (not Barba — SPA uses React Router + GSAP). */
export function GsapHero() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".gsap-hero-line", {
        y: 48,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });
      gsap.from(".gsap-felt", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.6,
        delay: 0.45,
        ease: "power2.inOut",
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="space-y-3">
      <p className="gsap-hero-line text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Portfolio · digital playground
      </p>
      <h1 className="gsap-hero-line font-black tracking-tight text-foreground text-5xl sm:text-6xl md:text-7xl">
        esnupi
      </h1>
      <p className="gsap-hero-line max-w-xl text-base leading-relaxed text-muted-foreground">
        Felt stop-motion × brutalism — Hydra in the back, Lenis underfoot, GSAP on the marquee.
      </p>
      <div
        className="gsap-felt h-2 w-48 rounded-sm bg-accent shadow-[3px_3px_0_rgba(0,0,0,0.4)]"
        aria-hidden
      />
    </div>
  );
}
