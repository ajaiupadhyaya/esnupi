# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build  (TypeScript project-references build, then Vite bundle)
npm run preview    # serve dist/
```

There is no test runner and no lint script. `tsc -b` during `build` is the only static check — strict mode is on (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`). To type-check without bundling: `npx tsc -b --noEmit`.

`PUBLISH_CHECKLIST.md` enumerates content that must be replaced before going to production (Unsplash placeholders in `src/lib/projectsData.ts`, etc.). Check it before claiming production-ready.

## Environment

`vite.config.ts` accepts both `VITE_*` and `NEXT_PUBLIC_*` prefixes. All env vars are optional — every integration degrades to a no-op when its keys are absent:

- `VITE_GITHUB_USER` — GitHub demo panel
- `VITE_SPLINE_URL` — Spline embed
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — shared photobook + visitor log (`hasSupabaseConfig` in `src/lib/supabaseClient.ts` gates this; if false, `supabase` is `null` and callers must check)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — aliases

Supabase schema lives in `supabase/*.sql` and must be applied manually in the SQL editor; there is no migration tooling.

## Architecture

### Routing layer (thin)

`src/App.tsx` is a small React Router shell. `MacintoshDesktop` at `/` and `/desktop` is **not** lazy; everything else (`/archive`, `/gallery`, `/film`, `/feltmoon`) is `React.lazy` + `Suspense`. The whole tree is wrapped in `ErrorBoundary` → `RouteTransitionProvider` (GSAP route fades) → `LenisGsapProvider` (smooth scroll + GSAP registration, registered once in `main.tsx`).

`/film` (`src/pages/Film.tsx`) is the one route that opts out of the site's chrome: `SiteLayout` skips the grain/vignette/topo/JPEG overlays and the crosshair cursor when `pathname` starts with `/film` (the `isBare` branch), and the page sets `data-film-page` on `<html>` while mounted so the field, overscroll, and scrollbars follow `prefers-color-scheme` instead of the site's dark-only tokens. It is the only light-capable surface on the site. Its lightbox portals into `<body>` and carries `data-lenis-prevent` — the attribute `LenisGsapProvider` checks — so global smooth scroll doesn't drive the page behind the overlay.

### Desktop is the product

`src/components/desktop/MacintoshDesktop.tsx` (~1.2k lines) is the real application surface — a simulated Mac OS 8 desktop with draggable windows, icons, dock, menu bar, ambient audio, and overlays. Most "pages" on this site are panels rendered inside windows, not routes. When asked to add a feature, default to adding a panel/window unless the user explicitly wants a top-level route.

The window system has three coupled files — change them together:

- `desktopIconConfig.ts` — `WindowId` union + the desktop icon layout (which icons launch which windows).
- `windowRegistry.ts` — `AnyWindowId` extends `WindowId` with "secondary" windows (`sticky`, `minesweeper`, `aboutMac`, `controls`, `clock`, etc.) that have no desktop icon. `INITIAL` is the title + default size map; `DOCK_APPS` is the dock order; `MOBILE_EXTRA_APPS` adds extras for the iPhone shell.
- `MacintoshWindowPanelContent.tsx` — the switch that maps a window id to its panel component.

Panels live in `src/components/desktop/panels/` (content windows like Photobook, Photobooth, Scrapbook, MusicPlayer, VisitorLog) and `src/components/desktop/programs/` (toy apps like Clock, Notepad, Kaleidoscope, Slideshow, Typist). Overlays in `src/components/desktop/overlays/` are non-window decorations (cursor trails, dust motes, desktop pet, defrag screensaver, memory-leak gag, notifications).

### Mobile shell

`IphoneMobileShell` swaps in below a media-query breakpoint (`useMediaQuery`). It re-uses the same panel components but in a phone-grid launcher. Anything you add to `windowRegistry` should be sized/tested for both shells.

### Hydra background imperative bus

The live wallpaper is `hydra-synth` (`HydraBackground.tsx`) with random or authored "moods" from `lib/authoredHydraSketches.ts` and `lib/randomHydraSketch.ts`. To avoid prop-drilling a ref through the whole desktop, `src/lib/hydraStage.ts` exposes a **module-level imperative bus** (`pulse`, `invert`, `setMouse`, `setHueRotation`, `setPaused`, `setMood`, `setMatrix`, `setBlur`, `spinHue`, `setShaderLabEngaged`, `setShaderLabParams`). `HydraBackground` installs the real impl on mount; everything else (window-open feedback, project hover hue rotation, Konami code, Control Panels) calls the bus directly. When adding a new visual effect, extend `HydraStageImpl` and install in `HydraBackground` — don't pass refs.

`P5MacBackground.tsx` is an alternate p5-based background; only one runs at a time, controlled by user preference in `controlSettings.ts`. Hydra-synth needs the Vite shim `define: { global: "globalThis" }` (regl dep references Node's `global`) — don't remove.

### MDX, photography, audio

- MDX is wired through `@mdx-js/rollup` only. The `@vitejs/plugin-react` `include` is explicitly restricted to `/\.(jsx|js|tsx|ts)$/` so babel doesn't touch `.mdx`. Don't broaden that include. `/lab` route + `src/content/*.mdx`.
- Photography catalog: `src/photography/manifest.ts` + `library.ts` → `buildFilmPhotoLibrary()` → `FILM_PHOTO_ITEMS` in `windowRegistry.ts` (desktop Photos window) and `src/pages/Film.tsx` (the `/film` route). Photos are loaded via `import.meta.glob` with `?responsive` so `vite-imagetools` produces WebP/JPG variants at 1024/2048 widths (4 outputs per photo). AVIF was tried but sharp's AVIF encoder pushed the Vercel build past 10 min for 75 photos. WebP gives ~95% of AVIF's compression at ~10x the speed. Render with `<ResponsivePicture image={photo.image} />` from `@/components/ui/ResponsivePicture`. The one exception is `src/p5mac/p5starCollageSketch.ts` which uses `p.loadImage()` — that needs a plain URL, so `skyline3.jpg` is imported without `?responsive`.
- Two imagetools traps, both hit in production before:
  - `as=picture` returns `sources` as an **object keyed by format** (`{webp: srcset, jpeg: srcset}`), not an array. `src/types/imagetools.d.ts` is hand-written and does not validate against reality, so `tsc` cannot catch a wrong `ResponsiveImage` shape — a mismatch only surfaces as a runtime crash inside `ResponsivePicture`.
  - imagetools' `include` regex is matched **case-insensitively** only because `vite.config.ts` passes the `i` flag explicitly. Its default is case-sensitive, so a photo saved as `.JPG` silently bypasses the plugin and resolves to a plain URL string. Keep image filenames lowercase anyway.
- Local audio: `src/music/` (gitignored — `music/` in `.gitignore`). `ambientAudio.ts` runs site ambience; `retroMacSounds.ts` triggers UI chirps (icon select/open, trash empty, glitch burst, Konami fanfare). Both are gated by `controlSettings`.

### Path alias

`@/` → `src/`. Use it consistently. UI icon imports live at `@/assets/icons/...`; other assets at `@/assets/...` (e.g. `gpu_depreciation.mp4`). The old root-level `images/` directory is gone — don't reintroduce relative `../../images/...` paths.

### Persistence

Session/visit state is in `localStorage` via `lib/visitMemory.ts` (visit count, windows opened, secrets found, Konami used) and `lib/visitorIdentity.ts` (anonymous visitor name). Shared photobook + visitor log live in Supabase; callers must handle the `supabase === null` case. Realtime subscriptions in `lib/photobookStore.ts` must be cleaned up via `unsubscribeSharedPhotos`.

## Things to know before changing code

- Two of the most-edited files are large: `MacintoshDesktop.tsx` (~1.2k lines) and `macintosh-desktop.css` (~5k lines). Prefer adding to the existing file in the same section over creating a parallel file, unless you're carving out a self-contained module.
- `windowRegistry.INITIAL` must contain an entry for every `AnyWindowId` — TypeScript will enforce this; if you add a window id, add the title/size or the build breaks.
- The repo ships `node_modules/`, `dist/`, and `.vercel/` — none of these should be touched by code changes.
- Vendor chunks are configured in `vite.config.ts` (`build.rollupOptions.output.manualChunks`). New heavy deps belong in an existing or new `vendor-*` chunk; otherwise they land in the entry bundle.
- `vite-imagetools` is wired with a `defaultDirectives` callback that only activates on imports tagged `?responsive`. Other image imports pass through Vite's default asset handling unchanged.
- `HydraBackground` and `P5MacBackground` short-circuit on mobile (`max-width: 640px`) and `prefers-reduced-motion: reduce`. Don't reintroduce eager WebGL/p5 startup on those code paths.
