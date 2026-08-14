import { HiddenSiteIdentity } from "@/components/seo/HiddenSiteIdentity";
import { SiteSeoHead } from "@/components/seo/SiteSeoHead";
import { SITE_OWNER_FULL_NAME } from "@/lib/siteIdentity";
import { useIdleMount } from "@/lib/useIdleMount";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { Suspense, lazy } from "react";
import { Outlet, useLocation } from "react-router-dom";

/* The two live wallpapers are by far the heaviest code on the site (p5 alone is
 * ~1 MB of JS, hydra-synth another ~180 KB) and they are pure decoration — so
 * they are code-split and mounted only once the browser goes idle. Nothing
 * above the fold waits on them. */
const P5MacBackground = lazy(() =>
  import("@/components/P5MacBackground").then((m) => ({ default: m.P5MacBackground })),
);
const HydraBackground = lazy(() =>
  import("@/components/HydraBackground").then((m) => ({ default: m.HydraBackground })),
);

export function SiteLayout() {
  const { pathname } = useLocation();

  /* Both wallpapers no-op on phones and for prefers-reduced-motion. Checking
   * that here rather than inside them means those visitors never download the
   * chunk in the first place. */
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isPhone = useMediaQuery("(max-width: 640px)");
  const idle = useIdleMount();
  const wallpaperAllowed = idle && !reduceMotion && !isPhone;

  /** Classic Mac desktop uses p5 (one random sketch per visit). `/` and
   *  `/desktop` both mount `MacintoshDesktop`; other routes use opaque UIs
   *  so we skip the live wallpaper to save CPU/GPU. `/lab` uses Hydra instead. */
  const showP5Mac = wallpaperAllowed && (pathname === "/" || pathname.startsWith("/desktop"));
  const isLab = pathname.startsWith("/lab");
  const showHydra = wallpaperAllowed && isLab;

  /** Only /lab gets the readability scrim over Hydra. */
  const showScrim = pathname.startsWith("/lab");

  /** /film is a bare field — no grain, vignette, topo, JPEG artifact, or
   *  crosshair cursor. The photographs carry the page on their own. */
  const isBare = pathname.startsWith("/film");

  return (
    <div
      className="site-fusion-shell relative min-h-dvh text-foreground"
      data-site-owner={SITE_OWNER_FULL_NAME}
      data-bare={isBare ? "" : undefined}
      aria-label={`${SITE_OWNER_FULL_NAME} portfolio`}
    >
      <SiteSeoHead />
      <HiddenSiteIdentity />
      {showP5Mac && (
        <div data-site-owner={SITE_OWNER_FULL_NAME} aria-hidden>
          <Suspense fallback={null}>
            <P5MacBackground />
          </Suspense>
        </div>
      )}
      {showHydra && (
        <div data-site-owner={SITE_OWNER_FULL_NAME} aria-hidden>
          <Suspense fallback={null}>
            <HydraBackground />
          </Suspense>
        </div>
      )}
      {!isBare && (
        <>
          <div className="site-fusion-topo" aria-hidden data-site-owner={SITE_OWNER_FULL_NAME} />
          <div className="site-fusion-jpeg" aria-hidden data-site-owner={SITE_OWNER_FULL_NAME} />
          <div className="site-film-vignette" aria-hidden data-site-owner={SITE_OWNER_FULL_NAME} />
          <div className="site-film-grain" aria-hidden data-site-owner={SITE_OWNER_FULL_NAME} />
        </>
      )}
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
