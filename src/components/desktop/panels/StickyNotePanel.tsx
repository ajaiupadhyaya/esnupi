/** Stickies-style yellow note. Content is local, not persisted. */
export function StickyNotePanel() {
  return (
    <div className="mac-sticky">
      <textarea
        className="mac-sticky__textarea"
        defaultValue={"a new note\n———\nthings to make:\n · "}
        spellCheck={false}
        aria-label="Sticky note"
      />
    </div>
  );
}
