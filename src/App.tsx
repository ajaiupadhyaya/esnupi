import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteTransitionProvider } from "@/components/layout/RouteTransition";
import { SiteLayout } from "@/components/layout/SiteLayout";
import Archive from "@/pages/Archive";
import Gallery from "@/pages/Gallery";
import Home from "@/pages/Home";
import MdxLab from "@/pages/MdxLab";
import { Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <ErrorBoundary>
      <RouteTransitionProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/lab" element={<MdxLab />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/archive" element={<Archive />} />
          </Route>
        </Routes>
      </RouteTransitionProvider>
    </ErrorBoundary>
  );
}
