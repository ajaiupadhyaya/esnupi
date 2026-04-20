import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { playMacTypeTick } from "@/lib/retroMacSounds";

const STORAGE_KEY = "esnupi.typist.v1";

type TypistPanelProps = {
  /** Fired when the user types "esnupi" anywhere in the note. */
  onMagicWord?: () => void;
};

/**
 * Typist — a distraction-free writing tool.
 *
 *   - Text persists to localStorage, debounced 500 ms per keystroke.
 *   - Live word + character counts at the bottom corners.
 *   - CLEAR button appears after 2 s if text exists; confirms before wiping.
 *   - File → Export Note is exposed via the exported {@link exportTypistNote}
 *     so the menu bar can trigger it regardless of window focus.
 *   - Types the word "esnupi" anywhere to fire `onMagicWord` — the brief's
 *     final easter-egg trigger.
 */
export function TypistPanel({ onMagicWord }: TypistPanelProps) {
  const [text, setText] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [clearVisible, setClearVisible] = useState(false);
  const magicFiredRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const saveTimer = useRef<number | null>(null);

  /* Focus on mount — "you open it, you write." */
  useEffect(() => {
    const id = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 60);
    return () => window.clearTimeout(id);
  }, []);

  /* Conditional CLEAR button — only reveals after the 2 s settle delay and
     only if there is text to clear. */
  useEffect(() => {
    if (!text.trim()) {
      setClearVisible(false);
      return;
    }
    const id = window.setTimeout(() => setClearVisible(true), 2_000);
    return () => window.clearTimeout(id);
  }, [text]);

  const persist = useCallback((value: string) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {
        /* quota exceeded / private mode: silent */
      }
    }, 500);
  }, []);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      setText(next);
      persist(next);
      playMacTypeTick();

      if (!magicFiredRef.current && /\besnupi\b/i.test(next)) {
        magicFiredRef.current = true;
        onMagicWord?.();
      }
    },
    [persist, onMagicWord],
  );

  const clearNote = useCallback(() => {
    const confirmed = window.confirm(
      "Are you sure you want to clear your note? This cannot be undone.",
    );
    if (!confirmed) return;
    setText("");
    persist("");
    textareaRef.current?.focus();
  }, [persist]);

  const counts = useMemo(() => {
    const chars = text.length;
    const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
    return { chars, words };
  }, [text]);

  return (
    <section className="prog-typist" aria-label="Typist">
      <textarea
        ref={textareaRef}
        className="prog-typist__area"
        value={text}
        onChange={onChange}
        placeholder="Start typing."
        spellCheck
        aria-label="Typist note"
      />
      <div className="prog-typist__meta">
        <span className="prog-typist__count prog-typist__count--words">
          {counts.words} words
        </span>
        {clearVisible && (
          <button
            type="button"
            className="prog-typist__clear"
            onClick={clearNote}
          >
            CLEAR
          </button>
        )}
        <span className="prog-typist__count prog-typist__count--chars">
          {counts.chars} characters
        </span>
      </div>
    </section>
  );
}

/**
 * Download the current note as a plain-text file. Intended for the
 * File → Export Note menu action.
 */
export function exportTypistNote() {
  try {
    const text = localStorage.getItem(STORAGE_KEY) ?? "";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `note-${date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  } catch {
    /* silent */
  }
}
