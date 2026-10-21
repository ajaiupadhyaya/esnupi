/**
 * Canonical project list — consumed by the home page's Works/Experiments index
 * (`homeIndex.ts`) and the in-desktop "System Profiler" window (`WorkPanel`).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *   TO ADD / REPLACE A PROJECT
 * ─────────────────────────────────────────────────────────────────────────────
 *   1. Copy any existing entry below as a template.
 *   2. `href` is where the work itself lives (its repo, live app, or article).
 *      Leave it out when the work has no public home yet; the home index then
 *      lists it as plain text instead of linking somewhere it isn't.
 *   3. `id` is a stable slug (lowercase, hyphens, no spaces).
 *   4. `accession` is the wall-label number (e.g. "Esn-0001"). It is decorative,
 *      but keep them unique and sequential.
 *   5. `index` is the 2-digit display number (e.g. "01").
 *      Order of the array IS the order on the page.
 *   6. `kind` decides which column it shows up under:
 *         "drive" → Works (the finished things)
 *         "kext"  → Experiments (the loose, weird, in-progress things)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { CASE_STUDY_GITHUB, CASE_STUDY_URL } from "@/lib/caseStudyUrl";
export type ProjectKind = "drive" | "kext";

export type ProjectLink = {
  label: string;
  href: string;
  /** Optional — just used to style the little pill; "external" is the default. */
  kind?: "github" | "demo" | "press" | "writeup" | "external";
};

export type Project = {
  /** Stable URL-safe slug. */
  id: string;
  /** 2-digit display number. */
  index: string;
  /** Wall-label serial — decorative but please keep unique. */
  accession: string;
  /** Drives = finished works, kexts = experiments / loose tools. */
  kind: ProjectKind;
  title: string;
  year: string;
  role: string;
  /** Tiny 1–2 line description shown on the home index and in the Profiler window. */
  blurb: string;
  /** Where the work itself lives. Omit when it has no public home. */
  href?: string;
  tags: string[];
  links: ProjectLink[];
  status?: "complete" | "ongoing" | "shelved";
  /** Purely for the decorative hex-dump effect in the Profiler window. */
  hex?: string;
};

const gh = (repo: string) => `https://github.com/ajaiupadhyaya/${repo}`;

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
    href: gh("privatecredit"),
    tags: ["Blue Owl", "Interest Rates", "Regulation", "2026"],
    status: "complete",
    hex: "7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00",
    links: [{ label: "GitHub", href: gh("privatecredit"), kind: "github" }],
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
    href: gh("gpus-substack"),
    tags: ["GPUs", "Data Centers", "AI", "Investor Relations"],
    status: "complete",
    hex: "c0 ff ee c0 ff ee 00 00 01 00 00 00 00 00 00 00",
    links: [{ label: "GitHub", href: gh("gpus-substack"), kind: "github" }],
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
    tags: ["Computer Vision", "Investment Research", "2026"],
    status: "complete",
    hex: "de ad be ef 00 00 00 10 fa ce b0 0c 00 00 00 01",
    links: [],
  },
  {
    id: "case-study-dashboard",
    index: "04",
    accession: "Esn-0004",
    kind: "drive",
    title: "Case Study Dashboard",
    year: "2026",
    role: "Applied financial math · decision-making · writing",
    blurb:
      "Interactive dashboard of applied finance case studies — models, writeups, and outcomes collected in one place.",
    href: CASE_STUDY_URL,
    tags: ["Finance", "Modeling", "Dashboard", "2026"],
    status: "complete",
    hex: "ca 5e 0d 15 74 75 64 79 20 64 61 73 68 62 6f 61",
    links: [
      { label: "Open dashboard", href: CASE_STUDY_URL, kind: "demo" },
      { label: "GitHub", href: CASE_STUDY_GITHUB, kind: "github" },
    ],
  },
  {
    id: "machine-learning-investment-research",
    index: "05",
    accession: "Esn-0101",
    kind: "kext",
    title: "Machine Learning strategies for investment research",
    year: "2026",
    role: "Machine Learning · Investment Research · Writing",
    blurb: "Independent investigation into the use of machine learning for investment research and the impact on the investment industry.",
    tags: ["Machine Learning", "Investment Research", "2026"],
    status: "ongoing",
    hex: "55 aa 55 aa 00 ff 11 ee 22 dd 33 cc 44 bb 55 aa",
    links: [],
  },
  {
    id: "financial-modeling-wealth-management",
    index: "06",
    accession: "Esn-0102",
    kind: "kext",
    title: "Financial Modeling for Wealth Management",
    year: "2026",
    role: "Wealth Management · Financial Modeling · Writing",
    blurb: "Independent investigation into the use of financial modeling for wealth management and the impact on the wealth management industry.",
    tags: ["Wealth Management", "Financial Modeling", "2026"],
    status: "ongoing",
    hex: "00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff",
    links: [],
  },
  {
    id: "autonomous-option-pricing-model",
    index: "07",
    accession: "Esn-0103",
    kind: "kext",
    title: "Autonomous Option Pricing Model",
    year: "2026",
    role: "Option Pricing · Autonomous Systems · Writing",
    blurb: "Independent investigation into the use of autonomous option pricing models and the impact on the option pricing industry.",
    tags: ["Option Pricing", "Autonomous Systems", "2026"],
    status: "complete",
    hex: "fa de d1 0b ff ff 00 00 aa 55 aa 55 99 99 00 00",
    links: [],
  },
];

/** Utility: grouped by kind for the Profiler window. */
export const PROJECTS_BY_KIND: Record<ProjectKind, Project[]> = {
  drive: PROJECTS.filter((p) => p.kind === "drive"),
  kext: PROJECTS.filter((p) => p.kind === "kext"),
};
