import { Analytics } from "@vercel/analytics/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SITE_OWNER_FULL_NAME } from "@/lib/siteIdentity";
import { RouteTransitionProvider } from "@/components/layout/RouteTransition";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { MacintoshDesktop } from "@/components/desktop/MacintoshDesktop";
import Home from "@/pages/Home";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const Basis = lazy(() => import("@/pages/Basis"));
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
              <Route path="/" element={<Home />} />
              {/* The Mac desktop sim lives here now; "/" is the plain home page. */}
              <Route path="/desktop" element={<MacintoshDesktop />} />
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
              {/* BASIS, the weekly market monitor: issue list and one issue per slug. */}
              {["/basis", "/basis/:slug"].map((path) => (
                <Route
                  key={path}
                  path={path}
                  element={(
                    <Suspense fallback={<RouteFallback />}>
                      <Basis />
                    </Suspense>
                  )}
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </RouteTransitionProvider>
        <Analytics />
      </div>
    </ErrorBoundary>
  );
}
