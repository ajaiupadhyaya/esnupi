import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type TransitionKind = "crt-collapse" | "boot";
type Phase = "idle" | "playing" | "settling";

type RouteTransitionCtx = {
  goto: (path: string) => void;
  phase: Phase;
  kind: TransitionKind | null;
};

const Ctx = createContext<RouteTransitionCtx | null>(null);

export function useRouteTransition() {
  const c = useContext(Ctx);
  if (!c) throw new Error("RouteTransition context not found");
  return c;
}

/** Wraps the app, coordinates desktop↔lab transitions via a fullscreen overlay. */
export function RouteTransitionProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [kind, setKind] = useState<TransitionKind | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  /* After every route change, let a boot play briefly before hiding. */
  const initialMountRef = useRef(true);
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    if (kind !== "boot") return;
    const id = window.setTimeout(() => {
      setPhase("idle");
      setKind(null);
    }, 900);
    return () => window.clearTimeout(id);
  }, [location.pathname, kind]);

  const goto = useCallback(
    (path: string) => {
      const isSecondaryRoom =
        path.startsWith("/lab") || path.startsWith("/gallery") || path.startsWith("/archive");
      const current = window.location.pathname;
      if (current === path) return;
      const nextKind: TransitionKind = isSecondaryRoom && current === "/" ? "crt-collapse" : "boot";
      setKind(nextKind);
      setPhase("playing");

      const playMs = nextKind === "crt-collapse" ? 650 : 50;
      window.setTimeout(() => {
        navigate(path);
        if (nextKind === "boot") {
          setPhase("settling");
        } else {
          setPhase("idle");
          setKind(null);
        }
      }, playMs);
    },
    [navigate],
  );

  const value = useMemo(() => ({ goto, phase, kind }), [goto, phase, kind]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {phase !== "idle" && kind && (
        <div className={`mac-route-transition mac-route-transition--${kind}`} aria-hidden>
          {kind === "boot" && (
            <div className="mac-route-transition__boot">
              <div className="mac-route-transition__scan" />
              <div className="mac-route-transition__text">starting up&#8230;</div>
            </div>
          )}
        </div>
      )}
    </Ctx.Provider>
  );
}
