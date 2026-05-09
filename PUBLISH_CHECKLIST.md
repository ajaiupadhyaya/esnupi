# Publish Checklist

## Required before production

- Replace placeholder image sources from Unsplash in:
  - `src/lib/projectsData.ts`
  - `src/pages/Gallery.tsx`
  - `src/pages/FeltMoon.tsx`
- Replace placeholder project copy in `src/lib/projectsData.ts` with final case-study text.
- Verify all outbound links in:
  - `src/components/desktop/panels/ContentPanels.tsx`
  - `src/lib/projectsData.ts`
- Add `.env` from `.env.example` if you need optional integrations.

## Optional integrations

- Supabase shared photobook:
  - set `VITE_SUPABASE_URL`
  - set `VITE_SUPABASE_ANON_KEY`
  - run `supabase/museum_photos.sql`
- GitHub profile panel:
  - set `VITE_GITHUB_USER`
- Spline embeds:
  - set `VITE_SPLINE_URL`

## Pre-flight quality checks

- `npm run build` passes.
- No broken internal routes:
  - `/`
  - `/archive`
  - `/gallery`
  - `/feltmoon`
- Desktop interactions checked manually:
  - icon single-click, double-click, drag, context menu
  - window drag/resize/minimize/close
  - keyboard shortcuts (Escape, Enter on icons, arrows on FeltMoon)

## Performance notes

- Build succeeds, but several image assets are very large (>4MB each).
- For production, consider generating smaller responsive variants for gallery and archive media.
- Keep GIF usage minimal; prefer MP4/WebM where possible for large animated assets.
