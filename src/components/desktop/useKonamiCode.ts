import { useEffect } from "react";

const SEQ = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

/**
 * Listen for the classic Konami sequence. `onUnlock` fires once per match.
 */
export function useKonamiCode(onUnlock: () => void) {
  useEffect(() => {
    let cursor = 0;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const want = SEQ[cursor];
      const got = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (got === want) {
        cursor += 1;
        if (cursor >= SEQ.length) {
          cursor = 0;
          onUnlock();
        }
      } else {
        cursor = got === SEQ[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onUnlock]);
}
