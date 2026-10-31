import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useRouteTransition } from "@/components/layout/RouteTransition";
import { PROJECTS, type Project, type ProjectKind } from "@/lib/projectsData";
import { SITE_OWNER_EMAIL } from "@/lib/siteIdentity";
import { useMediaQuery } from "@/lib/useMediaQuery";
import "./publications.css";

const SECTIONS: { kind: ProjectKind; label: string }[] = [
  { kind: "drive", label: "Works" },
  { kind: "kext", label: "Experiments" },
];

const PUBLISHED_COUNT = PROJECTS.filter((p) => p.report).length;

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

/** `#private-credit-modeling` → "private-credit-modeling", if it names a project. */
function projectFromHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  return PROJECTS.some((p) => p.id === id) ? id : null;
}

function reportStatus(project: Project) {
  const { report } = project;
  if (!report) return "In preparation";
  return report.pages ? `PDF, ${report.pages} pp` : "PDF";
}

/** Stand-in for the PDF where it can't (or doesn't yet) render inline: a plain title page. */
function ReportCover({ project }: { project: Project }) {
  const { report } = project;
  const face = (
    <>
      <span className="pub-cap">
        Report
        <br />
        {report?.date ?? project.year}
      </span>
      <span className="pub-cover__title">{report?.title ?? project.title}</span>
      <span className="pub-cap">AJ</span>
      <span className="pub-cap pub-cover__foot">{report ? "Read the report →" : "In preparation"}</span>
    </>
  );
  if (!report) return <div className="pub-cover" data-pending="">{face}</div>;
  return (
    <a className="pub-cover" href={report.src} target="_blank" rel="noopener">
      {face}
    </a>
  );
}

function Entry({
  project,
  open,
  inlinePdf,
  onToggle,
  go,
}: {
  project: Project;
  open: boolean;
  inlinePdf: boolean;
  onToggle: (id: string) => void;
  go: ReturnType<typeof useInternalLink>;
}) {
  const { report } = project;
  const rowId = `${project.id}-row`;
  const bodyId = `${project.id}-report`;
  const related = project.links.filter((l) => !l.href.startsWith("/publications"));

  return (
    <li id={project.id} className="pub-entry" data-open={open ? "" : undefined} data-has-report={report ? "" : undefined}>
      <h3 className="pub-entry__heading">
        <button
          type="button"
          id={rowId}
          className="pub-row"
          aria-expanded={open}
          aria-controls={open ? bodyId : undefined}
          onClick={() => onToggle(project.id)}
        >
          <span className="pub-cap">
            {project.index}
            <br />
            {project.year}
          </span>
          <span className="pub-row__title">{project.title}</span>
          <span className="pub-cap pub-row__status">{reportStatus(project)}</span>
          <span className="pub-row__toggle" aria-hidden="true" />
        </button>
      </h3>
      {open ? (
        <div className="pub-body" id={bodyId} role="region" aria-labelledby={rowId}>
          <div className="pub-about">
            <p className="pub-abstract">{report?.abstract ?? project.blurb}</p>
            <dl className="pub-facts pub-cap">
              {report?.date ? (
                <>
                  <dt>Published</dt>
                  <dd>{report.date}</dd>
                </>
              ) : null}
              <dt>Focus</dt>
              <dd>{project.role}</dd>
            </dl>
            {report ? (
              <p className="pub-actions">
                <a href={report.src} target="_blank" rel="noopener">
                  Open full screen ↗
                </a>
                <a href={report.src} download>
                  Download PDF ↓
                </a>
              </p>
            ) : null}
            {related.length ? (
              <ul className="pub-related" aria-label="Related">
                {related.map((l) =>
                  l.href.startsWith("/") ? (
                    <li key={l.label}>
                      <a href={l.href} onClick={go(l.href)}>
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <a href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label} ↗
                      </a>
                    </li>
                  ),
                )}
              </ul>
            ) : null}
          </div>
          <div className="pub-reader">
            {report && inlinePdf ? (
              <iframe className="pub-pdf" src={report.src} title={`${report.title ?? project.title} (PDF report)`} />
            ) : (
              <ReportCover project={project} />
            )}
          </div>
        </div>
      ) : null}
    </li>
  );
}

/**
 * /publications — reports on every Work and Experiment. Every project
 * link on the site lands here as `/publications#<id>`, which opens that entry
 * and brings it to the top so nobody has to find the project again.
 */
export default function Publications() {
  const go = useInternalLink();
  const { hash } = useLocation();
  const [openId, setOpenId] = useState<string | null>(() => projectFromHash(hash));
  /** Set whenever an entry opens; the effect below scrolls it to the top once it has rendered. */
  const scrollPending = useRef(openId !== null);
  /* Phones and tablets can't be trusted to draw a PDF inside a frame (Android
     Chrome shows nothing, iOS shows one page), and neither can a browser whose
     PDF viewer is switched off — those get a cover that opens the PDF on its own. */
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const inlinePdf = finePointer && navigator.pdfViewerEnabled !== false;

  /* Light field behind the page (the shell is dark-only), same trick as / and /basis. */
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-publications-page", "");
    return () => el.removeAttribute("data-publications-page");
  }, []);

  useEffect(() => {
    // BrowserRouter keeps the previous page's scroll offset; start at the top
    // unless a hash is about to take us somewhere.
    if (!scrollPending.current) window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const id = projectFromHash(hash);
    if (!id) return;
    scrollPending.current = true;
    setOpenId(id);
  }, [hash]);

  useEffect(() => {
    if (!openId || !scrollPending.current) return;
    scrollPending.current = false;
    const frame = requestAnimationFrame(() => {
      const entry = document.getElementById(openId);
      if (!entry) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      entry.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
      entry.querySelector<HTMLButtonElement>(".pub-row")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [openId]);

  const toggle = useCallback(
    (id: string) => {
      const next = openId === id ? null : id;
      if (next) scrollPending.current = true;
      setOpenId(next);
      // Keep the address shareable without a router navigation (which would re-run the hash effect).
      window.history.replaceState(window.history.state, "", next ? `#${next}` : window.location.pathname);
    },
    [openId],
  );

  return (
    <div className="pub-root">
      <header className="pub-head">
        <nav className="pub-bar" aria-label="Publications">
          <a href="/" onClick={go("/")}>
            ← ajaiupadhyaya.com
          </a>
          <span>
            {PUBLISHED_COUNT} of {PROJECTS.length} published
          </span>
        </nav>
        <h1 className="pub-mark">Publications</h1>
        <p className="pub-cap">
          Reports on the Works and Experiments by AJ.
          <br />
          Read them here, or take the PDF with you.
        </p>
      </header>
      <main className="pub-main">
        {SECTIONS.map((section) => {
          const entries = PROJECTS.filter((p) => p.kind === section.kind);
          return (
            <section key={section.kind} className="pub-section" aria-label={section.label}>
              <h2 className="pub-h2">
                {section.label}
                <sup>{entries.length}</sup>
              </h2>
              <ol className="pub-list">
                {entries.map((project) => (
                  <Entry
                    key={project.id}
                    project={project}
                    open={openId === project.id}
                    inlinePdf={inlinePdf}
                    onToggle={toggle}
                    go={go}
                  />
                ))}
              </ol>
            </section>
          );
        })}
      </main>
      <footer className="pub-foot pub-cap">
        ©{new Date().getFullYear()} AJ. Questions or corrections on a report:{" "}
        <a href={`mailto:${SITE_OWNER_EMAIL}`}>{SITE_OWNER_EMAIL}</a>
      </footer>
    </div>
  );
}
