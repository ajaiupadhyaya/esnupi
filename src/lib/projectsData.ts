/**
 * Canonical project list — consumed by the home page's Works/Experiments index
 * (`homeIndex.ts`), the in-desktop "System Profiler" window (`WorkPanel`), and
 * /publications.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *   TO ADD / REPLACE A PROJECT
 * ─────────────────────────────────────────────────────────────────────────────
 *   1. Copy any existing entry below as a template.
 *   2. Every Work and Experiment lives on /publications. The home index links
 *      each one to `publicationHref(id)`; give it a "Read the report" link
 *      with the same href so the System Profiler does too. Never link a
 *      project straight to GitHub.
 *   3. To publish its report, put the PDF at `public/reports/<id>.pdf` and set
 *      `report: { src: "/reports/<id>.pdf", date: "…", pages: N }`. Without
 *      `report`, its /publications entry reads "In preparation".
 *   4. `id` is a stable slug (lowercase, hyphens, no spaces).
 *   5. `accession` is the wall-label number (e.g. "Esn-0001"). It is decorative,
 *      but keep them unique and sequential.
 *   6. `index` is the 2-digit display number (e.g. "01").
 *      Order of the array IS the order on the page.
 *   7. `kind` decides which column it shows up under:
 *         "drive" → Works (the finished things)
 *         "kext"  → Experiments (the loose, weird, in-progress things)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { CASE_STUDY_URL } from "@/lib/caseStudyUrl";
export type ProjectKind = "drive" | "kext";

/** Where a project lives on this site: /publications, opened at that project. */
export function publicationHref(id: string) {
  return `/publications#${id}`;
}

export type ProjectLink = {
  label: string;
  href: string;
  /** Optional — just used to style the little pill; "external" is the default. */
  kind?: "github" | "demo" | "press" | "writeup" | "external";
};

/** The PDF shown for a project on /publications. */
export type ProjectReport = {
  /** Root-relative path to the PDF in `public/`, e.g. "/reports/private-credit-modeling.pdf". */
  src: string;
  /** Cover title, if it differs from the project title. */
  title?: string;
  /** Publication date as it should read on the page, e.g. "October 2026". */
  date?: string;
  pages?: number;
  /** One-paragraph abstract; falls back to the project's `blurb`. */
  abstract?: string;
};

export type Project = {
  /** Stable URL-safe slug; also its anchor on /publications. */
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
  tags: string[];
  links: ProjectLink[];
  /** The published PDF — see step 3 above. */
  report?: ProjectReport;
  status?: "complete" | "ongoing" | "idea" | "shelved";
  /** Purely for the decorative hex-dump effect in the Profiler window. */
  hex?: string;
};

function reportLink(id: string): ProjectLink {
  return { label: "Read the report", href: publicationHref(id), kind: "writeup" };
}

export const PROJECTS: Project[] = [
  {
    id: "delegating-to-the-machine",
    index: "01",
    accession: "Esn-0005",
    kind: "drive",
    title: "Delegating to the Machine",
    year: "2026",
    role: "Pre-registered research · Econometrics · Asset Pricing",
    blurb:
      "Pre-registered study of how people hand work to AI, using the Anthropic Economic Index, and whether industry stock returns priced it. Paper on SSRN, one-command replication.",
    tags: ["AI", "Labour", "Asset Pricing", "Pre-registration", "2026"],
    status: "complete",
    hex: "70 61 70 2d 76 31 00 00 de 1e 9a 7e 00 00 00 01",
    links: [
      reportLink("delegating-to-the-machine"),
      { label: "SSRN", href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7667658", kind: "press" },
      { label: "Zenodo DOI", href: "https://doi.org/10.5281/zenodo.23631273", kind: "external" },
    ],
    // The paper exactly as released (tag v1.0.0), appendices included.
    report: {
      src: "/reports/delegating-to-the-machine.pdf",
      title: "Delegating to the Machine: How People Hand Work to AI, and Whether Equity Markets Priced It",
      date: "October 2026",
      pages: 396,
    },
  },
  {
    id: "sharp-markets",
    index: "02",
    accession: "Esn-0006",
    kind: "drive",
    title: "Are Prediction Markets Sharp?",
    year: "2026",
    role: "Registered report · Forecast evaluation · Market microstructure",
    blurb:
      "Do Kalshi and Polymarket price European football as well as the Betfair Exchange closing line? 2025–26 says yes, and better than bookmakers; the pre-registered test runs on 2026–27.",
    tags: ["Prediction Markets", "Kalshi", "Polymarket", "Pre-registration", "2026"],
    status: "ongoing",
    hex: "73 74 61 67 65 31 00 00 70 61 70 2d 76 31 00 02",
    links: [
      reportLink("sharp-markets"),
      // The pre-analysis plan stays on GitHub: it is pinned to the pap-v1 tag, which is what makes it a pre-registration.
      { label: "Pre-analysis plan", href: "https://github.com/ajaiupadhyaya/sharp-markets/blob/pap-v1/docs/pap/pre-analysis-plan.md", kind: "external" },
    ],
    // The stage-1 paper as released (tag stage1-v1); the confirmatory result is added after 30 June 2027.
    report: {
      src: "/reports/sharp-markets.pdf",
      date: "October 2026",
      pages: 10,
    },
  },
  {
    id: "forecasting-or-remembering",
    index: "03",
    accession: "Esn-0013",
    kind: "drive",
    title: "Forecasting or Remembering?",
    year: "2026",
    role: "Empirical finance · LLM evaluation · Look-ahead bias",
    blurb:
      "Is LLM stock prediction from headlines signal or memory? Four prompts that differ only in what Qwen2.5 sees: the headline carries the signal, the firm's name adds about 0.01 of AUC, and nothing survives to the next session.",
    tags: ["LLMs", "Look-ahead bias", "News", "Asset Pricing", "2026"],
    status: "complete",
    hex: "6c 6f 6f 6b 61 68 65 61 64 00 00 00 00 00 00 13",
    links: [reportLink("forecasting-or-remembering")],
    // House-style report (esnupi Publications No. 31), built from the lookahead-probe results.
    report: {
      src: "/reports/forecasting-or-remembering.pdf",
      date: "November 2026",
      pages: 10,
      abstract:
        "Qwen2.5-7B and 32B scored 18,144 FNSPID headlines four ways: with date, firm and headline; without the date; with the firm's name hidden; and with no headline. On the same-session move the full prompt reaches an AUC of 0.565 and 0.570, the name-hidden prompt 0.555 and 0.561, and no headline 0.507 and 0.509. Most of the signal sits in headlines that report the move; on the next session the AUC is 0.505 to 0.508. On 20,262 Benzinga headlines either side of the training cutoff, every prompt that reads the headline loses about 0.02, the name-hidden one included.",
    },
  },
  {
    id: "rental-implied-depreciation",
    index: "04",
    accession: "Esn-0014",
    kind: "drive",
    title: "Rental-Implied Depreciation",
    year: "2026",
    role: "Empirical finance · Identification · Accounting",
    blurb:
      "How fast do AI accelerators lose value? Nine years of posted GPU rents, four identification strategies and a seven-firm earnings restatement: rents fall slowly, the shape flips with the market, and rents never reach running costs.",
    tags: ["GPUs", "Depreciation", "Hedonic pricing", "Accounting", "2026"],
    status: "complete",
    hex: "72 65 6e 74 61 6c 00 00 67 70 75 00 00 00 00 14",
    links: [
      reportLink("rental-implied-depreciation"),
      { label: "SSRN", href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7692700", kind: "press" },
      { label: "Zenodo DOI", href: "https://doi.org/10.5281/zenodo.24143074", kind: "external" },
      { label: "Data DOI", href: "https://doi.org/10.5281/zenodo.24143180", kind: "external" },
    ],
    // The working paper exactly as released (tag v1.0.1).
    report: {
      src: "/reports/rental-implied-depreciation.pdf",
      title: "Rental-Implied Depreciation of AI Accelerators: Why the Estimates Disagree",
      date: "November 2026",
      pages: 19,
      abstract:
        "A panel of 24,210 listing-months of posted rents for seven NVIDIA chips, V100 to B200, 2017 to 2026. Holding seller and contract fixed, the V100's rent changes by −0.38 log points over nine years. 96% of on-demand and reserved observations never move; spot prices fall late and list prices that move fall early. With seven chips, valid inference finds no significant rate or shape. An H100 rents for $4.50 an hour against $0.30 of running cost, so economic life is set by obsolescence: about 4.1 years in a power-constrained model.",
    },
  },
  {
    id: "private-credit-modeling",
    index: "05",
    accession: "Esn-0001",
    kind: "drive",
    title: "Private Credit Modeling",
    year: "2026",
    role: "Macroecononmic Trends · Financial Modeling · Writing",
    blurb: "Independent investigation into the rapidly growing private credit market and its importance into the financing sources of firms.",
    tags: ["Blue Owl", "Interest Rates", "Regulation", "2026"],
    status: "complete",
    hex: "7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00",
    links: [reportLink("private-credit-modeling")],
    report: {
      src: "/reports/private-credit-modeling.pdf",
      date: "October 2026",
      pages: 10,
      abstract:
        "Private credit is hard to see from outside, so this study works with what can be measured honestly. A five-name listed BDC basket fell 54.2% into March 2020 and ended March 2026 24.6% below its peak. On a synthetic 50,000-loan book, leakage-free classifiers rank later defaults well (holdout AUC 0.88) but overstate their level. A redemption model shows that gates set how long investors wait; the sale haircut sets what those who stay lose.",
    },
  },
  {
    id: "gpu-depreciation-cycle",
    index: "06",
    accession: "Esn-0002",
    kind: "drive",
    title: "GPU Depreciation Cycle",
    year: "2026",
    role: "Data Centers · AI · Investor Relations",
    blurb: "Independent Op-ed publication analyzing the rapidly depreciating value of GPUs in the data center and the impact on AI and investors.",
    tags: ["GPUs", "Data Centers", "AI", "Investor Relations"],
    status: "complete",
    hex: "c0 ff ee c0 ff ee 00 00 01 00 00 00 00 00 00 00",
    links: [reportLink("gpu-depreciation-cycle")],
    report: {
      src: "/reports/gpu-depreciation-cycle.pdf",
      date: "October 2026",
      pages: 10,
      abstract:
        "An illustrative scenario model of GPU value decay; every input is an assumption, not market data. In the base cases an H100 loses 30.2% of its value in year one and an A100 38.1%. The model's thirteen decay assumptions imply first-year losses from 22% to 47%. Because exponential decay front-loads the loss, a six-year straight-line schedule would hold H100 book value up to 18 points above modelled value; the life matching first-year loss is 3.3 years.",
    },
  },
  {
    id: "computer-vision-investment-research",
    index: "07",
    accession: "Esn-0003",
    kind: "drive",
    title: "Computer Vision for Investment Research",
    year: "2026",
    role: "Computer Vision · Investment Research · Writing",
    blurb: "Independent investigation into the use of computer vision for investment research and the impact on the investment industry.",
    tags: ["Computer Vision", "Investment Research", "2026"],
    status: "complete",
    hex: "de ad be ef 00 00 00 10 fa ce b0 0c 00 00 00 01",
    links: [reportLink("computer-vision-investment-research")],
    report: {
      src: "/reports/computer-vision-investment-research.pdf",
      title: "Tracking the 2025 NBA Finals with YOLOv8",
      date: "October 2026",
      pages: 8,
      abstract:
        "An exploratory pipeline ran YOLOv8 over about 12 minutes of 2025 NBA Finals Game 1 highlights, logging 236,658 person boxes, then derived possessions, shot locations, an xFG model and movement zones from those boxes alone. Only 30% of boxes clear the 0.6 confidence cut. The possession heuristic yields 3,352 segments, 1,307 of them zero frames long. The xFG model's 0.997 AUC comes from fitting labels generated from its own inputs. The report maps what turning video into data still needs.",
    },
  },
  {
    id: "case-study-dashboard",
    index: "08",
    accession: "Esn-0004",
    kind: "drive",
    title: "Case Study Dashboard",
    year: "2026",
    role: "Applied financial math · decision-making · writing",
    blurb:
      "Interactive dashboard of applied finance case studies — models, writeups, and outcomes collected in one place.",
    tags: ["Finance", "Modeling", "Dashboard", "2026"],
    status: "complete",
    hex: "ca 5e 0d 15 74 75 64 79 20 64 61 73 68 62 6f 61",
    links: [
      reportLink("case-study-dashboard"),
      { label: "Open dashboard", href: CASE_STUDY_URL, kind: "demo" },
    ],
    report: {
      src: "/reports/case-study-dashboard.pdf",
      title: "Applied Financial Math for Decision-Making",
      date: "October 2026",
      pages: 9,
      abstract:
        "A course case study at a fictional wealth manager, solved by a TypeScript engine and published as a dashboard. All five answers reproduce from the workbook: Plan C's growing perpetuity ($500,000) beats two annuities; OceanBlue's time-weighted return (9.16%) exceeds its money-weighted return (8.11%); facility Type B has the highest NPV ($1.72M); Bond C the highest current yield (7.85%); Investment C the highest effective annual yield (20.71%). Case 1 hinges on an input conflict: at the brief's $15,000, Plan A wins.",
    },
  },
  {
    id: "machine-learning-investment-research",
    index: "09",
    accession: "Esn-0101",
    kind: "kext",
    title: "Machine Learning strategies for investment research",
    year: "2026",
    role: "Machine Learning · Investment Research · Writing",
    blurb: "Independent investigation into the use of machine learning for investment research and the impact on the investment industry.",
    tags: ["Machine Learning", "Investment Research", "2026"],
    status: "ongoing",
    hex: "55 aa 55 aa 00 ff 11 ee 22 dd 33 cc 44 bb 55 aa",
    links: [reportLink("machine-learning-investment-research")],
    report: {
      src: "/reports/machine-learning-investment-research.pdf",
      title: "A Walk-Forward Ridge Forecaster for Ten ETFs",
      date: "October 2026",
      pages: 10,
      abstract:
        "A ridge regression forecasts monthly returns for ten liquid ETFs and is tested walk-forward on real data from 2009 to 2026, with an embargo, next-open fills and 5 bps costs. It returned 7.05% a year against 14.7% for SPY and 9.3% for an equal-weight basket, with a Sharpe ratio of 0.72. Alpha against SPY is not significant (t = 0.49). The overfitting statistics are benign (PBO 0.21) but narrow. It is a risk-premia allocation, not an edge.",
    },
  },
  {
    id: "financial-modeling-wealth-management",
    index: "10",
    accession: "Esn-0102",
    kind: "kext",
    title: "Financial Modeling for Wealth Management",
    year: "2026",
    role: "Wealth Management · Financial Modeling · Writing",
    blurb: "Independent investigation into the use of financial modeling for wealth management and the impact on the wealth management industry.",
    tags: ["Wealth Management", "Financial Modeling", "2026"],
    status: "ongoing",
    hex: "00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff",
    links: [reportLink("financial-modeling-wealth-management")],
  },
  {
    id: "autonomous-option-pricing-model",
    index: "11",
    accession: "Esn-0103",
    kind: "kext",
    title: "Autonomous Option Pricing Model",
    year: "2026",
    role: "Option Pricing · Autonomous Systems · Writing",
    blurb: "Independent investigation into the use of autonomous option pricing models and the impact on the option pricing industry.",
    tags: ["Option Pricing", "Autonomous Systems", "2026"],
    status: "complete",
    hex: "fa de d1 0b ff ff 00 00 aa 55 aa 55 99 99 00 00",
    links: [reportLink("autonomous-option-pricing-model")],
    report: {
      src: "/reports/autonomous-option-pricing-model.pdf",
      date: "October 2026",
      pages: 9,
      abstract:
        "The options layer of the quant-trading project is a 932-line Black–Scholes–Merton module (prices, Greeks, implied volatility) pinned by 46 tests. It prices hedges for an offline overlay and reads live SPY implied volatility for an always-on engine that never trades. Re-running the code shows round-trip accuracy near 2.5×10⁻⁹. On matched synthetic paths a 5%-OTM put cuts a 15-day crash's drawdown from 28.1% to 13.0% but barely touches a slow decline. The live read solves against a stale price.",
    },
  },
  {
    id: "sports-quant-ideas",
    index: "12",
    accession: "Esn-0104",
    kind: "kext",
    title: "Sports + Quant",
    year: "2025",
    role: "Sports · Quantitative research",
    blurb: "Research ideas applying quant methods to sport, starting with predicting live defensive matchups in the NBA and NFL.",
    tags: ["Sports", "Quant", "NBA", "NFL"],
    status: "idea",
    links: [reportLink("sports-quant-ideas")],
  },
  {
    id: "prediction-markets",
    index: "13",
    accession: "Esn-0105",
    kind: "kext",
    title: "Prediction Markets Analysis",
    year: "2026",
    role: "Prediction markets · Sportsbooks · Market efficiency",
    blurb: "Analysis of how efficient prediction markets and sportsbooks really are, and how they market themselves.",
    tags: ["Prediction Markets", "Sportsbooks", "2026"],
    status: "ongoing",
    links: [reportLink("prediction-markets")],
  },
  {
    id: "injury-cv",
    index: "14",
    accession: "Esn-0106",
    kind: "kext",
    title: "Injury-Risk Computer Vision",
    year: "2025",
    role: "Computer Vision · Sports injury",
    blurb: "Computer vision tool, prompted by Brandon Aiyuk's 2024 knee injury, to help athletes and play-callers avoid injuries.",
    tags: ["Computer Vision", "Sports", "Injury"],
    links: [reportLink("injury-cv")],
  },
  {
    id: "wallmachine",
    index: "15",
    accession: "Esn-0107",
    kind: "kext",
    title: "Wall Machine",
    year: "2026",
    role: "Robotics",
    blurb: "A robot that draws.",
    tags: ["Robotics", "2026"],
    status: "ongoing",
    links: [reportLink("wallmachine")],
  },
];

/** Utility: grouped by kind for the Profiler window. */
export const PROJECTS_BY_KIND: Record<ProjectKind, Project[]> = {
  drive: PROJECTS.filter((p) => p.kind === "drive"),
  kext: PROJECTS.filter((p) => p.kind === "kext"),
};
