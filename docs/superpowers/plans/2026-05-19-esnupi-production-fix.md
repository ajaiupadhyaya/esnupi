# esnupi Production-Readiness Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take `esnupi` from a working-but-unshippable portfolio prototype to a fast, polished, production-deployable site without changing the creative concept.

**Architecture:** Eight ordered phases, each independently shippable. Phase 0 establishes a baseline so every later phase can be measured. Phase 1 fixes the content/env blockers from `PUBLISH_CHECKLIST.md`. Phase 2 is the biggest user-visible win (398 MB → ~30 MB of assets). Phases 3–5 attack JS bundle, SEO, fonts. Phases 6–8 are hygiene/refactor/polish and may be deferred without regressing the launch.

**Tech Stack:** Vite 6, React 19, TypeScript (strict), Tailwind 3, `@mdx-js/rollup`, hydra-synth, p5, three (`@react-three/fiber`), Lenis, GSAP, Supabase, Vercel.

**Conventions for this plan:**
- This repo has **no test framework**. Where TDD steps would normally go, "verify" steps use `npm run build` output, `du -sh dist`, file existence, or `npx vite build --mode=production` byte counts. Add a real test suite only if the user later requests it.
- Each phase ends in a commit. Phases are independent; you can stop after any phase and ship.
- All file paths are relative to repo root `/Users/ajaiupadhyaya/Documents/esnupi`.
- Bundle-size assertions are *targets*, not contracts — record actual values in the commit message.

---

## Phase 0: Baseline & branch

Establish a measurable starting point and a working branch so every later phase has a comparison anchor.

### Task 0.1: Create working branch

**Files:** none

- [ ] **Step 1: Create branch**

```bash
cd /Users/ajaiupadhyaya/Documents/esnupi
git checkout -b fix/production-readiness
```

- [ ] **Step 2: Verify clean tree**

```bash
git status
```
Expected: `nothing to commit, working tree clean` (or only `dist/`, `node_modules/` if not yet ignored — confirm they are).

### Task 0.2: Record baseline metrics

**Files:**
- Create: `docs/superpowers/plans/baseline.md`

- [ ] **Step 1: Produce a fresh production build**

```bash
rm -rf dist
npm run build
```
Expected: build succeeds, no TS errors. If it fails, STOP and fix before continuing.

- [ ] **Step 2: Capture metrics**

```bash
du -sh dist
find dist/assets -name '*.js' -printf '%s %f\n' | sort -rn | head -5
find dist/assets -type f -printf '%s %f\n' | sort -rn | head -10
```

- [ ] **Step 3: Write `docs/superpowers/plans/baseline.md`** with this content (replace `<...>` with real numbers):

```markdown
# Baseline (pre-fix, branch: fix/production-readiness)

Date: <today>
Commit: <output of `git rev-parse HEAD`>

## Build
- `dist/` total: <e.g. 398M>
- Main JS bundle: <e.g. 2.07 MB>
- 2nd JS bundle: <e.g. MacTerminalApp 339 KB>

## Largest assets
<paste top 10 from `du`>

## Lighthouse (run `npm run preview` then `npx lighthouse http://localhost:4173`)
- Performance: <score>
- Accessibility: <score>
- Best Practices: <score>
- SEO: <score>
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/baseline.md
git commit -m "chore: record pre-fix baseline metrics"
```

---

## Phase 1: Content & secrets blockers

The items in `PUBLISH_CHECKLIST.md` plus a stale `.env` and unverified Supabase RLS. Nothing here changes behavior — it removes pre-flight gates.

### Task 1.1: Replace bogus Spline URL

**Files:**
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Decide policy.** The current `.env` has `VITE_SPLINE_URL=https://prod.spline.design/D6777777777777777777777777777777/scene.splinecode` — that's a placeholder. Either supply a real Spline scene URL, or remove the var so `SplineEmbed` skips. For now, remove.

- [ ] **Step 2: Edit `.env` (gitignored — local only) to unset the line:**

```
VITE_SPLINE_URL=
```

- [ ] **Step 3: Verify `SplineEmbed` handles empty URL gracefully**

```bash
grep -n "SPLINE_URL" src/components/demos/SplineEmbed.tsx
```
Read the file and confirm there's an early return when the URL is empty. If not, add one:

```tsx
const splineUrl = import.meta.env.VITE_SPLINE_URL;
if (!splineUrl) return null;
```

- [ ] **Step 4: Run build, confirm no crash**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/demos/SplineEmbed.tsx
git commit -m "fix(spline): no-op when VITE_SPLINE_URL is unset"
```

### Task 1.2: Audit Supabase RLS

**Files:**
- Read: `supabase/museum_photos.sql`, `supabase/museum_photos_visitor_name.sql`, `supabase/site_visitor_log.sql`

- [ ] **Step 1: Open each `supabase/*.sql` file and confirm each `CREATE TABLE` is followed by `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` and explicit `CREATE POLICY` statements for `INSERT` and `SELECT`.**

- [ ] **Step 2: If any file lacks RLS, add the policies inline.** Required minimum for a public-write/public-read pattern:

```sql
ALTER TABLE museum_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read"
  ON museum_photos FOR SELECT
  USING (true);

CREATE POLICY "anyone can insert"
  ON museum_photos FOR INSERT
  WITH CHECK (true);
```

- [ ] **Step 3: Re-apply the migrations in your live Supabase project** via the SQL editor (the MCP tool `mcp__plugin_supabase_supabase__apply_migration` is available if linked).

- [ ] **Step 4: Verify RLS is on in Supabase dashboard** (Authentication → Policies). Every table should show "RLS enabled" with at least two policies.

- [ ] **Step 5: Commit any SQL changes**

```bash
git add supabase/*.sql
git commit -m "security(supabase): enforce RLS on photobook + visitor log tables"
```

### Task 1.3: Replace Unsplash placeholders in `projectsData.ts`

**Files:**
- Modify: `src/lib/projectsData.ts`

This requires the user's real project images and copy. The plan codifies the *mechanics*; the user provides the content.

- [ ] **Step 1: List placeholder occurrences**

```bash
grep -n "unsplash\|TODO" src/lib/projectsData.ts
```

- [ ] **Step 2: For each project entry, gather final assets.** Place the real images under `src/photography/images/<project-slug>/` (or `images/projects/<slug>/` if photography pipeline is preferred). Then at the top of `projectsData.ts`:

```ts
import hero1 from "@/photography/images/elsewhere/hero.jpg";
```

Replace the `src: "https://images.unsplash.com/..."` strings with the imported identifier. The asset pipeline introduced in Phase 2 will handle compression.

- [ ] **Step 3: Replace placeholder copy** (intro paragraphs marked `PLACEHOLDER DATA` around line 85). Pull final copy from the user; don't invent.

- [ ] **Step 4: Verify no Unsplash URLs remain**

```bash
grep -n "unsplash" src/lib/projectsData.ts src/pages/Gallery.tsx src/pages/FeltMoon.tsx
```
Expected: no matches.

- [ ] **Step 5: Build to confirm imports resolve**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/projectsData.ts src/pages/Gallery.tsx src/pages/FeltMoon.tsx src/photography/images
git commit -m "content: replace Unsplash placeholders with final project assets"
```

### Task 1.4: Verify outbound links

**Files:**
- Read: `src/components/desktop/panels/ContentPanels.tsx`
- Read: `src/lib/projectsData.ts`

- [ ] **Step 1: Extract all hrefs**

```bash
grep -nE "href: \"https?:" src/lib/projectsData.ts src/components/desktop/panels/ContentPanels.tsx
```

- [ ] **Step 2: For each URL, manually open in a browser** and confirm it resolves to the intended page (no 404s, no defunct social accounts). Fix or delete dead ones.

- [ ] **Step 3: Commit if anything changed**

```bash
git commit -am "fix: update outbound portfolio links"
```

---

## Phase 2: Asset pipeline (biggest perf win)

Replace the 375 MB of raw JPGs in `src/photography/images/` with responsive WebP variants generated at build time. Single biggest user-visible improvement.

### Task 2.1: Install image pipeline dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install**

```bash
npm install --save-dev vite-imagetools sharp
```

- [ ] **Step 2: Verify versions in `package.json`** under `devDependencies`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add vite-imagetools + sharp for responsive images"
```

### Task 2.2: Wire `vite-imagetools` plugin

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Edit `vite.config.ts`** to add the plugin:

```ts
import path from "node:path";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { imagetools } from "vite-imagetools";
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  define: { global: "globalThis" },
  plugins: [
    mdx(),
    react({ include: /\.(jsx|js|tsx|ts)$/ }),
    imagetools({
      defaultDirectives: (url) => {
        // Only apply defaults to imports that opt in with `?responsive`
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
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  optimizeDeps: { include: ["hydra-synth", "p5"] },
});
```

- [ ] **Step 2: Build to confirm plugin loads**

```bash
npm run build
```
Expected: succeeds (no images converted yet — they'd need the `?responsive` query).

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "build: configure vite-imagetools responsive directive"
```

### Task 2.3: Create `<ResponsivePicture>` component

**Files:**
- Create: `src/components/ui/ResponsivePicture.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { type ImgHTMLAttributes } from "react";

type PictureSource = { srcset: string; type: string };
export type ResponsiveImage = {
  sources: PictureSource[];
  img: { src: string; w: number; h: number };
};

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  image: ResponsiveImage;
  sizes?: string;
};

export function ResponsivePicture({ image, sizes = "100vw", alt, ...rest }: Props) {
  return (
    <picture>
      {image.sources.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcset} sizes={sizes} />
      ))}
      <img
        {...rest}
        src={image.img.src}
        width={image.img.w}
        height={image.img.h}
        alt={alt}
        loading={rest.loading ?? "lazy"}
        decoding={rest.decoding ?? "async"}
      />
    </picture>
  );
}
```

- [ ] **Step 2: Verify import path resolves**

```bash
npx tsc -b --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ResponsivePicture.tsx
git commit -m "feat(ui): add ResponsivePicture for vite-imagetools output"
```

### Task 2.4: Add type declaration for `?responsive` imports

**Files:**
- Create: `src/types/imagetools.d.ts`

- [ ] **Step 1: Write the declaration**

```ts
declare module "*?responsive" {
  import type { ResponsiveImage } from "@/components/ui/ResponsivePicture";
  const value: ResponsiveImage;
  export default value;
}

declare module "*.jpg?responsive" {
  import type { ResponsiveImage } from "@/components/ui/ResponsivePicture";
  const value: ResponsiveImage;
  export default value;
}

declare module "*.jpeg?responsive" {
  import type { ResponsiveImage } from "@/components/ui/ResponsivePicture";
  const value: ResponsiveImage;
  export default value;
}

declare module "*.png?responsive" {
  import type { ResponsiveImage } from "@/components/ui/ResponsivePicture";
  const value: ResponsiveImage;
  export default value;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -b --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/types/imagetools.d.ts
git commit -m "types: declare ?responsive vite-imagetools imports"
```

### Task 2.5: Convert photography library to responsive imports

**Files:**
- Modify: `src/photography/library.ts`
- Modify: `src/photography/manifest.ts`
- Modify: every consumer of `FILM_PHOTO_ITEMS` (search them next)

- [ ] **Step 1: Locate consumers**

```bash
grep -rn "FILM_PHOTO_ITEMS\|buildFilmPhotoLibrary" src
```

- [ ] **Step 2: In `src/photography/manifest.ts`**, append `?responsive` to every image import. Example before/after:

```ts
// BEFORE
import midtown from "./images/midtown.jpg";

// AFTER
import midtown from "./images/midtown.jpg?responsive";
```

- [ ] **Step 3: Update the type for the photo manifest** so each entry's `src` is `ResponsiveImage` instead of `string`. In `src/photography/library.ts`:

```ts
import type { ResponsiveImage } from "@/components/ui/ResponsivePicture";

export type FilmPhoto = {
  id: string;
  caption: string;
  image: ResponsiveImage; // was: src: string
  // ...other existing fields unchanged
};
```

- [ ] **Step 4: Replace all `<img src={photo.src} />` consumers with `<ResponsivePicture image={photo.image} />`.** Search:

```bash
grep -rn "photo.src\|item.src" src/components/desktop/panels src/pages
```

For each hit, replace with the component. Provide `sizes` based on layout (e.g. `sizes="(max-width: 768px) 100vw, 50vw"` for two-column galleries).

- [ ] **Step 5: Build and measure**

```bash
rm -rf dist && npm run build
du -sh dist
```
Expected: `dist/` drops from ~398 MB to under 60 MB (single largest variant per photo should be ≤ 400 KB at 2048 w in WebP/AVIF).

- [ ] **Step 6: Commit**

```bash
git add src/photography src/components/ui/ResponsivePicture.tsx src/components/desktop/panels src/pages
git commit -m "perf(images): generate responsive WebP/AVIF for photography (-340MB dist)"
```

### Task 2.6: Convert `gpu_depreciation.gif` to MP4

**Files:**
- Delete: `gpu_depreciation.gif`
- Create: `src/assets/gpu_depreciation.mp4`
- Modify: `src/lib/projectsData.ts`

- [ ] **Step 1: Convert with ffmpeg**

```bash
ffmpeg -i gpu_depreciation.gif -movflags faststart -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  -c:v libx264 -crf 23 src/assets/gpu_depreciation.mp4
```

- [ ] **Step 2: Compare sizes**

```bash
du -sh gpu_depreciation.gif src/assets/gpu_depreciation.mp4
```
Expected: MP4 ~10–20% of the GIF size.

- [ ] **Step 3: Update import and usage in `projectsData.ts`** to use `kind: "video"`:

```ts
import gpuDepreciation from "@/assets/gpu_depreciation.mp4";
// ...
media: [{ kind: "video", src: gpuDepreciation, caption: "...", layout: "wide" }],
```

- [ ] **Step 4: Verify the consumer of `ProjectMedia` handles `kind: "video"` with `<video autoPlay muted loop playsInline />`.** Find consumer:

```bash
grep -rn "ProjectMedia\|project.media" src
```
If the video branch is missing, add it.

- [ ] **Step 5: Delete the GIF and build**

```bash
rm gpu_depreciation.gif
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "perf(media): convert gpu_depreciation gif -> mp4"
```

---

## Phase 3: Bundle splitting & dependency pruning

Current main bundle is ~2.1 MB. Target: < 500 KB for the entry chunk, with libs in vendor splits and heavy panels lazy-loaded.

### Task 3.1: Remove unused dependency `aos`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Confirm zero imports** (already verified: zero matches)

```bash
grep -rn --include='*.ts' --include='*.tsx' -E "from ['\"]aos" src
```
Expected: no output.

- [ ] **Step 2: Remove**

```bash
npm uninstall aos @types/aos
```

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): drop unused aos + @types/aos"
```

### Task 3.2: Configure `manualChunks` vendor splitting

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Add `build.rollupOptions.output.manualChunks`**

```ts
// inside defineConfig:
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
      },
    },
  },
  chunkSizeWarningLimit: 800,
},
```

- [ ] **Step 2: Build and inspect**

```bash
rm -rf dist && npm run build
find dist/assets -name '*.js' -printf '%-10s %f\n' | sort -rn | head -20
```
Expected: entry bundle drops to < 500 KB; libs appear as separate vendor-*.js chunks.

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "perf(build): split vendor chunks by library family"
```

### Task 3.3: Lazy-load heavy desktop panels

**Files:**
- Modify: `src/components/desktop/MacintoshWindowPanelContent.tsx`

- [ ] **Step 1: Identify heavy panels**

The currently-eager imports in `MacintoshWindowPanelContent.tsx` include Terminal (`MacTerminalApp` — uses `@xterm`), `SplineEmbed`, `ActivityChart` (chart.js), `FeltScene` (three), `PlaygroundTerminal`, and the `Photobook`/`Photobooth` panels (Supabase).

```bash
grep -n "import.*from" src/components/desktop/MacintoshWindowPanelContent.tsx | head -30
```

- [ ] **Step 2: Convert each heavy panel to a lazy import.** Pattern:

```tsx
import { lazy, Suspense } from "react";
const MacTerminalApp = lazy(() => import("./MacTerminalApp").then((m) => ({ default: m.MacTerminalApp })));

// in the switch/render:
case "terminal":
  return (
    <Suspense fallback={<PanelLoading />}>
      <MacTerminalApp {...props} />
    </Suspense>
  );
```

Apply to: `MacTerminalApp`, `PhotoboothPanel`, `PhotobookPanel`, `MinesweeperPanel`, `WebBrowserPanel`, `MusicPlayerPanel`, `KaleidoscopePanel`, `SlideshowPanel`.

- [ ] **Step 3: Create `PanelLoading` placeholder** (already a Mac-styled spinner pattern in repo — use the `mac-loading-line` CSS class):

```tsx
function PanelLoading() {
  return <div className="mac-loading-line" aria-label="loading" />;
}
```

- [ ] **Step 4: Build, inspect chunks**

```bash
rm -rf dist && npm run build
find dist/assets -name '*.js' -printf '%-10s %f\n' | sort -rn | head -20
```
Expected: entry bundle smaller; each lazy panel has its own chunk.

- [ ] **Step 5: Smoke test in browser**

```bash
npm run preview
```
Open http://localhost:4173, click each dock app, confirm windows open without errors (Suspense flickers briefly are acceptable).

- [ ] **Step 6: Commit**

```bash
git add src/components/desktop/MacintoshWindowPanelContent.tsx
git commit -m "perf(desktop): lazy-load heavy panels (terminal/photobook/browser/etc)"
```

### Task 3.4: Audit remaining oversized imports

**Files:** investigation only

- [ ] **Step 1: Build with `--mode=analyze` (or install `rollup-plugin-visualizer`)**

```bash
npm install --save-dev rollup-plugin-visualizer
```

Add to `vite.config.ts` plugins (gated):

```ts
import { visualizer } from "rollup-plugin-visualizer";
// ...
plugins: [
  // ...existing
  process.env.ANALYZE && visualizer({ open: true, filename: "dist/stats.html", gzipSize: true }),
].filter(Boolean),
```

- [ ] **Step 2: Run analyzer**

```bash
ANALYZE=1 npm run build
```
Open `dist/stats.html`. Look for surprises: any single module > 100 KB that isn't react/three/p5/hydra/chart is worth investigating.

- [ ] **Step 3: Decide per finding.** Common culprits:
  - `sweetalert2` (~50 KB) — used by anything? `grep -rn sweetalert2 src` — if unused, remove.
  - `chroma-js` — used? — remove if not.
  - `luxon` — `dayjs` is 30% the size if only basic date formatting is needed.
  - `lucide-react@1.8.0` — that version is ancient (current major is ~0.4xx); confirm package name is right (should be `lucide-react` with a current major). If wrong dep, fix.

- [ ] **Step 4: Commit any removals**

```bash
git commit -am "chore(deps): drop unused libs identified by bundle analyzer"
```

---

## Phase 4: SEO, social previews, favicon

### Task 4.1: Replace `index.html` `<head>`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Write the new head** (keep existing font links for now — Phase 5 will consolidate):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0a0a0a" />

    <title>esnupi — Ajai Upadhyaya</title>
    <meta name="description" content="Portfolio playground: experiments in interaction design, generative visuals, and quiet software by Ajai Upadhyaya." />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="canonical" href="https://esnupi.com/" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content="esnupi" />
    <meta property="og:description" content="Portfolio playground: interaction design, generative visuals, and quiet software." />
    <meta property="og:image" content="https://esnupi.com/og-cover.png" />
    <meta property="og:url" content="https://esnupi.com/" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="esnupi" />
    <meta name="twitter:description" content="Portfolio playground: interaction design, generative visuals, and quiet software." />
    <meta name="twitter:image" content="https://esnupi.com/og-cover.png" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=VT323&family=Barlow+Condensed:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,500;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Special+Elite&family=Silkscreen:wght@400;700&display=swap"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Replace `esnupi.com` with the actual production domain.

- [ ] **Step 2: Build and verify the meta tags ship**

```bash
npm run build
grep -E "og:title|description" dist/index.html
```
Expected: meta tags present.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "seo: add description, OG/Twitter meta, theme color, canonical"
```

### Task 4.2: Add favicon + OG image to `public/`

**Files:**
- Create: `public/favicon.svg`
- Create: `public/apple-touch-icon.png` (180×180)
- Create: `public/og-cover.png` (1200×630)
- Create: `public/robots.txt`

- [ ] **Step 1: Generate or supply** the four assets. For a quick favicon, an inline SVG works:

```bash
cat > public/favicon.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0a0a0a"/>
  <text x="50%" y="58%" text-anchor="middle" font-family="serif" font-size="20" fill="#f5f1e6">e</text>
</svg>
EOF
```

For `apple-touch-icon.png` and `og-cover.png`, the user supplies branded artwork (a screenshot of the desktop with the wordmark works for OG).

- [ ] **Step 2: Write `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://esnupi.com/sitemap.xml
```

- [ ] **Step 3: Write `public/sitemap.xml`** (5 URLs — `/`, `/desktop`, `/archive`, `/gallery`, `/feltmoon`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://esnupi.com/</loc></url>
  <url><loc>https://esnupi.com/archive</loc></url>
  <url><loc>https://esnupi.com/gallery</loc></url>
  <url><loc>https://esnupi.com/feltmoon</loc></url>
</urlset>
```

- [ ] **Step 4: Build, confirm public assets are emitted**

```bash
npm run build
ls dist/favicon.svg dist/robots.txt dist/sitemap.xml dist/og-cover.png 2>/dev/null
```

- [ ] **Step 5: Commit**

```bash
git add public/
git commit -m "seo: add favicon, OG cover, robots, sitemap"
```

### Task 4.3: Vercel cache headers

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Write the file**

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(favicon\\.svg|apple-touch-icon\\.png|og-cover\\.png|robots\\.txt|sitemap\\.xml)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400" }]
    },
    {
      "source": "/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    }
  ],
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

The `rewrites` block makes the SPA's React Router routes (`/archive`, `/gallery`, `/feltmoon`) work on direct hit.

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "build(vercel): immutable cache on /assets, SPA rewrite for routes"
```

---

## Phase 5: Font consolidation

The site loads two Google Fonts stylesheets (one in `index.html`, one via `@import` in `index.css`) — total 13 font families, with IBM Plex Mono duplicated. The CSS `@import` is render-blocking.

### Task 5.1: Audit which font families are actually used

**Files:** investigation

- [ ] **Step 1: Search**

```bash
for font in "VT323" "Barlow Condensed" "IBM Plex Mono" "Lora" "Courier Prime" "Special Elite" "Silkscreen" "Public Sans" "Playfair Display" "La Belle Aurore" "Alfa Slab One" "UnifrakturCook"; do
  echo "== $font =="
  grep -rn --include='*.css' --include='*.tsx' --include='*.ts' "$font" src
done
```

- [ ] **Step 2: List families with zero usage outside `index.css` :root vars.** These get dropped.

### Task 5.2: Consolidate into a single `<link>`

**Files:**
- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Step 1: Remove the `@import url(...)` line at the top of `src/index.css`.**

- [ ] **Step 2: Replace the `<link rel="stylesheet">` in `index.html`** with a single URL that requests *only* the families the audit kept. Example (adjust to audit results):

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=IBM+Plex+Mono:wght@400;500&family=VT323&display=swap"
/>
```

Five families is a reasonable target; each extra family is ~30–80 KB.

- [ ] **Step 3: Build, confirm no FOIT**

```bash
npm run preview
```
Open the site, throttle network to Fast 3G in DevTools, watch font swap. Should be `display=swap` → text appears immediately in fallback then re-renders.

- [ ] **Step 4: Commit**

```bash
git add index.html src/index.css
git commit -m "perf(fonts): consolidate to single stylesheet, drop unused families"
```

---

## Phase 6: Repo hygiene

### Task 6.1: Remove cruft

**Files:**
- Delete: `.venv/`, `designideas.md`, `newplan.md`, `fonts.md`, `public/backgrounds/`, `tsconfig.tsbuildinfo`

- [ ] **Step 1: Remove**

```bash
rm -rf .venv designideas.md newplan.md fonts.md public/backgrounds tsconfig.tsbuildinfo
```

- [ ] **Step 2: Add `tsconfig.tsbuildinfo` to `.gitignore`** (already ignored as not in git, but be explicit):

```
node_modules
dist
.DS_Store
*.local
.env
.venv
.vercel
music/
tsconfig.tsbuildinfo
```

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove stale planning notes, empty folders, tsbuildinfo"
```

### Task 6.2: Move root images into `src/assets/`

**Files:**
- Move: `images/*` → `src/assets/icons/`
- Move: `privatecreditimage.png` → `src/assets/`
- Modify: every import that points at `../../../images/...`

- [ ] **Step 1: Locate all imports from root images**

```bash
grep -rn "../../../images/\|../../images/" src
```

- [ ] **Step 2: Create destination and move**

```bash
mkdir -p src/assets/icons
git mv images/* src/assets/icons/
git mv privatecreditimage.png src/assets/
```

- [ ] **Step 3: Bulk-update imports** (run for each import path returned in Step 1):

```bash
# Example — adjust per real paths
find src -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 \
  | xargs -0 sed -i '' 's|"../../../images/|"@/assets/icons/|g'
find src -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 \
  | xargs -0 sed -i '' 's|"../../images/|"@/assets/icons/|g'
```

- [ ] **Step 4: Type-check and build**

```bash
npx tsc -b --noEmit
npm run build
```
Expected: both succeed. If any "Cannot find module" errors, those paths weren't covered by the sed — fix them individually.

- [ ] **Step 5: Smoke test**

```bash
npm run preview
```
Open the site, confirm icons render.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: relocate root images into src/assets, normalize imports"
```

---

## Phase 7: Motion & mobile guards (a11y + perf)

### Task 7.1: Gate Lenis on `prefers-reduced-motion`

**Files:**
- Modify: `src/providers/LenisGsapProvider.tsx`

- [ ] **Step 1: Read current file**

```bash
cat src/providers/LenisGsapProvider.tsx
```

- [ ] **Step 2: Wrap Lenis initialization** in a media-query check:

```tsx
const prefersReducedMotion = typeof window !== "undefined"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  return; // skip Lenis; let the browser handle native scroll
}
const lenis = new Lenis({ /* ...existing options */ });
```

- [ ] **Step 3: Apply the same gate to GSAP route-fade transitions** in `src/components/layout/GsapRouteTransition.tsx`. If reduced-motion, set `gsap.set(target, { opacity: 1 })` and skip the tween.

- [ ] **Step 4: Verify by emulating in DevTools** (Rendering tab → Emulate CSS media feature `prefers-reduced-motion: reduce`). Scroll should feel native; route changes instant.

- [ ] **Step 5: Commit**

```bash
git add src/providers/LenisGsapProvider.tsx src/components/layout/GsapRouteTransition.tsx
git commit -m "a11y: respect prefers-reduced-motion in Lenis + GSAP route fades"
```

### Task 7.2: Gate background canvases on mobile + reduced-motion

**Files:**
- Modify: `src/components/HydraBackground.tsx`
- Modify: `src/components/P5MacBackground.tsx`

- [ ] **Step 1: Add a mount guard to both files.** Top of the component:

```tsx
import { useMediaQuery } from "@/lib/useMediaQuery";

// inside component:
const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
const isPhone = useMediaQuery("(max-width: 640px)");
if (reduceMotion || isPhone) return null;
```

The static body background already sits behind these via the `--background` token, so removing the canvas leaves a clean dark surface.

- [ ] **Step 2: Build, smoke test at narrow viewport**

```bash
npm run preview
```
Resize to ~375 px wide. Confirm canvas does not mount and CPU usage drops.

- [ ] **Step 3: Commit**

```bash
git add src/components/HydraBackground.tsx src/components/P5MacBackground.tsx
git commit -m "perf(bg): skip Hydra/p5 canvas on mobile + reduced-motion"
```

### Task 7.3: Focus styles outside `.mac-desktop-root`

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add a global `:focus-visible`** (currently only `.mac-desktop-root :focus-visible` is styled):

```css
:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

Place it before the `.mac-desktop-root` override so the scoped rule still wins inside the desktop.

- [ ] **Step 2: Tab through `/archive`, `/gallery`, `/feltmoon`** — every interactive element should show the ring.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "a11y: add global focus-visible ring for non-desktop routes"
```

---

## Phase 8 (deferred / optional): Code structure refactor

Only ship this phase if the user wants it; it's pure maintainability with no user-facing change.

### Task 8.1: Split `macintosh-desktop.css`

**Files:**
- Create: `src/components/desktop/styles/_window.css`, `_menu-bar.css`, `_dock.css`, `_icons.css`, `_overlays.css`, `_animations.css`
- Modify: `src/components/desktop/macintosh-desktop.css` (becomes a thin import index)

- [ ] **Step 1: Identify section boundaries** in the existing 5070-line file (use the `/* ===== */` banners as section markers).

- [ ] **Step 2: Move each section to its own file.**

- [ ] **Step 3: Replace `macintosh-desktop.css` content with `@import` statements:**

```css
@import "./styles/_window.css";
@import "./styles/_menu-bar.css";
@import "./styles/_dock.css";
@import "./styles/_icons.css";
@import "./styles/_overlays.css";
@import "./styles/_animations.css";
```

- [ ] **Step 4: Build, diff the emitted CSS for byte-equivalence**

```bash
npm run build
# Compare line count to baseline — should be identical or off by whitespace.
```

- [ ] **Step 5: Commit**

```bash
git add src/components/desktop
git commit -m "refactor(css): split 5k-line desktop stylesheet by responsibility"
```

### Task 8.2: Extract window-manager state from `MacintoshDesktop.tsx`

**Files:**
- Create: `src/components/desktop/useWindowManager.ts`
- Modify: `src/components/desktop/MacintoshDesktop.tsx`

- [ ] **Step 1: Identify the window-state surface** — `openWindows`, `zIndices`, `geometry`, plus the handlers `openWindow`, `closeWindow`, `bringToFront`, `setGeometry`, `minimize`, `restore`, `stackedWindowPosition`, `clampWindowPosition`. Roughly lines 80–400 of `MacintoshDesktop.tsx`.

- [ ] **Step 2: Move them to `useWindowManager.ts`** behind a single hook:

```ts
export function useWindowManager() {
  // ...all the state + handlers
  return { openWindows, geometry, openWindow, closeWindow, bringToFront, setGeometry };
}
```

- [ ] **Step 3: Replace the inline state in `MacintoshDesktop.tsx` with `const wm = useWindowManager()`.** Update all references.

- [ ] **Step 4: Type-check + smoke test**

```bash
npx tsc -b --noEmit
npm run preview
```
Confirm window open/close/drag/resize still work.

- [ ] **Step 5: Commit**

```bash
git add src/components/desktop
git commit -m "refactor(desktop): extract useWindowManager hook"
```

---

## Phase 9: Final verification

### Task 9.1: Re-measure and write `final.md`

**Files:**
- Create: `docs/superpowers/plans/final.md`

- [ ] **Step 1: Production build**

```bash
rm -rf dist && npm run build
du -sh dist
find dist/assets -name '*.js' -printf '%-10s %f\n' | sort -rn | head -10
```

- [ ] **Step 2: Lighthouse on preview**

```bash
npm run preview &
sleep 3
npx lighthouse http://localhost:4173 --only-categories=performance,accessibility,best-practices,seo --quiet --chrome-flags="--headless"
kill %1
```

- [ ] **Step 3: Write `final.md`** with the same shape as `baseline.md` plus a diff column.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/final.md
git commit -m "chore: record post-fix metrics"
```

### Task 9.2: Open PR

- [ ] **Step 1: Push**

```bash
git push -u origin fix/production-readiness
```

- [ ] **Step 2: Open PR with body**

```bash
gh pr create --title "Production-readiness fixes" --body "$(cat <<'EOF'
## Summary
- Asset pipeline: responsive WebP/AVIF, dropped dist/ from ~398MB to ~30MB
- Bundle split + lazy-loaded heavy panels (terminal, photobook, browser)
- SEO meta, favicon, OG, robots, sitemap, Vercel cache headers
- Font consolidation
- a11y: prefers-reduced-motion + global focus styles
- Repo hygiene: removed cruft, relocated root images

See `docs/superpowers/plans/baseline.md` and `final.md` for measurements.

## Test plan
- [ ] `npm run build` succeeds
- [ ] `npm run preview` — every dock app opens
- [ ] Mobile shell at 375px loads fast, no Hydra canvas
- [ ] Lighthouse Performance ≥ 85, SEO = 100
- [ ] Social card renders on x.com / LinkedIn debugger
EOF
)"
```

---

## Self-review

- **Spec coverage:** Every item from the earlier review maps to a task — assets (Phase 2), bundle (Phase 3), SEO (Phase 4), fonts (Phase 5), hygiene (Phase 6), motion/a11y (Phase 7), CSS/component refactor (Phase 8 optional). Content/env blockers from `PUBLISH_CHECKLIST.md` are Phase 1.
- **Placeholders:** None of the "TBD / TODO / similar to" anti-patterns are present. Where the *user* must supply content (final photos, copy, OG image), it is called out explicitly with an exact location.
- **Type consistency:** `ResponsiveImage` and `ResponsivePicture` use matching property names across Tasks 2.3 → 2.5. `useWindowManager` (Task 8.2) keeps the existing handler names from `MacintoshDesktop.tsx` — no rename.
- **No tests in this repo:** verification uses build success, file existence, byte counts, and Lighthouse — explicitly noted up front.
