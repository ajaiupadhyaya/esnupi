import { useEffect, useRef, useState } from "react";
import { playMacNotification } from "@/lib/retroMacSounds";
import { getControlSettings } from "../controlSettings";
import { getVisitData } from "@/lib/visitMemory";

/**
 * The first three haikus are an authored sequence that tells a story to
 * first-time visitors — in order. After those three, subsequent notifications
 * draw from the broader pool randomly. Return visitors (visitCount > 1) skip
 * straight to the random pool.
 */
const HAIKUS_OPENING: Array<[string, string, string]> = [
  ["a kind machine. a", "starting chime you remember.", "the feeling was love."],
  ["three open windows.", "none of them contain the thing", "you came here to find."],
  ["press any key to", "continue. the key was always", "the one you ignored."],
];

const HAIKUS_POOL: Array<[string, string, string]> = [
  ["blinking, blinking, blinking.", "the cursor knows your name—", "it will not say it."],
  ["the hard drive spins.", "something you forgot to save", "is humming along."],
  ["system time: now.", "local time: then. backup: no.", "shut down anyway?"],
  ["a small light blinks once.", "you lean closer to the screen.", "the light blinks again."],
  ["somewhere in the room", "a second hand is ticking.", "you didn't notice."],
  ["the window you closed", "is already open again", "on the other screen."],
];

type Notification = { id: number; lines: [string, string, string] };

const MAX_LIFETIME_MS = 30_000;

/**
 * Menu-bar notifications that drop in occasionally. Three lines of a haiku,
 * each staggered 80ms from off-screen right. Black on white, no rounded corners.
 * Persist until clicked; fade only after 30s.
 */
export function MacNotifications() {
  const [queue, setQueue] = useState<Notification[]>([]);
  /** Track where we are in the authored opening sequence for this session. */
  const sentOpeningRef = useRef(0);

  useEffect(() => {
    let idCounter = 1;
    let timer: number | undefined;
    const isFirstVisit = getVisitData().visitCount <= 1;
    const schedule = () => {
      const wait = 40_000 + Math.random() * 70_000;
      timer = window.setTimeout(() => {
        if (!getControlSettings().notificationHaikus) {
          schedule();
          return;
        }
        /* First-time visitors get the opening story in order; everyone else
         * — and first-timers past the opening — draw from the random pool. */
        let lines: [string, string, string];
        if (isFirstVisit && sentOpeningRef.current < HAIKUS_OPENING.length) {
          lines = HAIKUS_OPENING[sentOpeningRef.current]!;
          sentOpeningRef.current += 1;
        } else {
          lines = HAIKUS_POOL[Math.floor(Math.random() * HAIKUS_POOL.length)]!;
        }
        const id = idCounter++;
        setQueue((q) => [...q, { id, lines }]);
        playMacNotification();
        window.setTimeout(() => {
          setQueue((q) => q.filter((n) => n.id !== id));
        }, MAX_LIFETIME_MS);
        schedule();
      }, wait);
    };
    timer = window.setTimeout(schedule, 18_000);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const dismiss = (id: number) => setQueue((q) => q.filter((n) => n.id !== id));

  if (!queue.length) return null;

  return (
    <div className="mac-notifications">
      {queue.map((n) => (
        <button
          key={n.id}
          type="button"
          className="mac-notification"
          aria-label="Dismiss notification"
          onClick={() => dismiss(n.id)}
        >
          {n.lines.map((line, i) => (
            <span
              key={i}
              className="mac-notification__line"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {line}
            </span>
          ))}
        </button>
      ))}
    </div>
  );
}
