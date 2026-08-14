import { getSupabase, hasSupabaseConfig } from "./supabaseClient";

/** Guestbook names are free text from anyone on the internet — cap them. */
const MAX_DISPLAY_NAME = 60;

export type VisitorLogEntry = {
  id: string;
  display_name: string;
  visited_at: string;
};

const LOCAL_KEY = "esnupi.visitor_log.v1";

function readLocal(): VisitorLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is VisitorLogEntry =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as VisitorLogEntry).id === "string" &&
        typeof (x as VisitorLogEntry).display_name === "string" &&
        typeof (x as VisitorLogEntry).visited_at === "string",
    );
  } catch {
    return [];
  }
}

function writeLocal(entries: VisitorLogEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
}

function notifyLocalListeners() {
  window.dispatchEvent(new CustomEvent("esnupi-visitor-log"));
}

/** Records a visit (name gate). Best-effort: Supabase first, then local-only. */
export async function registerVisitor(displayName: string): Promise<void> {
  const trimmed = displayName.trim().slice(0, MAX_DISPLAY_NAME);
  if (!trimmed) return;

  const entry: VisitorLogEntry = {
    id: crypto.randomUUID(),
    display_name: trimmed,
    visited_at: new Date().toISOString(),
  };

  const supabase = await getSupabase();
  if (supabase) {
    const { error } = await supabase.from("site_visitor_log").insert({
      display_name: trimmed,
      visited_at: entry.visited_at,
    });
    if (!error) return;
  }

  const prev = readLocal();
  writeLocal([entry, ...prev].slice(0, 500));
  notifyLocalListeners();
}

export async function loadVisitorLog(limit = 500): Promise<VisitorLogEntry[]> {
  const local = readLocal().slice(0, limit);
  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("site_visitor_log")
      .select("id,display_name,visited_at")
      .order("visited_at", { ascending: false })
      .limit(limit);
    if (!error && data) {
      return (data as VisitorLogEntry[]).map((row) => ({
        ...row,
        display_name: String(row.display_name ?? "").slice(0, MAX_DISPLAY_NAME),
      }));
    }
  }
  return local;
}

export function subscribeVisitorLog(onChange: () => void): () => void {
  // Returns synchronously so it can be used directly as a useEffect cleanup,
  // even though the Supabase client itself now loads lazily.
  if (hasSupabaseConfig) {
    let disposed = false;
    let dispose: (() => void) | null = null;
    void getSupabase().then((client) => {
      if (!client) return;
      const channel = client
        .channel("site-visitor-log")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "site_visitor_log" },
          () => {
            onChange();
          },
        )
        .subscribe();
      dispose = () => {
        void client.removeChannel(channel);
      };
      if (disposed) dispose();
    });
    return () => {
      disposed = true;
      dispose?.();
    };
  }

  const poll = window.setInterval(() => {
    void onChange();
  }, 12_000);
  const onStorage = () => void onChange();
  const onCustom = () => void onChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener("esnupi-visitor-log", onCustom as EventListener);
  return () => {
    window.clearInterval(poll);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("esnupi-visitor-log", onCustom as EventListener);
  };
}
