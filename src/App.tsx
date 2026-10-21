import { Analytics } from "@vercel/analytics/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SITE_OWNER_FULL_NAME } from "@/lib/siteIdentity";
import { RouteTransitionProvider } from "@/components/layout/RouteTransition";
import { SiteLayout } from "@/components/layout/SiteLayout";
import Portfolio from "@/pages/Portfolio";
import { lazy, Suspense } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";

const MacintoshDesktop = lazy(() => import("@/components/desktop/MacintoshDesktop").then((module) => ({ default: module.MacintoshDesktop })));

const Archive = lazy(() => import("@/pages/Archive"));
const FeltMoon = lazy(() => import("@/pages/FeltMoon"));
const Film = lazy(() => import("@/pages/Film"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const PhotoLab = lazy(() => import("@/pages/PhotoLab"));

function RouteFallback() {
  return <div aria-hidden style={{ minHeight: "40vh" }} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <div data-site-owner={SITE_OWNER_FULL_NAME}>
        <RouteTransitionProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Portfolio />} />
              <Route path="/desktop" element={(
                <Suspense fallback={<RouteFallback />}>
                  <MacintoshDesktop />
                  <Link className="portfolio-return" to="/">← Portfolio view</Link>
                </Suspense>
              )} />
              <Route
                path="/gallery"
                element={(
                  <Suspense fallback={<RouteFallback />}>
                    <Gallery />
                  </Suspense>
                )}
              />
              <Route
                path="/film"
                element={(
                  <Suspense fallback={<RouteFallback />}>
                    <Film />
                  </Suspense>
                )}
              />
              <Route
                path="/photolab"
                element={(
                  <Suspense fallback={<RouteFallback />}>
                    <PhotoLab />
                  </Suspense>
                )}
              />
              <Route
                path="/feltmoon"
                element={(
                  <Suspense fallback={<RouteFallback />}>
                    <FeltMoon />
                  </Suspense>
                )}
              />
              <Route
                path="/archive"
                element={(
                  <Suspense fallback={<RouteFallback />}>
                    <Archive />
                  </Suspense>
                )}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </RouteTransitionProvider>
        <Analytics />
      </div>
    </ErrorBoundary>
  );
}
