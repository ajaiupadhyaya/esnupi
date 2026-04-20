import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";
import { playMacMenuClick, playMacTypeTick } from "@/lib/retroMacSounds";

/**
 * Notepad — up to 5 named tabs, each persisted individually. Line numbers in
 * a 32px gutter, IBM Plex Mono, inline-rename by double-clicking a tab label.
 */

const MAX_TABS = 5;
const NAMES_KEY = "esnupi.notepad.tabNames.v1";
const ACTIVE_KEY = "esnupi.notepad.active.v1";

function bodyKey(i: number) {
  return `esnupi.notepad.tab${i}.v1`;
}

function loadNames(): string[] {
  try {
    const raw = localStorage.getItem(NAMES_KEY);
    if (!raw) return ["Note 1"];
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed) || parsed.length === 0) return ["Note 1"];
    return parsed.slice(0, MAX_TABS);
  } catch {
    return ["Note 1"];
  }
}

function loadBody(i: number): string {
  try {
    return localStorage.getItem(bodyKey(i)) ?? "";
  } catch {
    return "";
  }
}

function loadActive(): number {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    const n = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 && n < MAX_TABS ? n : 0;
  } catch {
    return 0;
  }
}

export function NotepadPanel() {
  const [names, setNames] = useState<string[]>(() => loadNames());
  const [active, setActive] = useState<number>(() => loadActive());
  const [bodies, setBodies] = useState<Record<number, string>>(() => {
    const out: Record<number, string> = {};
    names.forEach((_, i) => {
      out[i] = loadBody(i);
    });
    return out;
  });
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const saveTimers = useRef<Record<number, number | null>>({});

  /* Keep names + active persisted whenever they change. */
  useEffect(() => {
    try {
      localStorage.setItem(NAMES_KEY, JSON.stringify(names));
    } catch {
      /* quota */
    }
  }, [names]);
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_KEY, String(active));
    } catch {
      /* quota */
    }
  }, [active]);

  const persistBody = useCallback((idx: number, value: string) => {
    const prev = saveTimers.current[idx];
    if (prev) window.clearTimeout(prev);
    saveTimers.current[idx] = window.setTimeout(() => {
      try {
        localStorage.setItem(bodyKey(idx), value);
      } catch {
        /* quota */
      }
    }, 400);
  }, []);

  const onBodyChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      setBodies((b) => ({ ...b, [active]: next }));
      persistBody(active, next);
      playMacTypeTick();
    },
    [active, persistBody],
  );

  const addTab = useCallback(() => {
    if (names.length >= MAX_TABS) return;
    playMacMenuClick();
    setNames((ns) => [...ns, `Note ${ns.length + 1}`]);
    setBodies((b) => ({ ...b, [names.length]: "" }));
    setActive(names.length);
  }, [names.length]);

  const closeTab = useCallback(
    (idx: number) => {
      if (names.length <= 1) return;
      const hasContent = (bodies[idx] ?? "").trim().length > 0;
      if (hasContent && !window.confirm(`Close "${names[idx]}"? Its contents will be discarded.`)) {
        return;
      }
      playMacMenuClick();
      setNames((ns) => ns.filter((_, i) => i !== idx));
      setBodies((b) => {
        const out: Record<number, string> = {};
        let offset = 0;
        for (let i = 0; i < names.length; i += 1) {
          if (i === idx) {
            offset -= 1;
            continue;
          }
          out[i + offset] = b[i] ?? "";
        }
        return out;
      });
      try {
        localStorage.removeItem(bodyKey(idx));
      } catch {
        /* quota */
      }
      setActive((a) => {
        if (a === idx) return Math.max(0, idx - 1);
        return a > idx ? a - 1 : a;
      });
    },
    [bodies, names],
  );

  const startRename = useCallback(
    (idx: number) => {
      setRenaming(idx);
      setRenameDraft(names[idx] ?? "");
    },
    [names],
  );

  const commitRename = useCallback(() => {
    if (renaming === null) return;
    const trimmed = renameDraft.trim() || `Note ${renaming + 1}`;
    setNames((ns) => ns.map((n, i) => (i === renaming ? trimmed : n)));
    setRenaming(null);
  }, [renameDraft, renaming]);

  const onRenameKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commitRename();
      if (e.key === "Escape") setRenaming(null);
    },
    [commitRename],
  );

  const currentBody = bodies[active] ?? "";
  const lineCount = useMemo(() => Math.max(1, currentBody.split("\n").length), [currentBody]);
  const gutter = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1).join("\n"),
    [lineCount],
  );

  return (
    <section className="prog-notepad" aria-label="Notepad">
      <div className="prog-notepad__tabs" role="tablist">
        {names.map((label, idx) => (
          <div
            key={idx}
            role="tab"
            aria-selected={idx === active}
            className={cn(
              "prog-notepad__tab",
              idx === active && "prog-notepad__tab--active",
            )}
            onClick={() => setActive(idx)}
            onDoubleClick={() => startRename(idx)}
          >
            {renaming === idx ? (
              <input
                autoFocus
                className="prog-notepad__tab-input"
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={onRenameKey}
              />
            ) : (
              <span className="prog-notepad__tab-label">{label}</span>
            )}
            {names.length > 1 && renaming !== idx && (
              <button
                type="button"
                className="prog-notepad__tab-close"
                aria-label={`Close ${label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(idx);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {names.length < MAX_TABS && (
          <button
            type="button"
            className="prog-notepad__new"
            onClick={addTab}
            aria-label="New tab"
          >
            +
          </button>
        )}
      </div>
      <div className="prog-notepad__surface">
        <pre className="prog-notepad__gutter" aria-hidden>
          {gutter}
        </pre>
        <textarea
          ref={textareaRef}
          className="prog-notepad__textarea"
          value={currentBody}
          onChange={onBodyChange}
          spellCheck={false}
          aria-label={`Notepad content for ${names[active] ?? "note"}`}
        />
      </div>
    </section>
  );
}
