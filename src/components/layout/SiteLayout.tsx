import { HydraBackground } from "@/components/HydraBackground";
import { P5MacBackground } from "@/components/P5MacBackground";
import { Outlet, useLocation } from "react-router-dom";

export function SiteLayout() {
  const { pathname } = useLocation();

  /** Classic Mac desktop uses p5 (one random sketch per visit). `/` and
   *  `/desktop` both mount `MacintoshDesktop`; other routes use opaque UIs
   *  so we skip the live wallpaper to save CPU/GPU. `/lab` uses Hydra instead. */
  const showP5Mac = pathname === "/" || pathname.startsWith("/desktop");
  const isLab = pathname.startsWith("/lab");
  const showHydra = isLab;

  /** Only /lab gets the readability scrim over Hydra. */
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
