import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "lenis/dist/lenis.css";
import "sweetalert2/dist/sweetalert2.min.css";
import "./index.css";
import App from "./App";
import { LenisGsapProvider } from "./providers/LenisGsapProvider";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <LenisGsapProvider>
      <App />
    </LenisGsapProvider>
  </BrowserRouter>,
);
