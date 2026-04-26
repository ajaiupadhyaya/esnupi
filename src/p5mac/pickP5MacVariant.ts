/** Picks 0, 1, or 2 on each classic-desktop session (macbackground.md variants). */
export type P5MacVariant = 0 | 1 | 2;

export function pickP5MacVariant(): P5MacVariant {
  return (Math.floor(Math.random() * 3) as P5MacVariant);
}
