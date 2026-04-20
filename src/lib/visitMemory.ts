/**
 * Visit memory — the machine remembers you.
 *
 * Stored as a single `esnupi.visitData.v1` key in localStorage. Incremented
 * on app mount, updated every 30s while the tab is visible so total time
 * accumulates even across crashes/reloads.
 */

const KEY = "esnupi.visitData.v1";

export type VisitData = {
  visitCount: number;
  firstVisit: number;
  lastVisit: number;
  totalTimeMs: number;
  windowsOpened: number;
  secretFound: boolean;
  konamiUsed: boolean;
};

const DEFAULTS: VisitData = {
  visitCount: 0,
  firstVisit: 0,
  lastVisit: 0,
  totalTimeMs: 0,
  windowsOpened: 0,
  secretFound: false,
  konamiUsed: false,
};

let cache: VisitData | null = null;

function read(): VisitData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      cache = { ...DEFAULTS };
      return cache;
    }
    const parsed = JSON.parse(raw) as Partial<VisitData>;
    cache = { ...DEFAULTS, ...parsed };
    return cache;
  } catch {
    cache = { ...DEFAULTS };
    return cache;
  }
}

function write(next: VisitData) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getVisitData(): VisitData {
  return read();
}

/** Mark the start of a new session. Returns the updated record. */
export function beginVisit(): VisitData {
  const existing = read();
  const now = Date.now();
  const next: VisitData = {
    ...existing,
    visitCount: existing.visitCount + 1,
    firstVisit: existing.firstVisit || now,
    lastVisit: now,
  };
  write(next);
  return next;
}

export function patchVisit(patch: Partial<VisitData>) {
  const next = { ...read(), ...patch };
  write(next);
}

export function incrementWindowsOpened() {
  const next = read();
  write({ ...next, windowsOpened: next.windowsOpened + 1 });
}

export function markSecretFound() {
  patchVisit({ secretFound: true });
}

export function markKonamiUsed() {
  patchVisit({ konamiUsed: true });
}

/**
 * Accumulate elapsed time since `startTime` onto the total. Called on an
 * interval while the tab is visible.
 */
export function accumulateTime(deltaMs: number) {
  const existing = read();
  write({
    ...existing,
    totalTimeMs: existing.totalTimeMs + deltaMs,
    lastVisit: Date.now(),
  });
}

/* ------------------------------------------------------------------ */
/* Formatters for the About This Mac emotional specs                  */
/* ------------------------------------------------------------------ */

export function formatFirstBoot(ts: number): string {
  if (!ts) return "just now";
  const d = new Date(ts);
  return d
    .toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

export function formatUptime(totalMs: number, sessions: number): string {
  const totalMinutes = Math.floor(totalMs / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const headline =
    h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
  return `${headline} across ${sessions} session${sessions === 1 ? "" : "s"}`;
}

export function formatRelative(ts: number): string {
  if (!ts) return "never";
  const diff = Date.now() - ts;
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  const days = Math.floor(diff / day);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
}
