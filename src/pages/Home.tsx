import { useMemo } from "react";
import { useRouteTransition } from "@/components/layout/RouteTransition";
import { PROJECTS } from "@/lib/projectsData";

import feltheart3 from "../../images/feltheart3.webp";
import feltfolder from "../../images/feltfolder.png";
import feltmoon from "../../images/feltmoon.png";
import framefelt from "../../images/framefelt.png";
import homefelt from "../../images/homefelt.png";
import photobookfelt from "../../images/photobookfelt.png";

import "./home.css";

type Room = {
  title: string;
  blurb: string;
  path: string;
  icon: string;
};

const ROOMS: Room[] = [
  {
    title: "About",
    blurb: "Who I am and what I care about.",
    path: "/visit-classic?next=/desktop",
    icon: homefelt,
  },
  {
    title: "Lab",
    blurb: "Writing, prototypes, and experiments.",
    path: "/lab",
    icon: framefelt,
  },
  {
    title: "Gallery",
    blurb: "Still work, prints, and visual studies.",
    path: "/gallery",
    icon: photobookfelt,
  },
  {
    title: "Feltmoon",
    blurb: "A horizontal wall of film photography.",
    path: "/feltmoon",
    icon: feltmoon,
  },
  {
    title: "Archive",
    blurb: "The full catalog of projects and notes.",
    path: "/archive",
    icon: feltfolder,
  },
];

export default function Home() {
  const routeTransition = useRouteTransition();
  const featured = PROJECTS.slice(0, 4);
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
    <main className="home-minimal">
      <header className="home-minimal__masthead">
        <p>ESNUPI</p>
        <p>Brutalist Index</p>
        <p>{today}</p>
        <button type="button" onClick={() => go("/visit-classic?next=/desktop")}>
          Open desktop ↗
        </button>
      </header>

      <section className="home-minimal__hero">
        <p className="home-minimal__label">Studio statement</p>
        <h1>Soft machines. Hard ideas.</h1>
        <p className="home-minimal__lede">
          Esnupi is a minimal digital studio for design, code, and film. Enter a room,
          explore the work, and leave with one idea.
        </p>
        <img
          src={feltmoon}
          alt=""
          className="home-minimal__stamp home-minimal__stamp--moon"
          aria-hidden
        />
        <img
          src={feltheart3}
          alt=""
          className="home-minimal__stamp home-minimal__stamp--heart"
          aria-hidden
        />
      </section>

      <section className="home-minimal__manifesto">
        <p>
          A quiet practice in interface, narrative, and rhythm. Built with restraint.
          Designed for memory.
        </p>
      </section>

      <section className="home-minimal__rooms">
        <h2>Rooms</h2>
        <ol>
          {ROOMS.map((room, index) => (
            <li key={room.title}>
              <button
                type="button"
                onClick={() => go(room.path)}
                aria-label={`Enter ${room.title}`}
              >
                <span className="home-minimal__room-index">{String(index + 1).padStart(2, "0")}</span>
                <img src={room.icon} alt="" aria-hidden />
                <span className="home-minimal__room-text">
                  <strong>{room.title}</strong>
                  <small>{room.blurb}</small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-minimal__index">
        <div className="home-minimal__index-head">
          <h2>Selected Work</h2>
          <button type="button" onClick={() => go("/archive")}>
            Open full archive ({PROJECTS.length})
          </button>
        </div>
        <ul>
          {featured.map((project) => (
            <li key={project.id}>
              <button type="button" onClick={() => go(`/archive#project-${project.id}`)}>
                <span>{project.title}</span>
                <small>
                  {project.year} · {project.role}
                </small>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <footer className="home-minimal__foot">
        <h2>
          <span>Esn</span>
          <img src={feltheart3} alt="" aria-hidden />
          <span>upi</span>
        </h2>
        <div className="home-minimal__links">
          <a href="mailto:hello@esnupi.studio">hello@esnupi.studio</a>
          <a href="/feltmoon" onClick={(e) => { e.preventDefault(); go("/feltmoon"); }}>
            feltmoon
          </a>
          <a href="/visit-classic?next=/desktop" onClick={(e) => { e.preventDefault(); go("/visit-classic?next=/desktop"); }}>
            classic desktop
          </a>
        </div>
      </footer>
    </main>
  );
}
