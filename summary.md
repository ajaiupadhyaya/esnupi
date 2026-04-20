# esnupi — in-depth site summary

This document describes **what the site is**, **how it is structured**, and **every implemented feature, visual layer, and concept** found in the codebase as of the current tree.

---

## 1. Identity and purpose

**esnupi** is a **creative portfolio playground**: a single-page application (Vite + React + TypeScript) that presents the author’s work through a **late-1990s Macintosh desktop metaphor** (System 7–8 / “Platinum” chrome). The aesthetic combines **retro Mac UI**, **hand-made felt / stop-motion style icons**, and **real-time generative graphics** (Hydra) as a full-screen wallpaper.

It is **not** a minimal landing page: the home route is a **full interactive desktop** with draggable windows, a menu bar, a dock, optional Web Audio UI sounds, camera-based “museum” features, and embedded utilities (music player, iframe browser).

---

## 2. Routes and information architecture

| Route | What renders |
|-------|----------------|
| **`/`** | `MacintoshDesktop` — the full retro Mac shell (see §4–§6). |
| **`/lab`** | `MdxLab` — MDX article page (`hello.mdx` plus “Back home” link). |

`App.tsx` wraps routes in an **error boundary**, **GSAP route transition** (§12), and **`SiteLayout`** (Hydra + outlet).

---

## 3. Global visual stack (behind the UI)

Layers are conceptually ordered **back to front**:

1. **`HydraBackground`** (`SiteLayout`)  
   - Full-viewport **WebGL canvas** (`z-index: 0`, `pointer-events: none`).  
   - Uses **hydra-synth** with `makeGlobal: true` so generated code can call `osc`, `noise`, etc.  
   - **Sketch selection**: On each **full page load**, a new **32-bit seed** is computed (`getVisitSeed()` — mixes `performance.timeOrigin`, time, and `crypto.getRandomValues` when available).  
   - **`buildRandomHydraSketch(seed)`** picks one of several **template generators** (osc+kaleid+colorama, noise+color, shape+repeat+scroll, voronoi, gradient, modulated osc pairs, noise+modulateScale+thresh, osc+noise+pixelate, shape+voronoi modulate+kaleid, osc scroll+diff+colorama). Optional **speed/bpm** preamble lines are sometimes prepended.  
   - **Resize**: Canvas internal size tracks `window` with DPR capped at 2; `hydra.setResolution` on resize.  
   - **Failure path**: If WebGL/Hydra throws, a **CSS fallback** replaces the canvas: animated **radial gradient** with slow hue/brightness shift (`.hydra-fallback`).

2. **Route-specific dimming** (`SiteLayout`)  
   - On **`/`** there is **no** gradient scrim — Hydra stays **fully vivid** behind the transparent desktop.  
   - On **`/lab`**, a **fixed gradient overlay** (`from-background/30` → `to-background/90`) improves **text contrast** for prose.

3. **`P5RetroDesktop`** (lazy-loaded on home only)  
   - **p5.js** full-screen layer between Hydra and the Mac chrome (`mac-p5-overlay`, `pointer-events: none`).  
   - Renders **chunky noise grain** (small offscreen graphics buffer scaled up) for a **CRT / old LCD** feel.  
   - **Respects `prefers-reduced-motion`**: if reduced motion is set, the sketch **does not run** (no grain animation).

4. **CRT / dither overlays** (`mac-crt-overlay`, `mac-desktop-dither` in `MacintoshDesktop`)  
   - Additional **decorative screen effects** on top of the wallpaper stack (exact look in `macintosh-desktop.css`).

5. **Foreground UI** (`mac-desktop-surface`, `z-index` stack)  
   - Desktop icons, windows, and dock sit above the overlays.

---

## 4. Macintosh shell — structure and chrome

### 4.1 Menu bar

- **Fixed top bar** (~28px), **Platinum-style** gradient, **VT323** pixel font for menu labels, classic **groove** line under the bar.  
- **Apple menu** (Unicode Apple glyph): toggles a **dropdown** with at least **“About This Site…”** → opens the **About** window. Outside click closes it.  
- **Stub menus**: **File, Edit, View, Special, Help** — buttons that **only play** a short menu-click sound (`playMacMenuClick`) (no real menu content).  
- **Clock**: Updates every second via **Luxon** (`DateTime.TIME_SIMPLE`).

### 4.2 Boot screen

- On first paint, a **`mac-boot`** overlay shows **“Welcome”**, a **progress bar animation**, and **“Click to skip”**.  
- Auto-dismisses after **~1150ms**, or user can **click / Enter / Space** to skip immediately.

### 4.3 Desktop surface

- **`mac-desktop-root`** background is **transparent** so Hydra shows through.  
- **Custom cursor**: classic **black arrow with white outline** (data-URI SVG) for the root; links/buttons use the same shape as `pointer`.  
- **Font stack** for body text: Charcoal / Helvetica Neue / system sans at **14px** (menu bar uses VT323).

### 4.4 Desktop icons (“felt scatter”)

Icons are defined in **`desktopIconConfig.ts`**. Each icon has:

- A **felt illustration** (PNG/WebP under `images/`).  
- An **organic “film blob” frame** (`FELT_FRAME` — same asset for blob1/blob2 today) behind the icon art.  
- **Percent-based** `left` / `top` placement on the desktop.  
- A **target window** (`WindowId`) — **multiple icons can open the same window** (e.g. Email + Phone → Contact).

**Current icons and mappings:**

| Label | Opens |
|-------|--------|
| Email | Contact |
| Phone | Contact |
| Home | About |
| Projects | Projects |
| MDX Lab | Lab |
| Moon | About |
| Heart 1 | Projects |
| Heart 2 | About |
| Heart 3 | Contact |
| Heart 4 | Lab |
| Photobooth | Photobooth |
| Photobook | Photobook |

**Interaction:**

- **Single click**: selects icon (Mac-style **selection highlight**: blue tint, dotted outline). Plays **`playMacIconSelect`**.  
- **Double-click** (or **Enter/Space** when focused): opens the mapped window; plays **`playMacIconOpen`**.  
- **Photobooth / Photobook** icons: **single click** opens centered on the icon (special case).

### 4.5 Dock

- Bottom **dock** with **nine app buttons**: Home, Projects, Contact, Lab, Terminal, Photobooth, Photobook, Music, Browser.  
- **Placeholder icons** for most apps (inline SVG “disk” placeholder); **Music** and **Browser** have **custom SVG** dock art.  
- Clicking opens the app; window is positioned so its **center** aligns with the dock button.  
- Open apps get a **visual “open” state** (`mac-dock__item--open`).

### 4.6 Windowing system (`DesktopWindow`)

- **Platinum windows**: title bar gradient differs for **active vs inactive** (`mac-window` / `mac-window--inactive`).  
- **Close box** on the left; plays **`playMacWindowClose`**.  
- **Drag**: title bar **pointer drag** with **viewport clamping** — windows cannot go under the menu bar or into the **dock reserve** (~150px from bottom).  
- **Z-order**: opening or focusing brings window forward; z-index base **42+** so windows sit **above dock (~35)** but **below menu (70)**.  
- **Stacking**: opening from desktop (not dock) uses a **cascade offset** (32px steps) from screen center.

---

## 5. Window contents (each “app”)

### 5.1 About, Projects, Contact, Lab (scaffold panels)

Implemented as **`WindowScaffold`**:

- **Intro paragraph** + **multiple sections** (heading + bullet lists) — copy is **authoring boilerplate** in `WINDOW_CONTENT` inside `MacintoshDesktop.tsx` (intended to be replaced when shipping).  
- **Optional links** (Contact: mailto, GitHub, `/lab`; Lab: “Go to Lab”). Internal paths use **React Router `Link`**.  
- **“Working notes”** area: a **textarea** for scratch copy (local only, not persisted).

**Terminal window content in scaffold** (`WINDOW_CONTENT.terminal`) describes the toy shell; the **actual terminal UI** is **`MacTerminalApp`** (see §5.5).

### 5.2 Photobooth

- Requests **`getUserMedia`** (video, user-facing, modest resolution ~320×240, ~12–15 fps).  
- Live preview in a **framed “screen”** with **“Camera is starting…”** overlay.  
- **“Take picture (3s)”** runs a **3-second countdown**, then captures a frame.  
- **Post-processing**: grayscale **posterization** (quantized luminance), horizontal **scanline** darkening, and **random speckle** noise on a secondary canvas → exported as **JPEG data URL** (quality 0.6).  
- **Last capture** shown as thumbnail below controls.  
- **`onCapture`** sends the data URL to **`addSharedPhoto`** (Supabase) when configured (§7).  
- **“Open photobook”** opens the Photobook window.

### 5.3 Photobook (“Museum Photobook”)

- Lists **shared photos** from Supabase table **`museum_photos`** (`id`, `image_url`, `created_at`), **newest first**.  
- **Loading** and **error** states; if Supabase env is missing, shows **configuration instructions** (supports both `VITE_*` and `NEXT_PUBLIC_*` names).  
- **Realtime**: subscribes to **Postgres changes** on `museum_photos` and **refetches** on any insert/update/delete.  
- Grid of **figures** with image + **formatted timestamp** (Luxon `DATETIME_MED`).

**Note:** Inserts store **`image_url` as text** — the photobooth passes a **data URL**, so rows can be large unless you later switch to object storage URLs.

### 5.4 Music Player

- Builds a playlist from **`import.meta.glob("/src/music/*.{mp3,wav,ogg,m4a,flac,aac}")`** — files must live under **`src/music/`**; **dev server / build** must be restarted to pick up new files.  
- **Classic deck UI**: now playing, **seek bar**, **prev / play/pause / next**, **volume**, **numbered playlist** (click track to play).  
- **Auto-advance** on track end.

### 5.5 Web Browser

- **Iframe-based** “old school browser” with **toolbar**: Back, Forward, Reload (cache-bust via query param), Home.  
- **Address bar** with **normalization**: bare domains get `https://`; non-URLs go to **DuckDuckGo search**.  
- **Preset shortcut buttons**: example.com, Wikipedia Mac OS 8, archive.org, MDN.  
- **Sandboxed iframe** (`sandbox` allows forms, modals, pointer-lock, popups, presentation, same-origin, scripts).  
- **Status line**: loading vs done + **hostname** of current URL.

### 5.6 Terminal (`MacTerminalApp`)

- **xterm.js** + **FitAddon** in a **`mac-terminal-host`** container; **ResizeObserver** keeps terminal fitted.  
- **In-memory virtual filesystem** (cloned from a tree rooted at `/` with `home/guest`, `README.txt`, `projects`, `tmp`).  
- **Commands**: `help`, `pwd`, `ls`, `cd`, `cat`, `mkdir`, `touch`, `rm`, `rmdir`, `echo`, `clear`, `date`, `whoami`, `uname`.  
- **Prompt**: `guest@esnupi:${cwd}$`.  
- **History**: up/down arrows recall previous commands.  
- **Theme**: dark background, light text — distinct from any separate `PlaygroundTerminal` demo in `components/demos/`.

---

## 6. Audio (Web Audio API)

**`retroMacSounds.ts`** — no audio files; **oscillators** only:

| Function | Role |
|----------|------|
| `playMacIconSelect` | Soft tick when selecting an icon |
| `playMacIconOpen` | Two-stage “open” blip when launching |
| `playMacWindowClose` | Descending tone on close box |
| `playMacMenuClick` | Short click for menu bar items |

Uses a **shared `AudioContext`**; resumes on first use (browser autoplay policies).

---

## 7. Data layer — Supabase photobook

- **`supabaseClient.ts`**: Creates Supabase client when **URL + anon/publishable key** are present; **`auth.persistSession: false`**.  
- **`photobookStore.ts`**: `loadSharedPhotos`, `addSharedPhoto`, realtime **`subscribeToSharedPhotos` / `unsubscribeSharedPhotos`**.  
- **`supabase/museum_photos.sql`**: Table `museum_photos` with **RLS** allowing **public read** and **public insert** for `anon` (suitable for a visitor-contributed museum wall — understand the **abuse tradeoff** before production).

---

## 8. Lab route — MDX

- **`MdxLab.tsx`** imports **`hello.mdx`** and wraps it in **Tailwind Typography** (`prose prose-invert prose-sm`).  
- Sample content mentions Hydra, Lenis, GSAP route behavior.  
- **Vite**: `@mdx-js/rollup` processes MDX; React plugin **excludes** `.mdx` from Babel (per `vite.config.ts` comment).  
- **`global` → `globalThis`** shim for hydra-synth compatibility in the browser.

---

## 9. Motion, scroll, and route transitions

- **`LenisGsapProvider`**: **Lenis** smooth scrolling; **`lenis.on("scroll", ScrollTrigger.update)`**; GSAP ticker drives Lenis `raf`; **ScrollTrigger** registered globally for potential scroll-driven animations.  
- **`GsapRouteTransition`**: On **`pathname`** change, **GSAP** animates the routed subtree **`y: 8 → 0`** over **0.4s** (`power2.out`). Comment explains **opacity** is avoided so the app cannot get stuck invisible.

---

## 10. Resilience

- **`ErrorBoundary`**: Catches render errors; shows message, error text, **“Try again”** to reset state.

---

## 11. Environment variables (optional features)

| Variable | Purpose |
|----------|---------|
| `VITE_SPLINE_URL` | Embeds a **Spline** scene in `SplineEmbed` demo component |
| `VITE_GITHUB_USER` | GitHub REST username for `GitHubRepos` demo (defaults to `octocat`) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Shared photobook |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Alternate names supported by `supabaseClient` |

---

## 12. Components in `src/components/demos/` (library / not mounted)

These exist as **reusable demos** but are **not imported** by current routes (`grep` shows no app usage). They document **stack capabilities** you can drop into MDX or future pages:

| Component | What it demonstrates |
|-----------|-------------------------|
| **`GsapHero`** | Animated hero lines + “felt” underline (GSAP stagger/scale) |
| **`FeltScene`** | React Three Fiber **rotating box** + plane + **OrbitControls** |
| **`SplineEmbed`** | **@splinetool/react-spline** when `VITE_SPLINE_URL` is set |
| **`GitHubRepos`** | Fetches **last 5 repos** for a GitHub user via REST |
| **`ActivityChart`** | **Chart.js** line chart (demo “playground activity”) |
| **`PopperDemo`** | **@popperjs/core** tooltip positioning (explicit Popper vs Radix) |
| **`PlaygroundTerminal`** | Minimal **xterm.js** demo (`help` / `echo` / `clear` / `date`) — separate from **`MacTerminalApp`** |
| **`AnimeBadge`** | **Anime.js** pulsing badge |

---

## 13. Design tokens (non-Mac routes)

- **`index.css`**: Dark **HSL CSS variables** (background, foreground, primary accent ~orange, etc.) for **Tailwind** `bg-background`, `text-primary`, etc.  
- **`tailwind.config.cjs`**: `darkMode: class`, **typography** + **tailwindcss-animate** plugins, content includes `**/*.mdx`.

---

## 14. Summary sentence

**esnupi** is a **portfolio site** whose **homepage is a playable Mac OS 8–style desktop** over a **random Hydra live shader**, **p5 grain**, and **CRT-style overlays**, with **draggable windows** for **placeholder content**, **terminal**, **photobooth → Supabase museum**, **local music**, and **iframe browser**; **`/lab`** is an **MDX** writing surface; the repo also ships **optional demo widgets** and a **motion stack** (Lenis + GSAP + ScrollTrigger) ready for richer pages.
