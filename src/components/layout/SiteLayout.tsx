import { HydraBackground } from "@/components/HydraBackground";
import { Outlet, useLocation } from "react-router-dom";

export function SiteLayout() {
  const { pathname } = useLocation();
  const desktopHome =
    pathname === "/" || pathname.startsWith("/gallery") || pathname.startsWith("/archive");

  return (
    <div className="relative min-h-dvh text-foreground">
      <HydraBackground />
      {/* No dimming layer on / — keeps Hydra wallpaper vivid; lab route keeps readable scrim */}
      {!desktopHome && (
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
