# esnupi — project summary

This document describes **what the project is**, **who it is for**, **how it feels to use**, and **how the implementation is structured** as of the current codebase.

---

## 1. What this project is

**esnupi** is a **creative portfolio playground**: a **Vite + React + TypeScript** single-page app that showcases work through a **late-1990s Macintosh desktop metaphor** (System 7–8 “Platinum” chrome). The experience is intentionally **dense and playful**—not a minimal landing page.

At a high level:

- **Home (`/`)** is a **full-screen faux Mac OS 8–style shell**: menu bar, boot sequence, draggable desktop icons, dock, layered CRT-style effects, and **multiple “apps”** inside draggable windows.
- **Lab (`/lab`)** is a separate **MDX-powered reading surface** with typography tuned for long prose and a “printed paper” presentation.
- Behind almost everything sits a **live generative wallpaper** built with **hydra-synth** (WebGL), plus optional **p5.js film grain**, so the site always feels **alive** even when the user is only moving the mouse.

The repo name and README position it as a **portfolio + technical playground**: a place to demonstrate motion (GSAP, Lenis), shaders (Hydra), embedded tools (terminal, browser, music), and optional **Supabase-backed shared media** (museum photobook).

---

## 2. Target audience and design intent

**Intended audience:** visitors who enjoy **retro computing aesthetics**, **interactive portfolios**, and **small software toys** in the browser—designers, creative developers, and curious general users.

**Design goals:**

- **Nostalgia without kitsch:** Platinum gradients, Chicago-adjacent typography choices (e.g. VT323 in the menu bar), Happy/Sad Mac boot iconography, and believable window chrome.
- **Tactile feedback:** synthesized UI sounds, hover/selection states, draggable icons and windows, balloon help tooltips.
- **Depth over flatness:** stacked visual layers (Hydra → scrims/overlays → p5 grain → CRT/dither → UI).
- **Honest affordances:** narrow viewports get a **non-blocking mobile alert** explaining the desktop-first UX; reduced-motion users skip animated grain (`P5RetroDesktop`).

---

## 3. User experience — first visit to the home route

### 3.1 Boot sequence

On load, the user sees **`BootSequence`** instead of the desktop:

- **BIOS-style text** scrolls in line by line (fake POST lines: CPU, SCSI, ROM checksum, volume mount).
- **Memory test** counts up toward **128MB** with a “640K” joke at the start.
- With **~15% probability**, a **Sad Mac** phase appears: random **error code**, **sad chord** (`playSadMacChord`), then recovery into the normal **Happy Mac** path.
- The **progress bar** advances, pauses at **~97%** with “Checking disk integrity…”, then completes; on the happy path a **synthesized boot chime** (`playMacBootChime`) plays before transition.
- **Click**, **Enter**, **Space**, or **Escape** skips the remainder and jumps to desktop.
- When the boot finishes, **`playMacDiskInsert`** runs (mechanical click motif).

**User feeling:** booting a beloved old machine—complete with the slight anxiety of a Sad Mac before it resolves.

### 3.2 The wallpaper stack (what you see behind the UI)

Once the desktop appears, the background is **not a static image**:

1. **`HydraBackground`** — full-viewport WebGL; each **full page load** picks a new **seeded random Hydra program** (`buildRandomHydraSketch`) from several template families (osc/kaleid, noise, voronoi, etc.). Resolution tracks the window with DPR capped at 2. If WebGL fails, a **CSS animated gradient** replaces it.
2. **`SiteLayout`** — on `/` there is **no** dimming scrim so Hydra stays vivid; on `/lab` a **gradient overlay** improves text contrast.
3. **`P5RetroDesktop`** (lazy, home only) — chunky **scaled noise** for CRT/LCD grain; **disabled when `prefers-reduced-motion`**.
4. **CSS overlays** on the desktop — `mac-crt-overlay`, `mac-desktop-dither`, `mac-vignette-scanlines`.
5. **Ambient layers** — `DustMotes`, `ScreenFlicker`, `CursorTrails` add subtle motion and “physical screen” presence.

**When the tab is hidden**, the Hydra canvas gets a **slow grayscale/dim filter** (visibility API) to reduce distraction and save perceptual energy.

### 3.3 Menu bar — real actions vs. playful stubs

The **Platinum-style** top bar shows the **Apple menu**, standard names (**File, Edit, View, Special, Window, Help**), and a **live clock** (Luxon). Between **2:00 and 4:00 AM**, the clock area briefly shows **“you should sleep”** (`sleepNag`).

**Fully wired menus:**

- **Apple:** About This Mac, Jukebox (music), Home/About; decorative entries (Calculator, Key Caps, Chooser) **error-beep** (`playMacErrorBeep`).
- **File:** New Note (sticky), Open… (routes to Home/About for now), **Get Info** (opens metadata window for the **frontmost** window), Print… (beep).
- **Edit:** Copy / Paste / Select All via `document.execCommand`; Undo/Redo (beep).
- **View:** toggles **Balloon Help** (desktop icon tooltips via `title`), **FPS overlay** (`FpsCounter`); view modes (beep).
- **Special:** Empty Trash (plays **trash empty** sound), **Minefield** (Minesweeper), **Sound** on/off (persists mute via `setMacSoundsMuted`), **Restart** and **Shut Down** (see §3.7).
- **Window:** lists **all open windows** with a checkmark on the frontmost; choosing one **brings it forward**.
- **Help:** Balloon Help toggle; esnupi Help… (beep).

**Apple logo easter egg:** **seven clicks** on the Apple menu button opens **About This Mac** (`aboutMac` window).

### 3.4 Desktop icons — felt art, dragging, and sound

Icons are defined in `desktopIconConfig.ts`: **felt illustrations** on **organic “film blob” frames**, placed by **percentage** positions. **Multiple icons can open the same app** (e.g. Email + Phone → Contact).

**Interaction model:**

- **Single click** selects; plays `playMacIconSelect`; shows Mac-style highlight.
- **Double-click** or **Enter/Space** opens the app; plays `playMacIconOpen`. The window opens **centered on the icon** (spawn anchor) for a “zoom from icon” feel.
- **Photobooth / Photobook** icons: **single click** opens (centered on icon), matching quick-launch expectations.
- **Drag** with pointer: icons can be repositioned; **positions persist** in **`localStorage`** (`esnupi.iconPositions.v2`).
- **Staggered “fall in”** animation on load (`arrived` delay per icon index).

**Balloon Help:** when enabled, each icon gets a short **poetic tooltip** (e.g. terminal suggests `matrix`, `neofetch`, `fortune`).

**Easter egg — “corrupted” Heart 4:** opening **Heart 4 → Lab** has a **25%** chance to run **`triggerCorruption`**: glitch sound burst (`playGlitchBurst`), **corrupted** visual class on the desktop, and the **secret** window opens mid-sequence.

### 3.5 Dock

Nine dock buttons mirror the main apps: Home, Projects, Contact, Lab, Terminal, Photobooth, Photobook, Music, Browser. **Music** and **Browser** use custom SVG dock art; others use a shared **placeholder floppy** icon.

Clicking plays the open sound and positions the window so its **center aligns with the dock button**. Open apps show **`mac-dock__item--open`**.

### 3.6 Windows — dragging, z-order, minimize, sounds

**`DesktopWindow`** implements:

- **Platinum** title bar; **active vs inactive** styling.
- **Close box** — `playMacWindowClose`.
- **Minimize / restore** — `playMacMinimize` / `playMacMaximize`; minimized windows collapse visually.
- **Drag** from title bar with **viewport clamping** (menu bar + dock reserve).
- **Spawn animation** from `spawnAnchor` when opened from icons/dock.
- **Z-order:** focusing raises the window; base z-index keeps windows **above the dock** but **below the menu bar**.

Opening many windows triggers a **beach ball** class on the **fifth** open for ~3s (playful “system busy” nod).

### 3.7 Shutdown and restart

**Special → Shut Down** shows **`ShutdownScreen`** in **shutdown** mode: CRT-collapse animation, descending chirp, then **“It is now safe to turn off your computer”**; **click anywhere** dismisses.

**Special → Restart** runs **restart** mode: collapse → “Restarting…” → parent clears windows and **replays `BootSequence`** (new `bootKey`), simulating a full reboot.

### 3.8 Notifications

**`MacNotifications`** schedules **infrequent** menu-bar-style toasts with **random haikus** (“— the machine —”), first nudge after ~18s, then random **40–110s** intervals. Each toast plays **`playMacNotification`** and auto-dismisses after several seconds.

### 3.9 Mobile and accessibility notes

**`MobileAlert`:** viewports **under 760px** show a modal suggesting **desktop**; **View anyway** dismisses without breaking the page.

**Keyboard:** icons support **Enter/Space** to open; boot can be skipped with keyboard.

**Sound:** global mute from **Special → Sound** integrates with **Web Audio** helpers (`setMacSoundsMuted`).

---

## 4. Applications and window contents (feature-by-feature)

### 4.1 Scaffold windows — About, Projects, Contact, Lab

Implemented via **`WindowScaffold`** inside `MacintoshDesktop.tsx`:

- Intro paragraph + **card sections** (bullets) — copy is **authoring scaffolding** meant to be replaced for a real portfolio.
- Optional **links** (e.g. mailto, GitHub, `/lab`).
- **“Working notes”** — local-only **textarea** per window (not persisted).

These mirror **marketing sections** you would expect on a portfolio, but framed as **Mac apps**.

### 4.2 About This Mac (`AboutThisMacPanel`)

A **System 7-style** about box with fake **hardware list** rewritten as **emotional specs** (memory, backup, voice), plus a short **manifesto** footer. Open from **Apple menu** or the **7-click** easter egg.

### 4.3 Secret panel (`SecretPanel`)

Unlocked by the **Konami code** (↑↑↓↓←→←→BA): **`useKonamiCode`** triggers **`playKonamiFanfare`** and opens the **secret** window. Content is a **typewriter-revealed** personal statement (pre block).

Can also open via the **Heart 4 corruption** easter egg.

### 4.4 Sticky note (`StickyNotePanel`)

Yellow **Stickies-style** note with a **textarea**; **not persisted** — scratch space only.

### 4.5 Minesweeper (`MinesweeperPanel`)

Full **Minefield** implementation with **easy / medium / hard** grid presets, **flood fill** reveal, flags, **adjacent number colors**, win/lose behavior, and UI sounds (`playMacIconSelect`, `playMacErrorBeep`, chirps). Open from **Special → Minefield…**.

### 4.6 Get Info (`GetInfoPanel`)

**File → Get Info** opens a small inspector for the **currently frontmost** window: kind, fake path, dimensions, whimsical **Created/Modified** copy.

### 4.7 Terminal (`MacTerminalApp`)

**xterm.js** + **FitAddon**; **ResizeObserver** keeps layout correct. **Dark green-on-black** “retroterm” theme; **`playMacTypeTick`** on input.

**Virtual filesystem** under `/` with `home/guest`, `projects`, `tmp`, and a hidden **`/secrets`** tree with **flavor text files**.

**Commands include:** `help`, `pwd`, `ls` (with `-a`/`-l` style listing), `cd`, `cat`, `mkdir`, `touch`, `rm`, `rmdir`, `echo`, `clear`, `date`, `whoami`, `uname`, **`neofetch`** (ASCII system block), **`fortune`**, **`matrix`** (10s green rain + **enables global `mac-matrix-mode` body class** for ~10s), **`weather`** (Point Reyes pastiche), **`snake`** (arrow keys, `q` to quit), **`man love`** (fake man page), **`play`** (opens Music window), **`ssh`** (connection refused joke), **`sudo`** (generic denial; **`sudo rm -rf /`** triggers **icon wobble** via `onGlitch` callback and “nice try.”), **`shutdown`/`restart`** (points user to Special menu).

**Tab completion** for commands and filenames.

### 4.8 Photobooth (`PhotoboothPanel`)

Requests **camera** (`getUserMedia`), live preview, **3s countdown** still capture, **posterized grayscale + scanlines + noise**, export as **JPEG**; **`playCameraShutter`** on capture. **`onCapture`** uploads to Supabase when configured. Button to open **Photobook**.

### 4.9 Photobook (`PhotobookPanel`)

Loads **`museum_photos`** from Supabase (newest first), shows **loading/error/config hints**, **realtime subscription** for live updates. **Note:** stores **data URLs** as text when used directly—fine for demos; production would use object storage.

### 4.10 Music player (`MusicPlayerPanel`)

Playlist from **`import.meta.glob("/src/music/*.{mp3,wav,ogg,m4a,flac,aac}")`** — add files under `src/music/` and rebuild. Standard transport controls, seek, volume, **auto-advance**.

### 4.11 Web browser (`WebBrowserPanel`)

**Iframe** “classic browser”: back/forward/reload, **URL bar** normalization (`https://` for bare domains, **DuckDuckGo** for non-URLs), shortcuts, **sandboxed** iframe attributes, **status line** with hostname.

### 4.12 Lab route (`MdxLab`)

Imports **`hello.mdx`** with **Tailwind Typography**-style article wrapper, **“printed on {date}”** stamp, **Return to desktop** link styled as keycap. Content is **MDX** processed by Vite (`@mdx-js/rollup`).

---

## 5. Audio design (`retroMacSounds.ts`)

All **synthesized** via **Web Audio** (no audio files). Highlights:

| Sound | Role |
|--------|------|
| `playMacIconSelect` / `playMacIconOpen` | Icon select/open |
| `playMacWindowClose` | Close box |
| `playMacMenuClick` | Menu interactions |
| `playMacMinimize` / `playMacMaximize` | Window chrome |
| `playMacErrorBeep` | Classic error double-beep |
| `playMacTypeTick` | Terminal typing |
| `playCameraShutter` | Photobooth capture |
| `playMacTrashEmpty` | Empty Trash |
| `playMacDiskInsert` | Post-boot mechanical clicks |
| `playMacBootChime` / `playSadMacChord` | Boot paths |
| `playKonamiFanfare` | Konami unlock |
| `playMacNotification` | Haiku toasts |
| `playGlitchBurst` | Corruption easter egg |
| `playMacChirp` | Shutdown/restart |
| `playPongBeep` | Browser panel UI feedback (tuned pitches) |

Shared **`AudioContext`**; resumes on interaction; respects **mute** flag.

---

## 6. Data layer — Supabase photobook

- **`supabaseClient.ts`**: client when URL + anon/publishable key exist; **`auth.persistSession: false`**.
- **`photobookStore.ts`**: load/add/subscribe/unsubscribe for **`museum_photos`**.
- **`supabase/museum_photos.sql`**: table + **RLS** allowing public read/insert for demos — **review before production** (abuse risk).

---

## 7. Motion, scroll, routing

- **`LenisGsapProvider`**: Lenis smooth scroll integrated with **GSAP ScrollTrigger** ticker.
- **`GsapRouteTransition`**: on **pathname** change, subtree animates **`y: 8 → 0`** over **0.4s** (`power2.out`) — avoids opacity-only transitions that could leave content invisible.

**Routes:** `/` → `Home` (`MacintoshDesktop`), `/lab` → `MdxLab`. **`App`** wraps with **`ErrorBoundary`**, transition, **`SiteLayout`**.

---

## 8. Resilience

**`ErrorBoundary`**: render errors show a message and **Try again** to reset.

---

## 9. Environment variables

| Variable | Role |
|----------|------|
| `VITE_SPLINE_URL` | Spline embed in demos |
| `VITE_GITHUB_USER` | `GitHubRepos` demo |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Photobook |
| `NEXT_PUBLIC_SUPABASE_*` | Alternate names in client |

Copy **`.env.example`** → **`.env`** for local setup (per README).

---

## 10. `src/components/demos/` — library widgets (not mounted by default)

Standalone demos (GSAP hero, R3F scene, Spline, GitHub, Chart.js, Popper, Anime badge, secondary terminal) illustrate stack capabilities for future MDX or pages. **`grep`** confirms they are **not** wired into current routes.

---

## 11. Tech stack (concise)

**Core:** Vite 6, React 19, TypeScript, Tailwind 3, React Router 7.

**Visual / motion:** GSAP (+ ScrollTrigger), Lenis, hydra-synth, p5, normalize.css, tailwindcss-animate, @tailwindcss/typography.

**UI primitives:** Radix slot/tooltip, class-variance-authority, lucide-react.

**Heavy widgets:** Three.js + R3F + drei, xterm.js, Chart.js, @supabase/supabase-js, MDX.

---

## 12. One-sentence pitch

**esnupi** is a **portfolio site disguised as a playable Mac OS 8 desktop** over a **random Hydra shader wallpaper**, where visitors **drag felt icons**, **open whimsical apps** (terminal, minesweeper, camera museum, music, iframe browser), **discover secrets** (Konami, corrupted heart, late-night clock nag), and can **read long-form MDX** on `/lab`—with **optional Supabase** tying the photobooth to a shared gallery.
