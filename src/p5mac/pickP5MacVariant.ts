/** Picks 0–5 on each classic-desktop session (uniform random per visit). */
export type P5MacVariant = 0 | 1 | 2 | 3 | 4 | 5;

function randomUint32(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0]!;
  }
  return Math.floor(Math.random() * 2 ** 32);
}

export function pickP5MacVariant(): P5MacVariant {
  return (randomUint32() % 6) as P5MacVariant;
}
