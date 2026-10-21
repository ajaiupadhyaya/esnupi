import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { PROJECTS } from "@/lib/projectsData";
import { CASE_STUDY_URL } from "@/lib/caseStudyUrl";
import {
  SITE_OWNER_EMAIL,
  SITE_OWNER_GITHUB,
  SITE_OWNER_LINKEDIN,
  SITE_OWNER_SUBSTACK,
} from "@/lib/siteIdentity";
import "./portfolio.css";

const photos = {
  city: "/portfolio/new-york-skyline.webp",
};
const selectedWork = PROJECTS.filter((project) => project.kind === "drive");

function Arrow({ direction = "up-right" }: { direction?: "up-right" | "down" | "up" }) {
  return (
    <svg className={`bp-arrow bp-arrow--${direction}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Keep hash links useful while adding a motion-aware scroll and focus handoff. */
function jumpToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  window.history.replaceState(null, "", `#${id}`);
  target.focus({ preventScroll: true });
  const scrollTarget = target.closest(".bp-section") ?? target;
  scrollTarget.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
}

export default function Portfolio() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-blue-portfolio", "");
    return () => document.documentElement.removeAttribute("data-blue-portfolio");
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      const opening = gsap.timeline({ defaults: { ease: "power3.out" } });
      opening.from(".bp-name-line > span", { yPercent: 105, duration: 0.85 }, 0.08)
        .from(".bp-introduction", { y: 14, opacity: 0, duration: 0.65, stagger: 0.06 }, 0.5);
    }, root);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-revealed", "");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    root.classList.add("bp-motion");
    root.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      root.classList.remove("bp-motion");
      context.revert();
    };
  }, []);

  return (
    <main className="blue-portfolio" ref={rootRef} id="top" tabIndex={-1}>
      <div className="bp-grain" aria-hidden="true" />
      <a className="bp-skip" href="#work" onClick={(event) => jumpToSection(event, "work")}>Skip to work</a>
      <header className="bp-header">
        <nav aria-label="Portfolio sections" className="bp-nav">
          <a href="#work" onClick={(event) => jumpToSection(event, "work")}>Work</a>
          <a href="#photographs" onClick={(event) => jumpToSection(event, "photographs")}>Film</a>
        </nav>
        <Link className="bp-desktop-link" to="/desktop">Mac view <Arrow /></Link>
      </header>
      <section className="bp-hero" aria-label="Introduction">
        <h1 className="bp-name"><span className="bp-name-line"><span>AJ Saito</span></span></h1>
        <p className="bp-introduction">Code, research, photographs.</p>
      </section>
      <section className="bp-work bp-section" aria-labelledby="work">
        <h2 id="work" tabIndex={-1}>Work</h2>
        <ol className="bp-projects">
          {selectedWork.map((project, index) => (
            <li key={project.id} data-reveal style={{ "--reveal-delay": `${index * 35}ms` } as CSSProperties}>
              <Link className="bp-project" to={project.id === "case-study-dashboard" ? CASE_STUDY_URL : `/archive#project-${project.id}`}>
                <span>{project.title}</span><Arrow />
              </Link>
            </li>
          ))}
        </ol>
        <Link to="/archive" className="bp-archive">All work ↗</Link>
      </section>
      <section className="bp-photographs bp-section" aria-label="Film photographs">
        <figure data-reveal>
          <Link to="/film" aria-label="View the film archive: New York photographs">
            <picture><img src={photos.city} srcSet="/portfolio/new-york-skyline-small.webp 900w, /portfolio/new-york-skyline.webp 1800w" sizes="(max-width: 700px) 88vw, 48vw" width={1800} height={1194} loading="lazy" alt="The Manhattan skyline beneath a pale sky, photographed from a passing car on 35mm film." /></picture>
          </Link>
          <figcaption id="photographs" tabIndex={-1}><span>New York / 35mm</span><Link to="/film">Film archive ↗</Link></figcaption>
        </figure>
      </section>
      <footer className="bp-footer" data-reveal>
        <p>Computer science &amp; economics.</p>
        <nav aria-label="Find me elsewhere" className="bp-social-links">
          <a href={`mailto:${SITE_OWNER_EMAIL}`}>Email ↗</a>
          <a href={SITE_OWNER_GITHUB}>GitHub ↗</a>
          <a href={SITE_OWNER_LINKEDIN}>LinkedIn ↗</a>
          <a href={SITE_OWNER_SUBSTACK}>Substack ↗</a>
        </nav>
        <a href="#top" onClick={(event) => jumpToSection(event, "top")}>AJ Saito.</a>
      </footer>
    </main>
  );
}
