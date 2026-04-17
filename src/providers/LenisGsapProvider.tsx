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
    const lenis = new Lenis({
      smoothWheel: true,
      syncTouch: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(ticker);
      lenis.stop();
    };
  }, []);

  return <>{children}</>;
}
