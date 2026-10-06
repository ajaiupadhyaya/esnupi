import { useCallback, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useRouteTransition } from "@/components/layout/RouteTransition";
import { BASIS_ISSUES, formatIssueDate, formatIssueNumber, type BasisIssue } from "@/lib/basisIssues";
import { SITE_OWNER_SUBSTACK } from "@/lib/siteIdentity";
import "./basis.css";

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

function Masthead({ go }: { go: ReturnType<typeof useInternalLink> }) {
  return (
    <header className="bas-head">
      <nav className="bas-bar" aria-label="BASIS">
        <a href="/" onClick={go("/")}>
          ← ajaiupadhyaya.com
        </a>
        <a href="/basis" onClick={go("/basis")}>
          All issues
        </a>
      </nav>
      <a className="bas-mark" href="/basis" onClick={go("/basis")}>
        BASIS
      </a>
      <p className="bas-cap">
        A weekly market monitor by AJ.
        <br />
        Rates, credit, equities, and what moved.
      </p>
    </header>
  );
}

function IssueList({ go }: { go: ReturnType<typeof useInternalLink> }) {
  if (BASIS_ISSUES.length === 0) {
    return (
      <section className="bas-empty" aria-label="Issues">
        <p className="bas-cap">{formatIssueNumber(1)}</p>
        <p className="bas-empty__lede">The first issue is in preparation.</p>
        <p>
          New issues will appear here every week. In the meantime, my other writing is on{" "}
          <a href={SITE_OWNER_SUBSTACK} target="_blank" rel="noopener noreferrer">
            Substack
          </a>
          .
        </p>
      </section>
    );
  }
  return (
    <ol className="bas-list" aria-label="Issues">
      {BASIS_ISSUES.map((issue) => {
        const href = `/basis/${issue.slug}`;
        return (
          <li key={issue.slug}>
            <a href={href} onClick={go(href)}>
              <span className="bas-cap">
                {formatIssueNumber(issue.number)}
                <br />
                {formatIssueDate(issue.date)}
              </span>
              <span>
                <b>{issue.title}</b>
                {issue.dek ? <span className="bas-list__dek"> {issue.dek}</span> : null}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

function IssueView({ issue, go }: { issue: BasisIssue; go: ReturnType<typeof useInternalLink> }) {
  const i = BASIS_ISSUES.indexOf(issue);
  const newer = BASIS_ISSUES[i - 1];
  const older = BASIS_ISSUES[i + 1];
  const { Body } = issue;
  return (
    <article className="bas-issue">
      <header>
        <p className="bas-cap">
          {formatIssueNumber(issue.number)}
          <br />
          {formatIssueDate(issue.date)}
        </p>
        <h1 className="bas-issue__title">{issue.title}</h1>
        {issue.dek ? <p className="bas-issue__dek">{issue.dek}</p> : null}
      </header>
      <div className="bas-prose">
        <Body />
      </div>
      <nav className="bas-pager" aria-label="More issues">
        {older ? (
          <a href={`/basis/${older.slug}`} onClick={go(`/basis/${older.slug}`)}>
            ← {formatIssueNumber(older.number)}: {older.title}
          </a>
        ) : (
          <span />
        )}
        {newer ? (
          <a href={`/basis/${newer.slug}`} onClick={go(`/basis/${newer.slug}`)}>
            {formatIssueNumber(newer.number)}: {newer.title} →
          </a>
        ) : null}
      </nav>
    </article>
  );
}

export default function Basis() {
  const go = useInternalLink();
  const { slug } = useParams();
  const issue = slug ? BASIS_ISSUES.find((x) => x.slug === slug) : undefined;

  /* Light field behind the page (the shell is dark-only), same trick as / and /film. */
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-basis-page", "");
    return () => el.removeAttribute("data-basis-page");
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (slug && !issue) return <Navigate to="/basis" replace />;

  return (
    <div className="bas-root">
      <Masthead go={go} />
      <main className="bas-main">{issue ? <IssueView issue={issue} go={go} /> : <IssueList go={go} />}</main>
      <footer className="bas-foot bas-cap">
        ©{new Date().getFullYear()} AJ. BASIS is commentary, not investment advice.
      </footer>
    </div>
  );
}
