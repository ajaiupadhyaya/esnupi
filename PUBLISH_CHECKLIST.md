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
  - `/film`
  - `/feltmoon`
  - `/photolab`
- `/film` renders white in light mode and black in dark mode (`prefers-color-scheme`),
  with no grain, vignette, or crosshair cursor.
- Desktop interactions checked manually:
  - icon single-click, double-click, drag, context menu
  - window drag/resize/minimize/close
  - keyboard shortcuts (Escape, Enter on icons, arrows on FeltMoon)

## Performance notes

- Build succeeds, but several image assets are very large (>4MB each).
- For production, consider generating smaller responsive variants for gallery and archive media.
- Keep GIF usage minimal; prefer MP4/WebM where possible for large animated assets.

## Photolab page — before taking real orders

- Confirm the pricing in `src/lib/photoLabData.ts` against actual costs. The numbers
  shipped were proposed as a reasonable starting point, not owner-verified.
- The FAQ says payment is by Venmo, PayPal, or Cash App but names no handles — decide
  whether to add real handles to the page copy or keep collecting them by email only.
- No street address is published anywhere on `/photolab` by design (it's the owner's
  home). If a PO Box or UPS Store mailbox is set up later, add it to `photoLabData.ts`
  and it can be printed on the page.
- Confirm the equipment claims in `ABOUT_COPY` (`src/lib/photoLabData.ts`) — the Contax
  scanning setup, Negative Lab Pro, and in-house ECN-2 — are still accurate before launch;
  these are asserted publicly on the page.
