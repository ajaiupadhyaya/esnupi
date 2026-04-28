import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteTransitionProvider } from "@/components/layout/RouteTransition";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { MacintoshDesktop } from "@/components/desktop/MacintoshDesktop";
import Archive from "@/pages/Archive";
import FeltMoon from "@/pages/FeltMoon";
import Gallery from "@/pages/Gallery";
import Home from "@/pages/Home";
import VisitClassic from "@/pages/VisitClassic";
import { Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <ErrorBoundary>
      <RouteTransitionProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<MacintoshDesktop />} />
            <Route path="/visit-classic" element={<VisitClassic />} />
            <Route path="/desktop" element={<MacintoshDesktop />} />
            <Route path="/home" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/feltmoon" element={<FeltMoon />} />
            <Route path="/archive" element={<Archive />} />
          </Route>
        </Routes>
      </RouteTransitionProvider>
    </ErrorBoundary>
  );
}
