# `/film` — hyper-minimalist film photography page

Date: 2026-07-09
Status: approved, ready to implement

## Problem

The site holds 75 scanned film photographs in `src/photography/`, each with a
`title`, `location`, and `blurb` in `manifest.ts`. They are reachable only inside
the simulated Mac OS 8 desktop, through the `Photos` window (`FilmPhotosPanel`).
There is no plain, linkable page where the photographs are the whole subject.

Counts verified 2026-07-09: 75 image files, 75 manifest entries, no unlisted
files, and no empty `location` or `blurb` values.

Separately, `/gallery` presents itself as the photography page but renders three
Unsplash stock images. `PUBLISH_CHECKLIST.md` already flags those placeholders.
Fixing `/gallery` is **out of scope** for this spec; it is noted so the next
person does not mistake `/film` for a duplicate.

## Goal

A new route, `/film`, that is the opposite of the rest of the site: no chrome, no
wallpaper, no grain. A square grid of every photograph on a white or black field
chosen by the visitor's device, and a full-bleed viewer with a short brutalist
caption.

## Non-goals

- Changing `FilmPhotosPanel` or the desktop.
- Replacing the Unsplash placeholders on `/gallery`.
- Adding a light theme to the rest of the site.
- Adding new photographs, or editing the manifest.

## Data

`buildFilmPhotoLibrary()` from `@/photography/library` already returns the exact
shape the page needs:

```ts
type FilmPhoto = {
  id: string;
  image: ResponsiveImage;
  file: string;
  title: string;
  location: string;   // "" when absent
  blurb: string;      // "" when absent
};
```

The page calls `buildFilmPhotoLibrary()` directly and memoizes at module scope.
It does **not** import `FILM_PHOTO_ITEMS` from `windowRegistry.ts`: that module
also pulls in the desktop icon PNGs and the `WindowId` union, which would land in
the lazy `/film` chunk for no reason. Both entry points import `library.ts`, so
the `import.meta.glob` runs once regardless.

Every photograph currently carries a non-empty `location` and `blurb`. They are
typed as possibly-empty because `library.ts` appends any image *not* listed in
the manifest with `location: ""` and `blurb: ""`. The viewer therefore omits the
line entirely when a value is empty, rather than rendering an empty element or a
placeholder — a guard for future photographs, not for today's data.

## Theme

The site is dark-only. `:root` in `index.css` defines dark values for
`--background` / `--foreground`; `tailwind.config.cjs` sets `darkMode: ["class"]`
but no `.dark` class is ever applied. Rather than retheme the site, `/film`
carries its own token set, scoped to `.film-root`, switched on
`prefers-color-scheme`:

| token          | light     | dark      |
| -------------- | --------- | --------- |
| `--film-bg`    | `#ffffff` | `#000000` |
| `--film-fg`    | `#000000` | `#ffffff` |
| `--film-rule`  | 12% fg    | 20% fg    |
| `--film-muted` | 45% fg    | 55% fg    |

Dark mode is the `@media (prefers-color-scheme: dark)` branch; light is the
default, so a device with no preference gets white.

Because the page must be white while `body` is dark, overscroll and the scrollbar
would otherwise leak the dark theme. The page component sets a `data-film-page`
attribute on `document.documentElement` on mount and removes it on unmount. CSS
keyed on that attribute sets the root background and `color-scheme: light dark`.

## Chrome opt-out

`SiteLayout` unconditionally renders four fixed decorative overlays —
`.site-fusion-topo`, `.site-fusion-jpeg`, `.site-film-vignette`,
`.site-film-grain` — and `.site-fusion-shell` sets `cursor: crosshair`. All of it
is wrong for this page.

`SiteLayout` already branches on `pathname` (`showP5Mac`, `showHydra`,
`showScrim`). Add one more branch, `isBare`, true for `/film`, that skips the
four overlays and suppresses the crosshair cursor. This follows the file's
existing shape instead of introducing a new mechanism.

## Grid

- Cells are `<button>` elements, one per photograph, in manifest order.
- Each cell is `aspect-ratio: 1 / 1` with `object-fit: cover`. Photographs are
  center-cropped; the grid's rhythm wins over the frame.
- Columns: 2 (≤640px), 3 (≤1024px), 4 (≤1440px), 5 (>1440px).
- Hairlines: the grid container draws `border-top` and `border-left`; each cell
  draws `border-right` and `border-bottom`. **Not** `gap: 1px` over a
  rule-coloured container — 75 photographs divide evenly into only the 5-column
  case, and for the others the gap technique paints the empty trailing cells as a
  solid block of rule colour.
- Hover / focus reveals a mono index and title inside the cell. No text
  otherwise. Focus is visible via the same treatment, not only hover.

## Viewer (lightbox)

- Solid `--film-bg` backdrop, not translucent. The photograph is the page.
- Image is `object-fit: contain`, capped so the caption always has room.
- Top-left: zero-padded counter, `014 / 075`. Top-right: close control.
- Bottom-left: title, then location, then blurb — each omitted when empty.
- `←` / `→` step (wrapping), `Esc` closes, backdrop click closes. Prev/next
  controls are real buttons so touch and pointer users get the same affordance.
- `role="dialog"`, `aria-modal="true"`, focus trapped inside. On close, focus
  moves to the cell for the frame the viewer was **last showing** — not the cell
  that opened it. Open 016, step to 017, close: focus lands on 017 and scrolls
  it into view. This departs from the usual "return focus to the invoker" rule
  because the viewer navigates the same collection the grid shows; returning to
  the invoker would scroll the page backwards, away from the photograph the
  reader just chose to look at.
- Immediate neighbours are preloaded so stepping does not flash.
- The overlay root carries `data-lenis-prevent`. `LenisGsapProvider` checks for
  exactly that attribute; without it, global Lenis keeps smooth-scrolling the
  page underneath the overlay. Body scroll is locked in addition.
- Under `prefers-reduced-motion: reduce`, transitions are removed, not shortened.

## Typography

IBM Plex Mono for every element — counter, title, location, blurb. It is already
loaded by the Google Fonts `<link>` in `index.html`, so the page adds no font
request. Titles are uppercased with positive tracking; the blurb stays lowercase
at the manifest's own casing.

## Images and the build-time tradeoff

`vite-imagetools` is configured (in `vite.config.ts`) to emit WebP and JPG at
1024w and 2048w for imports tagged `?responsive`. Commit `2629995` deliberately
removed the 480w variant, and AVIF, to hold the Vercel build under three minutes
across the photograph set.

Consequence: a ~300px grid cell downloads the 1024w file. We accept this.
Re-adding a thumbnail width costs 150 further encodes and risks the exact build
timeout that commit exists to prevent.

Mitigations, both already supported by `ResponsivePicture`:

- Grid cells pass `sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"`.
- Grid cells keep the component's default `loading="lazy"`.
- The active viewer image uses `sizes="100vw"` and `loading="eager"`.

Revisit if the grid proves slow on a cold cache.

## Integration

New files:

- `src/pages/Film.tsx` — route component: header, grid, viewer state.
- `src/pages/FilmLightbox.tsx` — the viewer: keyboard, focus trap, scroll lock.
- `src/pages/film.css` — tokens and layout, scoped to `.film-root`.

Edited files:

- `src/App.tsx` — `React.lazy` route at `/film`, matching `/archive`.
- `src/components/layout/SiteLayout.tsx` — the `isBare` branch.
- `src/components/layout/RouteTransition.tsx` — add `/film` to `isSecondaryRoom`
  so navigating from `/` plays the same CRT collapse as the other rooms.
- `src/lib/seoMeta.ts` — an entry in `SITE_INDEXABLE_ROUTES` and a branch in
  `resolveSeoMeta`.
- `public/sitemap.xml` — a `<url>` entry.
- `PUBLISH_CHECKLIST.md` — add `/film` to the broken-route preflight list.

## Verification

There is no test runner in this repo; `tsc -b` under `npm run build` is the only
static check.

1. `npx tsc -b --noEmit` clean.
2. `npm run build` succeeds.
3. In a browser against `npm run preview`:
   - `/film` renders 75 cells; no grain, vignette, or crosshair cursor.
   - Emulating `prefers-color-scheme: light` gives a white field; `dark` gives
     black. Overscroll matches the field in both.
   - Clicking a cell opens the viewer with the right counter and caption.
   - `←` / `→` wrap at both ends; `Esc` closes; focus returns to the cell.
   - The page behind the overlay does not scroll.

The empty-`location` / empty-`blurb` branch cannot be exercised against current
data, since all 75 entries are populated. It is covered by inspection only.
