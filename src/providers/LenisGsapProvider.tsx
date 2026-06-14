import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { type ReactNode, useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scroll (Lenis) wired to GSAP ScrollTrigger — standard pairing for scroll-driven motion.
 */
export function LenisGsapProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Skip Lenis (and the GSAP ticker integration that pairs with it) when the
    // user has opted into reduced motion. Native browser scroll takes over.
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      smoothWheel: true,
      syncTouch: true,
      // The Mac desktop sim and the iPhone shell never scroll the page itself —
      // their windows/panels rely on native overflow scroll. Left global, Lenis
      // preventDefault()s those wheel/touch events and the panels can't scroll.
      // Opt those subtrees (and any explicit data-lenis-prevent) out of smoothing
      // so native scroll takes over there; smooth scroll still drives /archive,
      // /gallery, /feltmoon, /lab.
      prevent: (node) =>
        node.closest(".mac-desktop-root, .ios-retro-root, [data-lenis-prevent]") !== null,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(ticker);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
