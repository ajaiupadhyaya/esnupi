import { useEffect, useState } from "react";
import { playMacChirp, playShutdownSequence } from "@/lib/retroMacSounds";
import { stopAmbient } from "@/lib/ambientAudio";

type Mode = "shutdown" | "restart";

/**
 * Full-screen CRT-collapse shutdown/restart overlay.
 * On "restart": completes after ~2.8s and calls onRestart (parent replays boot).
 * On "shutdown": stays up until user clicks.
 */
export function ShutdownScreen({
  mode,
  onRestart,
  onDismiss,
}: {
  mode: Mode;
  onRestart: () => void;
  onDismiss: () => void;
}) {
  const [stage, setStage] = useState<"collapse" | "dark">("collapse");

  useEffect(() => {
    /* Shutdown layered audio: disk-park click (0ms) → fan decel (0.5s)
       → CRT bloom hiss (0.7s). Simultaneously ramp the ambient bed down. */
    playShutdownSequence();
    stopAmbient();
    playMacChirp(false);
    const id = window.setTimeout(() => setStage("dark"), 650);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (stage !== "dark") return;
    if (mode === "restart") {
      const id = window.setTimeout(() => onRestart(), 2100);
      return () => window.clearTimeout(id);
    }
  }, [mode, onRestart, stage]);

  return (
    <div
      className={`mac-shutdown mac-shutdown--${stage}`}
      role="presentation"
      onClick={() => {
        if (mode === "shutdown") onDismiss();
      }}
    >
      {stage === "dark" && mode === "shutdown" && (
        <div className="mac-shutdown__message">
          It is now safe to turn off your computer.
          <div className="mac-shutdown__hint">click anywhere to return</div>
        </div>
      )}
      {stage === "dark" && mode === "restart" && (
        <div className="mac-shutdown__message mac-shutdown__message--small">
          Restarting…
        </div>
      )}
    </div>
  );
}
