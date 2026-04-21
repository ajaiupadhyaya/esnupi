export type ScrapClip = {
  id: string;
  kind: "text" | "url";
  text: string;
  at: string;
};

const KEY = "esnupi.scrapClippings.v1";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadClippings(): ScrapClip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScrapClip[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveClippings(list: ScrapClip[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function addTextClip(text: string) {
  const t = text.trim();
  if (!t) return;
  const next: ScrapClip = {
    id: uid(),
    kind: t.startsWith("http") ? "url" : "text",
    text: t.slice(0, 8000),
    at: new Date().toISOString(),
  };
  const list = [next, ...loadClippings()].slice(0, 200);
  saveClippings(list);
  return list;
}

export function removeClip(id: string) {
  const list = loadClippings().filter((c) => c.id !== id);
  saveClippings(list);
  return list;
}
