/**
 * /  —  Brutalist, MoMA-inspired home plate.
 *
 *  The felt icons are used typographically: as stamps, drop-caps, index
 *  markers, and punctuation on a large, off-white paper canvas. No desktop
 *  metaphor; the Mac OS 8 room still exists behind /visit-classic → /desktop.
 *  to visit it.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouteTransition } from "@/components/layout/RouteTransition";
import { PROJECTS } from "@/lib/projectsData";

import emailfelt from "../../images/emailfelt.png";
import feltheart1 from "../../images/feltheart1.png";
import feltheart2 from "../../images/feltheart2.png";
import feltheart3 from "../../images/feltheart3.webp";
import feltheart4 from "../../images/feltheart4.webp";
import feltfolder from "../../images/feltfolder.png";
import feltmoon from "../../images/feltmoon.png";
import framefelt from "../../images/framefelt.png";
import homefelt from "../../images/homefelt.png";
import phonefelt from "../../images/phonefelt.png";
import photobookfelt from "../../images/photobookfelt.png";
import photoboothfelt from "../../images/photoboothfelt.png";

import "./home.css";

/* -------------------------------------------------------------------- */
/*  Content                                                             */
/* -------------------------------------------------------------------- */

type Room = {
  num: string;
  title: string;
  subtitle: string;
  vibe: string;
  meta: { label: string; body: string };
  path: string;
  icon: string;
};

const ROOMS: Room[] = [
  {
    num: "I",
    title: "About",
    subtitle: "Studio colophon · who is in the room.",
    vibe: "Cabaret Notes",
    meta: {
      label: "On view",
      body: "A note on practice, collaborators, and the list of small, stubborn questions the studio keeps coming back to.",
    },
    path: "/visit-classic?next=/desktop",
    icon: homefelt,
  },
  {
    num: "II",
    title: "Lab",
    subtitle: "Writing, toys, loose ends. The back room.",
    vibe: "Zine Margins",
    meta: {
      label: "New this month",
      body: "MDX essays, live sketches, half-finished tools. Things the studio is thinking with, not about.",
    },
    path: "/lab",
    icon: framefelt,
  },
  {
    num: "III",
    title: "Gallery",
    subtitle: "Edition prints and still works.",
    vibe: "Trail Archive",
    meta: {
      label: "Gallery III",
      body: "A quieter room for the framed things: drawings, photographs, small objects made slowly.",
    },
    path: "/gallery",
    icon: photobookfelt,
  },
  {
    num: "IV",
    title: "Feltmoon",
    subtitle: "A horizontal room. One picture at a time.",
    vibe: "Spotlight Drift",
    meta: {
      label: "Temporary exhibition",
      body: "Film photography treated as a museum wall. Scroll the wall, frame a single image, and — with a key press — deface it.",
    },
    path: "/feltmoon",
    icon: feltmoon,
  },
  {
    num: "V",
    title: "Archive",
    subtitle: "The complete catalog. Works and experiments.",
    vibe: "Topo Grid",
    meta: {
      label: "Archive, 2016 — 2026",
      body: "Every project, with longform wall text, tools and collaborators, in chronological order. Free admission.",
    },
    path: "/archive",
    icon: feltfolder,
  },
];

const TICKER_ITEMS = [
  { text: "Currently on view", accent: true },
  { text: "Feltmoon", icon: feltmoon },
  { text: "Room IV, through 2026" },
  { text: "——" },
  { text: "New in the archive" },
  { text: "Quiet Machines, 2025", icon: feltheart1 },
  { text: "Felt Cursor, 2024", icon: feltheart2 },
  { text: "Room With A Window, 2024" },
  { text: "——" },
  { text: "Open", accent: true },
  { text: "Daily, 24h", icon: phonefelt },
  { text: "Admission: free" },
  { text: "——" },
];

const WALL_ICONS: Array<{ src: string; tag: string }> = [
  { src: homefelt, tag: "01 · home" },
  { src: framefelt, tag: "02 · frame" },
  { src: feltheart1, tag: "03 · heart i" },
  { src: feltheart2, tag: "04 · heart ii" },
  { src: feltheart3, tag: "05 · heart iii" },
  { src: feltheart4, tag: "06 · heart iv" },
  { src: phonefelt, tag: "07 · phone" },
  { src: emailfelt, tag: "08 · post" },
  { src: feltfolder, tag: "09 · folder" },
  { src: photobookfelt, tag: "10 · photobook" },
  { src: photoboothfelt, tag: "11 · booth" },
  { src: feltmoon, tag: "12 · moon" },
];

/* -------------------------------------------------------------------- */
/*  Home                                                                */
/* -------------------------------------------------------------------- */

export default function Home() {
  const routeTransition = useRouteTransition();
  const sealRef = useRef<HTMLImageElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const [typedHero, setTypedHero] = useState("");

  /* Pick a random felt icon for the cursor seal on mount; the pool includes
     every icon so the site feels different to every visitor. */
  const sealIcon = useMemo(() => {
    const pool = [
      feltheart1,
      feltheart2,
      feltheart3,
      feltheart4,
      feltmoon,
      framefelt,
      feltfolder,
      homefelt,
      phonefelt,
      emailfelt,
      photobookfelt,
      photoboothfelt,
    ];
    return pool[Math.floor(Math.random() * pool.length)]!;
  }, []);

  /* Mouse-follow seal — a small felt stamp drifts behind the cursor. */
  useEffect(() => {
    const el = sealRef.current;
    if (!el) return;
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(hover: none)").matches;
    if (reduced) return;

    let x = -9999;
    let y = -9999;
    let tx = -9999;
    let ty = -9999;
    let raf = 0;
    let rot = -12;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX - 40;
      ty = e.clientY - 40;
      if (!el.classList.contains("is-on")) el.classList.add("is-on");
    };
    const onLeave = () => {
      el.classList.remove("is-on");
    };
    const loop = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      rot += ((tx - x) * 0.04 - rot * 0.02) * 0.4;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot.toFixed(2)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* Spotlight and subtle drift: move a theatrical light over the paper. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      root.style.setProperty("--bh-spot-x", "50%");
      root.style.setProperty("--bh-spot-y", "32%");
      return;
    }
    const onMove = (e: MouseEvent) => {
      root.style.setProperty("--bh-spot-x", `${e.clientX}px`);
      root.style.setProperty("--bh-spot-y", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  /* Typewriter reveal in the hero subline. */
  useEffect(() => {
    const target = "dramatic wilderness explorer // underground cabaret operator";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setTypedHero(target);
      return;
    }
    setTypedHero("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTypedHero(target.slice(0, i));
      if (i >= target.length) {
        window.clearInterval(id);
      }
    }, 24);
    return () => window.clearInterval(id);
  }, []);

  /* Simple scroll reveal */
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".bh-reveal"));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = (path: string) => routeTransition.goto(path);

  const today = useMemo(() => {
    const d = new Date();
    return d
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
  }, []);

  return (
    <main className="bh-root" ref={rootRef}>
      <div className="bh-curtain" aria-hidden>
        <span />
        <span />
      </div>
      <span className="bh-reg bh-reg--tl" aria-hidden />
      <span className="bh-reg bh-reg--tr" aria-hidden />
      <span className="bh-reg bh-reg--bl" aria-hidden />
      <span className="bh-reg bh-reg--br" aria-hidden />

      {/* ============================================================ */}
      {/* Acquisition slip — sticky, black, all caps.                   */}
      {/* ============================================================ */}
      <header className="bh-slip">
        <span className="bh-slip__live">
          <span className="bh-slip__dot" aria-hidden />
          <span>On air · {today}</span>
        </span>
        <span>Esnupi / Collection Index</span>
        <span>No. 0001 / ∞</span>
        <span>New York · Online</span>
        <button
          type="button"
          className="bh-slip__back"
          onClick={() => go("/visit-classic?next=/desktop")}
          title="Open the Mac OS 8 desktop version"
        >
          ↳ classic desktop
        </button>
      </header>

      {/* ============================================================ */}
      {/* Marquee / ticker.                                             */}
      {/* ============================================================ */}
      <div className="bh-ticker" aria-hidden>
        <div className="bh-ticker__track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i}>
              {item.accent ? <em>{item.text}</em> : <span>{item.text}</span>}
              {item.icon ? (
                <img src={item.icon} alt="" className="bh-ticker__icon" />
              ) : null}
            </span>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Hero                                                          */}
      {/* ============================================================ */}
      <section className="bh-hero">
        <div className="bh-hero__accession bh-reveal">
          <span>Plate 01 / 06</span>
          <span>·</span>
          <span>Edition of one</span>
          <span>Studio, est. 2016 — present</span>
        </div>

        <h1 className="bh-hero__display bh-reveal">
          <span className="bh-hero__line">Esnupi</span>
          <span className="bh-hero__line bh-is-serif">is a studio</span>
          <span className="bh-hero__line bh-is-indent">that builds</span>
          <span className="bh-hero__line bh-is-outline bh-is-indent">
            soft machines
          </span>
          <span className="bh-hero__line">and hard</span>
          <span className="bh-hero__line bh-is-red bh-is-crossed">ideas.</span>
        </h1>
        <p className="bh-hero__typed bh-reveal" aria-live="polite">
          {typedHero}
          <span className="bh-hero__caret" aria-hidden />
        </p>

        <img
          src={feltmoon}
          alt=""
          className="bh-hero__stamp bh-hero__stamp--moon bh-reveal"
          aria-hidden
        />
        <img
          src={feltheart1}
          alt=""
          className="bh-hero__stamp bh-hero__stamp--heart bh-reveal"
          aria-hidden
        />
        <img
          src={feltfolder}
          alt=""
          className="bh-hero__stamp bh-hero__stamp--folder"
          aria-hidden
        />

        <div className="bh-hero__footnotes">
          <div className="bh-reveal">
            <h4>01 · What</h4>
            <p>
              A practice of making and unmaking things — installations, web
              rooms, quiet tools. The outputs are various. The temperament is
              the same.
            </p>
          </div>
          <div className="bh-reveal">
            <h4>02 · Where</h4>
            <p>
              New York, and on this page. Correspondence welcome:{" "}
              <a href="mailto:hello@esnupi.studio">hello@esnupi.studio</a>.
            </p>
          </div>
          <div className="bh-reveal">
            <h4>03 · When</h4>
            <p>
              Open without interruption. The nightly programme runs between
              03:14 and 04:44, and is mostly for nobody.
            </p>
          </div>
          <div className="bh-reveal">
            <h4>04 · For whom</h4>
            <p>
              For curators, for the merely curious, for anyone who prefers
              looking to being looked at. Admission is free.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Manifesto paragraph with a felt drop-cap.                      */}
      {/* ============================================================ */}
      <section className="bh-manifesto">
        <div className="bh-manifesto__inner">
          <aside className="bh-manifesto__meta bh-reveal">
            Room 0 ·
            <br />
            Statement of intent
            <br />
            <strong>2026</strong>
            <br />
            Felt, linen, light.
            <br />
            Edition of one.
          </aside>
          <div className="bh-manifesto__body bh-reveal">
            <p>
              <img src={feltheart2} alt="" className="bh-dropcap" aria-hidden />
              We make things that refuse to perform for you. A lamp that turns
              off when it is watched. A cursor sewn from wool. A browser tab
              you are meant to forget. The studio prefers objects that keep
              their own counsel, and <em>rooms that are happier when empty</em>.
            </p>
            <p>
              The work is small, often stubborn, and occasionally{" "}
              <strong>tender</strong>. If it has a thesis, it is that{" "}
              <em>tools should apologise less</em> and that software can be a
              form of hospitality. If it has a mood, it is the hour before
              sunrise, when the city is still but the radios are on.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Rooms                                                         */}
      {/* ============================================================ */}
      <section className="bh-rooms">
        <header className="bh-rooms__head">
          <span>Rooms · five of them, opened in order or at random.</span>
          <span>Capacity: one visitor at a time.</span>
          <span>Current wait: zero.</span>
        </header>
        <ol className="bh-rooms__grid">
          {ROOMS.map((room) => (
            <li key={room.num} style={{ display: "contents" }}>
              <button
                type="button"
                className="bh-room bh-reveal"
                onClick={() => go(room.path)}
                aria-label={`Enter ${room.title}`}
              >
                <span className="bh-room__num">{room.num}</span>
                <span className="bh-room__badge">{room.vibe}</span>
                <h2 className="bh-room__title">
                  {room.title}
                  <small>{room.subtitle}</small>
                </h2>
                <p className="bh-room__meta">
                  <strong>{room.meta.label}</strong>
                  {room.meta.body}
                </p>
                <img src={room.icon} alt="" className="bh-room__icon" aria-hidden />
                <span className="bh-room__rule" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* ============================================================ */}
      {/* Collection index (projects table).                            */}
      {/* ============================================================ */}
      <section className="bh-index">
        <header className="bh-index__head bh-reveal">
          <span className="bh-index__kicker">
            Collection · accession 0001 — 0103
          </span>
          <h2 className="bh-index__title">
            the <em>catalog</em>
          </h2>
          <span className="bh-index__aside">
            06 works on view
            <br />
            {PROJECTS.length} total in archive
          </span>
        </header>
        <table className="bh-index__table">
          <thead>
            <tr>
              <th>№</th>
              <th>Accession</th>
              <th>Kind</th>
              <th>Title</th>
              <th className="bh-index__hide-sm">Role</th>
              <th className="bh-index__hide-sm">Year</th>
              <th className="bh-index__hide-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {PROJECTS.map((p, i) => {
              const icon = WALL_ICONS[i % WALL_ICONS.length]!.src;
              return (
                <tr
                  key={p.id}
                  className={`bh-reveal bh-index__row--${p.kind}`}
                  onClick={() => go(`/archive#project-${p.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <img
                      src={icon}
                      alt=""
                      className="bh-index__icon"
                      aria-hidden
                    />
                    {p.index}
                  </td>
                  <td>{p.accession}</td>
                  <td className="bh-index__kind">
                    {p.kind === "drive" ? "Work" : "Experiment"}
                  </td>
                  <td className="bh-index__title-cell">
                    {p.title}
                    <em>{p.blurb}</em>
                  </td>
                  <td className="bh-index__hide-sm">{p.role}</td>
                  <td className="bh-index__hide-sm">{p.year}</td>
                  <td className="bh-index__hide-sm">
                    {(p.status ?? "complete").toUpperCase()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ============================================================ */}
      {/* Wall of felt icons (black, dense, MoMA-wall feeling).         */}
      {/* ============================================================ */}
      <section className="bh-wall">
        <header className="bh-wall__head bh-reveal">
          <span>
            Room <strong>VI</strong>
          </span>
          <span>
            <strong>Stamps, seals, and small felt gods.</strong> A loose
            inventory of the studio's working vocabulary — icons made by hand,
            one by one, then retired into this catalog.
          </span>
          <span>12 of 12</span>
        </header>

        <p className="bh-wall__statement bh-reveal">
          Each of these <em>felt things</em> once lived on the Mac desktop
          version of this site. Here, they hang on the wall — quieter,
          heavier, more honest about what they always were: small paintings.
        </p>

        <div className="bh-wall__grid">
          {WALL_ICONS.map((icon) => (
            <div
              className="bh-wall__cell bh-reveal"
              key={icon.tag}
              data-tag={icon.tag}
            >
              <img src={icon.src} alt="" aria-hidden />
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* Now / dispatch                                                */}
      {/* ============================================================ */}
      <section className="bh-now">
        <div className="bh-now__grid">
          <article className="bh-now__card bh-reveal">
            <span className="bh-now__tag">Now writing</span>
            <h3 className="bh-now__title">Memory as UI</h3>
            <p className="bh-now__body">
              An essay on search engines that refuse to find you anything new.
              Published in the Lab, alongside the code for a small, local
              indexer that only knows what you already knew.
            </p>
            <div className="bh-now__foot">
              <span>Esn-0101</span>
              <img src={framefelt} alt="" aria-hidden />
            </div>
          </article>

          <article className="bh-now__card bh-reveal">
            <span className="bh-now__tag">Now listening</span>
            <h3 className="bh-now__title">Late Night Channel</h3>
            <p className="bh-now__body">
              A generative broadcast for the hour nobody is watching. Tune in
              between 03:14 and 04:44 local; the viewer counter has been
              removed because it felt impolite.
            </p>
            <div className="bh-now__foot">
              <span>Esn-0102</span>
              <img src={phonefelt} alt="" aria-hidden />
            </div>
          </article>

          <article className="bh-now__card bh-reveal">
            <span className="bh-now__tag">Now on the wall</span>
            <h3 className="bh-now__title">Feltmoon</h3>
            <p className="bh-now__body">
              Light, material, film. A horizontal museum wall of photographs
              that you can also, quietly, deface. The intervention persists
              for anyone who comes after you.
            </p>
            <div className="bh-now__foot">
              <span>Room IV</span>
              <img src={feltmoon} alt="" aria-hidden />
            </div>
          </article>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Foot / sign-off                                               */}
      {/* ============================================================ */}
      <footer className="bh-foot">
        <h2 className="bh-foot__mark">
          <span>Esn</span>
          <img src={feltheart3} alt="" aria-hidden />
          <span>upi</span>
        </h2>
        <div className="bh-foot__contact">
          <div>
            <h4>Write</h4>
            <a href="mailto:hello@esnupi.studio">hello@esnupi.studio</a>
          </div>
          <div>
            <h4>Listen</h4>
            <a href="#">the late night channel</a>
          </div>
          <div>
            <h4>Visit</h4>
            <a href="/feltmoon" onClick={(e) => { e.preventDefault(); go("/feltmoon"); }}>
              feltmoon, room iv
            </a>
          </div>
          <div>
            <h4>Return</h4>
            <a
              href="/visit-classic?next=/desktop"
              onClick={(e) => {
                e.preventDefault();
                go("/visit-classic?next=/desktop");
              }}
            >
              classic desktop ↳
            </a>
          </div>
        </div>

        <div className="bh-foot__credits">
          <p>
            <strong>Colophon</strong>
            Set in Public Sans, Playfair Display, IBM Plex Mono, and La Belle
            Aurore. Paper: a warm off-white with a faint halftone tooth. Ink:
            80% K.
          </p>
          <p>
            <strong>Materials</strong>
            Felt, linen, glue, and HTML. Every icon on this page was cut and
            sewn by hand, photographed, and then set into the grid like
            specimens.
          </p>
          <p>
            <strong>Hours</strong>
            Always open. The light stays on. If no one is here it is because
            they have gone into one of the rooms.
          </p>
          <p>
            <strong>Catalog</strong>
            Esnupi, 2016 —{" "}
            <em>
              {new Date().getFullYear()}.
            </em>{" "}
            No. 0001 of an open edition. Please do not feed the machines.
          </p>
        </div>
      </footer>

      {/* Cursor seal */}
      <img ref={sealRef} src={sealIcon} alt="" className="bh-seal" aria-hidden />
    </main>
  );
}
