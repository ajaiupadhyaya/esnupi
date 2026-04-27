import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  hasCompletedVisitorGate,
  setVisitorAsGuest,
  setVisitorDisplayName,
} from "@/lib/visitorIdentity";
import { registerVisitor } from "@/lib/visitorLogStore";

import "./visit-classic.css";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/desktop";
  return raw;
}

export default function VisitClassic() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = useMemo(() => safeNextPath(params.get("next")), [params]);

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hasCompletedVisitorGate()) {
      navigate(next, { replace: true });
    }
  }, [navigate, next]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setVisitorDisplayName(trimmed);
    try {
      await registerVisitor(trimmed);
    } finally {
      setBusy(false);
    }
    navigate(next, { replace: true });
  };

  const onGuest = () => {
    setVisitorAsGuest();
    navigate(next, { replace: true });
  };

  return (
    <main className="vc-root">
      <div className="vc-border">
        <p className="vc-kicker">Admission desk · classic desktop</p>
        <div className="vc-body">
          <h1 className="vc-title">Before you enter the machine: what should we call you?</h1>
          <div className="vc-rule" aria-hidden />
          <form className="vc-form" onSubmit={onSubmit}>
            <label className="vc-label" htmlFor="vc-name">
              Visitor name
            </label>
            <input
              id="vc-name"
              className="vc-input"
              name="visitorName"
              type="text"
              autoComplete="nickname"
              maxLength={80}
              placeholder="e.g. J."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="vc-actions">
              <button type="submit" className="vc-submit" disabled={busy || !name.trim()}>
                {busy ? "Recording…" : "Enter desktop"}
              </button>
              <button type="button" className="vc-skip" onClick={onGuest}>
                Enter as guest — no name
              </button>
            </div>
          </form>
          <p className="vc-foot">
            Your name is stored in this browser only. If you post to the photobook, it travels with the image so you do not have to type it again.
          </p>
        </div>
      </div>
    </main>
  );
}
