# Handoff: ship the new home page to ajaiupadhyaya.com

You are taking over a finished, tested change to the `esnupi` repo (AJ's personal site) and your job is to get it live. The new plain, brutalist home page goes to `/`, and the existing Mac OS 8 desktop moves to `/desktop`, where the home page's "Old desktop version" button sends people. The code is complete, type-checks, builds, and was tested in a browser against the production build with the real `vercel.json` headers. What remains is applying it, re-verifying on AJ's machine, pushing, confirming the live site, and a few follow-ups that need AJ's input.

Read `CLAUDE.md` first. The patch updates it with a new "Home page (`/`)" section, so read it again after applying.

## What you were given

**`home-brutalist.patch`** is a single `git am`-style commit, "feat(home): plain brutalist front page at /, Mac desktop moves to /desktop", built on `main` at `2b8e37f` ("fix(build): don't gate the build on headers:check"). It was verified to apply cleanly to a fresh clone of `main` at that commit. It touches 14 files:

| File | Change |
|---|---|
| `src/pages/Home.tsx` | New. The home page. |
| `src/pages/home.css` | New. All styles, classes prefixed `ajh-`. The header comment maps each feature to the reference site it came from. |
| `src/components/home/Signature.tsx` | New. Hand-drawn "AJ" SVG signature that draws itself on load. |
| `src/components/home/MonteCarloFigure.tsx` | New. "Fig. 1": 600 GBM price paths printed 1-bit on a canvas; hover reads 5%/95% percentiles, click reseeds. |
| `src/components/home/MosaicPhoto.tsx` | New. Film frame that resolves from a pixel mosaic when scrolled into view and turns from B&W to colour on hover/tap. |
| `src/App.tsx` | `Home` at `/`, `MacintoshDesktop` at `/desktop` (kept eager, see "Do not change"). |
| `src/components/layout/SiteLayout.tsx` | `/` is bare like `/film` (no grain, vignette, topo, JPEG overlay, crosshair). p5 wallpaper only on `/desktop`. |
| `src/components/layout/RouteTransition.tsx` | CRT-collapse transition fires when leaving `/` or `/desktop`. |
| `src/pages/Archive.tsx`, `Gallery.tsx`, `FeltMoon.tsx`, `MdxLab.tsx` | Their "← desktop" links now go to `/desktop` instead of `/`. |
| `CLAUDE.md`, `PUBLISH_CHECKLIST.md` | Updated for the new routes and the home page's rules. |

The commit author is `AJ <ajaiupad@gmail.com>`. If AJ commits under a different identity, run `git commit --amend --reset-author --no-edit` after applying.

## Deployment facts

Vercel project `esnupi` (`prj_oyRXhbgYOkQF6vHmMh3OD238A7ds`), team `team_774YisdHionN6asz1xVGrHcm`, framework Vite, Node 24. It is Git-linked to `github.com/ajaiupadhyaya/esnupi`. A push to `main` builds and publishes production at `www.ajaiupadhyaya.com` (the apex `ajaiupadhyaya.com` 308-redirects to `www`). A push to any other branch builds a preview at `esnupi-git-<branch>-ajaiupadhyayas-projects.vercel.app`.

Deployment Protection (Vercel Authentication) is on for every deployment URL except the custom domains. Preview URLs therefore require a Vercel login, while the custom domains are public.

The current production deployment, which is the rollback target, is `dpl_919L6qT65mJzDWTycgjkziMwGUy9` (`esnupi-6sr4zlim5-ajaiupadhyayas-projects.vercel.app`), built from `2b8e37f`.

Production must always come from `main`. Do not deploy with `vercel --prod` from a working tree or upload a build by hand. The next push to `main` would silently overwrite it, and the repo would stop matching what is live.

## Procedure

### Step 1: Preflight

Confirm the working tree is clean and `main` is current. If `main` has moved past `2b8e37f`, the patch may still apply. If it doesn't, use `git am -3` and resolve conflicts, keeping both sides' intent.

```bash
git status --short            # must be empty
git checkout main && git pull --ff-only
git log -1 --format='%h %s'   # expect 2b8e37f, or a descendant of it
```

### Step 2: Apply on a branch

Use a branch so you get a Vercel preview before production. Don't commit the `.patch` file itself.

```bash
git checkout -b home-brutalist
git am path/to/home-brutalist.patch      # or: git am -3 ... if main moved
git log -1 --stat
```

### Step 3: Build and check locally

`npm run build` runs `tsc -b && vite build`. There is no test runner or linter, so the type-check inside the build is the only static check. `preview:headers` serves `dist/` the way Vercel will, with the same SPA rewrite and the same `vercel.json` headers including the CSP, on port 4174. Test there rather than in `npm run dev`, because CSP problems only show up with real headers.

```bash
npm ci
npm run build
npm run preview:headers    # → http://localhost:4174
```

In a browser at `http://localhost:4174`, confirm everything in this table. A headless Playwright pass is fine if you have it; AJ should still eyeball it.

| Check | How | Expected |
|---|---|---|
| Home renders bare | Load `/` | Blue left panel, white sheet, no grain/vignette overlays, normal cursor (not crosshair). |
| Signature | Load `/`, then hover the big "AJ" | Strokes draw in over about 2s on load; hovering "AJ" redraws them. |
| Fig. 1 | Watch the plate, hover it, click it | Paths accumulate over about 2s. Hover shows a blue crosshair and the caption's third line becomes `day N: 5% x, 95% y`. Click pixelates the plate and runs a new seed with new `seed …, vol …%`. |
| Filter | Click WORKS, then EXPERIMENTS, then ALL | Non-matching rows turn grey (not hidden). On phone width the filter sits above the work list. |
| Contact | Click "+ Contact", and the "Contact" nav item | Drawer opens, "+" rotates to "×", nav dot fills ●. Email/LinkedIn/GitHub/Substack links work. |
| Film section | Scroll down | Whole screen goes blue. Six frames resolve from coarse mosaic blocks, print B&W, and go colour on hover (tap on touch). Captions show manifest title/location/blurb. |
| Old desktop button | Click "Old desktop version" (top right, always visible) | "starting up…" boot transition, then the Mac desktop at `/desktop` with p5 wallpaper. |
| Desktop rooms | From `/desktop`, open Archive/Gallery/Felt Moon, then use their back links | Return to `/desktop`, not `/`. |
| Other routes | Visit `/archive`, `/film`, `/gallery`, `/feltmoon`, `/photolab` directly | All render. `/film`'s "← ajaiupadhyaya.com" goes to the new home. |
| Reduced motion | Enable OS "reduce motion" and reload `/` | Signature shows fully drawn, Fig. 1 appears complete, no mosaic, no transitions. |
| Console | DevTools on `/` and `/desktop` | No `ErrorBoundary` or page errors. |

### Step 4: Push the branch and check the preview

```bash
git push -u origin home-brutalist
```

Wait for the Vercel preview to show READY in the dashboard, or with `vercel ls esnupi` if the CLI is linked. Open `https://esnupi-git-home-brutalist-ajaiupadhyayas-projects.vercel.app` while logged in to Vercel and repeat the key checks from the table: home, Fig. 1, film section, and the desktop button. If AJ wants to show someone who isn't logged in, generate a share link from the deployment's Share button. Don't turn off Deployment Protection.

### Step 5: Ship to production (get AJ's go-ahead first)

Ask AJ to confirm before this step, because it changes the public site. Then fast-forward `main` so history stays linear and the production build is exactly the commit you previewed:

```bash
git checkout main
git merge --ff-only home-brutalist
git push origin main
```

### Step 6: Verify production

When the production deployment is READY, check `https://www.ajaiupadhyaya.com/` and `https://www.ajaiupadhyaya.com/desktop` in a normal, logged-out browser window, plus once on a phone. Run the home, film, and desktop-button checks from Step 3 again. A quick header sanity check:

```bash
curl -sI https://www.ajaiupadhyaya.com/ | grep -i -E "^HTTP|content-security-policy"
curl -s -o /dev/null -w "%{http_code}\n" https://www.ajaiupadhyaya.com/desktop   # 200 via SPA rewrite
```

### Rollback, if anything is wrong in production

Restore the previous deployment immediately, either from the dashboard (Deployments → `dpl_919L6qT65mJzDWTycgjkziMwGUy9` → Instant Rollback) or with:

```bash
vercel rollback dpl_919L6qT65mJzDWTycgjkziMwGUy9
```

Then make git match what's live, so the next push doesn't redeploy the broken version:

```bash
git revert --no-edit HEAD && git push origin main
```

After an Instant Rollback, Vercel stops auto-assigning new production deployments to the domains until you undo the rollback in the dashboard. Undo it once the revert (or a fix) is on `main` and READY.

## Do not change these without a reason

**`MacintoshDesktop` stays eager.** It was briefly made lazy to shrink the home page's bundle, and that broke `/desktop` on any network that blocks Google Fonts. `macintosh-desktop.css` starts with `@import url(https://fonts.googleapis.com/...)`; as a lazy chunk, Vite preloads that CSS, the failed `@import` fires the link's `error` event, Vite's preload helper throws, and the route lands in `ErrorBoundary`. If you want it lazy later, first move that `@import` into `index.html` or self-host the fonts, then test with fonts.googleapis.com blocked.

**`MosaicPhoto` uses the destination-rect form of `drawImage`** (`drawImage(img, dx, dy, dw, dh)`). The images come from `<picture>`/`srcset`, so `img.naturalWidth` is density-corrected and doesn't match the bitmap's pixel size. The earlier source-rect crop (`drawImage(img, sx, sy, sw, sh, …)`) zoomed into the wrong corner of every photo.

**The home page is plain on purpose.** It uses system Helvetica/Arial and system mono, no web fonts, no gradients, shadows, rounded cards, or overlay grain. Its texture comes from the 1-bit Monte Carlo plate, the mosaic resolve, the film scans, and the signature. Its look is built from five reference sites AJ chose (brutalistwebsites.com/raw, arrc.site, stu-b-io.com, adamclarkecolour.com, fromouterspace.it). Don't restyle it toward a template look, add a font, or "clean up" the mono captions. Every animation has a `prefers-reduced-motion` path; keep that.

**Home content is data-driven.** The work index renders `PROJECTS` from `src/lib/projectsData.ts`. New projects such as OhCamel or the GPU compute index belong there, and then show up on both `/` and `/archive`. The six film frames are the filenames in `HOME_FRAMES` at the top of `Home.tsx`, captioned from `src/photography/manifest.ts`.

## Follow-ups that need AJ's input

Ask about these after production is verified, not before. Each is small and independent.

**The tab title and search description are stale.** `index.html` (title, `description`, `og:*`, `twitter:*`, JSON-LD), `src/lib/siteIdentity.ts` (`SITE_OWNER_SEO_PHRASES`), and the "About" copy in `src/components/desktop/panels/ContentPanels.tsx` still describe AJ as a fourth-year UVA CS and Economics student. He is now Finance at VCU, class of 2027. Propose replacement wording and get his approval before editing; `seoMeta.ts` and `structuredData.ts` read from `siteIdentity.ts`.

**The headline says "2027 Financial Engineering Graduate,"** which is AJ's own copy, but his degree is in Finance. Ask whether that's the official name of his degree or concentration. If not, quant recruiters may notice the mismatch.

**Frame 01's caption is personal.** It comes from the manifest entry for `newjpmg.jpg` and reads "I am in love with this building, I will work at JPMG after masters." It now sits on the front page that recruiters from every firm will see. Ask whether to keep it, edit the manifest blurb (which also changes `/film` and the desktop Photos window), or swap the frame in `HOME_FRAMES`.

**Two nav targets were best guesses.** "Data" links to `CASE_STUDY_URL` (the case-study dashboard), and "BASIS" links to `SITE_OWNER_SUBSTACK`. Confirm both with AJ.

**`/archive`'s "Back to desktop" button** now goes to `/desktop` even when someone arrived from the home page's "Work" link. Ask whether it should say "Back" and return to wherever the visitor came from.

**Pre-existing items in `PUBLISH_CHECKLIST.md`**, notably the Unsplash placeholder images and copy in `src/lib/projectsData.ts`, are still open. The new home page shows those projects' titles and blurbs, so placeholder copy there is now on the front page.
