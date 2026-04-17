/** Mulberry32 — deterministic PRNG from a 32-bit seed. */
export function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** New seed on every full page load (not reused across tabs in sessionStorage). */
export function getVisitSeed(): number {
  const time = Math.floor(performance.timeOrigin) ^ (Date.now() & 0xffff_ffff);
  try {
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const buf = new Uint32Array(2);
      crypto.getRandomValues(buf);
      return (buf[0] ^ buf[1] ^ time) >>> 0;
    }
  } catch {
    /* non-secure context or restricted crypto */
  }
  return ((Math.random() * 0xffffffff) ^ time) >>> 0;
}

export function pick<T>(r: () => number, items: readonly T[]): T {
  return items[Math.floor(r() * items.length)]!;
}

export function range(r: () => number, min: number, max: number): number {
  return min + r() * (max - min);
}
