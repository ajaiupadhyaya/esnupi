import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteTransitionProvider } from "@/components/layout/RouteTransition";
import { SiteLayout } from "@/components/layout/SiteLayout";
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
          </Route>
        </Routes>
      </RouteTransitionProvider>
    </ErrorBoundary>
  );
}
