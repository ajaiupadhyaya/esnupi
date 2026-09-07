# Photolab Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/photolab`, a real advertising/ordering page for Ajai's home film-developing
studio ("literaturevendingmachine photolab"), matching the pattern already established by
`/archive`, `/gallery`, and `/film`.

**Architecture:** One new route (`src/pages/PhotoLab.tsx` + `photolab.css`), one new data
module (`src/lib/photoLabData.ts`), and small additions to the existing routing/SEO/sitemap
plumbing every other route already goes through. No new dependencies, no backend, no
desktop window.

**Tech Stack:** Vite 6, React 19, TypeScript (strict), React Router, existing
`macintosh-desktop.css` "Platinum" design tokens (global, `:root`-scoped).

**Spec:** `docs/superpowers/specs/2026-09-06-photolab-page-design.md`

## Global Constraints

- No street address anywhere in the codebase — copy, data files, structured data, comments.
  This is a hard privacy constraint (owner's home address), not a style preference.
- No fabricated trust claims (years in business, rolls-processed counts, testimonials).
  Trust content is limited to process/equipment facts already supplied.
- Services are exactly C-41, B&W, and ECN-2, for 35mm and 120 only. No E-6, no prints, no
  push/pull as an offered service (FAQ may mention push/pull as "ask first," never as offered).
- No new npm dependencies — everything needed already exists in `package.json`.
- No test runner in this repo (confirmed in `CLAUDE.md`). Every "verify" step below uses
  `npx tsc -b --noEmit`, `npm run build`, or a manual/browser check via `npm run dev` —
  never `npm test`.
- Route path is exactly `/photolab`.
- Color/typography tokens come from the existing global Platinum system in
  `macintosh-desktop.css` (`--window-body`, `--chrome-light`, `--text-primary`,
  `--text-secondary`, `--accent-select`, `--shadow-window`, `--border-light`,
  `--border-dark`, `--space-*`, `--text-*`, `--mac-font-content`, `--mac-font-system`,
  `--mac-font-terminal`). **Never** the unused `index.css` shadcn tokens
  (`--background`, `--primary`, etc.) and **never** `--accent-rupture`/`--mac-rupture`
  (reserved elsewhere in this codebase for a specific one-off design moment — see spec).
- All file paths below are relative to repo root `/Users/ajaiupadhyaya/Documents/esnupi`.

---

## Task 1: Content data module

**Files:**
- Create: `src/lib/photoLabData.ts`

**Interfaces:**
- Produces: `LAB_NAME: string`, `HERO: { name, tagline, serviceArea, ctaLabel }`,
  `CONTACT_EMAIL: string`, `CONTACT_MAILTO: string`, `FilmProcess`, `FilmFormat`,
  `PricingRow`, `PRICING: PricingRow[]`, `SCAN_ONLY_PRICING: { format, price }[]`,
  `RUSH_FEE: number`, `BULK_DISCOUNT: { minRolls, percentOff }`,
  `STANDARD_TURNAROUND: string`, `RUSH_TURNAROUND: string`, `ProcessStep`,
  `PROCESS_STEPS: ProcessStep[]`, `ABOUT_COPY: { heading, paragraphs }`,
  `BEFORE_YOU_SEND: string[]`, `FaqEntry`, `FAQ: FaqEntry[]`. All consumed by Task 2–5.

- [ ] **Step 1: Write the data module**

```ts
import { SITE_OWNER_EMAIL } from "@/lib/siteIdentity";

export const LAB_NAME = "literaturevendingmachine photolab";

export const HERO = {
  name: LAB_NAME,
  tagline: "Hand-processed film developing and scanning, out of Richmond, Virginia.",
  serviceArea: "Serving Richmond & Midlothian, VA — mail-in developing available nationwide.",
  ctaLabel: "Email your order",
} as const;

const MAILTO_SUBJECT = "Film developing order — literaturevendingmachine photolab";
export const CONTACT_EMAIL = SITE_OWNER_EMAIL;
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(MAILTO_SUBJECT)}`;

export type FilmProcess = "c41" | "bw" | "ecn2";
export type FilmFormat = "35mm" | "120";

export type PricingRow = {
  process: FilmProcess;
  label: string;
  format: FilmFormat;
  developOnly: number;
  developAndScan: number;
};

export const PRICING: PricingRow[] = [
  { process: "c41", label: "C-41 Color Negative", format: "35mm", developOnly: 10, developAndScan: 18 },
  { process: "c41", label: "C-41 Color Negative", format: "120", developOnly: 12, developAndScan: 20 },
  { process: "bw", label: "Black & White", format: "35mm", developOnly: 13, developAndScan: 21 },
  { process: "bw", label: "Black & White", format: "120", developOnly: 15, developAndScan: 23 },
  { process: "ecn2", label: "ECN-2 (Motion Picture Film)", format: "35mm", developOnly: 16, developAndScan: 24 },
  { process: "ecn2", label: "ECN-2 (Motion Picture Film)", format: "120", developOnly: 18, developAndScan: 26 },
];

export const SCAN_ONLY_PRICING: Array<{ format: FilmFormat; price: number }> = [
  { format: "35mm", price: 9 },
  { format: "120", price: 10 },
];

export const RUSH_FEE = 10;
export const BULK_DISCOUNT = { minRolls: 5, percentOff: 10 };
export const STANDARD_TURNAROUND = "5–7 business days from when we receive your film";
export const RUSH_TURNAROUND = "48 hours from receipt";

export type ProcessStep = { step: number; title: string; body: string };

export const PROCESS_STEPS: ProcessStep[] = [
  {
    step: 1,
    title: "Email us",
    body: "Tell us what you're sending — process (C-41, B&W, or ECN-2), format, how many rolls, and develop-only or develop + scan. We'll confirm pricing and turnaround, and send mailing or drop-off details.",
  },
  {
    step: 2,
    title: "Send or drop off your film",
    body: "Mail it to us in a padded envelope — we'll send the address once we've confirmed your order. Local to Richmond or Midlothian? Drop-off is available by appointment.",
  },
  {
    step: 3,
    title: "We develop and scan",
    body: "Each roll is hand-processed in small batches and hand-inspected before scanning. Scans are pulled on a Contax-based large-format scanning setup and finished in Negative Lab Pro.",
  },
  {
    step: 4,
    title: "Your negatives (and scans) come back",
    body: "Negatives are returned cut and sleeved in archival sleeves unless you ask us to leave them uncut. Digital scans are delivered by download link.",
  },
];

export const ABOUT_COPY = {
  heading: "About the lab",
  paragraphs: [
    "literaturevendingmachine photolab is a small, hand-run darkroom based in the Richmond / Midlothian, Virginia area. Every roll is processed in small batches and hand-inspected before it's scanned — no automated mini-lab line, no batch shortcuts.",
    "Scans are pulled in-house on a Contax-based large-format scanning setup and finished in Negative Lab Pro, so color and contrast are checked by eye on every roll rather than left to a default profile.",
    "Alongside standard C-41 color and black & white, the lab also runs ECN-2 — the process motion picture film actually calls for, remjet and all — a process most consumer labs don't offer in-house.",
  ],
} as const;

export const BEFORE_YOU_SEND: string[] = [
  "Pack your film securely — a padded mailer or a film canister wrapped in bubble wrap works well.",
  "Include a note with your name, email, and what you'd like done (process, develop-only or develop + scan).",
  "Email us first — we'll confirm your order, pricing, and turnaround, and send mailing or drop-off details.",
  "No minimum order. Orders of 5 or more rolls get 10% off developing.",
  "Payment is by Venmo, PayPal, or Cash App, arranged by email once your order is confirmed.",
];

export type FaqEntry = { q: string; a: string };

export const FAQ: FaqEntry[] = [
  {
    q: "How long does developing take?",
    a: "Standard turnaround is 5–7 business days from when we receive your film. A 48-hour rush is available for an extra $10 per order — just ask when you email us.",
  },
  {
    q: "Do you process expired or found film?",
    a: "Yes — we'll run expired, found, or otherwise mystery rolls at the standard price. We can't guarantee results on film that's expired or was stored poorly, but we'll always try.",
  },
  {
    q: "Can I send disposable cameras?",
    a: "Yes, standard drugstore disposables are welcome. We'll extract and process the roll as C-41 unless the camera specifies otherwise.",
  },
  {
    q: "Do you do push or pull processing?",
    a: "Not as a standard offering yet. Email us before sending — we'll let you know if we can accommodate it for your specific roll.",
  },
  {
    q: "How do I pay?",
    a: "Venmo, PayPal, or Cash App. We'll send payment details once your order is confirmed by email — no payment info needed up front.",
  },
  {
    q: "Can I drop off in person?",
    a: "Yes, if you're in the Richmond or Midlothian, Virginia area. Email us to arrange a time and location — there are no public studio hours, so everything is by appointment.",
  },
  {
    q: "What if something happens to my film?",
    a: "We handle every roll carefully, but developing carries some inherent risk from chemistry and equipment that's outside anyone's control, and we can't be responsible for loss or damage in the mail. If your roll is irreplaceable, please insure it when you ship, and mention that in your email so we can take extra care.",
  },
  {
    q: "How are my negatives returned?",
    a: "Cut into strips and sleeved in archival sleeves by default. Tell us in your order email if you'd like them left uncut.",
  },
];
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors. (The file has no consumers yet, so this only catches syntax/type
mistakes in the module itself.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/photoLabData.ts
git commit -m "feat(photolab): add content data module"
```

---

## Task 2: Route plumbing + page shell (masthead, hero, footer)

**Files:**
- Create: `src/pages/PhotoLab.tsx`
- Create: `src/pages/photolab.css`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/RouteTransition.tsx`
- Modify: `src/lib/seoMeta.ts`
- Modify: `src/lib/structuredData.ts`
- Modify: `public/sitemap.xml`

**Interfaces:**
- Consumes: everything produced by Task 1 (`src/lib/photoLabData.ts`); `useRouteTransition()`
  from `src/components/layout/RouteTransition.tsx` (`{ goto: (path: string) => void }`).
- Produces: the `/photolab` route itself, reachable and rendering. Later tasks only ever
  *insert* JSX between the hero `</section>` and the `<footer>` this task creates, and
  append CSS rules to `photolab.css` — they do not change what this task produces.

- [ ] **Step 1: Add the lazy route in `src/App.tsx`**

Add the import alongside the other lazy pages (alphabetical, so between `Gallery` and the
`RouteFallback` function):

```tsx
const PhotoLab = lazy(() => import("@/pages/PhotoLab"));
```

Add the route inside `<Routes>`, directly after the existing `/film` route block:

```tsx
              <Route
                path="/photolab"
                element={(
                  <Suspense fallback={<RouteFallback />}>
                    <PhotoLab />
                  </Suspense>
                )}
              />
```

- [ ] **Step 2: Add `/photolab` to the CRT-collapse transition list**

In `src/components/layout/RouteTransition.tsx`, find `isSecondaryRoom` and add the new
route to the list of prefixes:

```tsx
      const isSecondaryRoom =
        path.startsWith("/lab") ||
        path.startsWith("/gallery") ||
        path.startsWith("/archive") ||
        path.startsWith("/film") ||
        path.startsWith("/feltmoon") ||
        path.startsWith("/photolab");
```

- [ ] **Step 3: Add SEO metadata in `src/lib/seoMeta.ts`**

Add an entry to `SITE_INDEXABLE_ROUTES` (after the `/film` entry):

```ts
  { path: "/photolab", label: `${SITE_OWNER_FULL_NAME} film developing lab` },
```

Add a branch in `resolveSeoMeta`, after the `/film` branch and before the `/feltmoon`
branch:

```ts
  if (normalized === "/photolab") {
    return {
      title: `literaturevendingmachine photolab — Film Developing & Scanning | ${SITE_BRAND}`,
      description:
        "C-41, black & white, and ECN-2 film developing and scanning, hand-processed in Richmond & Midlothian, Virginia. Mail-in orders welcome nationwide.",
      canonicalPath: "/photolab",
      ogType: "website",
      canonicalUrl: canonicalUrl("/photolab"),
    };
  }
```

- [ ] **Step 4: Add the `LocalBusiness` structured-data node in `src/lib/structuredData.ts`**

Add a new function, after `websiteNode()`:

```ts
function photoLabNode() {
  return {
    "@type": "LocalBusiness",
    "@id": `${SITE_OWNER_DOMAIN}photolab#business`,
    name: "literaturevendingmachine photolab",
    description:
      "Film developing and scanning lab offering C-41, black & white, and ECN-2 processing for 35mm and 120 film, based in the Richmond/Midlothian, Virginia area with nationwide mail-in service.",
    url: `${SITE_OWNER_DOMAIN}photolab`,
    email: `mailto:${SITE_OWNER_EMAIL}`,
    priceRange: "$9-$26",
    founder: { "@id": PERSON_ID },
    areaServed: [
      { "@type": "City", name: "Richmond, VA" },
      { "@type": "City", name: "Midlothian, VA" },
      { "@type": "Country", name: "United States" },
    ],
  };
}
```

Change `buildStructuredDataGraph` to build the graph as an array it can conditionally push
onto, instead of a fixed literal. Replace:

```ts
  return {
    "@context": "https://schema.org",
    "@graph": [
      personNode(),
      websiteNode(),
      {
        "@type": "ProfilePage",
        ...
      },
      {
        "@type": "WebPage",
        ...
      },
    ],
  };
```

with:

```ts
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const graph: Record<string, unknown>[] = [
    personNode(),
    websiteNode(),
    {
      "@type": "ProfilePage",
      "@id": `${SITE_OWNER_DOMAIN}#profile`,
      url: SITE_OWNER_DOMAIN,
      name: `${SITE_OWNER_FULL_NAME} — Official Portfolio`,
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: { "@id": PERSON_ID },
      about: { "@id": PERSON_ID },
    },
    {
      "@type": "WebPage",
      "@id": pageId,
      url: pageUrl,
      name: meta.title,
      description: meta.description,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": PERSON_ID },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${SITE_OWNER_DOMAIN}og-cover.png`,
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: crumb.item,
        })),
      },
    },
  ];

  if (normalized === "/photolab") {
    graph.push(photoLabNode());
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
```

(Keep the existing `breadcrumbItems` construction above this unchanged — only the final
`return` changes shape, from a literal array to a `graph` variable that gets one
conditional `.push()`.)

- [ ] **Step 5: Add the sitemap entry in `public/sitemap.xml`**

Add, after the `/film` `<url>` block:

```xml
  <url>
    <loc>https://ajaiupadhyaya.com/photolab</loc>
    <lastmod>2026-09-06</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.85</priority>
  </url>
```

- [ ] **Step 6: Create `src/pages/photolab.css`**

```css
/* ==========================================================================
   /photolab — literaturevendingmachine photolab advertising page
   Uses the desktop's own "Platinum" design tokens (macintosh-desktop.css,
   :root-scoped, loaded globally). No new color tokens are introduced here.
   ========================================================================== */

.photolab-root {
  min-height: 100dvh;
  background: var(--window-body);
  color: var(--text-primary);
  font-family: var(--mac-font-system);
}

.photolab-root a {
  color: var(--accent-select);
}

.photolab-container {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 48px);
}

.photolab-masthead {
  padding: var(--space-6) 0 var(--space-5);
}

.photolab-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  font-family: var(--mac-font-terminal);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.photolab-nav__home {
  color: var(--text-primary);
  text-decoration: none;
}
.photolab-nav__home:hover,
.photolab-nav__home:focus-visible {
  color: var(--accent-select);
}

.photolab-hero {
  padding: var(--space-9) 0 var(--space-8);
  border-bottom: var(--border-light);
}

.photolab-hero__name {
  font-family: var(--mac-font-content);
  font-size: clamp(32px, 6vw, var(--text-4xl));
  line-height: var(--leading-tight);
  margin: 0 0 var(--space-4);
}

.photolab-hero__tagline {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  max-width: 46ch;
  margin: 0 0 var(--space-3);
}

.photolab-hero__area {
  font-family: var(--mac-font-terminal);
  font-size: var(--text-xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin: 0 0 var(--space-6);
}

.photolab-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  background: var(--accent-select);
  color: var(--text-inverse);
  font-family: var(--mac-font-system);
  font-weight: 600;
  text-decoration: none;
  border: var(--border-dark);
  box-shadow: var(--shadow-window);
  transition: transform 0.12s var(--ease-crisp), box-shadow 0.12s var(--ease-crisp);
}
.photolab-cta:hover,
.photolab-cta:focus-visible {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 #888480;
}
.photolab-cta:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #888480;
}

.photolab-footer {
  padding: var(--space-9) 0 var(--space-10);
  text-align: center;
}

.photolab-footer__area {
  margin-top: var(--space-5);
  font-family: var(--mac-font-terminal);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}
```

- [ ] **Step 7: Create `src/pages/PhotoLab.tsx`**

```tsx
import { useCallback } from "react";

import { useRouteTransition } from "@/components/layout/RouteTransition";
import { CONTACT_MAILTO, HERO } from "@/lib/photoLabData";
import "./photolab.css";

export default function PhotoLab() {
  const routeTransition = useRouteTransition();

  const goHome = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      routeTransition.goto("/");
    },
    [routeTransition],
  );

  return (
    <main className="photolab-root">
      <header className="photolab-masthead">
        <div className="photolab-container">
          <nav className="photolab-nav">
            <a href="/" className="photolab-nav__home" onClick={goHome}>
              <span aria-hidden>←</span> ajaiupadhyaya.com
            </a>
            <span>Film developing &amp; scanning</span>
          </nav>
        </div>
      </header>

      <section className="photolab-hero">
        <div className="photolab-container">
          <h1 className="photolab-hero__name">{HERO.name}</h1>
          <p className="photolab-hero__tagline">{HERO.tagline}</p>
          <p className="photolab-hero__area">{HERO.serviceArea}</p>
          <a className="photolab-cta" href={CONTACT_MAILTO}>
            {HERO.ctaLabel}
          </a>
        </div>
      </section>

      <footer className="photolab-footer">
        <div className="photolab-container">
          <a className="photolab-cta" href={CONTACT_MAILTO}>
            {HERO.ctaLabel}
          </a>
          <p className="photolab-footer__area">{HERO.serviceArea}</p>
        </div>
      </footer>
    </main>
  );
}
```

- [ ] **Step 8: Type-check and build**

```bash
npx tsc -b --noEmit
npm run build
```
Expected: both succeed with no errors.

- [ ] **Step 9: Manual browser check**

```bash
npm run dev
```
Open `/photolab`. Expected:
- Page renders with full site chrome (grain/vignette/topo visible, same as `/archive`).
- Cream/paper background, warm dark text, blue CTA button with a hard offset shadow —
  not the dark near-black desktop background.
- Hero shows the lab name, tagline, service-area line, and a working `mailto:` CTA
  (clicking it opens a mail client addressed to the right email with a prefilled subject).
- Clicking "← ajaiupadhyaya.com" returns to `/`.
- Navigating to `/photolab` from `/` (e.g. by typing the URL after loading `/` first, or
  via back/forward) plays the same CRT-collapse animation as navigating to `/film`.

- [ ] **Step 10: Commit**

```bash
git add src/App.tsx src/components/layout/RouteTransition.tsx src/lib/seoMeta.ts \
  src/lib/structuredData.ts public/sitemap.xml src/pages/PhotoLab.tsx src/pages/photolab.css
git commit -m "feat(photolab): wire up /photolab route with hero and footer"
```

---

## Task 3: Services & pricing, and How it works sections

**Files:**
- Modify: `src/pages/PhotoLab.tsx`
- Modify: `src/pages/photolab.css`

**Interfaces:**
- Consumes: `PRICING`, `SCAN_ONLY_PRICING`, `RUSH_FEE`, `BULK_DISCOUNT`,
  `STANDARD_TURNAROUND`, `RUSH_TURNAROUND`, `PROCESS_STEPS` from `photoLabData.ts` (Task 1).

- [ ] **Step 1: Insert the two sections in `PhotoLab.tsx`**

Update the import line to add the new data:

```tsx
import {
  BULK_DISCOUNT,
  CONTACT_MAILTO,
  HERO,
  PRICING,
  PROCESS_STEPS,
  RUSH_FEE,
  RUSH_TURNAROUND,
  SCAN_ONLY_PRICING,
  STANDARD_TURNAROUND,
} from "@/lib/photoLabData";
```

Insert the following between the closing `</section>` of the hero and the `<footer>`:

```tsx
      <section className="photolab-section">
        <div className="photolab-container">
          <h2 className="photolab-section__heading">Services &amp; pricing</h2>
          <table className="photolab-pricing-table">
            <caption>Prices are per roll. Turnaround: {STANDARD_TURNAROUND}.</caption>
            <thead>
              <tr>
                <th scope="col">Process</th>
                <th scope="col">Format</th>
                <th scope="col">Develop only</th>
                <th scope="col">Develop + scan</th>
              </tr>
            </thead>
            <tbody>
              {PRICING.map((row) => (
                <tr key={`${row.process}-${row.format}`}>
                  <td>{row.label}</td>
                  <td>{row.format}</td>
                  <td>${row.developOnly}</td>
                  <td>${row.developAndScan}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="photolab-pricing-note">
            Already have negatives? Scan-only —{" "}
            {SCAN_ONLY_PRICING.map((row, i) => (
              <span key={row.format}>
                {i > 0 ? ", " : ""}
                {row.format}: ${row.price}
              </span>
            ))}
            . Rush ({RUSH_TURNAROUND}): +${RUSH_FEE} per order. {BULK_DISCOUNT.minRolls}+
            rolls in one order: {BULK_DISCOUNT.percentOff}% off developing.
          </p>
        </div>
      </section>

      <section className="photolab-section">
        <div className="photolab-container">
          <h2 className="photolab-section__heading">How it works</h2>
          <div className="photolab-process">
            {PROCESS_STEPS.map((step) => (
              <article className="photolab-process__step" key={step.step}>
                <p className="photolab-process__number">{String(step.step).padStart(2, "0")}</p>
                <h3 className="photolab-process__title">{step.title}</h3>
                <p className="photolab-process__body">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Append to `photolab.css`**

```css
.photolab-section {
  padding: var(--space-8) 0;
  border-bottom: var(--border-light);
}

.photolab-section__heading {
  font-family: var(--mac-font-content);
  font-size: var(--text-2xl);
  margin: 0 0 var(--space-6);
}

.photolab-pricing-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--mac-font-terminal);
  font-size: var(--text-sm);
}

.photolab-pricing-table caption {
  text-align: left;
  font-family: var(--mac-font-system);
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.photolab-pricing-table th,
.photolab-pricing-table td {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: var(--border-light);
}

.photolab-pricing-table th {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: 500;
}

.photolab-pricing-table td:not(:first-child),
.photolab-pricing-table th:not(:first-child) {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.photolab-pricing-note {
  margin-top: var(--space-5);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.photolab-process {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: repeat(4, 1fr);
}
@media (max-width: 1024px) {
  .photolab-process { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .photolab-process { grid-template-columns: 1fr; }
}

.photolab-process__step {
  border: var(--border-light);
  padding: var(--space-5);
  background: var(--chrome-light);
}

.photolab-process__number {
  font-family: var(--mac-font-terminal);
  font-size: var(--text-lg);
  color: var(--accent-select);
  margin: 0 0 var(--space-3);
}

.photolab-process__title {
  font-family: var(--mac-font-content);
  font-size: var(--text-md);
  margin: 0 0 var(--space-2);
}

.photolab-process__body {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}
```

- [ ] **Step 3: Type-check, build, and browser check**

```bash
npx tsc -b --noEmit
npm run build
npm run dev
```
Open `/photolab`. Expected: pricing table renders all 6 rows with correct numbers (spot
check C-41 35mm develop-only = $10, ECN-2 120 develop+scan = $26), the scan-only/rush/bulk
note reads grammatically, and the 4 "how it works" steps render in a 4-column grid on
desktop, 2-column on a resized/narrower window, 1-column on mobile width.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PhotoLab.tsx src/pages/photolab.css
git commit -m "feat(photolab): add services/pricing table and how-it-works section"
```

---

## Task 4: Sample gallery section

**Files:**
- Modify: `src/pages/PhotoLab.tsx`
- Modify: `src/pages/photolab.css`

**Interfaces:**
- Consumes: `buildFilmPhotoLibrary(): FilmPhoto[]` from `@/photography/library`
  (`FilmPhoto = { id, image: ResponsiveImage, file, title, location, blurb }`);
  `ResponsivePicture` from `@/components/ui/ResponsivePicture`
  (`props: { image: ResponsiveImage; alt?: string; sizes?: string }`).

- [ ] **Step 1: Insert the gallery section in `PhotoLab.tsx`**

Add imports:

```tsx
import { useMemo } from "react";
import { ResponsivePicture } from "@/components/ui/ResponsivePicture";
import { buildFilmPhotoLibrary } from "@/photography/library";
```

(Combine with the existing `useCallback` import into one `react` import line:
`import { useCallback, useMemo } from "react";`.)

Add, inside the component body before the `return`:

```tsx
  const galleryPhotos = useMemo(() => buildFilmPhotoLibrary().slice(0, 8), []);
```

Add a `GALLERY_SIZES` constant at module scope, above the component:

```tsx
const GALLERY_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";
```

Insert this section between the "How it works" section and the `<footer>`:

```tsx
      {galleryPhotos.length > 0 && (
        <section className="photolab-section">
          <div className="photolab-container">
            <h2 className="photolab-section__heading">Scans from the lab</h2>
            <div className="photolab-gallery">
              {galleryPhotos.map((photo) => (
                <div className="photolab-gallery__cell" key={photo.id}>
                  <ResponsivePicture image={photo.image} alt="" sizes={GALLERY_SIZES} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
```

- [ ] **Step 2: Append to `photolab.css`**

```css
.photolab-gallery {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}
@media (max-width: 1024px) {
  .photolab-gallery { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .photolab-gallery { grid-template-columns: repeat(2, 1fr); }
}

.photolab-gallery__cell {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border: var(--border-light);
}

.photolab-gallery__cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

- [ ] **Step 3: Type-check, build, and browser check**

```bash
npx tsc -b --noEmit
npm run build
npm run dev
```
Open `/photolab`, then open the browser's network tab and reload. Expected: 8 images
render in a grid (4 columns desktop / 3 tablet / 2 mobile), each cropped to a square, and
the network tab shows `.webp`/`.jpeg` responsive sources loading (not broken images or a
console error about `sources`).

- [ ] **Step 4: Commit**

```bash
git add src/pages/PhotoLab.tsx src/pages/photolab.css
git commit -m "feat(photolab): add sample gallery reusing the film photo catalog"
```

---

## Task 5: About/equipment, before-you-send, and FAQ sections

**Files:**
- Modify: `src/pages/PhotoLab.tsx`
- Modify: `src/pages/photolab.css`

**Interfaces:**
- Consumes: `ABOUT_COPY`, `BEFORE_YOU_SEND`, `FAQ` from `photoLabData.ts` (Task 1).

- [ ] **Step 1: Insert the three sections in `PhotoLab.tsx`**

Add to the import from `@/lib/photoLabData`:

```tsx
import {
  ABOUT_COPY,
  BEFORE_YOU_SEND,
  BULK_DISCOUNT,
  CONTACT_MAILTO,
  FAQ,
  HERO,
  PRICING,
  PROCESS_STEPS,
  RUSH_FEE,
  RUSH_TURNAROUND,
  SCAN_ONLY_PRICING,
  STANDARD_TURNAROUND,
} from "@/lib/photoLabData";
```

Insert between the gallery section and the `<footer>`:

```tsx
      <section className="photolab-section photolab-about">
        <div className="photolab-container">
          <h2 className="photolab-section__heading">{ABOUT_COPY.heading}</h2>
          {ABOUT_COPY.paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="photolab-section">
        <div className="photolab-container">
          <h2 className="photolab-section__heading">Before you send film</h2>
          <ul className="photolab-checklist">
            {BEFORE_YOU_SEND.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="photolab-section">
        <div className="photolab-container">
          <h2 className="photolab-section__heading">FAQ</h2>
          <div className="photolab-faq">
            {FAQ.map((entry) => (
              <div className="photolab-faq__item" key={entry.q}>
                <h3 className="photolab-faq__q">{entry.q}</h3>
                <p className="photolab-faq__a">{entry.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Append to `photolab.css`**

```css
.photolab-about p {
  font-family: var(--mac-font-content);
  font-size: var(--text-md);
  line-height: var(--leading-loose);
  max-width: 68ch;
  margin: 0 0 var(--space-5);
  color: var(--text-primary);
}

.photolab-checklist {
  margin: 0;
  padding-left: 1.2em;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}
.photolab-checklist li {
  margin-bottom: var(--space-3);
}

.photolab-faq__item {
  border-bottom: var(--border-light);
  padding: var(--space-5) 0;
}
.photolab-faq__item:last-child {
  border-bottom: none;
}

.photolab-faq__q {
  font-family: var(--mac-font-content);
  font-size: var(--text-md);
  margin: 0 0 var(--space-2);
}

.photolab-faq__a {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
  max-width: 68ch;
}
```

- [ ] **Step 3: Type-check, build, and browser check**

```bash
npx tsc -b --noEmit
npm run build
npm run dev
```
Open `/photolab`. Expected: About section shows 3 paragraphs, "Before you send film" shows
a 5-item bulleted list, FAQ shows all 8 questions with answers, and the page now reads
top-to-bottom as: masthead → hero → pricing → how it works → gallery → about → before you
send → FAQ → footer, with no leftover Lorem/TODO text anywhere.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PhotoLab.tsx src/pages/photolab.css
git commit -m "feat(photolab): add about, before-you-send, and FAQ sections"
```

---

## Task 6: Site-wide integration and final verification

**Files:**
- Modify: `src/components/desktop/panels/ContentPanels.tsx`
- Modify: `src/lib/siteIdentity.ts`
- Modify: `PUBLISH_CHECKLIST.md`

- [ ] **Step 1: Add an inline link from the desktop's About panel**

In `src/components/desktop/panels/ContentPanels.tsx`, add `useCallback` to the existing
React import:

```tsx
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
```

Add an import for the transition hook:

```tsx
import { useRouteTransition } from "@/components/layout/RouteTransition";
```

Inside `AboutPanel`, add the hook and a click handler right after the existing
`const year = useMemo(...)` line:

```tsx
  const routeTransition = useRouteTransition();
  const goToPhotoLab = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      routeTransition.goto("/photolab");
    },
    [routeTransition],
  );
```

Insert a new array element between the existing `key="r2"` `<hr>` and the `key="foot"`
paragraph:

```tsx
          <section className="mac-about-panel__block" key="photolab">
            <h4 className="mac-type-metadata">Also</h4>
            <p>
              I develop and scan film through{" "}
              <a href="/photolab" onClick={goToPhotoLab}>
                literaturevendingmachine photolab
              </a>
              , open for local drop-off (Richmond/Midlothian, VA) and mail-in orders.
            </p>
          </section>,
```

- [ ] **Step 2: Add SEO phrases in `src/lib/siteIdentity.ts`**

Append to the `SITE_OWNER_SEO_PHRASES` array, before the closing `];`:

```ts
  "literaturevendingmachine photolab",
  "film developing Richmond Virginia",
  "film developing Midlothian Virginia",
  "C-41 developing Richmond Virginia",
  `${SITE_OWNER_FULL_NAME} photolab`,
```

- [ ] **Step 3: Update `PUBLISH_CHECKLIST.md`**

Add `/photolab` to the existing "No broken internal routes" list:

```markdown
  - /photolab
```

Add a new section at the end of the file:

```markdown

## Photolab page — before taking real orders

- Confirm the pricing in `src/lib/photoLabData.ts` against actual costs. The numbers
  shipped were proposed as a reasonable starting point, not owner-verified.
- The FAQ says payment is by Venmo, PayPal, or Cash App but names no handles — decide
  whether to add real handles to the page copy or keep collecting them by email only.
- No street address is published anywhere on `/photolab` by design (it's the owner's
  home). If a PO Box or UPS Store mailbox is set up later, add it to `photoLabData.ts`
  and it can be printed on the page.
```

- [ ] **Step 4: Full verification pass**

```bash
npx tsc -b --noEmit
npm run build
```
Expected: both clean.

```bash
grep -rn "Shadow Ridge" src/ public/ dist/ 2>/dev/null
grep -rn "23112" src/ public/ dist/ 2>/dev/null
```
Expected: **no output** from either command. This is the check that the privacy
constraint actually holds in the shipped bundle, not just in the visible page copy.

```bash
npm run preview
```
In a browser:
- `/photolab` loads directly (not just via in-app navigation) and renders correctly.
- The inline link in the desktop's About panel (double-click the About/profile icon or
  open its window) navigates to `/photolab` and plays the CRT-collapse transition.
- View page source (or inspect the network response) for `/photolab` and confirm the
  JSON-LD script tag includes a `LocalBusiness` entry with `areaServed` and no `address`
  field.
- Resize the window through mobile/tablet/desktop widths — no horizontal scroll, no
  overlapping text, pricing table stays legible (scrolls horizontally inside its own
  container if needed rather than breaking layout).

- [ ] **Step 5: Commit**

```bash
git add src/components/desktop/panels/ContentPanels.tsx src/lib/siteIdentity.ts \
  PUBLISH_CHECKLIST.md
git commit -m "feat(photolab): link from desktop About panel, SEO phrases, publish checklist"
```
