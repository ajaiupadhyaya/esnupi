import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FilmPhoto } from "@/photography/library";
import { cn } from "@/lib/utils";

type FilmPhotosPanelProps = {
  items: FilmPhoto[];
};

export function FilmPhotosPanel({ items }: FilmPhotosPanelProps) {
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const count = items.length;
  const safeIndex = count > 0 ? Math.min(selectedIndex, count - 1) : 0;
  const selected = count > 0 ? items[safeIndex]! : null;

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    setSelectedIndex((i) => (count > 0 ? Math.min(i, count - 1) : 0));
  }, [count]);

  useEffect(() => {
    if (!listRef.current || count === 0) return;
    const row = listRef.current.querySelector<HTMLElement>(`[data-idx="${safeIndex}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [safeIndex, count]);

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setSelectedIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  const onRootKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        go(-1);
      }
    },
    [go],
  );

  const sidebarHint = useMemo(
    () =>
      count === 0
        ? "No items"
        : `${count} photo${count === 1 ? "" : "s"}`,
    [count],
  );

  return (
    <section
      ref={rootRef}
      className="mac-photos-app"
      aria-label="Photos"
      tabIndex={0}
      onKeyDown={onRootKeyDown}
    >
      <header className="mac-photos-app__toolbar mac-surface">
        <span className="mac-photos-app__toolbar-title">Photos</span>
        <span className="mac-photos-app__toolbar-meta">{sidebarHint}</span>
      </header>

      <div className="mac-photos-app__split">
        <aside className="mac-photos-app__sidebar mac-surface" aria-label="Library">
          <div className="mac-photos-app__sidebar-head">
            <span className="mac-photos-app__sidebar-label">Library</span>
          </div>
          <div ref={listRef} className="mac-photos-app__sidebar-list" role="listbox" aria-activedescendant={selected ? `film-photo-${safeIndex}` : undefined}>
            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="option"
                id={`film-photo-${idx}`}
                data-idx={idx}
                aria-selected={idx === safeIndex}
                className={cn(
                  "mac-photos-app__sidebar-row",
                  idx === safeIndex && "mac-photos-app__sidebar-row--active",
                )}
                onClick={() => setSelectedIndex(idx)}
              >
                <span className="mac-photos-app__sidebar-thumb-wrap">
                  <img src={item.src} alt="" className="mac-photos-app__sidebar-thumb" loading="lazy" decoding="async" />
                </span>
                <span className="mac-photos-app__sidebar-title">{item.title}</span>
              </button>
            ))}
          </div>
          {count === 0 ? (
            <p className="mac-photos-app__sidebar-empty">
              Add images to{" "}
              <code className="mac-photos-app__code">src/photography/images</code>
              {" "}and titles or blurbs in{" "}
              <code className="mac-photos-app__code">src/photography/manifest.ts</code>.
            </p>
          ) : null}
        </aside>

        <div className="mac-photos-app__main">
          {selected ? (
            <>
              <div className="mac-photos-app__canvas mac-surface">
                <img
                  src={selected.src}
                  alt={selected.title}
                  className="mac-photos-app__hero"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <article className="mac-photos-app__detail mac-surface">
                <h2 className="mac-photos-app__detail-title">{selected.title}</h2>
                {selected.location ? (
                  <p className="mac-photos-app__detail-loc">
                    <span aria-hidden className="mac-photos-app__pin">
                      📍
                    </span>
                    {selected.location}
                  </p>
                ) : (
                  <p className="mac-photos-app__detail-loc mac-photos-app__detail-loc--muted">No location</p>
                )}
                <div className="mac-photos-app__detail-blurb">
                  {selected.blurb ? (
                    <p>{selected.blurb}</p>
                  ) : (
                    <p className="mac-photos-app__detail-placeholder">
                      No description — add a <strong>blurb</strong> in{" "}
                      <code className="mac-photos-app__code">manifest.ts</code>.
                    </p>
                  )}
                </div>
              </article>
            </>
          ) : (
            <div className="mac-photos-app__empty mac-surface">
              <p className="mac-photos-app__empty-title">Your library is empty</p>
              <p className="mac-photos-app__empty-copy">
                Drop scans into{" "}
                <code className="mac-photos-app__code">src/photography/images</code>
                , then describe them in{" "}
                <code className="mac-photos-app__code">src/photography/manifest.ts</code>.
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="mac-photos-app__footer">
        <span className="mac-type-system">↑↓ select · film library</span>
      </footer>
    </section>
  );
}
