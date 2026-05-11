import { useRouteTransition } from "@/components/layout/RouteTransition";
import { PROJECTS, type ProjectKind, type ProjectMedia } from "@/lib/projectsData";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./archive.css";

type KindFilter = "all" | ProjectKind;

const HEADER_OFFSET = 96;

function sectionId(id: string) {
  return `project-${id}`;
}

function fromHash(rawHash: string) {
  if (!rawHash) return null;
  const token = decodeURIComponent(rawHash.replace(/^#/, ""));
  if (!token.startsWith("project-")) return null;
  return token.replace(/^project-/, "");
}

export default function Archive() {
  const routeTransition = useRouteTransition();
  const [progress, setProgress] = useState(0);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(PROJECTS[0]?.id ?? null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(PROJECTS.slice(0, 3).map((p) => p.id)));

  const years = useMemo(() => {
    const unique = new Set(PROJECTS.map((p) => p.year));
    return Array.from(unique).sort((a, b) => Number(b) - Number(a));
  }, []);

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return PROJECTS.filter((p) => {
      if (kindFilter !== "all" && p.kind !== kindFilter) return false;
      if (yearFilter !== "all" && p.year !== yearFilter) return false;
      if (!normalized) return true;
      const haystack = [
        p.title,
        p.blurb,
        p.role,
        p.year,
        p.tags.join(" "),
        p.tools.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [kindFilter, query, yearFilter]);

  const filteredIdSet = useMemo(() => new Set(filteredProjects.map((p) => p.id)), [filteredProjects]);

  const jumpTo = useCallback((id: string) => {
    const node = document.getElementById(sectionId(id));
    if (!node) return;

    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setActiveProjectId(id);
    history.replaceState(null, "", `#project-${encodeURIComponent(id)}`);

    const top = node.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAllFiltered = useCallback(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      filteredProjects.forEach((p) => next.add(p.id));
      return next;
    });
  }, [filteredProjects]);

  const collapseFiltered = useCallback(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      filteredProjects.forEach((p) => next.delete(p.id));
      return next;
    });
  }, [filteredProjects]);

  const handleBack = useCallback(() => {
    routeTransition.goto("/");
  }, [routeTransition]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(doc > 0 ? Math.min(1, Math.max(0, window.scrollY / doc)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const applyHash = () => {
      const targetId = fromHash(window.location.hash);
      if (!targetId || !filteredIdSet.has(targetId)) return;
      const delay = window.setTimeout(() => jumpTo(targetId), 120);
      return () => window.clearTimeout(delay);
    };

    const cleanup = applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => {
      cleanup?.();
      window.removeEventListener("hashchange", applyHash);
    };
  }, [filteredIdSet, jumpTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key.toLowerCase() === "g") {
        document.getElementById("archive-index-nav")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("archive-search")?.focus();
        return;
      }

      const n = Number(e.key);
      if (Number.isNaN(n) || n < 1 || n > 9) return;
      const match = filteredProjects[n - 1];
      if (match) jumpTo(match.id);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filteredProjects, jumpTo]);

  useEffect(() => {
    if (!filteredProjects.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (!visible.length) return;
        const id = visible[0].target.getAttribute("data-project-id");
        if (id) setActiveProjectId(id);
      },
      {
        root: null,
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    filteredProjects.forEach((p) => {
      const node = document.getElementById(sectionId(p.id));
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [filteredProjects]);

  const accessionRange = useMemo(() => {
    if (!PROJECTS.length) return "";
    const first = PROJECTS[0].accession;
    const last = PROJECTS[PROJECTS.length - 1].accession;
    return `${first} - ${last}`;
  }, []);

  return (
    <main className="archive-root" aria-label="Archive of works">
      <div className="archive-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden />

      <header className="archive-bar">
        <span className="archive-bar__title">Ajai Archive</span>
        <span className="archive-bar__meta">{PROJECTS.length} entries</span>
        <span className="archive-bar__meta">{accessionRange}</span>
        <button type="button" className="archive-bar__back" onClick={handleBack}>
          Back to desktop
        </button>
      </header>

      <div className="archive-layout">
        <aside className="archive-side" id="archive-index-nav" aria-label="Archive index">
          <div className="archive-side__intro">
            <p className="archive-side__kicker">Archive index</p>
            <h1 className="archive-side__title">Everything in one place.</h1>
            <p className="archive-side__copy">
              This view is built to scale with your full body of work. Use filters or jump straight
              to any entry.
            </p>
          </div>

          <div className="archive-controls">
            <label className="archive-field">
              <span>Search</span>
              <input
                id="archive-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Title, tag, tool, year..."
              />
            </label>

            <div className="archive-field">
              <span>Type</span>
              <div className="archive-segment">
                <button
                  type="button"
                  data-active={kindFilter === "all"}
                  onClick={() => setKindFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  data-active={kindFilter === "drive"}
                  onClick={() => setKindFilter("drive")}
                >
                  Works
                </button>
                <button
                  type="button"
                  data-active={kindFilter === "kext"}
                  onClick={() => setKindFilter("kext")}
                >
                  Experiments
                </button>
              </div>
            </div>

            <label className="archive-field">
              <span>Year</span>
              <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                <option value="all">All years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <div className="archive-controls__row">
              <button type="button" onClick={expandAllFiltered}>
                Expand all
              </button>
              <button type="button" onClick={collapseFiltered}>
                Collapse all
              </button>
            </div>
          </div>

          <div className="archive-side__meta">
            <span>{filteredProjects.length} visible</span>
            <span>/{PROJECTS.length} total</span>
          </div>

          <ol className="archive-index">
            {filteredProjects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="archive-index__item"
                  data-active={activeProjectId === p.id}
                  onClick={() => jumpTo(p.id)}
                  aria-label={`${p.title}, ${p.year}`}
                >
                  <span className="archive-index__num">{p.index}</span>
                  <span className="archive-index__label">
                    <span>{p.title}</span>
                    <span>{p.year}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section className="archive-content" aria-label="Archive entries">
          {filteredProjects.length ? (
            filteredProjects.map((p) => (
              <article
                key={p.id}
                id={sectionId(p.id)}
                data-project-id={p.id}
                className="archive-entry"
                aria-labelledby={`${sectionId(p.id)}-title`}
              >
                <header className="archive-entry__head">
                  <p className="archive-entry__serial">
                    {p.index} · {p.accession}
                    {p.status ? ` · ${p.status}` : ""}
                  </p>
                  <h2 id={`${sectionId(p.id)}-title`} className="archive-entry__title">
                    {p.title}
                  </h2>
                  <p className="archive-entry__blurb">{p.blurb}</p>

                  <div className="archive-entry__meta">
                    <span>{p.year}</span>
                    <span>{p.kind === "drive" ? "Work" : "Experiment"}</span>
                    <span>{p.role}</span>
                  </div>

                  <button
                    type="button"
                    className="archive-entry__toggle"
                    onClick={() => toggleExpanded(p.id)}
                    aria-expanded={expandedIds.has(p.id)}
                    aria-controls={`${sectionId(p.id)}-details`}
                  >
                    {expandedIds.has(p.id) ? "Hide details" : "Show details"}
                  </button>
                </header>

                {expandedIds.has(p.id) ? (
                  <div className="archive-entry__details" id={`${sectionId(p.id)}-details`}>
                    <div className="archive-entry__text">
                      {p.wallText.map((para) => (
                        <p key={para}>{para}</p>
                      ))}
                    </div>

                    <aside className="archive-entry__side">
                      <dl>
                        <dt>Tools</dt>
                        <dd>{p.tools.join(" · ")}</dd>
                        {p.collaborators?.length ? (
                          <>
                            <dt>With</dt>
                            <dd>{p.collaborators.join(", ")}</dd>
                          </>
                        ) : null}
                      </dl>
                      <div className="archive-tagrow">
                        {p.tags.map((tag) => (
                          <span key={tag}>#{tag}</span>
                        ))}
                      </div>
                    </aside>

                    {p.links.length ? (
                      <div className="archive-linkrow">
                        {p.links.map((link) => (
                          link.href === "#" ? (
                            <span
                              key={link.label}
                              className="archive-link"
                              data-kind={link.kind ?? "external"}
                              aria-disabled="true"
                              title="Link pending"
                            >
                              <span>{link.label}</span>
                              <span aria-hidden>Pending</span>
                            </span>
                          ) : (
                            <a
                              key={link.label}
                              className="archive-link"
                              data-kind={link.kind ?? "external"}
                              href={link.href}
                              target={link.href.startsWith("http") ? "_blank" : undefined}
                              rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                            >
                              <span>{link.label}</span>
                              <span aria-hidden>Open</span>
                            </a>
                          )
                        ))}
                      </div>
                    ) : null}

                    <div className="archive-media">
                      {p.media.map((m, k) => (
                        <MediaSlot
                          key={`${p.id}-${k}`}
                          m={m}
                          idx={`${p.index}.${String(k + 1).padStart(2, "0")}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="archive-empty">
              <p>No entries match your filters.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setKindFilter("all");
                  setYearFilter("all");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MediaSlot({ m, idx }: { m: ProjectMedia; idx: string }) {
  if (m.kind === "video") {
    return (
      <div className="archive-media__item" data-layout={m.layout ?? "full"}>
        <span className="archive-media__idx">{idx}</span>
        <figure className="archive-media__figure">
          <video
            className="archive-media__video"
            src={m.src}
            poster={m.poster}
            muted
            loop
            autoPlay
            playsInline
          />
          {m.caption ? <figcaption className="archive-media__cap">{m.caption}</figcaption> : null}
        </figure>
      </div>
    );
  }

  return (
    <div className="archive-media__item" data-layout={m.layout ?? "wide"}>
      <span className="archive-media__idx">{idx}</span>
      <figure className="archive-media__figure">
        <img className="archive-media__img" src={m.src} alt={m.alt} loading="lazy" decoding="async" />
        {m.caption ? <figcaption className="archive-media__cap">{m.caption}</figcaption> : null}
      </figure>
    </div>
  );
}
