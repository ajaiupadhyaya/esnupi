import type { HydraMoodId } from "./authoredHydraSketches";
import { beginVisit, getVisitData } from "./visitMemory";

/**
 * Base moods, indexed 0..4. ARCHIVE is a sixth mood only unlocked by Konami.
 * Time-of-day buckets map per the brief:
 *   morning (05–11)  → AQUARIUM
 *   noon    (11–14)  → EMPTY_ROOM
 *   afternoon (14–18)→ INTERFERENCE
 *   evening (18–22)  → THERMAL
 *   night   (22–05)  → DEAD_CHANNEL
 */
const BASE_MOODS: HydraMoodId[] = [
  "AQUARIUM",
  "EMPTY_ROOM",
  "INTERFERENCE",
  "THERMAL",
  "DEAD_CHANNEL",
];

function hourToBucket(hour: number): number {
  if (hour >= 5 && hour < 11) return 0; // AQUARIUM
  if (hour >= 11 && hour < 14) return 1; // EMPTY_ROOM
  if (hour >= 14 && hour < 18) return 2; // INTERFERENCE
  if (hour >= 18 && hour < 22) return 3; // THERMAL
  return 4; // DEAD_CHANNEL
}

/**
 * Persistent visit counter. Delegates to the unified visit-memory store so
 * About This Mac, mood selection, and the "welcome back" boot all stay in sync.
 */
export function incrementVisitCount(): number {
  return beginVisit().visitCount;
}

export function getVisitCount(): number {
  const n = getVisitData().visitCount;
  return n > 0 ? n : 1;
}

/**
 * Pick a mood from (time bucket + visit count). The visit count advances the
 * mood across sessions so repeat visitors always get something new.
 *
 * @param konamiUnlocked when true, forces the ARCHIVE mood.
 */
export function pickHydraMood(
  opts: { visitCount: number; date?: Date; konamiUnlocked?: boolean } = { visitCount: 1 },
): HydraMoodId {
  if (opts.konamiUnlocked) return "ARCHIVE";
  const hour = (opts.date ?? new Date()).getHours();
  const bucket = hourToBucket(hour);
  const index = (bucket + Math.max(0, opts.visitCount - 1)) % BASE_MOODS.length;
  return BASE_MOODS[index] ?? "AQUARIUM";
}
