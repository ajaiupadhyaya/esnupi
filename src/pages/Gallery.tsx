import { useRouteTransition } from "@/components/layout/RouteTransition";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import "./gallery.css";

gsap.registerPlugin(ScrollTrigger);

const MARQUEE = ["Light", "Surface", "Sequence", "Negative", "Print", "Study", "Room"];

const WORKS: Array<{
  id: string;
  title: string;
  year: string;
  src: string;
  caption: string;
  credit: string;
  layout: "split" | "wide" | "tall";
}> = [
  {
    id: "I",
    title: "Altitude",
    year: "2024",
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=2400&q=85",
    caption: "Distance collapses into tone. The frame is a decision about what weather is allowed inside.",
    credit: "Photograph via Unsplash",
    layout: "split",
  },
  {
    id: "II",
    title: "Paper sky",
    year: "2023",
    src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57f90?auto=format&fit=max&w=2400&q=85",
    caption: "Abstraction as refusal: no subject, only viscosity and edge.",
    credit: "Photograph via Unsplash",
    layout: "wide",
  },
  {
    id: "III",
    title: "Field note",
    year: "2022",
    src: "https://images.unsplash.com/photo-1500534314211-6a8a052b84e0?auto=format&fit=max&w=2400&q=85",
    caption: "Ideas staged as texture — what looks like noise is a list of intentions.",
    credit: "Photograph via Unsplash",
    layout: "tall",
  },
];

export default function Gallery() {
  const routeTransition = useRouteTransition();
  const rootRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      setProgress(doc > 0 ? Math.min(1, Math.max(0, y / doc)) : 0);
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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".gallery-reveal").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: reduced ? 0 : 36 },
          {
            opacity: 1,
            y: 0,
            duration: reduced ? 0.01 : 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 92%",
              once: true,
            },
          },
        );
      });

      if (!reduced) {
        gsap.utils.toArray<HTMLElement>(".gallery-parallax").forEach((img) => {
          const wrap = img.closest(".gallery-parallax-wrap");
          if (!wrap) return;
          gsap.fromTo(
            img,
            { yPercent: 7 },
            {
              yPercent: -7,
              ease: "none",
              scrollTrigger: {
                trigger: wrap,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.5,
              },
            },
          );
        });
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

  return (
    <main ref={rootRef} className="gallery-root">
      <div
        className="gallery-progress"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />

      <header className="gallery-bar">
        <span className="gallery-reveal">Study collection</span>
        <span className="gallery-bar__mark gallery-reveal" aria-hidden />
      </header>

      <section className="gallery-hero">
        <p className="gallery-hero__label gallery-reveal">Temporary exhibition / digital room</p>
        <h1 className="gallery-hero__title gallery-reveal">
          Light,
          <br />
          material,
          <br />
          sequence
        </h1>
        <div className="gallery-hero__rule gallery-reveal" />
        <p className="gallery-hero__lede gallery-reveal">
          A wall for photographs and fragments of thought. High resolution is not only pixels — it is
          the sharpness of what you are willing to leave out.
        </p>
      </section>

      <div className="gallery-marquee" aria-hidden>
        <div className="gallery-marquee__track">
          {[...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={`${w}-${i}`} className="gallery-marquee__word">
              {w}
            </span>
          ))}
        </div>
      </div>

      {WORKS.map((w) => {
        if (w.layout === "wide") {
          return (
            <figure key={w.id} className="gallery-figure gallery-reveal">
              <div className="gallery-figure__inner gallery-parallax-wrap">
                <img
                  className="gallery-figure__img gallery-parallax"
                  src={w.src}
                  alt=""
                  width={2400}
                  height={1030}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => ScrollTrigger.refresh()}
                />
              </div>
              <figcaption className="gallery-figure__foot">
                <span>
                  <strong>{w.title}</strong>
                  <span className="gallery-figure__index"> — {w.year}</span>
                  <br />
                  {w.caption}
                </span>
                <span className="gallery-figure__index">{w.id}</span>
              </figcaption>
              <span className="gallery-figure__credit">{w.credit}</span>
            </figure>
          );
        }

        const split = w.layout === "split";
        const tall = w.layout === "tall";

        return (
          <div key={w.id} className="gallery-pad">
            <article
              className={`gallery-block gallery-reveal${split ? " gallery-block--split" : ""}${
                tall ? " gallery-block--tall" : ""
              }`}
            >
              <div className="gallery-block__meta">
                <strong>
                  {w.title} <span style={{ fontWeight: 400, opacity: 0.6 }}>{w.year}</span>
                </strong>
                <span>Accession {w.id}</span>
              </div>
              {split ? (
                <div className="gallery-block__meta" style={{ borderRight: "none" }}>
                  <span style={{ lineHeight: 1.7 }}>{w.caption}</span>
                </div>
              ) : null}
              <figure
                className="gallery-block__figure gallery-parallax-wrap"
                style={split ? { gridColumn: "1 / -1", borderTop: "1px solid #0a0a0a" } : undefined}
              >
                <img
                  className="gallery-block__img gallery-parallax"
                  src={w.src}
                  alt=""
                  width={2400}
                  height={1800}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => ScrollTrigger.refresh()}
                />
              </figure>
              <div className="gallery-block__cap">
                {split ? (
                  <span className="gallery-block__credit">{w.credit}</span>
                ) : (
                  <>
                    {w.caption}
                    <span className="gallery-block__credit">{w.credit}</span>
                  </>
                )}
              </div>
            </article>
          </div>
        );
      })}

      <div className="gallery-graphic gallery-reveal">
        <div className="gallery-graphic__frame">
          <div className="gallery-graphic__orbit" aria-hidden />
        </div>
      </div>

      <section className="gallery-text">
        <p className="gallery-text__label gallery-reveal">Wall text</p>
        <p className="gallery-reveal">
          This room treats the browser like a museum plan: slow movement, hard margins, and captions
          that admit doubt. Replace the images with your own negatives when you are ready — the
          layout is the argument.
        </p>
        <p className="gallery-reveal">
          Ideas appear here as short statements so photography can stay large. Nothing scrolls for
          novelty; motion clarifies hierarchy.
        </p>
      </section>

      <footer className="gallery-foot">
        <button type="button" className="gallery-foot__back" onClick={() => routeTransition.goto("/")}>
          ← Desktop
        </button>
        <p className="gallery-foot__note">
          Replace the Unsplash placeholders with your own files when the work is ready — the layout is
          the constant.
        </p>
      </footer>
    </main>
  );
}
