import { useEffect, useState } from "react";
import { playMacNotification } from "@/lib/retroMacSounds";

const HAIKUS = [
  "three open windows.\nnone of them contain the thing\nyou came here to find.",
  "blinking, blinking, blinking.\nthe cursor knows your name—\nit will not say it.",
  "the hard drive spins.\nsomething you forgot to save\nis humming along.",
  "a kind machine. a\nstarting chime you remember.\nthe feeling was love.",
  "press any key to\ncontinue. the key was always\nthe one you ignored.",
  "system time: now.\nlocal time: then. backup: no.\nshut down anyway?",
  "a small light blinks once.\nyou lean closer to the screen.\nthe light blinks again.",
];

type Notification = { id: number; text: string };

/** Menu-bar style notifications that occasionally drop in. */
export function MacNotifications() {
  const [queue, setQueue] = useState<Notification[]>([]);

  useEffect(() => {
    let idCounter = 1;
    let timer: number | undefined;
    const schedule = () => {
      const wait = 40_000 + Math.random() * 70_000;
      timer = window.setTimeout(() => {
        const text = HAIKUS[Math.floor(Math.random() * HAIKUS.length)]!;
        const id = idCounter++;
        setQueue((q) => [...q, { id, text }]);
        playMacNotification();
        window.setTimeout(() => {
          setQueue((q) => q.filter((n) => n.id !== id));
        }, 7200);
        schedule();
      }, wait);
    };
    // Delay first nudge so the boot sequence can breathe
    timer = window.setTimeout(schedule, 18_000);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!queue.length) return null;

  return (
    <div className="mac-notifications" aria-hidden>
      {queue.map((n) => (
        <div key={n.id} className="mac-notification">
          <div className="mac-notification__title">— the machine —</div>
          <pre className="mac-notification__body">{n.text}</pre>
        </div>
      ))}
    </div>
  );
}
