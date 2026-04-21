Build a **hyper-brutalist, MoMA-inspired film photography gallery page** for a portfolio website. The design should feel like a **minimalist white museum wall**, but with subtle experimental/interactive elements.

### Core Concept

* The entire viewport is a **pure white gallery wall** (slightly off-white, textured like plaster or painted drywall).
* The experience is **horizontal scrolling (left → right)** only.
* High-resolution film photos are arranged in a continuous horizontal strip, edge-to-edge, filling most of the vertical height.
* No traditional UI clutter—everything should feel intentional, sparse, and curated.

---

### Image Interaction (Primary Experience)

* One image at a time is always considered the **“active” piece**.

* The image closest to the center of the screen:

  * Smoothly transitions into a **framed state**:

    * Thin black or aluminum frame
    * Subtle drop shadow (museum lighting feel)
    * Slight scale-up (e.g., 1.05x)
  * All other images remain unframed and slightly dimmed/desaturated.

* Transition behavior:

  * As the user scrolls, images should **glide smoothly into the frame position**.
  * Use easing (spring or cubic-bezier) so it feels physical and intentional.

---

### Optional Character Animation (Tasteful + Minimal)

* Either:

  1. A **simple, line-drawn museum worker (cartoon figure)** walks in, lifts the image, and places it into the frame.
     OR
  2. The image **mechanically slides into the frame** (preferred fallback for minimalism).

* If implemented:

  * Style: ultra-minimal, black line art (almost like Museum of Modern Art exhibition signage)
  * Animation should be subtle, not distracting or playful to the point of breaking tone.

---

### Museum Label (Metadata Panel)

* When an image is active (centered):

  * A **small label appears to the right or bottom-right** of the frame.
  * Typography:

    * Sans-serif (Helvetica/Neue Haas Grotesk style)
    * Small, clean, museum-like
  * Content example:

    * Title
    * Location
    * Year
    * Camera/Film stock (optional)
    * 1–2 sentence description

* Behavior:

  * Fades/slides in when image becomes active
  * Fades out when leaving center

---

### Graffiti System (Creative Tool Layer)

Add a toggleable **“intervention mode”** (graffiti system):

#### Toolbar (minimal, floating or collapsible)

* Spray paint tool
* Marker/pen tool
* Eraser
* Color picker
* Stroke size slider
* Undo/redo
* Clear canvas

#### Behavior:

* Users can draw **anywhere on the page**, including:

  * Over images
  * Over the wall
* Drawing layer sits above all content (canvas overlay).
* Should feel raw and slightly imperfect (not overly smoothed).

#### Aesthetic Direction:

* Contrast the clean museum with chaotic user expression.
* Think: vandalism vs curation tension.

#### Persistence (optional but ideal):

* Store drawings locally (localStorage or indexedDB)
* Optional: allow export as image

---

### Brutalist UI Details

* Cursor:

  * Custom cursor (crosshair or minimal square)
* Scroll indicator:

  * Thin, almost hidden progress bar or subtle numeric index (e.g., “03 / 17”)
* No gradients unless extremely subtle
* Hard edges, clean lines
* Occasional intentional “imperfections” (slight jitter, grain, film dust overlays)

---

### Motion & Feel

* Use **buttery smooth horizontal scroll** (GSAP or native scroll with inertia).
* Add **subtle film grain overlay** across the entire page.
* Optional:

  * Very faint ambient gallery audio
  * Light flicker like fluorescent museum lighting

---

### Performance Constraints

* Images are extremely high resolution:

  * Use progressive loading / lazy loading
  * Consider responsive sizing (serve lower res until active)
* Maintain 60fps interactions
* Use GPU-accelerated transforms

---

### Tech Stack Suggestions

* Frontend: React + Tailwind (or minimal CSS if preferred)
* Animation: GSAP or Framer Motion
* Canvas layer: HTML5 Canvas or Fabric.js for graffiti system
* Image handling: optimized loading (Next.js Image or similar)

---

### Bonus Ideas (if they fit cleanly)

* “Curator mode” toggle (removes graffiti layer, ultra-clean view)
* Randomize order button
* Subtle hover metadata before full activation
* Ability to “pin” a photo

---

### Overall Vibe

* Minimal but intentional
* Museum-grade presentation
* Brutalist, but not messy
* High contrast between **order (gallery)** and **chaos (graffiti)**

Avoid anything that feels like a typical gallery website. This should feel like an **interactive digital exhibition piece**, not a template.
