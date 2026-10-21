/**
 * Everything the home page's index lists, in one place.
 *
 * Works and Experiments come from `PROJECTS` (they also feed /archive and the
 * desktop's System Profiler). Everything else lives here: public GitHub repos,
 * writing, and experience. Copy is taken from each repo's README/description
 * and from the résumé; don't invent work that doesn't exist.
 *
 * To add something: append an entry to the matching array below. `href` is
 * optional; entries without one render as plain text (e.g. private work).
 */
import { PROJECTS } from "@/lib/projectsData";
import { SITE_OWNER_SUBSTACK } from "@/lib/siteIdentity";

export type IndexKind = "work" | "experiment" | "code" | "writing" | "experience";
export type IndexStatus = "complete" | "ongoing" | "idea" | "upcoming";

export type IndexEntry = {
  id: string;
  kind: IndexKind;
  title: string;
  blurb: string;
  year: string;
  status?: IndexStatus;
  /** Internal paths (starting with "/") use the route transition; others open in a new tab. */
  href?: string;
};

export const INDEX_SECTIONS: { kind: IndexKind; label: string }[] = [
  { kind: "work", label: "Works" },
  { kind: "experiment", label: "Experiments" },
  { kind: "code", label: "Code" },
  { kind: "writing", label: "Writing" },
  { kind: "experience", label: "Experience" },
];

const gh = (repo: string) => `https://github.com/ajaiupadhyaya/${repo}`;

const FROM_PROJECTS: IndexEntry[] = PROJECTS.map((p) => ({
  id: p.id,
  kind: p.kind === "drive" ? "work" : "experiment",
  title: p.title,
  blurb: p.blurb,
  year: p.year,
  status: p.status === "ongoing" ? "ongoing" : "complete",
  href: `/archive#project-${p.id}`,
}));

const EXPERIMENTS: IndexEntry[] = [
  {
    id: "sports-quant-ideas",
    kind: "experiment",
    title: "Sports + Quant",
    blurb: "Research ideas applying quant methods to sport, starting with predicting live defensive matchups in the NBA and NFL",
    year: "2025",
    status: "idea",
    href: gh("kaggle"),
  },
  {
    id: "prediction-markets",
    kind: "experiment",
    title: "Prediction Markets Analysis",
    blurb: "Analysis of how efficient prediction markets and sportsbooks really are, and how they market themselves",
    year: "2026",
    status: "ongoing",
    href: gh("ihatepredictionmarkets"),
  },
  {
    id: "injury-cv",
    kind: "experiment",
    title: "Injury-Risk Computer Vision",
    blurb: "Computer vision tool, prompted by Brandon Aiyuk's 2024 knee injury, to help athletes and play-callers avoid injuries",
    year: "2025",
    href: gh("brandonaiyuks-knee"),
  },
  {
    id: "wallmachine",
    kind: "experiment",
    title: "Wall Machine",
    blurb: "A robot that draws",
    year: "2026",
    status: "ongoing",
    href: gh("wallmachine"),
  },
];

const CODE: IndexEntry[] = [
  {
    id: "ohcamel",
    kind: "code",
    title: "OhCamel",
    blurb:
      "Reactive real-time risk and limits engine in OCaml: risk quantities are nodes in a self-adjusting graph (Jane Street Incremental), so a tick recomputes only what depends on it. Eight VaR/ES models, 13F import",
    year: "2026",
    status: "ongoing",
    href: gh("OhCamel"),
  },
  {
    id: "five-dollar-quant",
    kind: "code",
    title: "Five Dollar Quant",
    blurb:
      "Simulation-first study of institutional quant methods under a $5 capital constraint with realistic retail frictions: triple-barrier labels, purged walk-forward CV, Deflated Sharpe Ratio and PBO",
    year: "2026",
    href: gh("capitallimits"),
  },
  {
    id: "quant-harness",
    kind: "code",
    title: "Quant Research Harness",
    blurb: "Answers one question per hypothesis: does this signal have edge that survives honest out-of-sample validation?",
    year: "2026",
    href: gh("randomforest"),
  },
  {
    id: "mltrade",
    kind: "code",
    title: "MLTrade",
    blurb: "Research, risk and execution platform for systematic long/short trading in liquid US stocks and ETFs",
    year: "2026",
    href: gh("mltrade"),
  },
  {
    id: "quant-trading",
    kind: "code",
    title: "Quant Trading Research Platform",
    blurb:
      "Evidence-gated defensive ETF baseline plus five research strategies, with a walk-forward backtest engine and tear sheets, paper-traded on Alpaca via GitHub Actions",
    year: "2026",
    href: gh("quant-trading"),
  },
  {
    id: "autonomous-agent",
    kind: "code",
    title: "Autonomous Trading Agent",
    blurb:
      "Execution and market-making system: Avellaneda–Stoikov market making, Almgren–Chriss optimal execution, point-in-time data and live Alpaca connectivity",
    year: "2026",
  },
  {
    id: "aapl-agent",
    kind: "code",
    title: "AAPL Trading Agent",
    blurb: "Research-first, risk-aware, model-driven trading agent focused on AAPL",
    year: "2026",
    href: gh("AAPLagent"),
  },
  {
    id: "quant-terminal",
    kind: "code",
    title: "Models: Quant Terminal",
    blurb:
      "Bloomberg-terminal-style web app for personal quant research: backtesting, risk analytics, factor exposure and paper trading behind a keyboard-driven command line",
    year: "2026",
    href: gh("Models"),
  },
  {
    id: "saito",
    kind: "code",
    title: "Saito",
    blurb: "Open-source home for the strategies, models, algorithms and tools I build and use, with an interactive maths and statistics lab",
    year: "2026",
    href: gh("Saito"),
  },
  {
    id: "research-agent",
    kind: "code",
    title: "Research Agent",
    blurb: "Autonomous, local-first research pipeline: research, analysis, writer and critic agents on self-hosted LLMs, rendered to PDF",
    year: "2026",
    href: gh("research_agent"),
  },
  {
    id: "multi-agent-research",
    kind: "code",
    title: "Multi-Agent Research System",
    blurb: "Local multi-agent system that generates and iterates on quantitative research with self-hosted LLMs and private web retrieval",
    year: "2026",
  },
  {
    id: "quant-dashboard",
    kind: "code",
    title: "Quant Research Dashboard",
    blurb: "Backend-first research platform with auth, PostgreSQL and Redis",
    year: "2026",
    status: "ongoing",
    href: gh("actual"),
  },
  {
    id: "trading-platform",
    kind: "code",
    title: "Quantitative Trading Platform",
    blurb: "An interface for running and monitoring my trading models",
    year: "2026",
    href: gh("production"),
  },
  {
    id: "morganvuoksi",
    kind: "code",
    title: "MorganVuoksi",
    blurb: "Quantitative trading platform with a Bloomberg-style terminal, ML models and risk management",
    year: "2025",
    href: gh("morganvuoksi"),
  },
  {
    id: "financial-modeling-platform",
    kind: "code",
    title: "Financial Modeling Platform",
    blurb: "Financial models with interactive visualisations and quantitative analysis",
    year: "2025",
    href: gh("financialmodeling"),
  },
  {
    id: "creditrisk",
    kind: "code",
    title: "Credit Risk",
    blurb: "Building and training a model of risk in outstanding loans and bonds",
    year: "2026",
    href: gh("creditrisk"),
  },
  {
    id: "floodlit",
    kind: "code",
    title: "Floodlit",
    blurb: "World Cup tactical-intelligence dashboard: live match data, open-data tactical analysis and computer vision",
    year: "2026",
    href: "https://worldcup-sable.vercel.app",
  },
  {
    id: "pulseai",
    kind: "code",
    title: "PulseAI",
    blurb: "Market intelligence for LLMs: scores sentiment toward each model across Hacker News, GitHub, news and Reddit",
    year: "2026",
    href: gh("slopsentimentmonitor"),
  },
  {
    id: "news-dashboard",
    kind: "code",
    title: "News & Markets Dashboard",
    blurb: "A calm daily dashboard for news, politics, economics and finance",
    year: "2026",
    href: "https://news-dashboard-two-rho.vercel.app",
  },
  {
    id: "us-economy-dashboard",
    kind: "code",
    title: "U.S. Economy Dashboard",
    blurb: "Macro and micro analysis workbook on real data that rebuilds itself every Monday via GitHub Actions",
    year: "2026",
    href: gh("recrawl"),
  },
  {
    id: "intmacro",
    kind: "code",
    title: "Intermediate Macroeconomics",
    blurb: "Website of working macroeconomic models, each chapter pairing the maths with an interactive model",
    year: "2025",
    href: "https://ajaiupadhyaya.github.io/intmacro/",
  },
  {
    id: "nba-cv",
    kind: "code",
    title: "NBA Computer Vision",
    blurb: "Analyses game footage to track players and possessions, build shot charts and model shot difficulty",
    year: "2025",
    href: gh("computervision"),
  },
  {
    id: "apply",
    kind: "code",
    title: "APPLY",
    blurb: "Local-first job application pipeline: everything up to the submit button",
    year: "2026",
    href: gh("apply"),
  },
  {
    id: "slidecheck",
    kind: "code",
    title: "SlideCheck",
    blurb: "Scans PowerPoint files for WCAG 2.1 AA and Section 508 issues, fixes the safe ones and writes a report",
    year: "2026",
    href: gh("slidecheck"),
  },
  {
    id: "lumi",
    kind: "code",
    title: "Lumi",
    blurb: "Computational film light meter for iPhone. Offline, no ads, no accounts",
    year: "2026",
    href: gh("lightmeter"),
  },
  {
    id: "photoeditor",
    kind: "code",
    title: "PhotoEditor",
    blurb: "A macOS photo editor built for film scans. No AI, no cloud, no subscription",
    year: "2026",
    href: gh("totallynotanopensourcelightroom"),
  },
  {
    id: "professor-hyde",
    kind: "code",
    title: "Professor Hyde",
    blurb: "AI-assisted grading, course and email workflow for a university professor, with mandatory human review",
    year: "2026",
    href: gh("professorhyde"),
  },
  {
    id: "chargelocal",
    kind: "code",
    title: "ChargeLocal",
    blurb: "Residential EV chargers alongside public infrastructure on one map",
    year: "2026",
    href: gh("localcharging"),
  },
  {
    id: "outreach-dashboard",
    kind: "code",
    title: "Smart Outreach Dashboard",
    blurb: "Tool for managing LinkedIn and email outreach campaigns",
    year: "2025",
    href: gh("sorry"),
  },
  {
    id: "esnupi",
    kind: "code",
    title: "esnupi",
    blurb: "This site, and the Mac OS 8 desktop that still runs at /desktop",
    year: "2026",
    href: gh("esnupi"),
  },
  {
    id: "daily",
    kind: "code",
    title: "Daily",
    blurb: "A personal digital museum for photos, audio and writing",
    year: "2025",
    href: gh("daily"),
  },
  {
    id: "leto",
    kind: "code",
    title: "Leto",
    blurb: "Animated portfolio and discovery platform for showcasing projects",
    year: "2026",
    href: gh("leto"),
  },
  {
    id: "ascii-zine",
    kind: "code",
    title: "ASCII Zine",
    blurb: "Markdown zine served live over WebSocket, readable from a terminal",
    year: "2025",
    status: "ongoing",
    href: gh("ascii"),
  },
  {
    id: "fakin-it",
    kind: "code",
    title: "Fakin' It",
    blurb: "Local-network party game: host on the TV, players join from their phones",
    year: "2026",
    href: gh("fakinit"),
  },
  {
    id: "group-chat-bot",
    kind: "code",
    title: "Group Chat Bot",
    blurb: "Persona-driven group chat bot on Twilio Conversations and OpenAI",
    year: "2026",
    href: gh("1718"),
  },
  {
    id: "house-mood-ring",
    kind: "code",
    title: "House Mood Ring",
    blurb: "Tracks a household's mood from its group chat",
    year: "2025",
    href: gh("bored"),
  },
];

const WRITING: IndexEntry[] = [
  {
    id: "basis",
    kind: "writing",
    title: "BASIS",
    blurb: "A weekly market monitor",
    year: "2026",
    status: "ongoing",
    href: "/basis",
  },
  {
    id: "basis-001-liquid-compute",
    kind: "writing",
    title: "Liquid Compute: what the grid could earn",
    blurb: "BASIS No. 001. An outside-in model of a regulated exchange for GPU compute, with an interactive scenario model and a Monte Carlo of the tenor trade",
    year: "2026",
    status: "complete",
    href: "/basis/001-liquid-compute",
  },
  {
    id: "substack",
    kind: "writing",
    title: "Substack",
    blurb: "Essays, including the GPU depreciation op-ed",
    year: "2026",
    href: SITE_OWNER_SUBSTACK,
  },
];

const EXPERIENCE: IndexEntry[] = [
  {
    id: "vcu-fe",
    kind: "experience",
    title: "Virginia Commonwealth University",
    blurb: "Financial Engineering, graduating May 2027",
    year: "2026–27",
    status: "ongoing",
  },
  {
    id: "uvimco",
    kind: "experience",
    title: "UVIMCO",
    blurb: "Intern, University of Virginia Investment Management Company",
    year: "2025–26",
  },
  {
    id: "yugabyte",
    kind: "experience",
    title: "YugabyteDB",
    blurb: "Database Engineering Intern",
    year: "2025–26",
  },
  {
    id: "uva-consultant",
    kind: "experience",
    title: "University of Virginia",
    blurb: "Student Consultant: supported research on Bloomberg Terminal, Morningstar Direct and WRDS",
    year: "2023–26",
  },
  {
    id: "vita",
    kind: "experience",
    title: "Virginia Information Technologies Agency",
    blurb: "Financial Operations Analyst Intern: SQL/Python reporting pipelines, cash-flow analysis, Power BI dashboards",
    year: "2024",
  },
  {
    id: "specialized",
    kind: "experience",
    title: "Specialized Bicycle Components",
    blurb: "Software Development & Systems Research Intern: performance profiling and diagnostic tooling",
    year: "2023",
  },
  {
    id: "vmfa",
    kind: "experience",
    title: "Virginia Museum of Fine Arts",
    blurb: "Financial Management Intern: grant-allocation models and cost-benefit analysis",
    year: "2020–21",
  },
  {
    id: "uva-bs",
    kind: "experience",
    title: "University of Virginia",
    blurb: "B.S., Economics and Computer Science",
    year: "2023–26",
  },
  {
    id: "apo",
    kind: "experience",
    title: "Alpha Phi Omega",
    blurb: "Community Engagement Chair, UVA Theta Chapter",
    year: "2023–26",
  },
  {
    id: "community-bikes",
    kind: "experience",
    title: "Charlottesville Community Bikes",
    blurb: "Volunteer bike mechanic",
    year: "2023–26",
  },
];

export const HOME_INDEX: IndexEntry[] = [...FROM_PROJECTS, ...EXPERIMENTS, ...CODE, ...WRITING, ...EXPERIENCE];
