import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { DESKTOP_ICONS } from "../desktopIconConfig";

/**
 * Finder — a list-view Finder window showing the desktop's icons. Columns are
 * Name / Kind / Date Modified (whimsical values), all sortable by clicking
 * the header. Double-clicking a row opens its corresponding window.
 */

const DATE_MODIFIED: Record<string, string> = {
  email: "today, 2:14 PM",
  phone: "yesterday, 11:03 AM",
  home: "the night I rewrote everything",
  folder: "3 days ago",
  frame: "last Tuesday",
  moon: "a very quiet afternoon",
  heart1: "today, 3:40 AM",
  heart3: "yesterday",
  photobooth: "this morning",
  photobook: "2 days ago",
  visitorlog: "continuous",
};

type SortKey = "name" | "kind" | "date";

type FinderPanelProps = {
  onOpen: (windowId: string) => void;
};

export function FinderPanel({ onOpen }: FinderPanelProps) {
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({
    key: "name",
    asc: true,
  });

  const rows = useMemo(() => {
    const base = DESKTOP_ICONS.map((icon) => ({
      id: icon.id,
      name: icon.label,
      kind: "Application",
      date: DATE_MODIFIED[icon.id] ?? "recent",
      src: icon.src,
      windowId: icon.windowId,
    }));
    const dir = sort.asc ? 1 : -1;
    return base.sort((a, b) => {
      switch (sort.key) {
        case "kind":
          return a.kind.localeCompare(b.kind) * dir;
        case "date":
          return a.date.localeCompare(b.date) * dir;
        default:
          return a.name.localeCompare(b.name) * dir;
      }
    });
  }, [sort]);

  const sortBy = (key: SortKey) => {
    setSort((prev) => ({ key, asc: prev.key === key ? !prev.asc : true }));
  };

  const arrow = (key: SortKey) =>
    sort.key === key ? (sort.asc ? " ▲" : " ▼") : "";

  return (
    <section className="prog-finder" aria-label="Desktop Finder">
      <div className="prog-finder__bar">
        <span className="prog-finder__bar-title">Desktop</span>
        <span className="prog-finder__bar-meta">
          {rows.length} items · {rows.length} applications
        </span>
      </div>
      <table className="prog-finder__table">
        <thead>
          <tr>
            <th
              scope="col"
              className={cn("prog-finder__th", "prog-finder__th--name")}
              onClick={() => sortBy("name")}
            >
              Name{arrow("name")}
            </th>
            <th
              scope="col"
              className="prog-finder__th"
              onClick={() => sortBy("kind")}
            >
              Kind{arrow("kind")}
            </th>
            <th
              scope="col"
              className="prog-finder__th"
              onClick={() => sortBy("date")}
            >
              Date Modified{arrow("date")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="prog-finder__row"
              tabIndex={0}
              onDoubleClick={() => onOpen(row.windowId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpen(row.windowId);
              }}
            >
              <td className="prog-finder__cell prog-finder__cell--name">
                <img
                  src={row.src}
                  alt=""
                  className="prog-finder__icon"
                  aria-hidden
                />
                <span>{row.name}</span>
              </td>
              <td className="prog-finder__cell">{row.kind}</td>
              <td className="prog-finder__cell prog-finder__cell--date">
                {row.date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
