import { useMemo } from "react";

import {
  formatFirstBoot,
  formatRelative,
  formatUptime,
  getVisitData,
} from "@/lib/visitMemory";

/**
 * A System 7-style "About This Mac" panel, repurposed as a personal manifesto.
 * Blends fake hardware specs with actual, per-visitor telemetry: first boot
 * timestamp, cumulative uptime across sessions, and last-active delta.
 */
export function AboutThisMacPanel() {
  const visit = useMemo(() => getVisitData(), []);
  const firstBoot = formatFirstBoot(visit.firstVisit);
  const uptime = formatUptime(visit.totalTimeMs, Math.max(1, visit.visitCount));
  const lastActive = formatRelative(visit.lastVisit);

  return (
    <section className="mac-about">
      <header className="mac-about__header">
        <div className="mac-about__logo" aria-hidden>
          <svg width="64" height="70" viewBox="0 0 64 70">
            <rect x="4" y="6" width="56" height="50" fill="#f1efe6" stroke="#000" strokeWidth="2" />
            <rect x="10" y="12" width="44" height="30" fill="#cfd7c5" stroke="#000" />
            <rect x="14" y="56" width="36" height="8" fill="#e6e4da" stroke="#000" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <h3>About this Mac</h3>
          <p className="mac-about__tagline">
            System 8.1 · esnupi build · <span>made by ajai upadhyaya</span>
          </p>
        </div>
      </header>
      <dl className="mac-about__specs">
        <div>
          <dt>First boot</dt>
          <dd>{firstBoot}</dd>
        </div>
        <div>
          <dt>Uptime</dt>
          <dd>{uptime}</dd>
        </div>
        <div>
          <dt>Last active</dt>
          <dd>{lastActive}</dd>
        </div>
        <div>
          <dt>Built-in Memory</dt>
          <dd>Full of unfinished ideas</dd>
        </div>
        <div>
          <dt>Thinking speed</dt>
          <dd>Fast when anxious · slow when loved</dd>
        </div>
        <div>
          <dt>Largest Unused Block</dt>
          <dd>The one you were going to use later</dd>
        </div>
        <div>
          <dt>Last backed up</dt>
          <dd>Never. Let the machine forget.</dd>
        </div>
        <div>
          <dt>Startup Disk</dt>
          <dd>esnupi</dd>
        </div>
        <div>
          <dt>System Voice</dt>
          <dd>what does this even mean</dd>
        </div>
      </dl>
      <footer className="mac-about__colophon">
        <p>
          thank you for poking around my site!! it was very fun to build
        </p>
      </footer>
    </section>
  );
}
