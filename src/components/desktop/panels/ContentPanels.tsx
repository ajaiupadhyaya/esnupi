import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { hydraStage } from "@/lib/hydraStage";
import { PROJECTS_BY_KIND, type Project } from "@/lib/projectsData";
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
            Ajai Upadhyaya is a Fourth Year CS and Economics Major at UVA. Ask me anything about Microsoft Excel, Tennis, Film Photography, Road Cycling, and Private Credit or find my thoughts on Substack! (click the red heart button)
          </p>,
          <hr className="mac-about-panel__rule" key="r1" />,
          <section className="mac-about-panel__block" key="cur">
            <h4 className="mac-type-metadata">Currently</h4>
            <p>Thoroughly excited to learn a lot this Fall as I will be starting a Masters Program in Financial Engineering at VCU</p>
          </section>,
          <section className="mac-about-panel__block" key="prev">
            <h4 className="mac-type-metadata">Previously</h4>
            <ul className="mac-about-panel__list">
              <li>B.S in CS and Economics from University of Virginia, 2023 - 2026</li>
              <li>University of Virginia Investment Management, (UVIMCO) Intern, 2025 - 2026</li>
              <li>University of Virginia Digital Media Intern, 2023 - 2026</li>
              <li>VITA Financial Accounting and Operations Intern, 2024 - 2025</li>
              <li>Software Engineering Intern at Specialized, 2023 - 2024</li>
            </ul>
          </section>,
          <hr className="mac-about-panel__rule" key="r2" />,
          <p className="mac-type-metadata mac-about-panel__foot" key="foot">
            Ajai Upadhyaya, {year}
          </p>,
        ]}
      </ScaffoldReveal>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Work — System Profiler                                                      */
/*                                                                             */
/*   Pulls from the canonical list in @/lib/projectsData so every entry on     */
/*   the /archive page is discoverable here too. Clicking a row surfaces a     */
/*   short wall-label; a prominent CTA deep-links the user into the full       */
/*   case study on the new /archive route.                                     */
/* -------------------------------------------------------------------------- */

/** DISK0, DISK1, … for drives; KEXT.A, KEXT.B, … for kernel extensions. */
function volumeLabel(p: Project, indexWithinKind: number) {
  if (p.kind === "drive") return `DISK${indexWithinKind}`;
  return `KEXT.${String.fromCharCode(65 + indexWithinKind)}`;
}

export function WorkPanel({
  onOpenArchive,
}: {
  onOpenArchive?: (projectId?: string) => void;
}) {
  const [sel, setSel] = useState<Project | null>(null);

  const drives = PROJECTS_BY_KIND.drive;
  const kexts = PROJECTS_BY_KIND.kext;
  const labeled = useMemo(
    () =>
      new Map<string, string>([
        ...drives.map((p, i) => [p.id, volumeLabel(p, i)] as const),
        ...kexts.map((p, i) => [p.id, volumeLabel(p, i)] as const),
      ]),
    [drives, kexts],
  );

  const renderItem = (p: Project) => (
    <button
      key={p.id}
      type="button"
      className={`mac-profiler__item${sel?.id === p.id ? " mac-profiler__item--on" : ""}`}
      onClick={() => setSel(p)}
      onMouseEnter={() => hydraStage.setHueRotation(12)}
      onMouseLeave={() => hydraStage.setHueRotation(null)}
    >
      <span className="mac-profiler__vol">{labeled.get(p.id)}</span>
      <span className="mac-profiler__name">{p.title}</span>
    </button>
  );

  return (
    <article className="mac-profiler mac-work-panel" aria-label="System Profiler">
      <header className="mac-profiler__head">
        <h3 className="mac-type-metadata">System Profiler</h3>
        <p className="mac-profiler__sub">
          Volumes mount as drives; experiments load as kernel extensions. Pick one — the hex
          dissolves into the wall label. Open the full case study in the archive.
        </p>
      </header>
      <div className="mac-profiler__layout">
        <div className="mac-profiler__list">
          <div className="mac-profiler__group-label">Drives</div>
          {drives.map(renderItem)}
          <div className="mac-profiler__group-label">Kernel extensions</div>
          {kexts.map(renderItem)}
          {onOpenArchive ? (
            <button
              type="button"
              className="mac-profiler__archive-link"
              onClick={() => onOpenArchive()}
            >
              Open full archive ↗
            </button>
          ) : null}
        </div>
        <div className="mac-profiler__detail">
          {sel ? (
            <>
              <pre className="mac-profiler__hex" aria-hidden>
                {sel.hex ?? "00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00"}
                {"\n"}
                {sel.hex ?? "00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00"}
                {"\n"}
                {sel.hex ?? "00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00"}
              </pre>
              <div className="mac-profiler__case">
                <h4 className="mac-profiler__case-title">{sel.title}</h4>
                <div className="mac-profiler__case-meta">
                  <span><strong>{sel.year}</strong></span>
                  <span>{sel.role}</span>
                  <span>{sel.accession}</span>
                </div>
                <p className="mac-profiler__case-blurb">{sel.blurb}</p>
                <div className="mac-profiler__tags">
                  {sel.tags.slice(0, 6).map((t) => (
                    <span key={t} className="mac-profiler__tag">#{t}</span>
                  ))}
                </div>
                {onOpenArchive ? (
                  <button
                    type="button"
                    className="mac-profiler__cta"
                    onClick={() => onOpenArchive(sel.id)}
                  >
                    <span>Open full case study</span>
                    <span className="mac-profiler__cta-arrow" aria-hidden>
                      &#8599;
                    </span>
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="mac-profiler__placeholder">Select a volume or extension.</p>
              {onOpenArchive ? (
                <button
                  type="button"
                  className="mac-profiler__cta"
                  onClick={() => onOpenArchive()}
                  style={{ marginTop: 16 }}
                >
                  <span>Browse full archive</span>
                  <span className="mac-profiler__cta-arrow" aria-hidden>
                    &#8599;
                  </span>
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
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

export function FindPanel({ onOpenStudy }: { onOpenStudy?: () => void }) {
  const lines = [
    <div key="spacer" className="mac-find-panel__spacer" />,
    ...(onOpenStudy
      ? [
          <button
            key="study"
            type="button"
            className="mac-find-panel__row mac-find-panel__row--button"
            onClick={() => onOpenStudy()}
          >
            <span>Study — light, surface, sequence</span>
            <span className="mac-find-panel__arrow" aria-hidden>
              &#8599;
            </span>
          </button>,
        ]
      : []),
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
  ];

  return (
    <article className="mac-find-panel" aria-label="Find">
      <ScaffoldReveal stagger={40}>{lines}</ScaffoldReveal>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Lab stub — opens /lab via CRT transition                                    */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Felt Moon — a small museum label that opens the /feltmoon gallery room     */
/* -------------------------------------------------------------------------- */

export function FeltMoonPanel({ onOpenGallery }: { onOpenGallery?: () => void }) {
  return (
    <article className="mac-about-panel mac-feltmoon-panel" aria-label="Moon, at rest">
      <ScaffoldReveal>
        {[
          <header className="mac-feltmoon-panel__head" key="head">
            <p className="mac-type-metadata">Accession · MOON.01</p>
            <h3 className="mac-feltmoon-panel__title">Moon, at rest</h3>
            <p className="mac-feltmoon-panel__sub">
              felt on linen · 2025
            </p>
          </header>,
          <hr className="mac-about-panel__rule" key="r1" />,
          <section className="mac-about-panel__block" key="blurb">
            <h4 className="mac-type-metadata">Wall text</h4>
            <p>
              A piece that kept asking to be a door. Click through to an
              adjacent room — a horizontal scroll of film photographs you
              can deface, curate, and walk out of.
            </p>
          </section>,
          <section className="mac-about-panel__block" key="meta">
            <h4 className="mac-type-metadata">Details</h4>
            <dl className="mac-feltmoon-panel__dl">
              <div><dt>Title</dt><dd>Moon, at rest</dd></div>
              <div><dt>Year</dt><dd>2025</dd></div>
              <div><dt>Medium</dt><dd>felt on linen</dd></div>
              <div><dt>Room</dt><dd>/feltmoon — digital annex</dd></div>
            </dl>
          </section>,
          <hr className="mac-about-panel__rule" key="r2" />,
          <button
            key="open"
            type="button"
            className="mac-feltmoon-panel__cta"
            onClick={() => onOpenGallery?.()}
          >
            <span className="mac-feltmoon-panel__cta-label">
              <span className="mac-feltmoon-panel__cta-kicker">open the room</span>
              <span className="mac-feltmoon-panel__cta-title">
                Light, material, film — an exhibition
              </span>
            </span>
            <span className="mac-feltmoon-panel__cta-arrow" aria-hidden>
              &#8599;
            </span>
          </button>,
          <p className="mac-type-metadata mac-feltmoon-panel__foot" key="foot">
            The desktop dims. A different screen takes over.
          </p>,
        ]}
      </ScaffoldReveal>
    </article>
  );
}

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
