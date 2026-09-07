# `/photolab` — literaturevendingmachine photolab advertising page

Date: 2026-09-06
Status: approved, ready to implement

## Problem

The site is Ajai Upadhyaya's personal portfolio. Ajai is opening a home film-developing
studio ("literaturevendingmachine photolab") to outside customers and wants a page on
the portfolio that advertises it: what it does, what it costs, and how to send film in.
No such page, panel, or content currently exists anywhere on the site.

## Goal

A new route, `/photolab`, that functions as a real small-business landing page: services,
pricing, how-it-works, proof of quality, and a clear path to placing an order — while
still looking like it belongs on this site (full retro-Mac chrome, not a bare document
like `/film`).

## Non-goals

- No payment processing, checkout, or order-tracking backend. Ordering is "email us."
- No desktop window/icon. Reachable only via the route and one inline link from the
  existing About/bio content (user explicitly chose route-only over "both").
- No physical mailing address printed anywhere in the app, in copy or in code (see
  Address handling below) — this is a privacy constraint, not an oversight.
- Not fabricating unverifiable trust claims (years in business, rolls processed). Trust
  content sticks to process/equipment facts actually supplied.
- Not building E-6 (slide), prints, or push/pull as offered services — not confirmed by
  the owner, so not advertised.

## Content decisions (from owner)

- Name: **literaturevendingmachine photolab**.
- Base: Richmond / Midlothian, Virginia. Accepts local drop-off (by appointment) *and*
  mail-in orders (nationwide).
- Services: C-41 (color negative), B&W, and ECN-2 — for 35mm and 120 only.
- Scanning: in-house, via a Contax-based large-format scanning setup + Negative Lab Pro.
- Ordering: a `mailto:` link (`ajaiupad@gmail.com`) — no on-page form, no external tool.
- Payment: Venmo / PayPal / Cash App, arranged by email after order confirmation
  (placeholder handles — owner fills in real ones before launch).

## Address handling

The owner's only mailing address on file is a home address. This is a static site with
no auth layer — anything present in the deployed JS is visible to any visitor via
view-source or the network tab, so there is no way to "print an address on the page" and
also keep it out of the public bundle. Rather than ship a broken hide (e.g. rendering it
behind a click, or obfuscating the string), **the address is not present anywhere in the
codebase**. The page's copy for both mail-in and local drop-off says "email to arrange
it," and the owner sends the real address by hand once corresponding with an actual
customer. `PUBLISH_CHECKLIST.md` gets a note recommending a PO Box / UPS Store mailbox if
the owner later wants a publishable address.

## Pricing (owner delegated; flagged for confirmation before real orders)

| Format | Develop only | Develop + Scan |
| --- | --- | --- |
| C-41, 35mm | $10 | $18 |
| C-41, 120 | $12 | $20 |
| B&W, 35mm | $13 | $21 |
| B&W, 120 | $15 | $23 |
| ECN-2, 35mm | $16 | $24 |
| ECN-2, 120 | $18 | $26 |

Scan-only (customer supplies negatives): $9 (35mm) / $10 (120). Rush (48-hour): +$10
flat. 5+ rolls in one order: 10% off developing (not combined with rush). Standard
turnaround: 5–7 business days from receipt. These numbers live in `photoLabData.ts` as
plain data, not hardcoded into JSX, so the owner can edit them without touching markup.

## Page structure

Single scrolling page, sections in order:

1. **Hero** — lab name, one-line tagline, service-area line ("Richmond & Midlothian, VA
   — mail-in nationwide"), primary CTA button (`mailto:`).
2. **Services & pricing** — the table above, rendered from `photoLabData.ts`.
3. **How it works** — 4-step strip: email us → send or drop off film → we process &
   scan → negatives + scans back to you.
4. **Sample gallery** — 6–8 images pulled from the existing film catalog via
   `buildFilmPhotoLibrary()`, taken from the front of the manifest-ordered array (those
   entries carry curated `title`/`location`/`blurb`, unlike the alphabetical leftover
   tail — see `library.ts`). Framed as "scans from the lab," reusing `ResponsivePicture`.
   A static grid, not a lightbox/viewer — this is quality proof, not a second `/film`;
   no click-to-enlarge, no keyboard nav, no new interaction state.
5. **About / equipment** — process-and-care copy; names the Contax-based scanning setup
   and Negative Lab Pro; calls out ECN-2 as a specialty most consumer labs don't offer.
   No invented tenure/volume claims.
6. **Before you send / FAQ** — turnaround, expired-film policy (processed as-is, no
   result guarantee), disposable cameras (standard C-41 only), packaging guidance,
   negatives returned cut & sleeved unless uncut is requested, liability note (insure
   anything irreplaceable — the lab isn't responsible for loss/damage in transit or for
   pre-existing film damage), push/pull ("not offered as standard — email first").
7. **Contact footer** — repeat `mailto:` CTA + service-area line.

## Visual design

Full site chrome (grain/vignette/topo overlays), same treatment as `/archive` and
`/gallery` — nothing to change in `SiteLayout`, since that's already the default for any
route not in the `isBare` list.

Correction from the version of this decision presented in chat: the generic
`--background`/`--primary`/etc. HSL tokens in `index.css` (`:root`) are **not** actually
used anywhere in `macintosh-desktop.css` (verified: zero references) — they're unused
shadcn-scaffold leftovers. `Archive.tsx`/`Gallery.tsx` each define their own bespoke
light palette instead of touching either token set. The desktop's *real* visual language
is the "Platinum" system also defined on `:root` in `macintosh-desktop.css`
(`--chrome-light: #f0ece4`, `--window-body: #fdfaf5`, `--text-primary: #1a1814`,
`--accent-rupture: #ff3b00`, `--accent-select: #0000cc`, hard-edged `--shadow-window: 2px
2px 0 #888480`, plus its `--space-*` spatial scale and `--text-*` modular type scale).
Because these are declared on `:root`, not scoped to a desktop component class, they're
already valid CSS anywhere in the app, `/photolab` included, with zero new tokens needed.

`/photolab` uses the Platinum system directly: warm cream/paper background
(`--window-body`/`--chrome-light`), warm near-black text (`--text-primary`,
`--text-secondary` for meta/muted copy), hard pixel-offset shadows (`--shadow-window`)
on cards and buttons — a genuine visual match for the desktop's own chrome. This is a
deliberate departure from `Archive.tsx`/`Gallery.tsx`, which each invented their own
one-off palette — `/photolab` reuses the desktop's actual system instead, which is what
"match the retro Mac desktop" in the approved plan means.

**Accent color: `--accent-select` (`#0000cc`, classic Mac selection blue), not
`--accent-rupture`.** `macintosh-desktop.css` documents `--accent-rupture`/`--mac-rupture`
explicitly in a comment as "the single rupture color — appears only at the threshold
between navigation and experience (Secret panel, Konami, About drop cap, corruption)."
That's a deliberate scarcity rule already established in this codebase; spending it on a
new page's buttons and headers would cheapen the one thing it's reserved for, however apt
"safelight red" sounds. `--accent-select` is the desktop's other real accent (used for
`::selection` globally) and carries no such restriction, so it's the correct choice for
CTA buttons, links, and table emphasis here.

Typography reuses the desktop's own dual-register stacks rather than inventing new font
choices: `--mac-font-content` (Playfair Display serif, via the existing `.mac-type-content`
utility) for headings and body copy, `--mac-font-system` (Public Sans) for UI labels/nav,
`--mac-font-terminal` (IBM Plex Mono) for prices, metadata, and the FAQ index — matching
how the desktop itself splits these registers. Spacing uses the existing `--space-*`
scale and `--text-*` modular type scale from `macintosh-desktop.css` rather than
new ad-hoc values. Layout follows the section-with-generous-spacing shape of
`Archive.tsx`/`Gallery.tsx`, not `film.css`'s bare-field grid.

## SEO & structured data

- `seoMeta.ts`: add a `/photolab` branch to `resolveSeoMeta` (title, description
  mentioning Richmond/Midlothian and the three processes) and an entry in
  `SITE_INDEXABLE_ROUTES`.
- `structuredData.ts`: `buildStructuredDataGraph` appends one additional `@graph` node
  when `pathname` is `/photolab` — `"@type": "LocalBusiness"` with `name`, `description`,
  `url`, `email`, `priceRange: "$9-$26"`, `founder: { "@id": PERSON_ID }`, and
  `areaServed` as a list of `City` entries (Richmond VA, Midlothian VA) plus
  `Country: United States` for the mail-in reach. **No `address` field** — this is the
  standard schema.org/Google pattern for a service-area business that intentionally
  doesn't publish a street address, and keeps this file consistent with the Address
  handling section above.
- `public/sitemap.xml`: add a `<url>` entry for `/photolab`.
- `siteIdentity.ts`: append a few phrases to `SITE_OWNER_SEO_PHRASES` (e.g. "film
  developing Richmond Virginia", "literaturevendingmachine photolab") following the
  file's existing flat-list convention.

## Integration

New files:

- `src/pages/PhotoLab.tsx` — route component.
- `src/pages/photolab.css` — scoped styles, following `archive.css`/`gallery.css`.
- `src/lib/photoLabData.ts` — services, pricing table, FAQ entries, process-steps copy.

Edited files:

- `src/App.tsx` — `React.lazy` route at `/photolab`, matching `/archive`.
- `src/components/layout/RouteTransition.tsx` — add `/photolab` to `isSecondaryRoom` so
  navigating from `/` plays the same CRT-collapse transition as the other rooms.
- `src/lib/seoMeta.ts`, `src/lib/structuredData.ts`, `src/lib/siteIdentity.ts` — as above.
- `public/sitemap.xml` — new `<url>` entry.
- `PUBLISH_CHECKLIST.md` — add `/photolab` to the broken-route preflight list; add a line
  to confirm real pricing and fill in real Venmo/PayPal/Cash App handles before taking
  real orders; note the PO Box recommendation.
- One existing content panel (bio/About copy in `ContentPanels.tsx`, where film
  photography is already mentioned) — add one inline link to `/photolab` so the page is
  reachable from the main site, not only from search/direct link.

## Verification

No test runner in this repo; `tsc -b` under `npm run build` is the only static check.

1. `npx tsc -b --noEmit` clean.
2. `npm run build` succeeds.
3. Against `npm run preview`, in a browser:
   - `/photolab` renders full chrome (grain/vignette/topo present, unlike `/film`).
   - Pricing table, FAQ, and gallery render with real data — no leftover Lorem/TODO text.
   - The gallery section renders real photographs via `ResponsivePicture` (network tab
     shows `webp`/`jpeg` sources, not a broken image).
   - The `mailto:` CTA has the correct address and opens a mail client.
   - Navigating from `/` plays the CRT-collapse transition, matching `/film`/`/archive`.
   - No street address string appears anywhere in `dist/assets/*.js` after build (grep
     check) — confirms the privacy constraint actually holds in the shipped bundle.
   - The inline link from the About/bio panel navigates correctly.
4. Manually confirm `PUBLISH_CHECKLIST.md`'s new pricing/payment-handle reminders read
   clearly for future-Ajai.
