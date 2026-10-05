import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MonteCarloFigure } from "@/components/home/MonteCarloFigure";
import { MosaicPhoto } from "@/components/home/MosaicPhoto";
import { Signature } from "@/components/home/Signature";
import { useRouteTransition } from "@/components/layout/RouteTransition";
import { CASE_STUDY_URL } from "@/lib/caseStudyUrl";
import { PROJECTS, type ProjectKind } from "@/lib/projectsData";
import {
  SITE_OWNER_EMAIL,
  SITE_OWNER_GITHUB,
  SITE_OWNER_LINKEDIN,
  SITE_OWNER_SUBSTACK,
} from "@/lib/siteIdentity";
import { buildFilmPhotoLibrary } from "@/photography/library";
import "./home.css";

/** Frames shown on the blue RAW-style sheet, in order. Filenames from ./photography/images. */
const HOME_FRAMES = [
  "newjpmg.jpg",
  "nyc subway.jpg",
  "schoooolbus.jpg",
  "nyc2026.jpg",
  "cornernyc.jpg",
  "lovethisplace.jpg",
];

const LIBRARY = buildFilmPhotoLibrary();
const FRAMES = HOME_FRAMES.map((f) => LIBRARY.find((p) => p.file === f)).filter(
  (p): p is NonNullable<typeof p> => Boolean(p),
);

type Filter = "all" | ProjectKind;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "drive", label: "Works" },
  { id: "kext", label: "Experiments" },
];

function FilterList({
  filter,
  counts,
  onPick,
  className,
}: {
  filter: Filter;
  counts: Record<Filter, number>;
  onPick: (f: Filter) => void;
  className: string;
}) {
  return (
    <ul className={`ajh-filter ${className}`}>
      {FILTERS.map((f) => (
        <li key={f.id}>
          <button type="button" aria-pressed={filter === f.id} onClick={() => onPick(f.id)}>
            {f.label}
            <sup>{counts[f.id]}</sup>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** A plain click goes through the site's route transition; modified clicks stay native. */
function useInternalLink() {
  const routeTransition = useRouteTransition();
  return useCallback(
    (path: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      routeTransition.goto(path);
    },
    [routeTransition],
  );
}

export default function Home() {
  const go = useInternalLink();
  const [filter, setFilter] = useState<Filter>("all");
  const [contactOpen, setContactOpen] = useState(false);
  const [sigRun, setSigRun] = useState(0);
  const contactRef = useRef<HTMLDivElement>(null);

  /* Light field behind the page (the shell is dark-only), same trick as /film. */
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-home-page", "");
    return () => el.removeAttribute("data-home-page");
  }, []);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: PROJECTS.length, drive: 0, kext: 0 };
    for (const p of PROJECTS) c[p.kind] += 1;
    return c;
  }, []);

  const openContact = useCallback(() => {
    setContactOpen((open) => {
      const next = !open;
      if (next) {
        window.setTimeout(() => contactRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
      }
      return next;
    });
  }, []);

  return (
    <div className="ajh-root">
      <a className="ajh-legacy" href="/desktop" onClick={go("/desktop")}>
        Old desktop version
      </a>

      {/* ── Blue panel: the PSD's left column ───────────────────────────── */}
      <aside className="ajh-panel">
        <div>
          <p className="ajh-mark" onMouseEnter={() => setSigRun((r) => r + 1)}>
            AJ
          </p>
          <p className="ajh-cap">
            Financial Engineering, 2027
            <br />
            <a href="https://ajaiupadhyaya.com">http://ajaiupadhyaya.com</a>
          </p>
        </div>

        <MonteCarloFigure />

        <nav className="ajh-nav" aria-label="Sections">
          <ul>
            <li>
              <button type="button" aria-expanded={contactOpen} aria-controls="ajh-contact" onClick={openContact}>
                <span className="ajh-dot" aria-hidden />
                Contact
              </button>
            </li>
            <li>
              <a href={CASE_STUDY_URL}>
                <span className="ajh-dot" aria-hidden />
                Data
              </a>
            </li>
            <li>
              <a href="/archive" onClick={go("/archive")}>
                <span className="ajh-dot" aria-hidden />
                Work
              </a>
            </li>
            <li>
              <a href={SITE_OWNER_SUBSTACK}>
                <span className="ajh-dot" aria-hidden />
                BASIS
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* ── White sheet ─────────────────────────────────────────────────── */}
      <main className="ajh-sheet">
        <div className="ajh-main">
          <Signature runKey={sigRun} className="ajh-sig" />
          <h1 className="ajh-h1">2027 Financial Engineering Graduate</h1>
          <div className="ajh-roles">
            <p>
              <b>Previous roles</b> Accounting, Financial Management, Software Development, Dev-Ops
            </p>
            <p>
              <b>Relevant experience</b> Actuary/Quantitative Finance, Investment Banking, Corporate Accounting,
              Machine Learning, Computer Vision
            </p>
          </div>

          <h2 className="ajh-h2">Works + Experiments</h2>
          <FilterList filter={filter} counts={counts} onPick={setFilter} className="ajh-filter--inline" />
          <ul className="ajh-index">
            {PROJECTS.map((p) => {
              const out = filter !== "all" && p.kind !== filter;
              const href = `/archive#project-${p.id}`;
              return (
                <li key={p.id} className={out ? "is-out" : undefined}>
                  <a href={href} onClick={go(href)} tabIndex={out ? -1 : undefined}>
                    <i>{p.title}</i> {p.blurb.replace(/\.$/, "")}
                    {p.status === "ongoing" ? ", ongoing" : ""}. {p.year}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="ajh-contact" ref={contactRef}>
            <button
              type="button"
              className="ajh-plus"
              aria-expanded={contactOpen}
              aria-controls="ajh-contact"
              onClick={() => setContactOpen((o) => !o)}
            >
              <span aria-hidden>+</span> Contact
            </button>
            <div id="ajh-contact" className={`ajh-drawer${contactOpen ? " is-open" : ""}`}>
              <div>
                <p>2027, Finance, Virginia Commonwealth University, Richmond, VA</p>
                <p>Previously, Computer Science and Economics, University of Virginia, Charlottesville, VA</p>
                <p className="ajh-bio-name">
                  <b>AJ</b>
                </p>
                <p>A student who lives and works in Richmond, Virginia.</p>
                <p>
                  <a href={`mailto:${SITE_OWNER_EMAIL}`}>{SITE_OWNER_EMAIL}</a>
                </p>
                <p>
                  <a href={SITE_OWNER_LINKEDIN}>LinkedIn</a> <a href={SITE_OWNER_GITHUB}>GitHub</a>{" "}
                  <a href={SITE_OWNER_SUBSTACK}>Substack</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="ajh-side" aria-label="Filter works">
          <FilterList filter={filter} counts={counts} onPick={setFilter} className="ajh-filter--side" />
        </aside>

        {/* ── The RAW page: film frames on blue ─────────────────────────── */}
        <section className="ajh-film" aria-label="Film photographs">
          <div className="ajh-film__grid">
            {FRAMES.map((photo, i) => (
              <MosaicPhoto key={photo.id} photo={photo} n={i + 1} />
            ))}
          </div>
          <p className="ajh-cap ajh-film__foot">
            {LIBRARY.length} frames on 35mm and 110, scanned at home.
            <br />
            <a href="/film" onClick={go("/film")}>
              http://ajaiupadhyaya.com/film
            </a>
          </p>
          <p className="ajh-cap ajh-film__colophon">
            ©{new Date().getFullYear()} AJ. Set in whatever Helvetica your computer has. The old desktop is still
            running at{" "}
            <a href="/desktop" onClick={go("/desktop")}>
              /desktop
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
