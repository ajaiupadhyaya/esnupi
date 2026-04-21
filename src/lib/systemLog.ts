/**
 * Lightweight syslog bus for cross-app messages (Terminal, force-quit, etc.).
 * Not persisted; mirrors classic UNIX syslog behavior for the fiction.
 */

const listeners = new Set<(line: string) => void>();

export function appendSystemLog(line: string) {
  const stamp = new Date().toLocaleTimeString(undefined, { hour12: false });
  const full = `[${stamp}] ${line}`;
  listeners.forEach((fn) => {
    try {
      fn(full);
    } catch {
      /* ignore */
    }
  });
}

export function subscribeSystemLog(fn: (line: string) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
