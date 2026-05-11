import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteTransitionProvider } from "@/components/layout/RouteTransition";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { MacintoshDesktop } from "@/components/desktop/MacintoshDesktop";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";

const Archive = lazy(() => import("@/pages/Archive"));
const FeltMoon = lazy(() => import("@/pages/FeltMoon"));
const Gallery = lazy(() => import("@/pages/Gallery"));

function RouteFallback() {
  return <div aria-hidden style={{ minHeight: "40vh" }} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <RouteTransitionProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<MacintoshDesktop />} />
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
      <SpeedInsights />
    </ErrorBoundary>
  );
}
