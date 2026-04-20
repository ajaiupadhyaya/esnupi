import { DateTime } from "luxon";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { playMacTypeTick } from "@/lib/retroMacSounds";
import { cn } from "@/lib/utils";

/**
 * The Clock program — a minimal Brutalist analog clock.
 *
 *  - Pure SVG. No numbers on the face. Twelve ticks (four long, eight short).
 *  - Second hand in #FF3B00 (the rupture color), snaps to each second with
 *    a discrete tick instead of a smooth sweep.
 *  - requestAnimationFrame for the subsecond polling, but a setTimeout aligned
 *    to `Date.now() % 1000` for the audible tick, so the sound always lands
 *    exactly on the second boundary.
 *  - Optional second/third world-clock faces at 60% scale, up to two extras.
 */

const TIMEZONES: Array<{ label: string; zone: string }> = [
  { label: "NEW YORK", zone: "America/New_York" },
  { label: "LONDON", zone: "Europe/London" },
  { label: "TOKYO", zone: "Asia/Tokyo" },
  { label: "MEXICO CITY", zone: "America/Mexico_City" },
  { label: "LAGOS", zone: "Africa/Lagos" },
];

export function ClockPanel() {
  const [now, setNow] = useState<DateTime>(() => DateTime.now());
  const [extraZones, setExtraZones] = useState<string[]>([]);

  /* Tick the second-precision clock exactly on the second boundary and play
     the audible tick at the same moment. */
  const lastSecondRef = useRef(-1);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const t = DateTime.now();
      const sec = t.second;
      if (sec !== lastSecondRef.current) {
        lastSecondRef.current = sec;
        setNow(t);
        playMacTypeTick();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const addTimezone = useCallback(
    (zone: string) => {
      setExtraZones((prev) => {
        if (prev.includes(zone) || prev.length >= 2) return prev;
        return [...prev, zone];
      });
    },
    [],
  );

  const removeTimezone = useCallback((zone: string) => {
    setExtraZones((prev) => prev.filter((z) => z !== zone));
  }, []);

  const dateLine = useMemo(
    () => now.toFormat("cccc, d LLLL").toUpperCase(),
    [now],
  );

  return (
    <section className="prog-clock" aria-label="Clock">
      <div className="prog-clock__main">
        <AnalogClock time={now} />
      </div>
      <div className="prog-clock__date">{dateLine}</div>

      {extraZones.map((zone) => {
        const zt = now.setZone(zone);
        const meta = TIMEZONES.find((t) => t.zone === zone);
        return (
          <div key={zone} className="prog-clock__zone">
            <AnalogClock time={zt} small />
            <div className="prog-clock__zone-meta">
              <span className="prog-clock__zone-label">{meta?.label ?? zone}</span>
              <button
                type="button"
                className="prog-clock__zone-remove"
                onClick={() => removeTimezone(zone)}
                aria-label={`Remove ${meta?.label ?? zone} clock`}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}

      {extraZones.length < 2 && (
        <label className="prog-clock__add">
          <span className="prog-clock__add-label">Add timezone</span>
          <select
            className="prog-clock__add-select"
            value=""
            onChange={(e) => {
              if (e.target.value) addTimezone(e.target.value);
              e.currentTarget.value = "";
            }}
          >
            <option value="">—</option>
            {TIMEZONES.filter((t) => !extraZones.includes(t.zone)).map((t) => (
              <option key={t.zone} value={t.zone}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Analog face                                                         */
/* ------------------------------------------------------------------ */

function AnalogClock({ time, small = false }: { time: DateTime; small?: boolean }) {
  const size = small ? 120 : 200;
  const r = size / 2;
  const strokeTick = small ? 2 : 3;
  const ringRadius = r - (small ? 4 : 6);

  /* Pure rectangle ticks: four long (12 / 3 / 6 / 9) + eight short. */
  const ticks = Array.from({ length: 12 }).map((_, i) => {
    const long = i % 3 === 0;
    const angle = (i * 360) / 12;
    const outer = ringRadius;
    const inner = outer - (long ? (small ? 10 : 16) : small ? 5 : 9);
    return { angle, inner, outer, long, strokeTick };
  });

  const hours = time.hour % 12;
  const minutes = time.minute;
  const seconds = time.second;

  const hourAngle = (hours + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  const hourLen = r * 0.6;
  const minuteLen = r * 0.8;
  const secondLen = r * 0.9;

  return (
    <svg
      className={cn("prog-clock__face", small && "prog-clock__face--small")}
      width={size}
      height={size}
      viewBox={`-${r} -${r} ${size} ${size}`}
      aria-hidden
    >
      <circle cx="0" cy="0" r={ringRadius} fill="#fff" stroke="#000" strokeWidth={small ? 2 : 3} />
      {ticks.map((t) => (
        <rect
          key={t.angle}
          x={-strokeTick / 2}
          y={-t.outer}
          width={strokeTick}
          height={t.outer - t.inner}
          fill="#000"
          transform={`rotate(${t.angle})`}
        />
      ))}
      {/* hour */}
      <rect
        x={-(small ? 3 : 4) / 2}
        y={-hourLen}
        width={small ? 3 : 4}
        height={hourLen}
        fill="#000"
        rx={small ? 1.5 : 2}
        transform={`rotate(${hourAngle})`}
      />
      {/* minute */}
      <rect
        x={-(small ? 1.5 : 2) / 2}
        y={-minuteLen}
        width={small ? 1.5 : 2}
        height={minuteLen}
        fill="#000"
        transform={`rotate(${minuteAngle})`}
      />
      {/* second — rupture */}
      <rect
        x={-0.5}
        y={-secondLen}
        width={1}
        height={secondLen}
        fill="#FF3B00"
        transform={`rotate(${secondAngle})`}
      />
      <circle cx="0" cy="0" r={small ? 4 : 6} fill="#000" />
    </svg>
  );
}
