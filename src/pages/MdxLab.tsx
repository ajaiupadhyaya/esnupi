import { DateTime } from "luxon";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useRouteTransition } from "@/components/layout/RouteTransition";
import "./mdx-lab.css";

const FEATURED_WORK: Array<{
  title: string;
  category: string;
  year: string;
  description: string;
  href: string;
  meta: string;
}> = [
  {
    title: "Feature Placeholder 01",
    category: "Projects",
    year: "2026",
    description:
      "Replace this with a sharp one-sentence account of a flagship project, the problem it addressed, and why it matters.",
    href: "#",
    meta: "Case study / product / outcome",
  },
  {
    title: "Feature Placeholder 02",
    category: "Research",
    year: "2025",
    description:
      "Use this larger card for a research thread, collaboration, or experiment that deserves more atmosphere than a row.",
    href: "#",
    meta: "Prototype / research / archive",
  },
];

const WORK_INDEX: Array<{
  title: string;
  category: string;
  year: string;
  href: string;
}> = [
  { title: "Project Name 01", category: "Projects", year: "2026", href: "#" },
  { title: "Project Name 02", category: "Writing", year: "2026", href: "#" },
  { title: "Project Name 03", category: "Notes", year: "2025", href: "#" },
  { title: "Project Name 04", category: "Research", year: "2025", href: "#" },
  { title: "Project Name 05", category: "Experiments", year: "2025", href: "#" },
  { title: "Project Name 06", category: "Collaborations", year: "2024", href: "#" },
  { title: "Project Name 07", category: "Projects", year: "2024", href: "#" },
  { title: "Project Name 08", category: "Writing", year: "2024", href: "#" },
  { title: "Project Name 09", category: "Research", year: "2023", href: "#" },
  { title: "Project Name 10", category: "Notes", year: "2023", href: "#" },
  { title: "Project Name 11", category: "Experiments", year: "2023", href: "#" },
  { title: "Project Name 12", category: "Collaborations", year: "2022", href: "#" },
];

export default function MdxLab() {
  const year = DateTime.now().year;
  const routeTransition = useRouteTransition();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [cursor, setCursor] = useState({ x: 0, y: 0, hot: false, visible: false });

  /* Track reading progress as a share of the scrollable area. */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(1, Math.max(0, el.scrollTop / scrollable)));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const revealItems = Array.from(root.querySelectorAll<HTMLElement>(".mdx-lab__reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("mdx-lab__reveal--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { root, threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="mdx-lab"
      ref={scrollerRef}
      onMouseMove={(event) => {
        const target = event.target as HTMLElement;
        setCursor({
          x: event.clientX,
          y: event.clientY,
          hot: Boolean(target.closest("a, button")),
          visible: true,
        });
      }}
      onMouseLeave={() => setCursor((next) => ({ ...next, visible: false }))}
    >
      <div
        className={`mdx-lab__cursor${cursor.hot ? " mdx-lab__cursor--hot" : ""}${
          cursor.visible ? " mdx-lab__cursor--visible" : ""
        }`}
        style={{ "--cursor-x": `${cursor.x}px`, "--cursor-y": `${cursor.y}px` } as CSSProperties}
        aria-hidden
      />
      <div
        className="mdx-lab__progress"
        style={{ width: `${progress * 100}vw` }}
        aria-hidden
      />

      <aside className="mdx-lab__side-label" aria-hidden>
        ©{year} / VOL. 01
      </aside>

      <div className="mdx-lab__paper">
        <header className="mdx-lab__head">
          <div className="mdx-lab__meta">
            <span>PERSONAL CATALOG</span>
            <span className="mdx-lab__meta-sep">/</span>
            <span>SELECTED WORKS</span>
            <span className="mdx-lab__meta-sep">/</span>
            <span>{year}</span>
          </div>
        </header>

        <section className="mdx-lab__hero" aria-label="Work index">
          <p className="mdx-lab__kicker">Open catalog / keep moving</p>
          <h1>WORK</h1>
          <p className="mdx-lab__intro">
            A temporary index for projects, writing, research, notes, experiments,
            and collaborations. Replace the labels below with real work when the
            archive is ready.
          </p>
        </section>

        <section className="mdx-lab__features" aria-label="Featured work">
          {FEATURED_WORK.map((item, index) => (
            <a
              key={item.title}
              href={item.href}
              className={`mdx-lab__feature mdx-lab__feature--${index + 1} mdx-lab__reveal`}
            >
              <span className="mdx-lab__feature-count">0{index + 1}</span>
              <span className="mdx-lab__feature-meta">
                {item.category} — {item.year}
              </span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <span className="mdx-lab__feature-hidden">{item.meta}</span>
            </a>
          ))}
        </section>

        <section className="mdx-lab__index" aria-label="Work list">
          <div className="mdx-lab__index-head">
            <span>Project Name</span>
            <span>Category — Year</span>
          </div>
          <div className="mdx-lab__rows">
            {WORK_INDEX.map((item, index) => (
              <a
                key={`${item.title}-${item.year}`}
                href={item.href}
                className="mdx-lab__row mdx-lab__reveal"
                style={{ "--delay": `${180 + index * 55}ms` } as CSSProperties}
              >
                <span className="mdx-lab__row-title">
                  <span className="mdx-lab__row-arrow" aria-hidden>
                    &#8594;
                  </span>
                  {item.title}
                </span>
                <span className="mdx-lab__row-dots" aria-hidden />
                <span className="mdx-lab__row-meta">
                  {item.category} — {item.year}
                </span>
              </a>
            ))}
          </div>
        </section>

        <footer className="mdx-lab__foot">
          <div className="mdx-lab__stamp">index remains provisional</div>
          <button
            type="button"
            className="mdx-lab__back"
            onClick={() => routeTransition.goto("/")}
          >
            &larr; return to desktop
          </button>
        </footer>
      </div>
    </div>
  );
}
