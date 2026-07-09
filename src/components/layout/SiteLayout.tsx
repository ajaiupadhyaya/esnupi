import { HiddenSiteIdentity } from "@/components/seo/HiddenSiteIdentity";
import { SiteSeoHead } from "@/components/seo/SiteSeoHead";
import { HydraBackground } from "@/components/HydraBackground";
import { P5MacBackground } from "@/components/P5MacBackground";
import { SITE_OWNER_FULL_NAME } from "@/lib/siteIdentity";
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
          <P5MacBackground />
        </div>
      )}
      {showHydra && (
        <div data-site-owner={SITE_OWNER_FULL_NAME} aria-hidden>
          <HydraBackground />
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
