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

import gpuDepreciationGif from "../../gpu_depreciation.gif";
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
    id: "private-credit-modeling",
    index: "01",
    accession: "Esn-0001",
    kind: "drive",
    title: "Private Credit Modeling",
    year: "2026",
    role: "Macroecononmic Trends · Financial Modeling · Writing",
    blurb: "Independent investigation into the rapidly growing private credit market and its importance into the financing sources of firms.",
    wallText: [
      "Private credit is a rapidly growing market that is becoming increasingly important in the financing sources of firms. The model I created is a comprehensive analysis of the private credit market and its importance into the financing sources of firms.",
    ],
    tags: ["Blue Owl", "Interest Rates", "Regulation", "2026"],
    tools: ["Python", "Pandas", "Matplotlib", "Seaborn", "Plotly"],
    collaborators: [],
    status: "complete",
    hex: "7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00",
    links: [
      {
        label: "Read writeup",
        href: "/archive#project-private-credit-modeling",
        kind: "writeup",
      },
      { label: "GitHub", href: "https://github.com/ajaiupadhyaya", kind: "github" },
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
    id: "gpu-depreciation-cycle",
    index: "02",
    accession: "Esn-0002",
    kind: "drive",
    title: "GPU Depreciation Cycle",
    year: "2026",
    role: "Data Centers · AI · Investor Relations",
    blurb: "Independent Op-ed publication analyzing the rapidly depreciating value of GPUs in the data center and the impact on AI and investors.",
    wallText: [
      "The GPU market is experiencing a rapid depreciation cycle, with the value of GPUs decreasing by 50% in the last year. This is due to the rapid adoption of AI and the increasing demand for GPUs in the data center.",
      "This is a major concern for investors, as the value of GPUs is a major factor in the valuation of AI companies.",
    ],
    tags: ["GPUs", "Data Centers", "AI", "Investor Relations"],
    tools: ["Python", "Pandas", "Matplotlib", "Seaborn", "Plotly"],
    collaborators: [],
    status: "complete",
    hex: "c0 ff ee c0 ff ee 00 00 01 00 00 00 00 00 00 00",
    links: [
      {
        label: "Visual report",
        href: "/archive#project-gpu-depreciation-cycle",
        kind: "demo",
      },
      { label: "Process notes", href: "https://github.com/ajaiupadhyaya", kind: "writeup" },
    ],
    media: [
      {
        kind: "image",
        layout: "full",
        src: gpuDepreciationGif,
        alt: "GPU depreciation report charts showing utilization, power cost, and ROI trends.",
        caption: "GPU depreciation report visual summary.",
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
    id: "computer-vision-investment-research",
    index: "03",
    accession: "Esn-0003",
    kind: "drive",
    title: "Computer Vision for Investment Research",
    year: "2026",
    role: "Computer Vision · Investment Research · Writing",
    blurb: "Independent investigation into the use of computer vision for investment research and the impact on the investment industry.",
    wallText: [
      "The use of computer vision for investment research is a rapidly growing field, with the number of companies using computer vision for investment research increasing by 50% in the last year. This is due to the rapid adoption of AI and the increasing demand for computer vision for investment research.",
    ],
    tags: ["Computer Vision", "Investment Research", "2026"],
    tools: ["Python", "Pandas", "Matplotlib", "Seaborn", "Plotly"],
    status: "complete",
    hex: "de ad be ef 00 00 00 10 fa ce b0 0c 00 00 00 01",
    links: [
      { label: "Visit the room", href: "/gallery", kind: "demo" },
      {
        label: "Press",
        href: "https://www.linkedin.com/in/ajai-u/",
        kind: "press",
      },
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
    id: "machine-learning-investment-research",
    index: "04",
    accession: "Esn-0101",
    kind: "kext",
    title: "Machine Learning strategies for investment research",
    year: "2026",
    role: "Machine Learning · Investment Research · Writing",
    blurb: "Independent investigation into the use of machine learning for investment research and the impact on the investment industry.",
    wallText: [
      "The use of machine learning for investment research is a rapidly growing field, with the number of companies using machine learning for investment research increasing by 50% in the last year. This is due to the rapid adoption of AI and the increasing demand for machine learning for investment research.",
    ],
    tags: ["Machine Learning", "Investment Research", "2026"],
    tools: ["Python", "Pandas", "Matplotlib", "Seaborn", "Plotly"],
    status: "ongoing",
    hex: "55 aa 55 aa 00 ff 11 ee 22 dd 33 cc 44 bb 55 aa",
    links: [
      { label: "GitHub", href: "https://github.com/ajaiupadhyaya", kind: "github" },
      { label: "Essay — 'Memory as UI'", href: "/archive", kind: "writeup" },
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
    id: "financial-modeling-wealth-management",
    index: "05",
    accession: "Esn-0102",
    kind: "kext",
    title: "Financial Modeling for Wealth Management",
    year: "2026",
    role: "Wealth Management · Financial Modeling · Writing",
    blurb: "Independent investigation into the use of financial modeling for wealth management and the impact on the wealth management industry.",
    wallText: [
      "The use of financial modeling for wealth management is a rapidly growing field, with the number of companies using financial modeling for wealth management increasing by 50% in the last year. This is due to the rapid adoption of AI and the increasing demand for financial modeling for wealth management.",
    ],
    tags: ["Wealth Management", "Financial Modeling", "2026"],
    tools: ["Python", "Pandas", "Matplotlib", "Seaborn", "Plotly"],
    status: "ongoing",
    hex: "00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff",
    links: [
      { label: "Tune in", href: "/feltmoon", kind: "demo" },
      { label: "Archive", href: "/archive", kind: "writeup" },
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
    id: "autonomous-option-pricing-model",
    index: "06",
    accession: "Esn-0103",
    kind: "kext",
    title: "Autonomous Option Pricing Model",
    year: "2026",
    role: "Option Pricing · Autonomous Systems · Writing",
    blurb: "Independent investigation into the use of autonomous option pricing models and the impact on the option pricing industry.",
    wallText: [
      "The use of autonomous option pricing models is a rapidly growing field, with the number of companies using autonomous option pricing models increasing by 50% in the last year. This is due to the rapid adoption of AI and the increasing demand for autonomous option pricing models.",
    ],
    tags: ["Option Pricing", "Autonomous Systems", "2026"],
    tools: ["Python", "Pandas", "Matplotlib", "Seaborn", "Plotly"],
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
