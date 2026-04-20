import Hello from "@/content/hello.mdx";
import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";
import { useRouteTransition } from "@/components/layout/RouteTransition";
import "./mdx-lab.css";

export default function MdxLab() {
  const date = DateTime.now().toFormat("dd LLL yyyy").toUpperCase();
  const routeTransition = useRouteTransition();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

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

  return (
    <div className="mdx-lab" ref={scrollerRef}>
      <div
        className="mdx-lab__progress"
        style={{ width: `${progress * 100}vw` }}
        aria-hidden
      />

      <div className="mdx-lab__paper">
        <header className="mdx-lab__head">
          <div className="mdx-lab__meta">
            <span>LAB</span>
            <span className="mdx-lab__meta-sep">/</span>
            <span>A READING</span>
          </div>
        </header>

        <article className="mdx-lab__article">
          <Hello />
        </article>

        <footer className="mdx-lab__foot">
          <div className="mdx-lab__stamp">printed on {date}</div>
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
