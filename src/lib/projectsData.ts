/**
 * Canonical project list — consumed by BOTH the in-desktop "System Profiler"
 * window (`WorkPanel`) and the full /archive page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *   TO ADD / REPLACE A PROJECT
 * ─────────────────────────────────────────────────────────────────────────────
 *   1. Copy any existing entry below as a template.
 *   2. Replace the placeholder copy and Unsplash image URLs (marked TODO).
 *      For local images: `import foo from "../../images/foo.jpg"` at the top
 *      of this file, then set `src: foo`.
 *   3. `id` becomes the URL anchor — `/archive#project-<id>` — so keep it
 *      slug-safe (lowercase, hyphens, no spaces).
 *   4. `accession` is the wall-label number (e.g. "Esn-0001"). It is decorative,
 *      but it is ALSO the invisible thread that holds a MoMA-ish catalog
 *      together — keep them unique and sequential.
 *   5. `index` is the 2-digit display number on the archive index (e.g. "01").
 *      Order of the array IS the order on the page.
 *   6. `kind` decides which column it shows up under in the System Profiler:
 *         "drive" → Works (the finished things)
 *         "kext"  → Experiments (the loose, weird, in-progress things)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ProjectKind = "drive" | "kext";

export type ProjectLink = {
  label: string;
  href: string;
  /** Optional — just used to style the little pill; "external" is the default. */
  kind?: "github" | "demo" | "press" | "writeup" | "external";
};

export type ProjectMedia =
  | {
      kind: "image";
      src: string;
      alt: string;
      caption?: string;
      /**
       * Governs the layout slot this image takes in the case-study flow.
       *   "full" → edge-to-edge hero
       *   "wide" → 16:9-ish inside column (default for most shots)
       *   "tall" → vertical, paired with its neighbour
       *   "half" → 50/50 paired with its neighbour
       */
      layout?: "full" | "wide" | "tall" | "half";
    }
  | {
      kind: "video";
      src: string;
      poster?: string;
      caption?: string;
      layout?: "full" | "wide";
    };

export type Project = {
  /** URL-safe slug, used as `#project-<id>` anchor. */
  id: string;
  /** 2-digit display number shown on the index. */
  index: string;
  /** Wall-label serial — decorative but please keep unique. */
  accession: string;
  /** Drives = finished works, kexts = experiments / loose tools. */
  kind: ProjectKind;
  title: string;
  year: string;
  role: string;
  /** Tiny 1–2 line description shown in the in-desktop Profiler window. */
  blurb: string;
  /** Paragraph(s) of wall text — longform case study body. */
  wallText: string[];
  tags: string[];
  tools: string[];
  collaborators?: string[];
  links: ProjectLink[];
  media: ProjectMedia[];
  status?: "complete" | "ongoing" | "shelved";
  /** Purely for the decorative hex-dump effect in the Profiler window. */
  hex?: string;
};

/* ────────────────────────────────────────────────────────────────────────── */
/*   PLACEHOLDER DATA — replace freely. All Unsplash URLs are marked TODO.    */
/* ────────────────────────────────────────────────────────────────────────── */

export const PROJECTS: Project[] = [
  {
    id: "quiet-machines",
    index: "01",
    accession: "Esn-0001",
    kind: "drive",
    title: "Quiet Machines",
    year: "2025",
    role: "Direction · Electronics · Writing",
    blurb: "A series of small devices that only run when nobody is watching them.",
    wallText: [
      "Quiet Machines began as a question about attention: what does a tool do with the time you give it back? Six objects — a lamp, a clock, a radio, a scale, a kettle, a door — were fitted with sensors that detect human presence and refuse to function while being observed.",
      "The work is shown dark. Visitors are asked to leave the room; the show happens behind their backs. What they receive instead is a log, printed nightly, of what the objects did in their absence.",
      "The result is a portrait of a room that prefers its own company, and a small argument against the demand that every object perform for its user.",
    ],
    tags: ["installation", "hardware", "sensor-art", "2025"],
    tools: ["Rust", "ESP32", "thermal printer", "machined aluminium", "TOF sensors"],
    collaborators: ["— TODO: collaborator name"],
    status: "complete",
    hex: "7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00",
    links: [
      { label: "Read writeup", href: "#", kind: "writeup" },
      { label: "GitHub", href: "https://github.com/", kind: "github" },
    ],
    // TODO: Replace Unsplash placeholders with your own photographs.
    media: [
      {
        kind: "image",
        layout: "full",
        src: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=max&w=2400&q=85",
        alt: "A dim industrial interior.",
        caption: "Install view, Room B, night of opening.",
      },
      {
        kind: "image",
        layout: "half",
        src: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=max&w=1600&q=85",
        alt: "Detail of a small machined device on a concrete surface.",
      },
      {
        kind: "image",
        layout: "half",
        src: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=max&w=1600&q=85",
        alt: "Circuitry close-up, selectively lit.",
        caption: "Prototype v3 — sensor stack with custom carrier board.",
      },
      {
        kind: "image",
        layout: "wide",
        src: "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=max&w=2400&q=85",
        alt: "Low-angle shot of an empty gallery at night.",
        caption: "The show, as visitors were instructed to leave it.",
      },
    ],
  },
  {
    id: "felt-cursor",
    index: "02",
    accession: "Esn-0002",
    kind: "drive",
    title: "Felt Cursor",
    year: "2024",
    role: "Concept · Fabrication · Interface",
    blurb: "A pointing device made entirely of fabric and intent.",
    wallText: [
      "Felt Cursor is a tactile mouse — hand-sewn from wool felt, stitched over a capacitive core — paired with a custom driver that translates cloth-pressure into screen motion.",
      "The work is a soft joke about hardness. A computer interface is asked to be gentle. The cursor moves like a slow animal and refuses velocity. Users report it changes how they write email.",
    ],
    tags: ["interface", "textile", "haptics"],
    tools: ["Wool felt", "conductive thread", "Teensy 4.1", "C++ HID firmware"],
    collaborators: [],
    status: "complete",
    hex: "c0 ff ee c0 ff ee 00 00 01 00 00 00 00 00 00 00",
    links: [
      { label: "Demo video", href: "#", kind: "demo" },
      { label: "Process notes", href: "#", kind: "writeup" },
    ],
    media: [
      {
        kind: "image",
        layout: "full",
        src: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=max&w=2400&q=85",
        alt: "A soft textured object against a neutral background.",
        caption: "Felt Cursor v2, in the studio.",
      },
      {
        kind: "image",
        layout: "tall",
        src: "https://images.unsplash.com/photo-1529068755536-a5ade0dcb4e8?auto=format&fit=max&w=1400&q=85",
        alt: "Close-up of stitched wool texture.",
      },
      {
        kind: "image",
        layout: "tall",
        src: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=max&w=1400&q=85",
        alt: "Cursor placed on a desk beside a keyboard.",
        caption: "In use. The cursor has opinions.",
      },
    ],
  },
  {
    id: "room-with-a-window",
    index: "03",
    accession: "Esn-0003",
    kind: "drive",
    title: "Room With A Window",
    year: "2024",
    role: "Creative direction · Front-end",
    blurb: "Browser installation for a gallery that refused to open.",
    wallText: [
      "A site-specific web piece commissioned for a show that was cancelled two weeks before opening. Rather than delete the work, we exhibited the gallery instead: visitors received a URL; the URL displayed the closed gallery, streamed live, with the show that was never installed rendered as a WebGL ghost layered over it.",
      "The piece asks what a room is for when nothing is in it. For two months, an empty room had more viewers than a full one would have.",
    ],
    tags: ["web", "webgl", "site-specific", "2024"],
    tools: ["TypeScript", "Three.js", "GLSL", "live RTSP stream"],
    status: "complete",
    hex: "de ad be ef 00 00 00 10 fa ce b0 0c 00 00 00 01",
    links: [
      { label: "Visit the room", href: "#", kind: "demo" },
      { label: "Press", href: "#", kind: "press" },
    ],
    media: [
      {
        kind: "image",
        layout: "full",
        src: "https://images.unsplash.com/photo-1545231027-637d2f6210f8?auto=format&fit=max&w=2400&q=85",
        alt: "An empty white gallery room seen through a doorway.",
        caption: "The subject of the piece — the room itself.",
      },
      {
        kind: "image",
        layout: "wide",
        src: "https://images.unsplash.com/photo-1520697222860-fadff64f1155?auto=format&fit=max&w=2400&q=85",
        alt: "A window casting a patch of light onto a gallery floor.",
      },
      {
        kind: "image",
        layout: "half",
        src: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=max&w=1600&q=85",
        alt: "A visitor reflected in a gallery window.",
      },
      {
        kind: "image",
        layout: "half",
        src: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=max&w=1600&q=85",
        alt: "Late afternoon light across polished concrete.",
        caption: "Stream still, 16:42 local.",
      },
    ],
  },
  {
    id: "echo-index",
    index: "04",
    accession: "Esn-0101",
    kind: "kext",
    title: "Echo Index",
    year: "2023",
    role: "R&D · Writing",
    blurb: "A search engine that can only find things you already know.",
    wallText: [
      "Echo Index is a personal search engine that indexes only what the user has already read, watched, or typed. It cannot return anything new. It is, in effect, a rehearsal tool — a librarian for your own mind.",
      "The project is a quiet argument against recommendation systems. Where the modern web hands you something new in exchange for your attention, Echo Index offers the opposite: a return to what you have already agreed to be shaped by.",
    ],
    tags: ["tool", "research", "LLM", "privacy"],
    tools: ["Rust", "SQLite", "local embeddings (bge-small)", "OCR pipeline"],
    status: "ongoing",
    hex: "55 aa 55 aa 00 ff 11 ee 22 dd 33 cc 44 bb 55 aa",
    links: [
      { label: "GitHub", href: "https://github.com/", kind: "github" },
      { label: "Essay — 'Memory as UI'", href: "#", kind: "writeup" },
    ],
    media: [
      {
        kind: "image",
        layout: "wide",
        src: "https://images.unsplash.com/photo-1456081445129-830eb8d4bfc6?auto=format&fit=max&w=2400&q=85",
        alt: "An old library shelf, warm light.",
        caption: "The ancestor of every search engine.",
      },
      {
        kind: "image",
        layout: "full",
        src: "https://images.unsplash.com/photo-1519452575417-564c1401ecc0?auto=format&fit=max&w=2400&q=85",
        alt: "Stacked reading material and handwritten notes on a desk.",
      },
    ],
  },
  {
    id: "late-night-channel",
    index: "05",
    accession: "Esn-0102",
    kind: "kext",
    title: "Late Night Channel",
    year: "2022",
    role: "Direction · Generative system · Score",
    blurb: "A generative broadcast for the hour nobody is watching.",
    wallText: [
      "Late Night Channel runs a single stream to nobody, every night, between 03:14 and 04:44 local. The stream is generative: title cards, stills, static, an ambient score, and the occasional sincere confession from the machine that is making it.",
      "The piece exists to be missed. It is gentle on purpose. A viewer counter was removed from the feed after the first week because it felt impolite.",
    ],
    tags: ["broadcast", "generative", "sound"],
    tools: ["FFmpeg", "SuperCollider", "Hydra", "Node"],
    status: "ongoing",
    hex: "00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff",
    links: [
      { label: "Tune in", href: "#", kind: "demo" },
      { label: "Archive", href: "#", kind: "writeup" },
    ],
    media: [
      {
        kind: "image",
        layout: "full",
        src: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=max&w=2400&q=85",
        alt: "A glowing television set in a dark room.",
        caption: "Channel on, 03:17.",
      },
      {
        kind: "image",
        layout: "tall",
        src: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=max&w=1400&q=85",
        alt: "Abstract analog video noise.",
      },
      {
        kind: "image",
        layout: "tall",
        src: "https://images.unsplash.com/photo-1518676590629-3dcba9c5a555?auto=format&fit=max&w=1400&q=85",
        alt: "A silent city block at 4am.",
      },
    ],
  },
  {
    id: "study-light",
    index: "06",
    accession: "Esn-0103",
    kind: "kext",
    title: "Study — Light, Surface, Sequence",
    year: "2022",
    role: "Photography · Print",
    blurb: "A photographic study of what stays when subject is removed.",
    wallText: [
      "A loose body of photographs made across six rooms in three cities. No subject was asked to be there; the images are of the rooms after people left. The work is an argument for the object quality of attention.",
      "Prints exist as a limited edition (12, plus 3 APs). Every print is made on the morning after the exposure.",
    ],
    tags: ["photography", "print", "study"],
    tools: ["Medium format film", "hand-printed silver gelatin"],
    status: "complete",
    hex: "fa de d1 0b ff ff 00 00 aa 55 aa 55 99 99 00 00",
    links: [
      { label: "Open related exhibition →", href: "/gallery", kind: "external" },
    ],
    media: [
      {
        kind: "image",
        layout: "full",
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=2400&q=85",
        alt: "Soft mountain tones dissolving into sky.",
        caption: "Altitude, 2022.",
      },
      {
        kind: "image",
        layout: "half",
        src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57f90?auto=format&fit=max&w=1600&q=85",
        alt: "Abstract pale surface with shadow.",
      },
      {
        kind: "image",
        layout: "half",
        src: "https://images.unsplash.com/photo-1500534314211-6a8a052b84e0?auto=format&fit=max&w=1600&q=85",
        alt: "Forest edge at daybreak.",
      },
    ],
  },
];

/** Utility: grouped by kind for the Profiler window. */
export const PROJECTS_BY_KIND: Record<ProjectKind, Project[]> = {
  drive: PROJECTS.filter((p) => p.kind === "drive"),
  kext: PROJECTS.filter((p) => p.kind === "kext"),
};

export function findProject(id: string | undefined | null): Project | undefined {
  if (!id) return undefined;
  return PROJECTS.find((p) => p.id === id);
}
