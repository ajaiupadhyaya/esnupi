import path from "node:path";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { imagetools } from "vite-imagetools";
import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

/**
 * Vendor groupings, matched against the module id. Order matters — the first
 * regex that matches wins, so keep narrower patterns above broader ones.
 * Anything in node_modules that matches nothing here is left to Rollup, which
 * will co-locate it with whichever chunk actually imports it.
 */
const VENDOR_CHUNKS: Array<[name: string, test: RegExp]> = [
  ["vendor-react", /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//],
  ["vendor-three", /node_modules\/(three|@react-three)[/\\]/],
  ["vendor-p5", /node_modules\/p5\//],
  ["vendor-hydra", /node_modules\/(hydra-synth|regl)\//],
  ["vendor-motion", /node_modules\/(gsap|lenis|animejs)\//],
  ["vendor-chart", /node_modules\/(chart\.js|react-chartjs-2)\//],
  ["vendor-xterm", /node_modules\/@xterm\//],
  ["vendor-supabase", /node_modules\/@supabase\//],
];

export default defineConfig({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  // hydra-synth (via regl/streaming deps) references Node's `global`, which browsers don't define
  define: {
    global: "globalThis",
  },
  build: {
    rollupOptions: {
      output: {
        // Function form, deliberately. The object form of `manualChunks` *pulls
        // the listed packages into the graph* even when nothing imports them —
        // that is how ~180 KB of three.js ended up modulepreloaded on every
        // page load for a <FeltScene> component no route ever rendered. The
        // function form only ever re-homes modules that are already there, so a
        // package that stops being used simply disappears from the build.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          for (const [name, test] of VENDOR_CHUNKS) {
            if (test.test(id)) return name;
          }
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 800,
    // Vite gzips every chunk just to print a size column; skipping it is a
    // straight build-time win on a repo with 75 photos to encode.
    reportCompressedSize: false,
  },
  plugins: [
    mdx(),
    // MDX must be handled only by @mdx-js/rollup — do not pass .mdx/.md through react-babel.
    react({ include: /\.(jsx|js|tsx|ts)$/ }),
    imagetools({
      // imagetools' default `include` is case-sensitive, so an image saved as
      // `.JPG` silently bypasses the plugin and resolves to a plain URL string
      // instead of a picture object — which then blows up in <ResponsivePicture>.
      // Same list as the default, matched case-insensitively.
      include: /^[^?]+\.(avif|gif|heif|jpeg|jpg|png|tiff|webp)(\?.*)?$/i,
      defaultDirectives: (url) => {
        // Only apply defaults to imports that opt in with `?responsive`.
        // Produces a <picture>-shaped object with WebP + JPG variants at 1024/2048 widths.
        // AVIF dropped: sharp's AVIF encoder is ~10x slower than WebP and pushed the Vercel
        // build past 10 min for 75 photos. WebP is supported in every modern browser and gives
        // ~95% of AVIF's compression at a fraction of the build cost.
        if (url.searchParams.has("responsive")) {
          return new URLSearchParams({
            format: "webp;jpg",
            w: "1024;2048",
            as: "picture",
          });
        }
        return new URLSearchParams();
      },
    }),
    process.env.ANALYZE === "1" &&
      visualizer({
        open: false,
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean) as PluginOption[],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["hydra-synth", "p5"],
  },
});
