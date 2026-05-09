import { DateTime } from "luxon";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
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
            Ajai Upadhyaya is a Fourth Year CS and Economics Major at UVA. Ask me anything about Microsoft Excel, Tennis, Film Photography, Road Cycling, Private Credit or find my thoughts on Substack! (click the red heart button)
          </p>,
          <hr className="mac-about-panel__rule" key="r1" />,
          <section className="mac-about-panel__block" key="cur">
            <h4 className="mac-type-metadata">Currently</h4>
            <p>I am preparing to start a Masters Program in Business Administration, concentration in Corporate Finance and Financial Engineering at Virginia Commonwealth University in Fall 2026</p>
          </section>,
          <section className="mac-about-panel__block" key="prev">
            <h4 className="mac-type-metadata">Previously</h4>
            <ul className="mac-about-panel__list">
              <li>B.S in CS and Economics from University of Virginia, 2023 - 2026 (3.75 GPA)</li>
              <li>University of Virginia Investment Management, (UVIMCO) Intern, 2025 - 2026</li>
              <li>Database Engineering Intern at YugabyteDB, 2025 - 2026</li>
              <li>University of Virginia Digital Media Management Employee, 2023 - 2026</li>
              <li>VITA Financial Accounting and Operations Intern, 2024 - 2025</li>
              <li>Software Engineering Intern at Specialized Bicycling Components, 2023 - 2024</li>
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
        <h3 className="mac-type-metadata">Recent Activity</h3>
        <p className="mac-profiler__sub">
          take a peek at my recent work including models, writing, research, and more; updated weekly
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
                    <span>Open full project</span>
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

const CONTACT_METHODS: Array<{ label: string; value: string; href: string }> = [
  { label: "Email", value: "ajaiupad@gmail.com", href: "mailto:ajaiupad@gmail.com" },
  { label: "Phone", value: "(804)296-8522", href: "tel:+18042968522" },
  { label: "LinkedIn", value: "linkedin.com/in/ajai-u/", href: "https://www.linkedin.com/in/ajai-u/" },
  { label: "GitHub", value: "github.com/ajaiupadhyaya", href: "https://github.com/ajaiupadhyaya" },
];

const CONTACT_LINKS: Array<{ label: string; href: string }> = [
  { label: "Portfolio / Archive", href: "/archive" },
  { label: "GitHub", href: "https://github.com/ajaiupadhyaya" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/ajai-u/" },
];

export function FindPanel({
  onOpenStudy,
  onOpenCalendar,
}: {
  onOpenStudy?: () => void;
  onOpenCalendar?: () => void;
}) {
  const lines = [
    <header key="head" className="mac-contact-panel__head">
      <h3 className="mac-type-metadata">Contact</h3>
      <p>
        all my contact information; for immediate response call my cell, for all other inquires send me an email!
      </p>
    </header>,
    <section key="methods" className="mac-contact-panel__card">
      <h4 className="mac-type-metadata">info</h4>
      <dl className="mac-contact-panel__grid">
        {CONTACT_METHODS.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>
              <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                {item.value}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </section>,
    <section key="links" className="mac-contact-panel__card">
      <h4 className="mac-type-metadata">Links</h4>
      {CONTACT_LINKS.map((l) => (
        <a key={l.label} href={l.href} className="mac-find-panel__row">
          <span>{l.label}</span>
          <span className="mac-find-panel__arrow" aria-hidden>
            &#8599;
          </span>
        </a>
      ))}
    </section>,
    ...(onOpenStudy
      ? [
          <button
            key="study"
            type="button"
            className="mac-find-panel__row mac-find-panel__row--button"
            onClick={() => onOpenStudy()}
          >
            <span>Open study / gallery</span>
            <span className="mac-find-panel__arrow" aria-hidden>
              &#8599;
            </span>
          </button>,
        ]
      : []),
    ...(onOpenCalendar
      ? [
          <button
            key="calendar"
            type="button"
            className="mac-find-panel__row mac-find-panel__row--button"
            onClick={() => onOpenCalendar()}
          >
            <span>Schedule a meeting / view availability</span>
            <span className="mac-find-panel__arrow" aria-hidden>
              &#8599;
            </span>
          </button>,
        ]
      : []),
    <div key="foot" className="mac-find-panel__foot">
      <h4 className="mac-type-metadata">Available for</h4>
      <p>
        I greatly appreciate all inquires, whether it be for employment opportunities or not, I will do my best to respond as soon as possible!
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
    <article className="mac-about-panel mac-feltmoon-panel" aria-label="Moon">
      <ScaffoldReveal>
        {[
          <header className="mac-feltmoon-panel__head" key="head">
            <p className="mac-type-metadata">Ajai Upadhyaya</p>
            <h3 className="mac-feltmoon-panel__title">Post Graduate Plans</h3>
            <p className="mac-feltmoon-panel__sub">
              MBA with Concentrations in Corporate Finance and Financial Engineering · 2026
            </p>
          </header>,
          <hr className="mac-about-panel__rule" key="r1" />,
          <section className="mac-about-panel__block" key="blurb">
            <h4 className="mac-type-metadata">Looking Ahead</h4>
            <p>
              I will be starting a Business Administration Masters Program at VCU in the Fall of 2026. My concentrations within this program are
              Corporate Finance and Financial Engineering. I am excited to learn more about the industry and how to apply my technical skills to the field of finance
              and better a firm's ability to manage risk and efficiency.
            </p>
          </section>,
          <section className="mac-about-panel__block" key="meta">
            <h4 className="mac-type-metadata">Program Details</h4>
            <dl className="mac-feltmoon-panel__dl">
              <div><dt>Title</dt><dd>MBA w/Concentrations in Corp. Finance and Financial Engineering</dd></div>
              <div><dt>Year</dt><dd>2026</dd></div>
              <div>
                <dt>Curriculum</dt>
                <dd>
                  <a
                    href="https://bulletin.vcu.edu/graduate/school-business/mba-programs/business-administration-corporate-finance/business-administration-corporate-finance.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    VCU bulletin — Business Administration, Corporate Finance (PDF)
                  </a>
                </dd>
              </div>
              <div>
                <dt>Program Placement</dt>
                <dd>
                  <a
                    href="https://www.vcu.edu/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    VCU graduate programs
                  </a>
                </dd>
              </div>
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
              <span className="mac-feltmoon-panel__cta-title">
                Explore my work I've done in preparation for this program
              </span>
            </span>
            <span className="mac-feltmoon-panel__cta-arrow" aria-hidden>
              &#8599;
            </span>
          </button>,
          <p className="mac-type-metadata mac-feltmoon-panel__foot" key="foot">
            
          </p>,
        ]}
      </ScaffoldReveal>
    </article>
  );
}

const WORKSITE_FEATURES: Array<{
  title: string;
  category: string;
  year: string;
  href: string;
  description: string;
  meta: string;
}> = [
  {
    title: "github",
    category: "GitHub",
    year: "2026",
    href: "https://github.com/ajaiupadhyaya",
    description:
      "check out my profile for all of my projects, research, models, and a clear demonstration of my technical skills.",
    meta: "repo / live link / documentation",
  },
  {
    title: "LinkedIn",
    category: "LinkedIn",
    year: "2026",
    href: "https://www.linkedin.com/in/ajai-u/",
    description:
      "connect with my on LinkedIn and get to know me better.",
    meta: "professional development / collaboration / connecting",
  },
];

const WORKSITE_LINKS: Array<{
  title: string;
  category: string;
  year: string;
  href: string;
}> = [
  { title: "My Resume", category: "PDF", year: "2026", href: "/resume.pdf" },
  { title: "Substack", category: "Writing", year: "2026", href: "https://ajaiupadhyaya.substack.com/" },
  { title: "Undergrad Econ Research", category: "Research", year: "2026", href: "/archive" },
  { title: "Undergrad CS Research", category: "Research", year: "2026", href: "/gallery" },
  { title: "Excel Models & Dashboards", category: "Notes", year: "2026", href: "/feltmoon" },
  { title: "YugabyteDB Intern Work", category: "Internship Work", year: "2026", href: "https://github.com/ajaiupadhyaya" },
  { title: "VITA Finance Work", category: "Internship Work", year: "2026", href: "https://github.com/ajaiupadhyaya" },
  { title: "UVIMCO Work", category: "Internship Work", year: "2025-26", href: "https://www.linkedin.com/in/ajai-u/" },
  { title: "UVA DM Consultant Work", category: "Projects", year: "2024", href: "https://www.linkedin.com/in/ajai-u/" },
];

export function LabStubPanel() {
  const year = useMemo(() => DateTime.now().year, []);
  const scrollRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateProgress = () => {
      const maxScroll = el.scrollHeight - el.clientHeight;
      setProgress(maxScroll > 0 ? Math.min(1, Math.max(0, el.scrollTop / maxScroll)) : 0);
    };

    updateProgress();
    el.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      el.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const nodes = Array.from(el.querySelectorAll<HTMLElement>(".mac-worksite__reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("mac-worksite__reveal--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { root: el, threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <article className="mac-worksite" aria-label="My Work website" ref={scrollRef}>
      <div
        className="mac-worksite__progress"
        style={{ "--progress": `${progress * 100}%` } as CSSProperties}
        aria-hidden
      />
      <aside className="mac-worksite__side-label" aria-hidden>
        ©{year} / VOL. 01
      </aside>

      <div className="mac-worksite__paper">
        <header className="mac-worksite__masthead">
          <span>Personal Catalog</span>
          <span>/</span>
          <span>My Work</span>
          <span>/</span>
          <span>{year}</span>
        </header>

        <section className="mac-worksite__hero" aria-label="Work index">
          <p className="mac-worksite__kicker">Scroll and close the window to return to the desktop</p>
          <h1>My Work</h1>
          <p className="mac-worksite__intro">
            A full catalog of everything I've created in my undergraduate years, in and out of the classroom.
          </p>
        </section>

        <section className="mac-worksite__features" aria-label="Featured work links">
          {WORKSITE_FEATURES.map((item, index) => (
            <a
              key={item.title}
              className={`mac-worksite__feature mac-worksite__feature--${index + 1} mac-worksite__reveal`}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noreferrer" : undefined}
            >
              <span className="mac-worksite__feature-count">0{index + 1}</span>
              <span className="mac-worksite__feature-meta">
                {item.category} — {item.year}
              </span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <span className="mac-worksite__feature-hidden">{item.meta}</span>
            </a>
          ))}
        </section>

        <section className="mac-worksite__index" aria-label="Work links">
          <div className="mac-worksite__index-head">
            <span>Website</span>
            <span>Category — Year</span>
          </div>
          <div className="mac-worksite__rows">
            {WORKSITE_LINKS.map((item, index) => (
              <a
                key={`${item.title}-${item.year}`}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                className="mac-worksite__row mac-worksite__reveal"
                style={{ "--delay": `${160 + index * 45}ms` } as CSSProperties}
              >
                <span className="mac-worksite__row-title">
                  <span className="mac-worksite__row-arrow" aria-hidden>
                    &#8594;
                  </span>
                  {item.title}
                </span>
                <span className="mac-worksite__row-dots" aria-hidden />
                <span className="mac-worksite__row-meta">
                  {item.category} — {item.year}
                </span>
              </a>
            ))}
          </div>
        </section>

        <footer className="mac-worksite__foot">
          <span>Ajai Upadhyaya</span>
          <span>2026</span>
        </footer>
      </div>
    </article>
  );
}

/** Public embed URL (America/New_York). Must match sharing settings in Google Calendar. */
const GOOGLE_CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=ajaiupad%40gmail.com&ctz=America%2FNew_York";

const SCHEDULING_EMAIL = "ajaiupad@gmail.com";

/**
 * Optional self-serve booking page (Calendly, Google Appointment Schedules, SavvyCal, etc.).
 * Set to a full URL to show a “pick a time” button above the email request.
 */
const SCHEDULING_BOOKING_PAGE_URL: string | null = null;

const QUICK_EMAIL_HREF = `mailto:${SCHEDULING_EMAIL}`;

const MEETING_REQUEST_MAILTO = (() => {
  const subject = "Meeting request — proposing times";
  const body = `Hi Ajai,

I'd like to find a time to meet. Here are some windows that work on my side (add your time zone):

— 
— 
— 

Thanks,`;
  return `mailto:${SCHEDULING_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
})();

export function CalendarPanel() {
  return (
    <article className="mac-find-panel mac-calendar-panel" aria-label="Calendar">
      <ScaffoldReveal stagger={24}>
        {[
          <div key="layout" className="mac-calendar-panel__layout">
            <header className="mac-contact-panel__head mac-calendar-panel__head">
              <h3 className="mac-type-metadata">Calendar</h3>
              <p className="mac-calendar-panel__intro">
                <strong className="mac-calendar-panel__lead">Meet with me:</strong> glance at my availability
                below (US Eastern), then request a time. Your mail app opens with a short template you can edit—add
                the slots that work for you.
              </p>
            </header>

            <div className="mac-calendar-panel__hero-actions">
              {SCHEDULING_BOOKING_PAGE_URL ? (
                <a
                  href={SCHEDULING_BOOKING_PAGE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mac-profiler__cta mac-calendar-panel__cta-hero"
                >
                  <span>Pick a time (self-serve booking)</span>
                  <span className="mac-profiler__cta-arrow" aria-hidden>
                    &#8599;
                  </span>
                </a>
              ) : null}
              <a href={MEETING_REQUEST_MAILTO} className="mac-profiler__cta mac-calendar-panel__cta-hero">
                <span>Request a meeting by email</span>
                <span className="mac-profiler__cta-arrow" aria-hidden>
                  &#8599;
                </span>
              </a>
            </div>

            <section className="mac-contact-panel__card mac-calendar-panel__more" aria-label="Other scheduling options">
              <h4 className="mac-type-metadata">Also</h4>
              <a
                href={GOOGLE_CALENDAR_EMBED_URL}
                target="_blank"
                rel="noreferrer"
                className="mac-find-panel__row"
              >
                <span>View this calendar in a full browser tab</span>
                <span className="mac-find-panel__arrow" aria-hidden>
                  &#8599;
                </span>
              </a>
              <a href={QUICK_EMAIL_HREF} className="mac-find-panel__row">
                <span>Email me ({SCHEDULING_EMAIL})</span>
                <span className="mac-find-panel__arrow" aria-hidden>
                  &#8599;
                </span>
              </a>
            </section>

            <div className="mac-calendar-panel__embed">
              <div className="mac-calendar-panel__embed-cap">
                <h4 className="mac-type-metadata" id="calendar-embed-label">
                  When I’m busy / free
                </h4>
                <p className="mac-calendar-panel__embed-hint" id="calendar-embed-desc">
                  Shown in US Eastern. Busy blocks are generally not available; open gaps are easier to propose for a
                  meeting.
                </p>
              </div>
              <div className="mac-calendar-panel__embed-frame">
                <iframe
                  title="Google Calendar"
                  src={GOOGLE_CALENDAR_EMBED_URL}
                  width={800}
                  height={600}
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  aria-labelledby="calendar-embed-label"
                  aria-describedby="calendar-embed-desc"
                />
              </div>
            </div>
          </div>,
        ]}
      </ScaffoldReveal>
    </article>
  );
}
