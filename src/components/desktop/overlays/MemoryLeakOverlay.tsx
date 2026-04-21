import type { CSSProperties } from "react";

/**
 * Ten-second “heap corruption” illusion: ghost windows cascade, then vanish.
 */
export function MemoryLeakOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="mac-memory-leak" aria-hidden>
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="mac-memory-leak__ghost"
          style={{ "--i": i } as CSSProperties & { "--i": number }}
        />
      ))}
    </div>
  );
}
