import { useEffect, useState } from "react";

export function MobileAlert() {
  const [dismissed, setDismissed] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 760);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isNarrow || dismissed) return null;

  return (
    <div className="mac-mobile-alert" role="alertdialog" aria-modal="true">
      <div className="mac-mobile-alert__window">
        <div className="mac-mobile-alert__title">esnupi</div>
        <div className="mac-mobile-alert__body">
          <div className="mac-mobile-alert__icon" aria-hidden>
            ⚠
          </div>
          <div className="mac-mobile-alert__text">
            <strong>This site is best experienced on a desktop.</strong>
            <p>
              The Macintosh shell, dragging, and real-time shader wallpaper were
              built for a mouse and a bigger screen. You can look around from here
              if you like — nothing will break.
            </p>
          </div>
        </div>
        <div className="mac-mobile-alert__actions">
          <button type="button" className="mac-mobile-alert__button" onClick={() => setDismissed(true)}>
            View anyway
          </button>
        </div>
      </div>
    </div>
  );
}
