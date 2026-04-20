import { DateTime } from "luxon";
import { useMemo } from "react";
import { hydraStage } from "@/lib/hydraStage";
import { ScaffoldReveal } from "./ScaffoldReveal";

/* -------------------------------------------------------------------------- */
/* About                                                                       */
/* -------------------------------------------------------------------------- */

export function AboutPanel() {
  const year = useMemo(() => DateTime.now().year, []);
  return (
    <article className="mac-about-panel" aria-label="About">
      <ScaffoldReveal>
        {[
          <p className="mac-about-panel__statement" key="stmt">
            An artist whose work lives between two rooms: the one you remember and
            the one you were never allowed in. Objects, interfaces, and small
            broken machines.
          </p>,
          <hr className="mac-about-panel__rule" key="r1" />,
          <section className="mac-about-panel__block" key="cur">
            <h4 className="mac-type-metadata">Currently</h4>
            <p>Shaders, felt sculpture, a long-form essay about cursors.</p>
          </section>,
          <section className="mac-about-panel__block" key="prev">
            <h4 className="mac-type-metadata">Previously</h4>
            <ul className="mac-about-panel__list">
              <li>Studio residency, Somewhere, 2023.</li>
              <li>Creative technologist, unnamed agency, 2019–2022.</li>
              <li>Group show, an old gallery on an old street.</li>
            </ul>
          </section>,
          <hr className="mac-about-panel__rule" key="r2" />,
          <p className="mac-type-metadata mac-about-panel__foot" key="foot">
            Brooklyn, {year}
          </p>,
        ]}
      </ScaffoldReveal>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Work                                                                        */
/* -------------------------------------------------------------------------- */

const WORK_ITEMS: Array<{ n: string; title: string; blurb: string; year: string }> = [
  { n: "01", title: "Quiet Machines", blurb: "A series of small devices that only run when unobserved.", year: "2025" },
  { n: "02", title: "Felt Cursor", blurb: "A pointing device made entirely of fabric and intent.", year: "2024" },
  { n: "03", title: "Room with a Window", blurb: "Browser installation for a gallery that refused to open.", year: "2024" },
  { n: "04", title: "Echo Index", blurb: "A search engine that can only find things you already know.", year: "2023" },
  { n: "05", title: "Late Night Channel", blurb: "Generative broadcast for the hour no one is watching.", year: "2022" },
];

export function WorkPanel() {
  return (
    <article className="mac-work-panel" aria-label="Work">
      <ScaffoldReveal stagger={30}>
        {WORK_ITEMS.map((w) => (
          <div
            key={w.n}
            className="mac-work-panel__row"
            onMouseEnter={() => hydraStage.setHueRotation(15)}
            onMouseLeave={() => hydraStage.setHueRotation(null)}
          >
            <span className="mac-work-panel__num">{w.n}</span>
            <div className="mac-work-panel__body">
              <h3 className="mac-work-panel__title">{w.title}</h3>
              <p className="mac-work-panel__blurb">
                {w.blurb} <span className="mac-type-metadata">{w.year}</span>
              </p>
            </div>
          </div>
        ))}
      </ScaffoldReveal>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Find                                                                        */
/* -------------------------------------------------------------------------- */

const LINKS: Array<{ label: string; href: string }> = [
  { label: "hello@esnupi.example", href: "mailto:hello@esnupi.example" },
  { label: "github / esnupi", href: "https://github.com/" },
  { label: "are.na / esnupi", href: "https://www.are.na/" },
];

export function FindPanel() {
  return (
    <article className="mac-find-panel" aria-label="Find">
      <ScaffoldReveal stagger={40}>
        {[
          <div key="spacer" className="mac-find-panel__spacer" />,
          ...LINKS.map((l) => (
            <a key={l.label} href={l.href} className="mac-find-panel__row">
              <span>{l.label}</span>
              <span className="mac-find-panel__arrow" aria-hidden>
                &#8599;
              </span>
            </a>
          )),
          <div key="foot" className="mac-find-panel__foot">
            <h4 className="mac-type-metadata">Available for</h4>
            <p>
              Commissions, residencies, and conversations that do not begin
              with the words &quot;quick call.&quot;
            </p>
          </div>,
        ]}
      </ScaffoldReveal>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Lab stub — opens /lab via CRT transition                                    */
/* -------------------------------------------------------------------------- */

export function LabStubPanel({ onNavigateLab }: { onNavigateLab?: () => void }) {
  return (
    <article className="mac-find-panel" aria-label="Lab">
      <ScaffoldReveal stagger={40}>
        {[
          <p key="p" className="mac-type-content">
            A separate room for longer writing. The desktop shuts down; the same
            screen loads a different machine.
          </p>,
          <button
            key="btn"
            type="button"
            className="mac-find-panel__row mac-find-panel__row--button"
            onClick={() => onNavigateLab?.()}
          >
            <span>Open the Lab</span>
            <span className="mac-find-panel__arrow" aria-hidden>
              &#8599;
            </span>
          </button>,
        ]}
      </ScaffoldReveal>
    </article>
  );
}
