import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";

import { hasSupabaseConfig } from "@/lib/supabaseClient";
import {
  loadVisitorLog,
  subscribeVisitorLog,
  type VisitorLogEntry,
} from "@/lib/visitorLogStore";

export function VisitorLogPanel() {
  const [entries, setEntries] = useState<VisitorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const rows = await loadVisitorLog();
      setEntries(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsub = subscribeVisitorLog(() => {
      void refresh();
    });
    return unsub;
  }, [refresh]);

  const localOnly = !hasSupabaseConfig;

  return (
    <section className="mac-visitorlog" aria-label="Visitor log">
      <header className="mac-visitorlog__header">
        <h3 className="mac-type-metadata">Guest log</h3>
        <p className="mac-visitorlog__lede">
          Names left at the gate. Updates while the desktop stays open.
        </p>
      </header>

      {loading ? (
        <p className="mac-visitorlog__meta">Pulling ledger…</p>
      ) : entries.length === 0 ? (
        <p className="mac-visitorlog__meta">No signatures yet.</p>
      ) : (
        <ol className="mac-visitorlog__list">
          {entries.map((row, i) => (
            <li key={row.id} className="mac-visitorlog__row">
              <span className="mac-visitorlog__idx">{String(entries.length - i).padStart(3, "0")}</span>
              <span className="mac-visitorlog__name">{row.display_name}</span>
              <time className="mac-visitorlog__time" dateTime={row.visited_at}>
                {DateTime.fromISO(row.visited_at).toFormat("MMM d · HH:mm")}
              </time>
            </li>
          ))}
        </ol>
      )}

      {localOnly ? (
        <p className="mac-visitorlog__hint">
          Shared Supabase keys are off — this list is stored in your browser session only. Add env vars and run{" "}
          <code className="mac-visitorlog__code">supabase/site_visitor_log.sql</code> for a live ledger.
        </p>
      ) : null}
    </section>
  );
}
