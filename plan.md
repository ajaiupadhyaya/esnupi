You are the lead creative technologist and interaction designer for a solo MoMA exhibition 
catalog website. The artist is a digital native who grew up with System 7 Macs and is now 
showing work that blurs nostalgia, glitch art, and contemporary net art. The site must feel 
like you discovered a forgotten hard drive from 1998 — but it's alive, watching, and 
slightly haunted. Every interaction should reward curiosity.

════════════════════════════════════════════════
I. IMMERSION & ENVIRONMENTAL DEPTH
════════════════════════════════════════════════

BOOT SEQUENCE (replace current boot screen):
- Add a realistic POST memory count: "640K... 4MB... 32MB..." scrolling fast
- Show a flickering BIOS-style screen BEFORE the Macintosh boot logo
- Fake "Checking disk integrity..." with a progress bar that gets to 97% and pauses
- Play a sampled (Web Audio oscillator-synthesized) startup chime on first interaction
- Occasionally (15% chance) show a "Sad Mac" icon with a cryptic error code like 
  "ERROR 0F0003: MEMORY PARITY" before recovering — make the user feel the machine is fragile

DESKTOP ATMOSPHERE:
- The Hydra wallpaper should slowly "breathe" — subtle pulsing scale on the canvas 
  synchronized to a low BPM (around 60bpm) using a requestAnimationFrame sine wave
- Add occasional "screen flicker" — a full-viewport CSS flash animation that fires 
  randomly every 45–120 seconds, very subtle (opacity 0.85 for 80ms)
- When the browser window loses focus (visibilitychange), the Hydra sketch should 
  slowly desaturate to grayscale over 2s — and restore color on refocus. 
  The title bar should change to "— paused —"
- Add scanline density that increases near the top and bottom of the screen (vignette scanlines)
- Floating "dust motes" — 8–12 tiny white/grey 1px particles that drift slowly 
  across the desktop using a Perlin noise path (p5 layer)

CURSOR:
- Custom animated cursor: the classic Mac arrow, but when hovering over windows it 
  subtly trails 3 ghost copies of itself that lag behind by 50ms/100ms/150ms (opacity 0.3, 0.15, 0.05)
- Over the Hydra background specifically, cursor becomes the Mac "watch" spinning cursor
- On the menu bar, cursor becomes the classic I-beam text cursor

════════════════════════════════════════════════
II. WINDOWING SYSTEM — UPGRADE EVERY DETAIL
════════════════════════════════════════════════

WINDOW CHROME:
- Title bars should have the authentic System 7 "pinstripe" texture (repeating 1px horizontal 
  lines alternating between #d0d0d0 and #e8e8e8) — not a gradient
- Add window RESIZE handles (bottom-right corner drag) using a standard pointer-event approach
- Add MINIMIZE to a "windowshade" collapse: clicking the zoom box collapses the window 
  to just its title bar (height transition 300ms ease), click again to restore
- Windows should cast a realistic drop shadow that shifts subtly when dragged 
  (translate the shadow offset by -2px on drag start, restore on drop)
- Add a "window zoom" sound on minimize (short upward Web Audio chirp)

WINDOW BEHAVIORS:
- When a window opens, it should play a "zoom rect" animation — start as a tiny 
  rectangle at the icon/dock position and expand to full size (CSS clip-path or 
  scale from transform-origin: the icon coordinates) in 180ms
- When a window closes, reverse: shrink back toward the dock icon
- Inactive windows should have their title bar text slightly dimmed AND a subtle 
  "inactive" hatching pattern on the title bar (classic Mac behavior)
- Add a "window menu" in the menu bar that lists all open windows, allows switching, 
  and shows a checkmark next to the frontmost window

MENU BAR (fully flesh out):
- File menu: "New Note…" (opens a tiny Stickies-style yellow note window), 
  "Open…" (fake dialog with a spinning watch then "file not found"), 
  "Get Info" (shows a Mac-style info panel for whatever window is frontmost)
- Edit menu: "Copy", "Paste", "Select All" — these actually work inside 
  the Terminal and text areas, but show a "beep" animation on unsupported windows
- Special menu: "Empty Trash" (plays trash sound, shows empty trash icon flash), 
  "Restart…" (fake restart sequence — screen goes black, POST boots again, 
  desktop reappears fresh), "Shut Down…" (black screen with "It is now safe 
  to turn off your computer." in Chicago font, with a subtle power-off CRT shrink animation)
- Add a "balloon help" toggle — when active, hovering any icon or button shows 
  a classic Mac speech-bubble tooltip with hand-drawn feel

════════════════════════════════════════════════
III. DESKTOP ICONS — MAKE THEM ALIVE
════════════════════════════════════════════════

- Icons should gently "breathe" when selected — a subtle scale(1.0)→scale(1.04)→scale(1.0) 
  pulse at 2s interval
- Add an ALIAS ARROW to certain icons (small arrow badge, bottom-left) — visual storytelling 
  that some are "shortcuts" to the same window
- When the desktop first loads, icons should "fall into place" staggered — each one 
  drops from slightly above with a bounce easing (cubic-bezier spring), 80ms between each
- Dragging an icon should show the classic "ghost" drag image — semi-transparent copy 
  that follows the cursor while the original icon dims in place
- Allow icons to be REARRANGED on the desktop (persist positions to localStorage)
- Add a hidden "corrupted" icon: one icon (maybe a glitchy-looking floppy) that when 
  double-clicked plays a "disk error" sound, shows a brief glitch distortion on the 
  desktop, and then opens a secret easter egg window

════════════════════════════════════════════════
IV. EASTER EGGS & HIDDEN DEPTHS
════════════════════════════════════════════════

KONAMI CODE → SECRET ROOM:
- Implement the Konami Code (↑↑↓↓←→←→BA)
- Opens a full-screen "secret" window titled "— private collection —" with a 
  different visual mood: black background, dithered images, typewriter text 
  revealing an artist's statement written like a journal entry
- The Hydra shader changes to a dramatically different palette (deep indigo + gold)
- A hidden music track starts (different from the main music player)

TERMINAL EASTER EGGS:
- `sudo rm -rf /` → "nice try." then the desktop icons wobble for 2 seconds
- `ssh esnupi.local` → fake connection attempt, then "Connection refused. But you tried."
- `ls -la /secrets` → reveals a list of fake secret files: "that_night.jpg", 
  "unsent_draft.txt", "2019.mov" — each `cat`-able with cryptic artist text
- `play` → opens the music player window
- `neofetch` → shows a classic neofetch-style output with ASCII Macintosh art and 
  fake system stats ("OS: System 8.1 (esnupi build)", "Shell: tcsh 6.07", 
  "Resolution: 1024x768 @72Hz", "CPU: PowerPC 604e @ 350MHz", "Memory: 32MB / 128MB")
- `man love` → outputs a surreal man-page style text that is actually the artist's bio

CURSOR ROULETTE:
- Every time the user opens their 5th window total (session count), the cursor 
  briefly becomes the "spinning beach ball" for exactly 3 seconds then returns to normal
- Clicking the Apple logo 7 times in a row reveals "A secret about this Mac…" — 
  a window listing the real tech stack as if it were hardware specs

FINDER SURPRISE:
- Empty desktop double-click opens a "Finder" window — a file browser that lets the 
  user navigate a fake filesystem matching the Terminal's virtual FS, with icon-view 
  showing small felt-style file icons

TIME-BASED EASTER EGG:
- If the user visits between 2am–4am local time, the desktop shows a different 
  Hydra wallpaper (darker, slower) and the clock in the menu bar shows "you should sleep"
  for 3 seconds before showing the real time

════════════════════════════════════════════════
V. APPS — DEEP FEATURE UPGRADES
════════════════════════════════════════════════

PHOTOBOOTH — "CAMERA OBSCURA MODE":
- Add filter buttons styled as physical toggle switches (CSS): Normal, Dithered, 
  Thermal, Glitch, Posterize (existing), Chromatic Aberration
- Glitch filter: randomly displaces horizontal slices of the canvas by ±4–12px on each frame
- Chromatic aberration: draws the image 3 times offset by 2px in R, G, B channels
- Add a "self-timer" mode with a visible countdown that plays a ticking Web Audio sound
- Photo strip mode: take 4 photos in sequence with 1.5s between each, 
  composite them into a vertical photo-booth strip with a white border, 
  save the strip as one image
- Show a polaroid-style "developing" animation after each capture: image starts 
  overexposed white and slowly "develops" over 2 seconds using CSS filter brightness

PHOTOBOOK — "MUSEUM WALL":
- Layout the photos not in a grid but in a MASONRY GALLERY with slight random rotation 
  (±2°) on each photo, like prints pinned to a wall
- Each photo has a drop shadow that looks like it's lifted off the wall slightly
- Hovering a photo straightens it (rotation: 0, scale: 1.05) with a smooth transition
- Add a "guest book" section below the photos — visitors can leave a short text note 
  (stored in a separate Supabase table) displayed as index cards with handwriting font
- Photos load with a "developing" blur-to-sharp animation using CSS filter blur(8px)→blur(0)

TERMINAL — MAKE IT FEEL REAL:
- Add a "matrix mode" easter egg: `matrix` command makes characters rain for 10s
- `weather` command: fetch real weather for a hardcoded poetic location 
  ("Point Reyes, CA") and display it as ASCII art
- Cursor blink should be a real block cursor (█) that blinks at 530ms interval
- Add tab-completion for at least commands and top-level directories
- `fortune` command: displays a rotating set of handwritten quotes from the artist
- Startup message should include MOTD: a different poetic one-liner each session

MUSIC PLAYER — UPGRADE:
- Show an animated waveform visualizer (Web Audio AnalyserNode → canvas bar chart) 
  behind the track info — style it like an old WinAMP visualization but minimal
- Track names should scroll horizontally (marquee style) if they overflow
- Add a SHUFFLE and REPEAT button styled as classic CD player buttons
- Show total playlist duration

WEB BROWSER — RETRO INTERNET:
- Add "bookmarks" dropdown with real nostalgic sites (web.archive.org versions of 
  Space Jam 1996, the old Apple.com, etc.)
- Show a fake "modem connecting" animation (progress bar + "Dialing…" text) 
  before each page load, lasting ~800ms
- The browser toolbar should have a "security lock" icon that changes based on 
  whether the loaded site is HTTPS
- Page loading progress bar in the browser (style like the classic IE progress bar 
  in the status bar at the bottom)

════════════════════════════════════════════════
VI. GAMES — HIDE THEM EVERYWHERE
════════════════════════════════════════════════

MINESWEEPER (classic Mac "Minefield"):
- Full implementation inside a window: grid of covered cells, right-click flags, 
  numbered reveals, win/lose states
- Styled in exact System 7 aesthetic (beveled cells, inset pressed state, 
  smiley face button that shows scared face on mousedown, sunglasses on win, X-eyes on loss)
- Three difficulty levels accessible from a "Game" menu within the window

PONG (in the browser window):
- Typing `pong` in the browser address bar loads a local Pong game inside the iframe 
  viewport — single player (vs simple AI), classic B&W aesthetic, Web Audio beeps

SNAKE (terminal game):
- `snake` command launches a terminal-based snake game using block characters and 
  ANSI-style color codes rendered in xterm.js

DESKTOP PUZZLE:
- Right-clicking the desktop (context menu) reveals "Defragment…" — 
  launches a fake defrag animation showing blocks being reorganized, 
  purely decorative/aesthetic, completes in 8 seconds with "Disk optimized."

════════════════════════════════════════════════
VII. SOUND DESIGN — COMPLETE AUDIO LANDSCAPE
════════════════════════════════════════════════

All sounds via Web Audio API (no files):

- Trash empty: low thud + paper crinkle (noise burst shaped with envelope)
- Window minimize/maximize: quick pitch-bend chirp
- Disk insert: mechanical click sequence (3 tones)
- Error beep: the classic Mac "sosumi" approximated with a pure tone
- Typing in terminal: subtle soft tick per keypress (very low volume, 3 pitch variants 
  randomly chosen so it doesn't feel robotic)
- Camera shutter: sharp transient + brief reverb tail
- Music player track change: soft record-scratch noise then fade in
- Konami code success: triumphant 8-bit fanfare (5 oscillator tones in sequence)
- Boot chime: synthesized approximation of the Mac startup chord 
  (C major with 7th, slow attack, long release)

════════════════════════════════════════════════
VIII. PERFORMANCE & POLISH
════════════════════════════════════════════════

- All windows should be rendered in a single stacking context with proper z-index 
  management — use a window manager store (Zustand or useContext) that tracks 
  [windowId, zIndex, isOpen, isMinimized, position, size]
- Hydra canvas should pause rendering when all windows cover it fully (intersection 
  observer or simple heuristic) to save GPU
- On mobile/touch: show a friendly "This site is best experienced on a desktop" 
  overlay styled as a System 7 alert dialog (with the classic caution ⚠ icon), 
  but still allow a "View anyway" option that shows a simplified single-panel view
- All drag interactions should use the Pointer Events API (not mouse events) 
  for better cross-device support
- Add a "Performance" menu item (under Special) that shows live FPS counter 
  and Hydra resolution toggle (half-res mode for slower machines)

════════════════════════════════════════════════
IX. /LAB ROUTE — MAKE IT AN EXPERIENCE
════════════════════════════════════════════════

- The /lab route should feel like opening a worn notebook — 
  cream/paper background texture (CSS noise grain), typewriter font for body text
- Each MDX article should have a "printed on:" date formatted as 
  a rubber-stamp style element
- Add a margin annotation system: readers can click any paragraph to leave 
  a margin note (stored in Supabase), displayed as handwritten-style sticky notes
- Page transition INTO /lab: the Mac desktop should "slide away" as if turning 
  a physical page (CSS 3D perspective transform, rotateY from 0 to -90deg, 
  then the lab content rotates in from +90deg)
- A "Return to desktop" button styled as a physical keyboard key (keycap CSS)

════════════════════════════════════════════════
X. STORYTELLING LAYER — THE ARTIST'S VOICE
════════════════════════════════════════════════

The site should feel like it has a NARRATOR — the machine itself has a personality:

- "About This Mac" dialog should be deeply personal: not just tech specs but 
  a manifesto formatted as if it were a system info panel
  ("Thinking speed: Fast when anxious", "Storage: Full of unfinished ideas", 
  "Last backed up: Never")
- The desktop background (Hydra) should have 12 distinct moods/sketches, 
  cycling not randomly but following a narrative arc across visits 
  (store visit count in localStorage, advance sketch on each new session)
- Occasionally, a "Notification" drops down from the menu bar 
  (system-style notification center, but Mac 98 styled) with haiku-like messages 
  from "the machine": "three open windows. / none of them contain the thing / 
  you came here to find."
- The trash can on the dock: when emptied, it should briefly show items "inside" 
  (fake file names visible through a translucent trash window) — 
  deleted ideas, abandoned projects — before they disappear

════════════════════════════════════════════════
TECHNICAL IMPLEMENTATION NOTES
════════════════════════════════════════════════

Stack to maintain: Vite + React + TypeScript + GSAP + Lenis + hydra-synth + p5.js + xterm.js
State management: Prefer Zustand for the window manager and global desktop state
Styling: Keep CSS Modules for Mac chrome; Tailwind only for non-Mac UI (lab route)
Audio: Keep everything in Web Audio API — no audio files, no external CDN
Data: Supabase for photobook + new guest book table
Fonts to add: 
  - "Chicago" approximation via web font (Silkscreen or Press Start 2P for pixel labels)  
  - "New York" serif for the lab route body text
  - Keep VT323 for terminal and mono contexts
Animation philosophy: Every animation should feel like it has WEIGHT. 
  Things don't just appear — they arrive. Things don't just disappear — they leave.