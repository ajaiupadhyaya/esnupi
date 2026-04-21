import { useEffect, useRef, useState } from "react";

/**
 * Tiny 8-bit felt-style “inhabitant” that patrols the menu bar — e-Sheep energy, low fidelity.
 */
export function DesktopPet() {
  const [x, setX] = useState(12);
  const dir = useRef(1);

  useEffect(() => {
    const id = window.setInterval(() => {
      setX((prev) => {
        const max = Math.max(80, window.innerWidth - 140);
        let next = prev + dir.current * (1.2 + Math.random() * 1.4);
        if (next >= max) dir.current = -1;
        if (next <= 8) dir.current = 1;
        next = Math.min(max, Math.max(8, next));
        return next;
      });
    }, 140);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="mac-desktop-pet"
      style={{ left: x }}
      aria-hidden
      title="a small resident"
    >
      <span className="mac-desktop-pet__sprite">◕‿◕</span>
    </div>
  );
}
