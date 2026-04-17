import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GsapRouteTransition } from "@/components/layout/GsapRouteTransition";
import { SiteLayout } from "@/components/layout/SiteLayout";
import Home from "@/pages/Home";
import MdxLab from "@/pages/MdxLab";
import { Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <ErrorBoundary>
      <GsapRouteTransition>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/lab" element={<MdxLab />} />
          </Route>
        </Routes>
      </GsapRouteTransition>
    </ErrorBoundary>
  );
}
