# /film — "The Unstyled Document"

**Date:** 2026-07-11
**Figma:** https://www.figma.com/design/Q34kcxFRh9wr1YYIqTelv6/Untitled (page "Film")
**Status:** Shipped.
**Supersedes the visual layer of:** `docs/superpowers/specs/2026-07-09-film-page-design.md` (the route, lightbox, a11y, and image pipeline decisions in that spec all stand)

---

## Thesis

The rest of ajaiupadhyaya.com is a simulated Mac OS 8 desktop: grain, vignette, crosshair cursor, dark-only, hydra wallpaper. It is the loudest thing on the site.

`/film` is the plain document underneath it.

So the design system is not a design system. **It is the browser's own default stylesheet.** Every colour, every type size, every unit of space on the page is a value a browser would have used if nobody had styled anything. The photographs sit in a grid built to hairline precision. The type around them is deliberately un-designed.

The grid is the only thing on the page that was designed. That tension is the whole idea.

## What changes from today's `/film`

Today's page is already white/black, `prefers-color-scheme`-driven, and edge-to-edge. It works. Three things change:

1. **It gets a title and a description.** Today there is only a nav bar (`← Ajai Upadhyaya — Film`) and a footer. There is no `<h1>` and no prose. The page never says what it is.
2. **The type stops being uniformly mono-uppercase-tracked.** IBM Plex Mono at `11px / 0.2em / uppercase` is a *style* — a deliberate, fashionable one. It is replaced by two voices with different jobs (below).
3. **The zero-gutter hairline grid becomes an 8px-gutter grid.** "Minimal, but present." The hairline-border technique (container draws top+left, cells draw right+bottom) exists only to dodge the trailing-empty-cell problem, and it goes away with real gutters.

## Tokens

Figma collection `ua-default`, two modes (Light / Dark). Every value is a real browser default.

### Colour — follows `prefers-color-scheme`

| Token | Light | Dark | Role |
|---|---|---|---|
| `color/canvas` | `#FFFFFF` | `#000000` | body background |
| `color/ink` | `#000000` | `#FFFFFF` | body color |
| `color/link` | `#0000EE` | `#9E9EFF` | The UA anchor colour. The only colour on the page. |
| `color/rule` | ink @ 14% | ink @ 22% | hairline. Never a grey — always ink at low alpha. |
| `color/muted` | ink @ 50% | ink @ 55% | secondary text |

`color/link` is the one risk. It is not a brand accent; it is what a browser does to an `<a>` when you don't style it. It appears exactly once per view (the back-link to the portfolio). If it ever appears twice, something has gone wrong.

### Type — two voices

**Times** is the document voice. **Courier** is the machine voice. Nothing else.

| Role | Face | Size / line-height | Notes |
|---|---|---|---|
| `h1` | Times Bold | 32 / 37 | The UA default: `2em`, bold, serif. |
| `p` | Times Regular | 16 / 24 | `1rem`. Measure snaps to two grid columns (565px), not an arbitrary max-width. |
| `h2` (lightbox title) | Times Bold | 24 / 30 | |
| meta | Courier Regular | 13 / 20 | Counts, captions, film stock, nav. |

CSS: `font-family: "Times New Roman", Times, serif` and `font-family: "Courier New", Courier, monospace`. Both are system faces — **no webfont request**. (Figma has no Times or Courier; the file uses **Tinos** and **Cousine**, which are the metric-exact clones. They render identically. Do not ship Tinos/Cousine.)

Titles and blurbs stay lowercase, as authored in `manifest.ts`. No `text-transform`. No `letter-spacing`.

### Space — the whole scale is the UA body margin

| px | Token | Role |
|---|---|---|
| 8 | `space/margin`, `space/gap` | `body { margin: 8px }`. **The page gutter and the grid gutter are the same number.** |
| 16 | `space/block` | `margin-block: 1em`. Between h1, p, caption lines. |
| 24 | `space/section` | Three margins. Between masthead, grid, footer. |
| 1 | `rule/hairline` | `<hr>`, caption top border. Never 2. |

The one exception: the **focus ring is 2px**, not a hairline. A 1px ring is too thin to meet the focus-visible bar, and accessibility outranks the thesis.

An 8px page gutter is aggressive — the grid is essentially flush to the viewport, with a hairline of canvas around it. That is intentional and it is the reason the page reads as a wall of photographs rather than a portfolio layout.

## Layout

```
body                                  padding 8, gap 24
├── masthead                          gap 24
│   ├── nav          [SPACE_BETWEEN]  a "← ajaiupadhyaya.com"  ·  "075 frames"
│   └── title block                   gap 16
│       ├── h1       "Film"
│       └── p        the description  (width: 565px = 2 cols + 1 gutter)
├── grid                              gap 8
│   └── row × n                       gap 8, cells are 1fr squares
├── hr
└── footer           [SPACE_BETWEEN]  "35mm · 110 · scanned at home"  ·  "ajai upadhyaya"
```

### Grid

Square cells, `1fr`, 8px gutters, `object-fit: cover`.

| Breakpoint | Columns |
|---|---|
| ≤ 640 | 2 |
| 641–1024 | 3 |
| 1025–1440 | 4 |
| ≥ 1441 | 5 |

75 frames divide evenly only at 5 columns. **Trailing cells in the last row are simply absent** — no filler, no stretched cell. With real gutters this needs no special handling (the old hairline technique did).

### Cell hover / focus

A solid `color/canvas` bar, 32px tall, hairline top rule, slides up from the bottom edge. Courier 13px: zero-padded index in `color/muted`, then the title in `color/ink`, truncating with an ellipsis. **No location** — it does not fit in 278px and it belongs in the lightbox. Same treatment on `:focus-visible`. Respect `prefers-reduced-motion`.

### Lightbox

Padding 8 (same UA margin — the photograph gets everything else). Three rows: bar / stage / foot.

- **bar:** `013 / 075` (muted) · `close (esc)` (ink)
- **stage:** the photograph, `object-fit: contain`, never cropped
- **foot:** `h2` title (Times Bold 24) over location + blurb (Courier 13, muted) · `← prev` `next →`

Keep everything else from the existing `FilmLightbox.tsx`: portal into `<body>`, focus trap, Esc / ← / → keys, `data-lenis-prevent`, neighbour preload, scroll lock, and the return-focus-to-last-viewed-frame behaviour.

## Copy

> **Film**
>
> Seventy-five frames on 35mm and 110 — Ektar 400, Kodak Gold, unlabelled Fuji, one roll of Lomochrome. Scanned at home. In no order.

The film stocks are drawn from the `blurb` field in `manifest.ts` and are accurate. There is no "click any frame to open it" hint: the brief was a title and a description, and a third line is one accessory too many.

## The entry point (fixed in this change)

`/film` was **not linked from anywhere on the site** — it was in `sitemap.xml` and `seoMeta.ts`, and the CRT route transition knew about it, but no component ever navigated to it. It was reachable only by typing the URL.

The desktop's Photos window now carries a **Contact sheet ↗** link in its toolbar (`FilmPhotosPanel`, calling `routeTransition.goto("/film")`). The Photos window is where someone already looking at the photographs is standing, so it is the honest place to put the door.

## Implementation notes

- All of this lives in `src/pages/film.css` + `Film.tsx` + `FilmLightbox.tsx`. No new files, no Tailwind, no new dependency, no webfont.
- The four `--film-*` custom properties become the five tokens above, declared on both `.film-root` and `.film-lightbox` (the lightbox portals out of the subtree and cannot inherit).
- Photos, the `?responsive` imagetools pipeline, and `ResponsivePicture` are unchanged. `sizes` needs re-checking against the 8px gutters, but the 1024w/2048w variants still cover every cell size.
