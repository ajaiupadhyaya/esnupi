╔══════════════════════════════════════════════════════════════════════╗
║  ESNUPI — FINAL FORM  ·  Creative Direction v4                      ║
║  "The last commit before the show opens."                            ║
╚══════════════════════════════════════════════════════════════════════╝

This is the finishing brief. Everything in v1–v3 stands. This document
layers the final coat: the micro-details, the missing programs, the
sounds nobody thought to synthesize, the animations that make the
difference between a portfolio and a performance.

Read it as a musician reads a score. Every marking matters.
Nothing is decoration. Execute with full creative authority.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART ONE — THE MISSING LAYER: SPATIAL AUDIO DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The current sound library is event-driven. Make it SPATIAL and
CONTINUOUS. The desktop should have an ambient soundscape —
a barely audible environment that makes silence feel wrong.

ALL sounds are Web Audio API. No files. Ever.

────────────────────────────────────────────────────────────────────
A. AMBIENT LAYER (always playing, volume ~0.015)
────────────────────────────────────────────────────────────────────

Compose a generative ambient loop using three parallel signal chains:

  CHAIN 1 — "FAN HUM":
    A BiquadFilterNode (highpass, frequency 60Hz) fed by a
    BufferSourceNode filled with white noise, output gain 0.012.
    This is the sound of a Power Mac G4 doing nothing.
    It never changes. It never stops. It is barely there.
    Most users will not consciously hear it. It will be missed
    if removed.

  CHAIN 2 — "CRT WHINE":
    An OscillatorNode at 15,734 Hz (the actual horizontal sync
    frequency of NTSC CRTs), gain 0.004. A slight LFO (0.08 Hz)
    modulates the frequency ±40 Hz — the pitch drifts like an
    aging tube. Starts when the desktop loads. Stops if the user
    enables "Reduce Motion" in Control Panels (because the whine
    IS the CRT, and the CRT should be off if you've asked for
    calm).

  CHAIN 3 — "ROOM TONE":
    A convolver (reverb) fed by an extremely quiet noise burst
    every 8–14 seconds (random interval). The reverb tail is
    synthesized: white noise shaped with a fast attack (5ms) and
    a very long decay (3.2s) through an exponential gain ramp.
    Output gain 0.008. This is the sound of the room the machine
    is in. You are inside a space. The space has walls.

────────────────────────────────────────────────────────────────────
B. REACTIVE SOUND UPGRADES
────────────────────────────────────────────────────────────────────

Beyond the existing event sounds, add these reactive audio moments:

  WINDOW DRAG (while actively dragging):
    A very faint, continuous soft friction sound — filtered noise
    (bandpass, Q=8, frequency 800Hz), gain 0.025, plays only while
    pointer is held down and window is moving. Stops the instant
    the pointer releases. This is the sound of plastic on desk.

  ICON HOVER (not click — hover):
    A single sine wave pulse at 1200 Hz, duration 30ms, gain 0.06,
    attack 2ms / release 28ms. So subtle it registers as a feeling
    more than a sound. Three pitch variants (1200, 1350, 1050 Hz)
    chosen by icon index mod 3, so each icon has its own voice.

  MUSIC PLAYER SEEK:
    When the user drags the seekbar, play a continuous "tape
    scrub" sound — sped-up noise with a slight pitch envelope
    that follows the seek direction (forward = rising, back =
    falling). Use AudioParam.linearRampToValueAtTime for the
    frequency envelope. Stop on mouseup.

  MINESWEEPER SOUNDS (completely rework):
    - Cell reveal: single tone, pitch determined by the cell's
      number (0=low, 8=high). Each reveal is a xylophone hit.
      Fast attack (1ms), medium decay (80ms), no sustain.
    - Flood reveal (empty cell expansion): a cascade of those
      xylophone hits with 12ms stagger between each cell in
      the flood sequence. This is a musical arpeggio.
      The number of cells revealed determines how long the
      chord lasts. Large floods are satisfying.
    - Flag placement: a soft "pin" sound — a transient click
      followed by a 40ms resonant thud. Like pushing a thumbtack
      into cork.
    - Win: generate a four-note major chord (C4, E4, G4, C5),
      all sine waves, staggered by 80ms, each with a 1.2s decay.
      The machine is pleased.
    - Explode: a proper synthesized explosion — noise burst with
      a fast lowpass sweep (cutoff 8000→200Hz over 600ms), plus
      a sub-bass hit at 60Hz that decays over 400ms. The kind of
      sound that makes someone at a coffee shop look up.

  HYDRA MOOD TRANSITION (when time-of-day changes the shader):
    A very slow crossfade sound — two sine waves at 432Hz and
    440Hz beating against each other (8Hz beat frequency),
    gaining up from silence over 3s, then fading out over 3s.
    This marks the moment the room changed.

  SCREENSAVER ACTIVATE / DEACTIVATE:
    Activate: a slow, descending tone sequence (C5→G4→E4→C4),
    each note 400ms, overlapping, like a lullaby closing.
    Deactivate: the reverse, ascending, faster (150ms per note).
    The machine wakes up before the desktop does.

  SHUTDOWN SOUND (replace current chirp):
    The actual final sounds of a shutting-down machine:
    1. A soft "disk park" click (transient at 2ms, 400Hz)
    2. A fan deceleration — noise filtered through a lowpass
       that sweeps from 4000Hz to 200Hz over 2.5s, gaining
       down simultaneously. The machine is spinning down.
    3. A final CRT "bloom" sound — a brief 15734Hz spike that
       cuts immediately to silence. The phosphor settles.
    These three sounds overlap in sequence and are the last
    thing before the "safe to turn off" screen.

────────────────────────────────────────────────────────────────────
C. THE SILENCE PHILOSOPHY
────────────────────────────────────────────────────────────────────

The 600ms black pause during boot (from v3 brief) should be
genuinely silent — all ambient audio chains should ramp to
gain 0 over 200ms before the pause, and ramp back up over
200ms after the Happy Mac appears. The silence is shaped.
It has edges. It arrives and it leaves.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART TWO — NEW PROGRAMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add these as fully working applications, each in its own window,
each accessible from the Apple menu under a new submenu: "Programs".

────────────────────────────────────────────────────────────────────
PROGRAM A — "KALEIDOSCOPE" (visual toy / screensaver preview)
────────────────────────────────────────────────────────────────────

A full-window canvas application. A proper After Dark–style
visual toy.

BEHAVIOR:
  - A single <canvas> fills the window content area
  - Draws a real-time kaleidoscope: radial symmetry (8 segments
    by default), driven by mouse position within the window
  - Moving the mouse paints — a trail of colored dots in the
    canvas coordinate system gets reflected across all 8 axes
  - Colors: a continuous HSL color wheel cycling at 0.5 deg/frame
  - The canvas NEVER clears — paint accumulates over time
  - "SYMMETRY" slider at the bottom: 2–16 segments (even only)
  - "CLEAR" button: the canvas fades to black over 800ms (not
    an instant clear — the painting dies slowly)
  - "SAVE" button: canvas.toBlob() → download as PNG named
    "esnupi-[timestamp].png"
  - When the window is minimized and restored, the painting
    is exactly preserved (canvas state persists in a ref)
  - A subtle "ink drop" sound (a soft pluck, 300Hz, 60ms decay)
    plays every 200ms while the mouse is moving within the window

────────────────────────────────────────────────────────────────────
PROGRAM B — "TYPIST" (distraction-free writing tool)
────────────────────────────────────────────────────────────────────

A writing application that is also an argument about writing.

BEHAVIOR:
  - White window background. A single textarea, fullwidth, no border,
    no scrollbar, padding 32px all sides
  - Font: the serif content font at 17px, 1.9 line-height
  - Character count in the bottom right: "[n] characters" —
    updates live, styled as a faint caption
  - Word count in the bottom left: "[n] words"
  - NO save button. Text persists to localStorage key
    "esnupi.typist.v1" on every keystroke (debounced 500ms)
  - Loads existing text from localStorage on mount
  - A "CLEAR" button that shows ONLY when the textarea has text —
    appears after a 2s delay post-load, fades in. On click:
    confirm with a Mac-style alert dialog ("Are you sure you want
    to clear your note? This cannot be undone."), then clears.
  - Typing sound: use the existing playMacTypeTick but at reduced
    gain — 3 pitch variants for natural feel
  - When the window first opens: the cursor is immediately focused
    in the textarea. No clicks required. You open it, you write.
  - EXPORT: File → Export Note → downloads the text as a .txt
    file named "note-[YYYY-MM-DD].txt"
  - The textarea should have NO resize handle. It is what it is.

────────────────────────────────────────────────────────────────────
PROGRAM C — "CLOCK" (desk clock / world clock)
────────────────────────────────────────────────────────────────────

Not a utility. An object. This should feel like a sculpture.

BEHAVIOR:
  - Window size: 280px × 320px (fixed, non-resizable)
  - Content: an analog clock face rendered in SVG, updated
    every second using requestAnimationFrame
  - Clock face design — MINIMAL BRUTALIST:
    - Black circle on white background
    - NO numbers. Twelve tick marks: four long ones (12, 3, 6, 9)
      and eight shorter ones (others). All are rectangles,
      not lines — 3px wide.
    - Hour hand: a thick rectangle, 4px wide, rounded end,
      60% of radius length, black
    - Minute hand: 2px wide, 80% of radius length, black
    - Second hand: 1px wide, 90% of radius length, #FF3B00
      (the rupture color — the only moving element in red)
    - A small filled circle at center, 6px diameter, black
    - Second hand movement: DISCRETE TICKS, not smooth sweep.
      Snaps to each second position. The tick is accompanied
      by the existing playMacTypeTick sound at gain 0.04.
  - Below the clock face: the current date in the format
    "MONDAY, 21 APRIL" — uppercase, tracked, the content serif,
    12px.
  - A small dropdown: "Add timezone" — choosing from a short
    curated list (NEW YORK, LONDON, TOKYO, MEXICO CITY, LAGOS)
    adds a second smaller clock face (60% size) below with
    the city name. Max 2 timezones shown. Uses Luxon for all
    time logic.
  - Tick sound should be synchronized to the actual second
    boundary (using setTimeout aligned to Date.now() % 1000).

────────────────────────────────────────────────────────────────────
PROGRAM D — "NOTEPAD" (the other writing surface)
────────────────────────────────────────────────────────────────────

Multiple sticky notes was already there. This is different:
a tabbed notepad with up to 5 named tabs.

BEHAVIOR:
  - Each tab is a named text area: "Note 1" by default,
    double-click the tab label to rename it (inline edit)
  - Tabs displayed as actual Mac-style folder tabs at the top
    of the window (the tab sticks UP above the content area)
  - Content persists per-tab in localStorage
    ("esnupi.notepad.tab[0–4].v1")
  - New Tab button (+) appears after the last tab when fewer
    than 5 exist
  - Close tab: small × on the tab, confirm if has content
  - Font: IBM Plex Mono 13px. This is for notes that feel like
    code even when they aren't.
  - Line numbers in the left gutter — a fixed 32px column,
    faint grey, counting from 1. They update as you type.
    Feels like a lightweight code editor.

────────────────────────────────────────────────────────────────────
PROGRAM E — "SLIDESHOW" (the portfolio, properly)
────────────────────────────────────────────────────────────────────

This replaces (or companions) the scaffold Projects window.
A proper image slideshow application — the artist's work, shown
the way an artist would want to show it.

BEHAVIOR:
  - Images loaded from a config file: src/slides/slides.ts
    Each slide: { src: string, title: string, year: number,
    medium: string, dimensions?: string, note?: string }
  - Full-bleed image fills the window (object-fit: contain,
    black background)
  - Navigation: LEFT/RIGHT arrow keys, or clickable arrow
    buttons at bottom corners (styled as Platinum beveled arrows)
  - Slide counter: "03 / 12" bottom center, small caption font
  - Title + metadata: fades in from bottom over 400ms when
    slide loads, then fades out after 4s (unless the user
    moves their mouse within the window — then it stays visible)
  - A "FULL SCREEN" button: maximizes the window to fill the
    viewport (not browser fullscreen — just the window expands
    to fill the desktop area, respecting menu bar and dock)
  - Keyboard shortcut: F key toggles fullscreen
  - A very subtle crossfade between slides (200ms, CSS transition
    on opacity) — no sliding, no zooming. The image just
    breathes in.
  - If a slide has note: a small ¶ in the bottom-left corner.
    Clicking it opens a small overlay within the window
    containing the note text in the serif font.
  - Sound: a soft page-turn sound on each slide change —
    a very short burst of filtered noise (bandpass, 2000Hz,
    Q=3, 25ms) that sounds like paper.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART THREE — ANIMATION COMPLETION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are the final animation passes — the ones that separate
a finished site from a nearly-finished site.

────────────────────────────────────────────────────────────────────
A. THE DOCK — MAKE IT ALIVE
────────────────────────────────────────────────────────────────────

The dock is currently static. Give it exactly one behavior upgrade:

MAGNETIC HOVER:
  When the mouse approaches within 80px of the dock (measured
  from the bottom of the viewport), the dock items within 120px
  of the cursor scale up from 1.0 to 1.4 using a gaussian
  falloff — items farther from the cursor scale less. Items
  at >200px from cursor are unaffected.

  This is the macOS dock magnification effect. It belongs here.
  It is the single interaction that will make the most people
  lean forward.

  Implementation:
    - Track mousemove on the document
    - When mouse.y > (window.innerHeight - 120): dock is "active"
    - For each dock item, compute distance from mouse.x to
      item center
    - scale = 1.0 + 0.4 * Math.exp(-(dist²) / (2 * 60²))
    - Apply via CSS transform: scale(computed) with a 60ms
      transition
    - When mouse leaves the bottom zone: all items return to
      scale(1.0) with a 200ms spring-like transition (use
      GSAP elastic ease or CSS cubic-bezier(0.34, 1.56, 0.64, 1))
    - The dock itself should also lift slightly (translateY -4px)
      when active, and settle back on deactivation

────────────────────────────────────────────────────────────────────
B. WINDOW FOCUS — DEPTH CUES
────────────────────────────────────────────────────────────────────

When a window gains focus (becomes frontmost):
  - It scales from 0.998 to 1.0 — a 0.2% scale change over 80ms.
    Nobody will consciously see this. It will feel like the window
    "clicked into place."
  - All other (inactive) windows gain a CSS filter:
    brightness(0.95) — they dim very slightly.
  - Active window: filter: none.
  - These transitions: 120ms ease.

When NO window has focus (user clicks the desktop):
  - All windows return to full brightness but add a very faint
    desaturate: filter: saturate(0.85). The windows are
    "waiting." The desktop is the active surface.

────────────────────────────────────────────────────────────────────
C. THE MENU BAR — DROPDOWN POLISH
────────────────────────────────────────────────────────────────────

Current dropdowns: appear instantly. Replace with:
  - Menu appears with a clip-path animation: clip-path from
    inset(0 0 100% 0) to inset(0 0 0% 0) over 80ms.
    This is the classic Mac menu "pulling down" animation.
  - Each menu item fades in with a 15ms stagger from top to bottom.
  - Hover state: the menu item highlight (the blue Platinum
    selection) should slide, not jump — when moving between items,
    the selection bar moves with a 40ms transition.
    (This is not a common pattern. It will be noticed.)
  - Submenus: slide in from the right using the same clip-path
    technique.

────────────────────────────────────────────────────────────────────
D. TEXT CURSOR IN EDITABLE FIELDS
────────────────────────────────────────────────────────────────────

In ALL textarea and input elements across all apps:
  - Override the default CSS caret with a custom one:
    caret-color: #FF3B00;
  - caret-shape is not widely supported yet, but set it anyway
    for future compatibility.
  - The rupture color in the text cursor is a small claim:
    where you are about to write matters.

────────────────────────────────────────────────────────────────────
E. THE SCRAPBOOK / PHOTOBOOK — PHYSICS
────────────────────────────────────────────────────────────────────

If the Scrapbook from v3 is implemented, add:
  - When new photos arrive via Supabase realtime subscription:
    the new polaroid doesn't appear in place. It FALLS from the
    top of the corkboard — a CSS animation (translateY: -200px
    → 0, rotation: random start → final rotation) with a spring
    easing (cubic-bezier(0.34, 1.56, 0.64, 1)), duration 600ms.
    Followed by a soft "pin" sound (reuse the Minesweeper flag
    sound at lower gain).
  - On hover: the polaroid adds a very faint box-shadow elevation
    change (from 4px to 16px blur radius) to suggest it's been
    picked up.

────────────────────────────────────────────────────────────────────
F. THE HYDRA BACKGROUND — FINAL REACTIVITY PASS
────────────────────────────────────────────────────────────────────

Three final behaviors for the Hydra canvas that haven't been
specified yet:

  1. WINDOW DRAG REACTION:
     While a window is being dragged across the desktop, the
     Hydra canvas should have CSS filter: blur(1px) applied.
     On drag release: blur returns to 0px over 400ms.
     The wallpaper goes slightly out of focus when the user
     is busy rearranging the foreground. It respects attention.

  2. MINESWEEPER WIN:
     When the user wins Minesweeper, the Hydra canvas briefly
     runs a celebration: CSS filter: hue-rotate animation from
     0deg to 360deg over 2s, once. The whole world shifts.

  3. IDLE BREATHING:
     When there's been no interaction for 30+ seconds (and the
     screensaver hasn't yet triggered), the Hydra canvas should
     very slowly pulse — a CSS animation on a div overlay above
     the canvas, going from opacity 0 to 0.08 and back, over 4s,
     in pure black. The room darkens slightly, rhythmically.
     Like slow breathing. Stops immediately on any interaction.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART FOUR — UI DETAILS THAT FINISH THE PRODUCT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are the details that reviewers notice and designers steal.

────────────────────────────────────────────────────────────────────
A. SELECTION EVERYWHERE
────────────────────────────────────────────────────────────────────

Override the browser selection color across the entire site:

  ::selection {
    background: #0000aa;
    color: #ffffff;
  }

This is the Mac OS classic selection color. It is in the browser.
It is the desktop. The selection bleeds across the boundary.

────────────────────────────────────────────────────────────────────
B. SCROLLBARS — STYLED
────────────────────────────────────────────────────────────────────

Override all scrollbars within windows (not the main viewport):

  ::-webkit-scrollbar { width: 15px; }
  ::-webkit-scrollbar-track { background: #d4d0c8; }
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #f4f0e8, #a8a498);
    border: 1px solid #888;
  }
  ::-webkit-scrollbar-button {
    background: #c8c4bc;
    height: 15px;
    border: 1px solid #888;
  }

These are the authentic System 8 scrollbars. They should exist
ONLY within window content areas (scope with .mac-window-content *).
The main desktop has no scrollbar (overflow: hidden).

────────────────────────────────────────────────────────────────────
C. FOCUS RINGS — AUTHENTIC
────────────────────────────────────────────────────────────────────

Every focusable element in the Mac shell should use:
  outline: 1px dotted #000000;
  outline-offset: 1px;

The dotted black outline is authentic to Mac OS 8. It should appear
on keyboard navigation (not mouse hover — use :focus-visible).
This is both aesthetic accuracy AND accessibility correctness.

────────────────────────────────────────────────────────────────────
D. WINDOW RESIZE HANDLES — PIXEL PERFECT
────────────────────────────────────────────────────────────────────

If window resizing is implemented, the resize handle (bottom-right
corner) should be the authentic Mac resize widget: a 16×16px area
with three diagonal lines, rendered as an SVG data-URI in the
CSS background:

  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><line x1='14' y1='2' x2='2' y2='14' stroke='%23999' stroke-width='1'/><line x1='14' y1='6' x2='6' y2='14' stroke='%23999' stroke-width='1'/><line x1='14' y1='10' x2='10' y2='14' stroke='%23999' stroke-width='1'/></svg>")

Cursor on this element: nwse-resize.

────────────────────────────────────────────────────────────────────
E. THE APPLE MENU LOGO — RAINBOW
────────────────────────────────────────────────────────────────────

The Apple logo in the menu bar should be the rainbow Apple —
the six-color striped version (not the monochrome modern logo).
Render it as an SVG with the six horizontal stripe clips.
Colors top to bottom: #61BB46, #FDB827, #F5821F, #E03A3E,
#963D97, #009DDC.
On hover: the logo very subtly brightens (filter: brightness(1.1)).
This logo existed. This site is set in 1998. Use the right logo.

────────────────────────────────────────────────────────────────────
F. WINDOW TITLE BAR — PINSTRIPE, FINALLY
────────────────────────────────────────────────────────────────────

The window title bars need the authentic platinum pinstripe texture.
Not a gradient. This specific CSS pattern:

  background-image: repeating-linear-gradient(
    to bottom,
    #e8e4de 0px,
    #e8e4de 1px,
    #d4d0ca 1px,
    #d4d0ca 2px
  );

Active window title bar uses the above.
Inactive window title bar uses the same pattern but with
colors shifted to #d8d4ce / #c8c4be — slightly cooler, dimmer.

The title text should be centered (not left-aligned) in ALL
windows. This is correct Mac behavior. Left-aligned titles
are Windows 95. This matters.

────────────────────────────────────────────────────────────────────
G. CONTEXT MENUS — IMPLEMENT EVERYWHERE
────────────────────────────────────────────────────────────────────

Right-click context menus, styled as authentic Mac OS 8 menus
(white background, 1px border, drop shadow below and right,
no rounded corners — sharp corners only):

  DESKTOP (right-click empty area):
    - New Folder → creates a "Folder [n]" icon on the desktop
      (purely cosmetic — clicking it opens a new empty Finder window)
    - Get Desktop Info → opens a Get Info window for "Desktop"
      with whimsical emotional metadata
    - Change Wallpaper → opens a mini window showing the 5 Hydra
      moods as static thumbnail previews; clicking one switches
      the Hydra shader immediately
    - ─────────────────
    - Empty Trash

  WINDOW TITLE BAR (right-click):
    - Close
    - Minimize / Restore
    - Get Info
    - ─────────────────
    - Send to Back (puts this window behind all others)

  DESKTOP ICON (right-click):
    - Open
    - Get Info
    - Move to Trash → icon disappears with a CSS shrink animation
      and a "crinkle" sound; a "Trash" counter badge on the
      dock Trash icon increments; items can be recovered before
      emptying

Implementation: a single ContextMenu React component, portaled
to document.body, positioned at cursor coordinates, closed on
any outside click or Escape.

────────────────────────────────────────────────────────────────────
H. LOADING STATES — EVERYWHERE THEY'RE MISSING
────────────────────────────────────────────────────────────────────

Any window or app that loads async content (Photobook, Browser,
Slideshow, GitHub repos) should show the authentic Mac "spinning
watch" cursor while loading, AND a small progress indicator
within the window content area.

The progress indicator: NOT a spinner. A horizontal line at the
very bottom of the window, extending from left to right using
a CSS animation (width: 0% → 100%, 1.2s ease-in-out), repeating
until load completes, then the line disappears with a 200ms fade.

Color: #0000aa — the Platinum selection blue.

────────────────────────────────────────────────────────────────────
I. THE TRASH ICON — MAKE IT FUNCTIONAL
────────────────────────────────────────────────────────────────────

The Trash in the dock is currently decorative. Complete it:

  - Empty state: standard empty trash can icon
  - Full state: trash can with visible paper/items inside
    (SVG art to match the felt icon style — hand-drawn)
  - Item count badge: a small circle with the count of trashed
    items (0 = no badge shown)
  - Drag-to-trash: desktop icons can be dragged to the Trash
    icon in the dock. On hover-over-trash while dragging:
    the Trash icon scales to 1.2× and the can "opens" (lid
    tilts up — a CSS rotation transform on just the lid element)
  - "Empty Trash" empties with animation: all badge numbers
    count down to 0, lid snaps shut, trash empties sound
  - Emptied items cannot be recovered (this is fine — it's a toy)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART FIVE — THE FINAL EXPERIENCE DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are not features. They are experiences. They exist to ensure
that a visitor who has spent 20 minutes on the site feels they have
been somewhere, not browsed something.

────────────────────────────────────────────────────────────────────
A. VISIT MEMORY — THE MACHINE KNOWS YOU
────────────────────────────────────────────────────────────────────

localStorage key: "esnupi.visitData.v1"
Stores: { visitCount, firstVisit, lastVisit, totalTimeMs,
          windowsOpened, secretFound, konamiUsed }

On each visit, increment visitCount and update timestamps.
Track time-on-site with a setInterval that saves every 30s.

Use this data in the following places:

  ABOUT THIS MAC PANEL (the emotional specs):
    Show "FIRST BOOT: [formatted date of first visit]"
    Show "UPTIME: [total time across all visits, formatted as
           '3h 14m across 7 sessions']"
    Show "LAST ACTIVE: [relative time, e.g., '4 days ago']"
    This makes the machine personal to the specific visitor.
    It remembers. It has been waiting.

  BOOT SEQUENCE (on return visits, visitCount > 1):
    Skip the full POST sequence. Show instead:
    A single line: "Welcome back." — just that. Then the Happy
    Mac immediately. The machine knows you. It doesn't need
    to introduce itself again.
    (The full POST runs ONLY on first visit, or after Restart.)

  NOTIFICATION HAIKU SELECTION:
    First 3 haikus are always the same sequence (authored,
    not random), to tell a story to first-time visitors.
    After that, random from the pool. Return visitors get
    new haikus sooner (the first 3 are skipped after visit 2).

────────────────────────────────────────────────────────────────────
B. FINDER WINDOW — A REAL FILE BROWSER
────────────────────────────────────────────────────────────────────

A double-click on the desktop background opens a Finder window —
not a folder, but the desktop's Finder, showing the same icons
that are on the desktop in a list-view table.

Layout:
  ┌──────────────────────────────────────────────────┐
  │  🗂  Desktop                                   □  │
  ├──────────────────────────────────────────────────┤
  │  Name ▲           Kind           Date Modified   │
  │  ────────────────────────────────────────────    │
  │  📁  Email         Application    today, 2:14 PM  │
  │  📁  Projects      Application    today, 2:14 PM  │
  │  📁  Terminal      Application    2 days ago      │
  │  ... etc                                          │
  └──────────────────────────────────────────────────┘

  - Columns are sortable by clicking headers (Name, Kind, Date)
  - Double-clicking a row opens that app (same as icon open)
  - Icon column shows small 16×16 versions of the felt art
  - "Date Modified" shows a poetic or whimsical value for each
    app ("the night I rewrote everything", "just now", etc.)
  - This window should feel like a real Finder list view,
    pixel for pixel, in Platinum style

────────────────────────────────────────────────────────────────────
C. CURSOR — THE FINAL PASS
────────────────────────────────────────────────────────────────────

Implement a FULL cursor set as SVG data-URIs:

  DEFAULT:       Classic Mac arrow (already exists — keep)
  POINTER:       The Mac "pointing hand" — index finger extended,
                 clean SVG illustration matching the felt art style
  TEXT:          Mac I-beam cursor (narrow, with serifs on ends)
  GRAB:          Open hand (5 fingers visible, slight spread)
  GRABBING:      Closed fist (while dragging windows/icons)
  WAIT:          Spinning beach ball — a CSS animated GIF or
                 a CSS animation using a conic-gradient div that
                 tracks the cursor position (complex but worth it)
  RESIZE (NESW): Standard resize arrows but in the Mac style
  NOT-ALLOWED:   The Mac "spinning wait" becomes a ⊘ symbol

Apply these via cursor: url(...) rules with specificity:
  - [draggable] elements: grab / grabbing
  - [data-loading] elements: wait
  - Interactive elements without pointer: default
  - Links and buttons: pointer
  - Text content: text
  - Title bars: grab (before drag), grabbing (during)

────────────────────────────────────────────────────────────────────
D. THE FINAL EASTER EGG — "INTERNALS"
────────────────────────────────────────────────────────────────────

One more hidden thing. No trigger is documented in the code
comments (just a plain function call). The trigger is:

  Type "esnupi" into the Typist application window.

(Not a keyboard shortcut. Not a hidden button. The user has to
actually use one of the apps, put their words in it, and the
word they type to unlock something is the name of the site itself.)

What happens:
  1. The Typist window border briefly flashes — a single frame
     of #FF3B00 before returning to Platinum.
  2. A new window opens: "INTERNALS" — 
     styled differently from ALL other windows:
     - Black title bar (not Platinum)
     - Monospace font throughout
     - Contains a real ASCII representation of the site's
       entire component tree (hand-authored, not generated)
       showing the actual structure of what was built
     - At the bottom: "built with care. [year]."
     - Below that: a list of every technology used, formatted
       as if it were a credits sequence in a film:
         HYDRA SYNTH .................. Olivia Jack
         GSAP ......................... GreenSock
         LENIS ........................ darkroom.engineering
         XTERM.JS ..................... xtermjs.org
         SUPABASE ..................... supabase.io
         REACT ........................ Meta Open Source
         VITE ......................... Evan You
         [etc.]
     - This is a love letter to the tools. It belongs here.

────────────────────────────────────────────────────────────────────
E. ACCESSIBILITY THAT DOESN'T BREAK THE DREAM
────────────────────────────────────────────────────────────────────

The site can be inaccessible in FEELING (dense, retro, demanding)
while being accessible in FUNCTION. These should coexist:

  - All images: meaningful alt text (not "felt icon" — "email icon,
    opens contact window")
  - All interactive elements: aria-label where text is absent
  - All windows: role="dialog", aria-labelledby pointing to
    the title bar text
  - Keyboard navigation: Tab moves through dock items and
    open window close/minimize buttons
  - Escape: closes the frontmost window (if one is open),
    or closes the most recently opened dropdown
  - The mobile alert: screen-reader readable, focus-trapped
  - Live haiku notifications: aria-live="polite" region so
    screen readers announce them without interrupting

  This is not a compromise. A machine that works for everyone
  is a better machine.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENTATION ORDER — READ THIS LAST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Not everything here can ship simultaneously. Prioritize in this order:

TIER 1 — HIGHEST RETURN ON EFFORT (do first):
  1. Dock magnification (Part 3A) — most visceral single upgrade
  2. Ambient audio layer (Part 1A) — transforms the whole feel
  3. Rainbow Apple logo (Part 4E) — 10 minutes, unforgettable
  4. Title bar pinstripe CSS (Part 4F) — pure CSS, instant polish
  5. Visit memory / "Welcome back" boot (Part 5A) — emotional payoff
  6. ::selection color override (Part 4A) — one line, right forever
  7. Window focus depth cues (Part 3B) — subtle, professional

TIER 2 — NEW PROGRAMS (order by complexity):
  8. Clock (Program C) — smallest, purest
  9. Typist (Program B) — small, useful, triggers the last easter egg
  10. Notepad (Program D) — straightforward
  11. Kaleidoscope (Program A) — canvas work, fun
  12. Slideshow (Program E) — requires content, highest design impact

TIER 3 — INTERACTION COMPLETION:
  13. Context menus everywhere (Part 4G)
  14. Trash functionality (Part 4I)
  15. Finder window (Part 5B)
  16. Menu dropdown animation (Part 3C)
  17. Minesweeper sound redesign (Part 1B)

TIER 4 — POLISH AND FINISHING:
  18. Scrapbook physics (Part 3E)
  19. Full cursor set (Part 5C)
  20. Shutdown audio redesign (Part 1B)
  21. INTERNALS easter egg (Part 5D)
  22. Accessibility pass (Part 5E)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL NOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When this is done, the site should make a person feel the following
things in sequence, on first visit:

  1. "Oh — this is a Mac desktop. I've seen this before."
  2. "Wait, this is actually working. I can do things."
  3. "There's something behind this. Something personal."
  4. "I want to find everything."

The fourth feeling is the one that makes a portfolio unforgettable.
It means the work has depth that rewards attention.
That is what this has always been trying to be.

Ship it.