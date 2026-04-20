import { type ReactNode, useEffect, useMemo, useState } from "react";

type Props = {
  children: ReactNode[];
  /** Ms between each child opacity step. */
  stagger?: number;
  className?: string;
};

/**
 * "The machine is rendering the content." Each child fades in one at a time
 * on a 20ms stagger — it feels like the OS, not CSS.
 */
export function ScaffoldReveal({ children, stagger = 20, className }: Props) {
  const count = children.length;
  const [revealed, setRevealed] = useState(0);

  const delays = useMemo(
    () => Array.from({ length: count }, (_, i) => i * stagger),
    [count, stagger],
  );

  useEffect(() => {
    setRevealed(0);
    const ids = delays.map((d, i) =>
      window.setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), d),
    );
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [delays]);

  return (
    <div className={className}>
      {children.map((child, i) => (
        <div
          key={i}
          className="mac-reveal-line"
          style={{
            opacity: i < revealed ? 1 : 0,
            transition: "opacity 180ms ease",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
