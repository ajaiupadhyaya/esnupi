import { DateTime } from "luxon";
import { useMemo } from "react";
import type { SharedPhoto } from "@/lib/photobookStore";

export function PhotobookPanel({
  photos,
  loading,
  error,
  sharedEnabled,
}: {
  photos: SharedPhoto[];
  loading: boolean;
  error: string | null;
  sharedEnabled: boolean;
}) {
  const items = useMemo(() => photos, [photos]);

  return (
    <section className="mac-photobook">
      <header className="mac-photobook__header">
        <h3>Museum Photobook</h3>
        <p>{photos.length} portraits pinned to the wall. Each one catches the light a little differently.</p>
      </header>
      {!sharedEnabled ? (
        <p className="mac-photobook__warning">
          Add Supabase env vars (<code>VITE_SUPABASE_URL</code> + <code>VITE_SUPABASE_ANON_KEY</code> or
          <code> NEXT_PUBLIC_SUPABASE_URL</code> + <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>)
          to enable shared storage.
        </p>
      ) : null}
      {error ? <p className="mac-photobook__warning">{error}</p> : null}
      {loading ? <p className="mac-photobook__empty">Loading shared collection…</p> : null}
      {!loading && !items.length ? (
        <p className="mac-photobook__empty">No portraits yet. Open Photobooth to add the first visitor photo.</p>
      ) : (
        <div className="mac-photobook__wall">
          {items.map((photo, idx) => {
            // deterministic pseudo-random rotation per id so the wall feels hand-pinned
            const hash = hashString(photo.id);
            const rotation = ((hash % 41) - 20) / 10; // -2.0 .. +2.0 degrees
            const offsetY = (hash % 13) - 6;
            return (
              <figure
                key={photo.id}
                className="mac-photobook__pin"
                style={{
                  // Expose custom properties so CSS can animate from them
                  ["--pin-rot" as never]: `${rotation}deg`,
                  ["--pin-off" as never]: `${offsetY}px`,
                }}
              >
                <img
                  src={photo.image_url}
                  alt={`Visitor portrait — ${DateTime.fromISO(photo.created_at).toLocaleString(DateTime.DATETIME_MED)}`}
                  loading={idx < 6 ? "eager" : "lazy"}
                />
                <figcaption>
                  {DateTime.fromISO(photo.created_at).toLocaleString(DateTime.DATETIME_MED)}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </section>
  );
}

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
