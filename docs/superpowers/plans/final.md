# Final (post-fix, branch: fix/production-readiness)

Date: 2026-05-19
Commit: 89d812296e660cb622781f1385141d0a22e449a8
Commits on branch: 21

## Build

| Metric | Baseline | Final | Delta |
|---|---|---|---|
| `dist/` total | 398M | 159M | -239M (-60%) |
| Main JS bundle | 2.17 MB | 377 KB | -1.79 MB (-83%) |
| Largest single asset | 16.4 MB JPG | 4.04 MB JPG | -12.3 MB (-75%) |

## Top 10 JS chunks (final)

1105180 vendor-p5-DmozCCU5.js
377204 index-LCru0Y1J.js
334212 vendor-xterm-CRPy65hj.js
196939 vendor-supabase-60EFKzIz.js
186813 vendor-hydra-B4R-iEx_.js
182936 vendor-three-DcjLxgDB.js
89333 vendor-motion-sLsAmo41.js
49235 vendor-react-_GL2JRAd.js
18670 FeltMoon-D1hn0ueo.js
13161 MacTerminalApp-kmDnWTmh.js

## Top 10 largest assets (final)

5373629 the rot-kCGLBqcs.mp3
5243949 Facebook.com-DA6yMq7z.mp3
5060159 insomniac-ru_fVIlU.mp3
4039606 skyline3-BYJ7vvsS.jpg
2011284 tWbeM-DevvoP-x.webp
2010982 tWbeM-Pdx0y_jZ.jpeg
2003277 mucho-BDri5HvE.mp3
1952494 cornernyc2-Bx-miGdy.webp
1927379 cornernyc2-DP47HWgU.jpeg
1867464 schoooolbus-B7TtUfmj.webp

## Lighthouse

Skipped — binary not available in this environment.

## Commits on this branch

89d8122 a11y: global focus-visible ring for non-desktop routes
bf59b01 perf(bg): skip Hydra/p5 canvas on mobile + reduced-motion
8e2447e a11y: respect prefers-reduced-motion in Lenis + GSAP route fades
227c744 chore(assets): relocate root images into src/assets, normalize imports
7e105f6 chore: remove stale planning notes, empty folders, build artifact
adf9c4f perf(fonts): single stylesheet, drop unused families, deduplicate IBM Plex Mono
005f65b build(vercel): immutable cache on /assets, SPA rewrite, short cache on static files
f3f1d9c seo: add favicon, robots.txt, sitemap.xml
5100b42 seo: add description, OG/Twitter meta, theme color, canonical (ajaiupadhyaya.com)
fa752d6 chore(deps): drop unused libs identified by bundle analyzer
dc754ba perf(desktop): lazy-load heavy panels via React.lazy + Suspense
5877680 perf(build): split vendor chunks by library family
1562808 chore(deps): drop unused aos + @types/aos
751745d perf(media): convert gpu_depreciation gif -> mp4
a8e6b27 perf(images): responsive AVIF/WebP/JPG for photography (-238MB dist)
f1a193d feat(ui): add ResponsivePicture component + ?responsive type decls
5236eda build: add vite-imagetools + sharp; wire responsive directive
8d03bc4 security(supabase): allow authenticated users on visitor log RLS policies
3565928 fix(spline): no-op when VITE_SPLINE_URL is unset
b7609c8 chore: record pre-fix baseline metrics
a150e73 docs: add CLAUDE.md and production-readiness fix plan

## Notes

- p5/Hydra canvases now skip on mobile + reduced-motion; `vendor-p5` (1.1 MB) only downloads when the canvas actually mounts.
- vite-imagetools generates AVIF + WebP + JPG at 480/1024/2048 widths for every photography import via `import.meta.glob` with `?responsive`.
- All eager / lazy panel splits visible above as separate chunks.
- The single 4 MB JPG remaining is `skyline3.jpg`, used by the p5 sketch which needs a plain URL (not a `<picture>` object). Could be pre-resized manually for further savings.
- `luxon` (~40 KB gzip) noted as a future replacement candidate for native `Intl`.
- A third render-blocking `@import` for Bebas Neue in `macintosh-desktop.css` was identified and left in scope for a future pass.
