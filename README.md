# esnupi

Portfolio playground: **Vite · React · TypeScript · Tailwind · MDX**. Live background is **hydra-synth** (random sketch each full page load).

## Stack (high level)

| Area | Libraries |
|------|-----------|
| Motion | GSAP (+ ScrollTrigger), Lenis (smooth scroll), Anime.js |
| Routing / “Barba-like” | **React Router** + GSAP route fade — Barba.js targets classic multi-page HTML; this SPA uses the same *idea* without fighting React’s renderer |
| 3D | Three.js via `@react-three/fiber` + `@react-three/drei`, optional **Spline** embed (`VITE_SPLINE_URL`) |
| UI | Tailwind CSS, shadcn-style components (Radix + CVA), **Normalize.css** |
| Content | MDX (`/lab`) |
| Data / misc | Chart.js, `@popperjs/core`, AOS, Luxon, SweetAlert2, xterm.js, GitHub REST API |

**Tailwind Plus** is a separate paid Tailwind UI product; this repo uses open-source Tailwind + hand-rolled/shadcn-style components instead. You can paste Plus snippets into `src/components/` if you have a license.

## Commands

- `npm install` — install dependencies
- `npm run dev` — local dev server
- `npm run build` — production build to `dist/`

Copy `.env.example` to `.env` and set optional variables.

## Environment variables

Only set what you need:

- `VITE_GITHUB_USER` (optional) — username used by the GitHub demo panel.
- `VITE_SPLINE_URL` (optional) — public Spline scene URL.
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (optional pair) — enables shared photobook storage.
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (optional aliases) — accepted for compatibility.

## Shared photobook setup (Supabase)

For the `Photobooth`/`Photobook` desktop apps to store a truly shared museum collection:

1. Create a Supabase project.
2. Run `supabase/museum_photos.sql` in the SQL editor.
3. Set these values in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Key paths

- `src/components/HydraBackground.tsx` — Hydra canvas
- `src/lib/randomHydraSketch.ts` — random Hydra programs
- `src/components/desktop/MacintoshDesktop.tsx` — primary desktop experience
- `src/pages/Archive.tsx` — long-form archive room
- `src/pages/Gallery.tsx` — study/gallery route
- `src/pages/FeltMoon.tsx` — horizontal scroll gallery route
- `src/content/hello.mdx` — sample MDX
- `src/music/` — drop local audio files for the desktop Music app
