import path from "node:path";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { imagetools } from "vite-imagetools";
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  // hydra-synth (via regl/streaming deps) references Node's `global`, which browsers don't define
  define: {
    global: "globalThis",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
          "vendor-p5": ["p5"],
          "vendor-hydra": ["hydra-synth"],
          "vendor-motion": ["gsap", "lenis", "animejs"],
          "vendor-chart": ["chart.js", "react-chartjs-2"],
          "vendor-xterm": ["@xterm/xterm", "@xterm/addon-fit"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-mdx": ["@mdx-js/react"],
          "vendor-analytics": ["@vercel/analytics"],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  plugins: [
    mdx(),
    // MDX must be handled only by @mdx-js/rollup — do not pass .mdx/.md through react-babel.
    react({ include: /\.(jsx|js|tsx|ts)$/ }),
    imagetools({
      defaultDirectives: (url) => {
        // Only apply defaults to imports that opt in with `?responsive`.
        // Produces a <picture>-shaped object with AVIF + WebP + JPG variants at 480/1024/2048 widths.
        if (url.searchParams.has("responsive")) {
          return new URLSearchParams({
            format: "avif;webp;jpg",
            w: "480;1024;2048",
            as: "picture",
          });
        }
        return new URLSearchParams();
      },
    }),
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
