/**
 * A System 7-style "About This Mac" panel, repurposed as a personal manifesto.
 * Fake hardware specs with emotional entries.
 */
export function AboutThisMacPanel() {
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
            System 8.1 · esnupi build · <span>painted by hand</span>
          </p>
        </div>
      </header>
      <dl className="mac-about__specs">
        <div>
          <dt>Built-in Memory</dt>
          <dd>Full of unfinished ideas</dd>
        </div>
        <div>
          <dt>Total Memory</dt>
          <dd>Depends on who is asking</dd>
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
          <dt>Storage</dt>
          <dd>Full of unfinished ideas</dd>
        </div>
        <div>
          <dt>Last backed up</dt>
          <dd>Never. Let the machine forget.</dd>
        </div>
        <div>
          <dt>Startup Disk</dt>
          <dd>esnupi · system · softly</dd>
        </div>
        <div>
          <dt>System Voice</dt>
          <dd>a stranger who loves you</dd>
        </div>
      </dl>
      <footer className="mac-about__colophon">
        <p>
          This site is a small museum for things I made with my hands on a keyboard.
          Nothing in it is ironic. I was serious when I was fourteen, and I am still serious.
        </p>
      </footer>
    </section>
  );
}
