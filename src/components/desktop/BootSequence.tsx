import { useEffect, useMemo, useRef, useState } from "react";
import {
  playMacBootChime,
  playMacDiskInsert,
  playSadMacChord,
} from "@/lib/retroMacSounds";
import { dipAmbient } from "@/lib/ambientAudio";

type Phase = "bios" | "post" | "blackbeat" | "logo" | "sadmac" | "done" | "welcomeback";

const ERROR_CODES = [
  "ERROR 0F0003: MEMORY PARITY",
  "ERROR 0F000A: ADDRESS",
  "ERROR 0F0000: BUS ERROR",
  "ERROR 0F0001: ILLEGAL INSTRUCTION",
  "ERROR 0F0005: BAD F-LINE",
];

const BIOS_LINES = [
  "esnupi BIOS v1.98 — build 1998.09.21",
  "Copyright (c) esnupi systems, inc.",
  "",
  "CPU: PowerPC 604e @ 350 MHz .......... [ OK ]",
  "L2 cache ............................. [ 512 KB ]",
  "ROM checksum ......................... [ PASS ]",
  "ADB bus .............................. [ READY ]",
  "SCSI bus ............................. [ 2 DEV ]",
  "Mounting volume 'esnupi' ............. [ OK ]",
];

/**
 * Multi-phase boot screen: BIOS text, POST memory count, disk integrity bar,
 * happy Mac (or Sad Mac 15% of the time), then fades to the desktop.
 *
 * Interactive: click/Enter/Space skips ahead.
 */
export function BootSequence({
  onDone,
  shortForm = false,
}: {
  onDone: () => void;
  /**
   * If true, skip the POST/BIOS phases entirely and show a single "Welcome back"
   * line before the Happy Mac. Used for return visitors (visitCount > 1) — the
   * machine knows you and doesn't need to introduce itself again.
   */
  shortForm?: boolean;
}) {
  const rollSadMac = useMemo(() => (shortForm ? false : Math.random() < 0.15), [shortForm]);
  const [phase, setPhase] = useState<Phase>(shortForm ? "welcomeback" : "bios");
  const [postMem, setPostMem] = useState(0);
  const [postTotal] = useState(128);
  const [barPct, setBarPct] = useState(0);
  const [pauseAt97, setPauseAt97] = useState(false);
  const [biosLineCount, setBiosLineCount] = useState(0);
  const errorCode = useMemo(
    () => ERROR_CODES[Math.floor(Math.random() * ERROR_CODES.length)] ?? ERROR_CODES[0],
    [],
  );
  const completed = useRef(false);

  const finish = () => {
    if (completed.current) return;
    completed.current = true;
    onDone();
  };

  useEffect(() => {
    if (phase !== "bios") return;
    const id = window.setInterval(() => {
      setBiosLineCount((n) => {
        if (n >= BIOS_LINES.length) {
          window.clearInterval(id);
          window.setTimeout(() => setPhase("post"), 260);
          return n;
        }
        return n + 1;
      });
    }, 90);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "post") return;
    const id = window.setInterval(() => {
      setPostMem((m) => {
        const next = m + 4;
        if (next >= postTotal) {
          window.clearInterval(id);
          // Silent 600ms black beat before Happy Mac — the most important 600ms on the site.
          window.setTimeout(() => setPhase("blackbeat"), 260);
          return postTotal;
        }
        return next;
      });
    }, 30);
    return () => window.clearInterval(id);
  }, [phase, postTotal, rollSadMac]);

  useEffect(() => {
    if (phase !== "welcomeback") return;
    /* Two-beat: show the greeting briefly, then hand off to the happy Mac. */
    const id = window.setTimeout(() => {
      playMacDiskInsert();
      setPhase("logo");
    }, 1_200);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "blackbeat") return;
    /* Shape the silence: ramp ambient to zero 200ms before the beat, hold
       through it, and ramp back up 200ms after — per the v4 brief. */
    dipAmbient(200, 600);
    const id = window.setTimeout(() => {
      playMacDiskInsert();
      setPhase(rollSadMac ? "sadmac" : "logo");
    }, 600);
    return () => window.clearTimeout(id);
  }, [phase, rollSadMac]);

  useEffect(() => {
    if (phase !== "logo" && phase !== "sadmac") return;
    const id = window.setInterval(() => {
      setBarPct((p) => {
        if (p >= 97 && !pauseAt97) {
          setPauseAt97(true);
          window.clearInterval(id);
          window.setTimeout(() => {
            if (phase === "sadmac") {
              playSadMacChord();
              window.setTimeout(() => {
                setPhase("logo");
                setBarPct(0);
                setPauseAt97(false);
              }, 2200);
            } else {
              setBarPct(100);
              playMacBootChime();
              window.setTimeout(finish, 1100);
            }
          }, 900);
          return 97;
        }
        return Math.min(97, p + 3);
      });
    }, 24);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") finish();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="mac-boot-root" role="presentation" onClick={finish}>
      {phase === "welcomeback" && (
        <div className="mac-boot-welcome">
          <div className="mac-boot-welcome__line">Welcome back.</div>
        </div>
      )}
      {phase === "bios" && (
        <div className="mac-boot-bios">
          {BIOS_LINES.slice(0, biosLineCount).map((line, i) => (
            <div key={i} className="mac-boot-bios__line">
              {line || "\u00A0"}
            </div>
          ))}
          <div className="mac-boot-bios__cursor" />
        </div>
      )}
      {phase === "post" && (
        <div className="mac-boot-post">
          <div className="mac-boot-post__lines">
            {BIOS_LINES.map((line, i) => (
              <div key={i} className="mac-boot-bios__line" style={{ opacity: 0.55 }}>
                {line || "\u00A0"}
              </div>
            ))}
            <div className="mac-boot-post__memline">
              Memory test: {postMem === 0 ? "640K" : `${postMem}MB`} of {postTotal}MB OK
            </div>
          </div>
        </div>
      )}
      {phase === "logo" && (
        <div className="mac-boot-logo">
          <div className="mac-boot-logo__mac" aria-hidden>
            <HappyMac />
          </div>
          <div className="mac-boot-logo__label">Welcome to esnupi</div>
          <div className="mac-boot-logo__bar">
            <div className="mac-boot-logo__bar-fill" style={{ width: `${barPct}%` }} />
          </div>
          <div className="mac-boot-logo__status">
            {pauseAt97 && barPct < 100 ? "Checking disk integrity…" : ""}
          </div>
          <div className="mac-boot-logo__hint">click to skip</div>
        </div>
      )}
      {phase === "sadmac" && (
        <div className="mac-boot-logo mac-boot-logo--sad">
          <div className="mac-boot-logo__mac" aria-hidden>
            <SadMac />
          </div>
          <div className="mac-boot-logo__errorcode">{errorCode}</div>
          <div className="mac-boot-logo__hint">recovering…</div>
        </div>
      )}
    </div>
  );
}

function HappyMac() {
  return (
    <svg width="120" height="130" viewBox="0 0 120 130" aria-hidden="true">
      <g shapeRendering="crispEdges">
        <rect x="10" y="14" width="100" height="94" fill="#f1efe6" stroke="#000" strokeWidth="2" />
        <rect x="18" y="22" width="84" height="62" fill="#cfd7c5" stroke="#000" />
        <circle cx="46" cy="48" r="4" fill="#000" />
        <circle cx="76" cy="48" r="4" fill="#000" />
        <path d="M44 62 Q61 76 78 62" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="42" y="88" width="36" height="5" fill="#000" />
        <rect x="30" y="108" width="60" height="14" fill="#f1efe6" stroke="#000" strokeWidth="2" />
        <rect x="10" y="100" width="100" height="10" fill="#e6e4da" stroke="#000" strokeWidth="2" />
      </g>
    </svg>
  );
}

function SadMac() {
  return (
    <svg width="120" height="130" viewBox="0 0 120 130" aria-hidden="true">
      <g shapeRendering="crispEdges">
        <rect x="10" y="14" width="100" height="94" fill="#f1efe6" stroke="#000" strokeWidth="2" />
        <rect x="18" y="22" width="84" height="62" fill="#cfd7c5" stroke="#000" />
        <path d="M40 42 l10 10 M50 42 l-10 10" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        <path d="M70 42 l10 10 M80 42 l-10 10" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        <path d="M44 70 Q61 58 78 70" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="30" y="108" width="60" height="14" fill="#f1efe6" stroke="#000" strokeWidth="2" />
        <rect x="10" y="100" width="100" height="10" fill="#e6e4da" stroke="#000" strokeWidth="2" />
      </g>
    </svg>
  );
}
