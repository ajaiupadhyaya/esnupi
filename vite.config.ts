import path from "node:path";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";

export default defineConfig({
  // hydra-synth (via regl/streaming deps) references Node's `global`, which browsers don't define
  define: {
    global: "globalThis",
  },
  plugins: [
    mdx(),
    // MDX must be handled only by @mdx-js/rollup — do not pass .mdx/.md through react-babel.
    react({ include: /\.(jsx|js|tsx|ts)$/ }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["hydra-synth", "p5"],
  },
});
