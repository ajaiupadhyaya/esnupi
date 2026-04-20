import { useEffect, useState } from "react";

/**
 * Concrete poem revealed only via Konami. Typing is deliberate (40ms/char)
 * with three 1200ms breath pauses so it reads like the machine is thinking.
 * Trailing paragraph mark slow-pulses forever.
 */
const POEM_LINES: string[] = [
  "what i save is what i lose.",
  "what i build is where i hide.",
  "",
  "the terminal is a mirror.",
  "the mirror is a window.",
  "the window is the same size",
  "as the room i grew up in.",
  "",
  "if you are here you are already part of it.",
  "",
  "\u00b6",
];

const CHAR_DELAY = 40;
const LINE_PAUSE = 120;
/** After lines 1, 3, 7 we hold for 1200ms — three breaths. */
const BREATH_AFTER = new Set<number>([1, 3, 7]);
const BREATH_PAUSE = 1200;

export function SecretPanel() {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const line = POEM_LINES[lineIdx];
    if (line === undefined) {
      setDone(true);
      return;
    }
    if (charIdx < line.length) {
      const id = window.setTimeout(() => setCharIdx((c) => c + 1), CHAR_DELAY);
      return () => window.clearTimeout(id);
    }
    const pause = BREATH_AFTER.has(lineIdx) ? BREATH_PAUSE : LINE_PAUSE;
    const id = window.setTimeout(() => {
      setCharIdx(0);
      setLineIdx((l) => l + 1);
    }, pause);
    return () => window.clearTimeout(id);
  }, [lineIdx, charIdx, done]);

  return (
    <section className="mac-secret" aria-label="private collection">
      <h3 className="mac-secret__title">— private collection —</h3>
      <pre className="mac-secret__body">
        {POEM_LINES.slice(0, lineIdx).map((line, i) => {
          const isPilcrow = line === "\u00b6";
          return (
            <span key={i} className={isPilcrow ? "mac-secret__pilcrow" : undefined}>
              {line}
              {"\n"}
            </span>
          );
        })}
        {!done && POEM_LINES[lineIdx] !== undefined && (
          <>
            {POEM_LINES[lineIdx]!.slice(0, charIdx)}
            <span className="mac-secret__cursor">█</span>
          </>
        )}
      </pre>
    </section>
  );
}
