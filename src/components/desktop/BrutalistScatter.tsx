import { BRUTALIST_SCATTER } from "./brutalistScatterConfig";

/**
 * Raw photos / prints “dropped” on the desk — harsh frames, sits under interactive icons.
 */
export function BrutalistScatter() {
  return (
    <div className="mac-brutalist-scatter" aria-hidden>
      {BRUTALIST_SCATTER.map((pic) => (
        <figure
          key={pic.id}
          className="mac-brutalist-photo"
          style={{
            left: `${pic.xPct}%`,
            top: `${pic.yPct}%`,
            transform: `translate(-50%, -50%) rotate(${pic.rotDeg}deg)`,
            width: pic.widthPx,
            maxWidth: "min(42vw, 220px)",
          }}
        >
          <img src={pic.src} alt="" draggable={false} loading="lazy" decoding="async" />
        </figure>
      ))}
    </div>
  );
}
