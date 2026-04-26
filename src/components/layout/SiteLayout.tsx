import { HydraBackground } from "@/components/HydraBackground";
import { P5MacBackground } from "@/components/P5MacBackground";
import { Outlet, useLocation } from "react-router-dom";

export function SiteLayout() {
  const { pathname } = useLocation();

  /** The brutalist home (/) and secondary rooms render opaque surfaces that
   *  cover the wallpaper, so we suppress it to save CPU/GPU and avoid
   *  any flicker beneath them. The classic Mac desktop uses p5, /lab
   *  keeps the Hydra shader stack. */
  const isDesktop = pathname.startsWith("/desktop");
  const isLab = pathname.startsWith("/lab");
  const showP5Mac = isDesktop;
  const showHydra = isLab;

  /** The brutalist home is its own sealed paper surface, and /desktop wants
   *  the wallpaper fully vivid — so only /lab gets the readability scrim. */
  const showScrim = pathname.startsWith("/lab");

  return (
    <div className="site-fusion-shell relative min-h-dvh text-foreground">
      {showP5Mac && <P5MacBackground />}
      {showHydra && <HydraBackground />}
      <div className="site-fusion-topo" aria-hidden />
      <div className="site-fusion-jpeg" aria-hidden />
      <div className="site-film-vignette" aria-hidden />
      <div className="site-film-grain" aria-hidden />
      {showScrim && (
        <div
          className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-b from-background/30 via-background/55 to-background/90"
          aria-hidden
        />
      )}
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}
