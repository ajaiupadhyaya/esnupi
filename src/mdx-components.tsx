import type { ReactNode } from "react";

/** Margin annotation. Renders in the 120px left gutter on wide screens. */
export function Aside({ children }: { children: ReactNode }) {
  return <aside className="lab-aside">{children}</aside>;
}
