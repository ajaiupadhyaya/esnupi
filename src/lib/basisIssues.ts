import type { ComponentType } from "react";

/**
 * BASIS, the weekly market monitor. Each issue is one MDX file in
 * `src/content/basis/` (see the README there). Files starting with `_` are
 * ignored, so `_template.mdx` never ships.
 */
export type BasisMeta = {
  /** Issue number, shown as "No. 001". */
  number: number;
  title: string;
  /** ISO date, e.g. "2026-10-12". */
  date: string;
  /** One-sentence summary for the issue list. */
  dek?: string;
};

export type BasisIssue = BasisMeta & {
  slug: string;
  Body: ComponentType<Record<string, unknown>>;
};

type BasisModule = { default: ComponentType<Record<string, unknown>>; meta?: BasisMeta };

const modules = import.meta.glob<BasisModule>("/src/content/basis/[!_]*.mdx", { eager: true });

/** Newest first. */
export const BASIS_ISSUES: BasisIssue[] = Object.entries(modules)
  .flatMap(([path, mod]) => {
    if (!mod.meta) {
      console.warn(`[basis] ${path} has no \`export const meta\`; skipped.`);
      return [];
    }
    const slug = path.split("/").pop()!.replace(/\.mdx$/, "");
    return [{ ...mod.meta, slug, Body: mod.default }];
  })
  .sort((a, b) => b.number - a.number);

export const formatIssueNumber = (n: number) => `No. ${String(n).padStart(3, "0")}`;

export function formatIssueDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
