import { useRouteTransition } from "@/components/layout/RouteTransition";
import { PROJECTS, type Project, type ProjectMedia } from "@/lib/projectsData";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./archive.css";

gsap.registerPlugin(ScrollTrigger);

const MANIFESTO_MARQUEE = [
  "archive",
  "notes from the studio",
  "a room that keeps its own light",
  "index of works",
  "sequence, surface, intent",
];

export default function Archive() {
  const routeTransition = useRouteTransition();
  const rootRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  /* floating index thumbnail — state lives here because we orchestrate it
     from both pointermove (position) and row hover (which project). */
  const thumbRef = useRef<HTMLDivElement>(null);
  const thumbPosRef = useRef({ x: -9999, y: -9999 });
  const [thumbProject, setThumbProject] = useState<Project | null>(null);
  const thumbLerpRef = useRef({ x: -9999, y: -9999 });

  /* ── progress bar ──────────────────────────────────────────────────── */
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

  /* ── scroll reveals + parallax ──────────────────────────────────────── */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".archive-reveal").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: reduced ? 0.01 : 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onStart: () => el.classList.add("archive-reveal--on"),
        });
      });

      if (!reduced) {
        gsap.utils.toArray<HTMLElement>(".archive-media__img, .archive-media__video").forEach((img) => {
          const wrap = img.closest(".archive-media__item");
          if (!wrap) return;
          gsap.fromTo(
            img,
            { yPercent: 6 },
            {
              yPercent: -6,
              ease: "none",
              scrollTrigger: {
                trigger: wrap,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.6,
              },
            },
          );
        });

        gsap.utils.toArray<HTMLElement>(".archive-divider__rule").forEach((rule) => {
          gsap.to(rule, {
            scaleX: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: rule, start: "top 80%", end: "top 30%", scrub: true },
          });
        });
      } else {
        document
          .querySelectorAll<HTMLElement>(".archive-reveal")
          .forEach((el) => el.classList.add("archive-reveal--on"));
        document
          .querySelectorAll<HTMLElement>(".archive-divider__rule")
          .forEach((el) => (el.style.transform = "scaleX(1)"));
      }
    }, rootRef);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    refresh();

    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, []);

  /* ── deep-link to a project via #project-<id> ───────────────────────── */
  useEffect(() => {
    const raw = window.location.hash;
    if (!raw) return;
    const id = window.setTimeout(() => {
      const node = document.getElementById(raw.replace(/^#/, ""));
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 240);
    return () => window.clearTimeout(id);
  }, []);

  /* ── keyboard shortcuts: 1..9 jump to project, G jumps to index ─────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const n = Number(e.key);
      if (!Number.isNaN(n) && n >= 1 && n <= PROJECTS.length) {
        const p = PROJECTS[n - 1];
        document
          .getElementById(`project-${p.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (e.key.toLowerCase() === "g") {
        document
          .getElementById("archive-index")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── floating thumbnail: smooth-follow the cursor ───────────────────── */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      thumbPosRef.current.x = e.clientX;
      thumbPosRef.current.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const lerp = () => {
      const p = thumbLerpRef.current;
      const target = thumbPosRef.current;
      p.x += (target.x - p.x) * 0.18;
      p.y += (target.y - p.y) * 0.18;
      if (thumbRef.current) {
        thumbRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(lerp);
    };
    raf = requestAnimationFrame(lerp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const jumpTo = useCallback((id: string) => {
    const node = document.getElementById(`project-${id}`);
    if (!node) return;
    history.replaceState(null, "", `#project-${id}`);
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleBack = useCallback(() => {
    routeTransition.goto("/");
  }, [routeTransition]);

  const thumbImage = useMemo(() => {
    if (!thumbProject) return undefined;
    const firstImage = thumbProject.media.find((m): m is Extract<ProjectMedia, { kind: "image" }> => m.kind === "image");
    return firstImage?.src;
  }, [thumbProject]);

  const accessionRange = useMemo(() => {
    if (!PROJECTS.length) return "";
    const first = PROJECTS[0].accession;
    const last = PROJECTS[PROJECTS.length - 1].accession;
    return `${first} — ${last}`;
  }, []);

  return (
    <main ref={rootRef} className="archive-root" aria-label="Archive of works">
      <div className="archive-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden />

      {/* ─── Sticky header / accession bar ─────────────────────────── */}
      <header className="archive-bar">
        <span className="archive-bar__lockup">
          <span className="archive-bar__mark" aria-hidden />
          <span className="archive-bar__title">Ajai - Archive</span>
        </span>
        <span className="archive-bar__meta">2019 —  {new Date().getFullYear()}</span>
        <span className="archive-bar__meta" aria-hidden>
          {accessionRange}
        </span>
        <button type="button" className="archive-bar__back" onClick={handleBack}>
          ← Desktop
        </button>
      </header>

      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="archive-hero">
        <p className="archive-hero__kicker archive-reveal">
          Permanent collection · Ongoing
        </p>
        <h1 className="archive-hero__title archive-reveal">
          creations,
          <br />
          2019
          <em>—</em>
          {new Date().getFullYear().toString().slice(-2)}.
        </h1>
        <hr className="archive-hero__rule archive-reveal" />
        <p className="archive-hero__lede archive-reveal">
          A catalog of finished objects, unfinished experiments, and the occasional essay.
          This room is organized like a museum plan: <em>walk slowly</em>, read the wall
          text, let the index be the map. Press <kbd>1</kbd>–<kbd>{PROJECTS.length}</kbd> to
          jump between works, or <kbd>G</kbd> to return to the index.
        </p>
        <dl className="archive-hero__info archive-reveal">
          <div>
            <dt>Works</dt>
            <dd>{PROJECTS.length} entries</dd>
          </div>
          <div>
            <dt>Medium</dt>
            <dd>mixed</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>digital</dd>
          </div>
          <div>
            <dt>Curated by</dt>
            <dd>ajai</dd>
          </div>
        </dl>
      </section>

      {/* ─── Index (centerpiece) ───────────────────────────────────── */}
      <section className="archive-index-wrap" id="archive-index" aria-label="Index">
        <div className="archive-index-head">
          <span>Index · hover to preview · click to enter</span>
          <span>{PROJECTS.length.toString().padStart(2, "0")} entries</span>
        </div>
        <ol className="archive-index">
          {PROJECTS.map((p) => (
            <li
              key={p.id}
              className="archive-index__row archive-reveal"
              role="button"
              tabIndex={0}
              onClick={() => jumpTo(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  jumpTo(p.id);
                }
              }}
              onPointerEnter={() => setThumbProject(p)}
              onPointerLeave={() => setThumbProject(null)}
              onFocus={() => setThumbProject(p)}
              onBlur={() => setThumbProject(null)}
              aria-label={`${p.title}, ${p.year}. ${p.role}`}
            >
              <span className="archive-index__num">{p.index} / {PROJECTS.length.toString().padStart(2, "0")}</span>
              <h3 className="archive-index__title">
                {p.title}
              </h3>
              <span className="archive-index__meta">
                {p.year}
                <br />
                {p.role.split(" · ")[0]}
              </span>
              <span className="archive-index__arrow" aria-hidden>↘</span>
            </li>
          ))}
        </ol>
      </section>

      {/* floating preview thumbnail */}
      <div
        ref={thumbRef}
        className={`archive-index-thumb${thumbProject ? " archive-index-thumb--on" : ""}`}
        aria-hidden
      >
        {thumbImage ? <img src={thumbImage} alt="" /> : null}
        {thumbProject ? <span className="archive-index-thumb__tag">{thumbProject.index} — {thumbProject.year}</span> : null}
      </div>

      {/* ─── Manifesto + marquee (camp punctuation) ────────────────── */}
      <section className="archive-manifesto">
        <p className="archive-manifesto__eyebrow archive-reveal">Wall text · §00</p>
        <p className="archive-manifesto__text archive-reveal">
          A portfolio is not a resume. It is a <mark>room</mark> you were invited into —
          and you are allowed, in that room, to be <em>strange</em>.
        </p>
        <p className="archive-manifesto__sig archive-reveal">— esnupi, on the wall, {new Date().getFullYear()}</p>
      </section>

      <div className="archive-marquee" aria-hidden>
        <div className="archive-marquee__track">
          {[...MANIFESTO_MARQUEE, ...MANIFESTO_MARQUEE, ...MANIFESTO_MARQUEE].map((w, i) => (
            <span key={`${w}-${i}`}>
              <span className="archive-marquee__star">✳</span>
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Case studies ──────────────────────────────────────────── */}
      {PROJECTS.map((p, i) => (
        <CaseStudy
          key={p.id}
          p={p}
          next={PROJECTS[i + 1]}
        />
      ))}

      {/* ─── Afterword ─────────────────────────────────────────────── */}
      <section className="archive-after">
        <p className="archive-after__lead archive-reveal">
          Thank you for <em>scrolling slowly.</em> The rest of the room is waiting whenever
          you are. If anything here is useful or confusing, write.
        </p>
        <div className="archive-after__colophon archive-reveal">
          <p>Set in a system serif and a monospaced companion.</p>
          <p>Rendered with React, GSAP, and patience.</p>
          <p>Version 01 · Last amended {new Date().toISOString().slice(0, 10)}</p>
          <button
            type="button"
            className="archive-after__return"
            onClick={handleBack}
          >
            ← Return to the desktop
          </button>
        </div>
      </section>

      <footer className="archive-foot">
        <span>© esnupi — all wall text unlicensed</span>
        <span>fin.</span>
      </footer>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Case study                                                               */
/* ─────────────────────────────────────────────────────────────────────── */

function CaseStudy({
  p,
  next,
}: {
  p: Project;
  next?: Project;
}) {
  return (
    <>
      <section
        id={`project-${p.id}`}
        className="archive-case"
        aria-labelledby={`project-${p.id}-title`}
      >
        <p className="archive-case__accession archive-reveal">
          No. {p.index} · {p.accession}{p.status ? ` · ${p.status}` : ""}
        </p>

        <header className="archive-case__head">
          <h2 className="archive-case__title archive-reveal" id={`project-${p.id}-title`}>
            {p.title}
          </h2>
          <aside className="archive-case__side archive-reveal">
            <dl>
              <dt>Year</dt>
              <dd>{p.year}</dd>
              <dt>Role</dt>
              <dd>{p.role}</dd>
              <dt>Status</dt>
              <dd>{p.status ?? "—"}</dd>
              {p.collaborators && p.collaborators.length > 0 ? (
                <>
                  <dt>With</dt>
                  <dd>{p.collaborators.join(", ")}</dd>
                </>
              ) : null}
            </dl>
            <div className="archive-chiprow">
              {p.tags.map((t) => (
                <span key={t} className="archive-chip">#{t}</span>
              ))}
            </div>
          </aside>
        </header>

        <div className="archive-case__body">
          <div className="archive-case__walltext archive-reveal">
            {p.wallText.map((para, k) => (
              <p key={k}>{para}</p>
            ))}
          </div>
          <div className="archive-case__sidenote archive-reveal">
            <strong>Tools / stack</strong>
            {p.tools.join(" · ")}
          </div>

          {p.links.length > 0 ? (
            <div className="archive-linkrow archive-reveal">
              {p.links.map((l) => (
                <a
                  key={l.label}
                  className="archive-link"
                  data-kind={l.kind ?? "external"}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                >
                  <span>{l.label}</span>
                  <span aria-hidden>↗</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="archive-media">
          {p.media.map((m, k) => (
            <MediaSlot key={k} m={m} idx={`${p.index}.${String(k + 1).padStart(2, "0")}`} />
          ))}
        </div>
      </section>

      {next ? (
        <aside className="archive-divider" aria-hidden>
          <span className="archive-divider__kicker">
            Next · No. {next.index} / {PROJECTS.length.toString().padStart(2, "0")}
          </span>
          <h3 className="archive-divider__title">
            <em>{next.title}</em>
          </h3>
          <hr className="archive-divider__rule" />
          <div className="archive-divider__ticker">
            <span>{next.year}</span>
            <span>{next.role}</span>
            <span>{next.kind === "drive" ? "Work" : "Experiment"}</span>
          </div>
        </aside>
      ) : null}
    </>
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
        <img
          className="archive-media__img"
          src={m.src}
          alt={m.alt}
          loading="lazy"
          decoding="async"
          onLoad={() => ScrollTrigger.refresh()}
        />
        {m.caption ? <figcaption className="archive-media__cap">{m.caption}</figcaption> : null}
      </figure>
    </div>
  );
}
