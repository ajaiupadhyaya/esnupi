import { useCallback, useEffect, useRef, useState } from "react";
import { playMacTypeTick, playPongBeep } from "@/lib/retroMacSounds";

const BROWSER_HOME = "https://example.com";
const BROWSER_PRESETS = [
  "https://example.com",
  "https://en.wikipedia.org/wiki/Mac_OS_8",
  "https://archive.org",
  "https://developer.mozilla.org",
];

const BOOKMARKS: Array<{ label: string; url: string }> = [
  { label: "Space Jam (1996, archived)", url: "https://web.archive.org/web/1996/https://www.spacejam.com/" },
  { label: "Apple.com (1997, archived)", url: "https://web.archive.org/web/1997/https://www.apple.com/" },
  { label: "Suck.com", url: "https://web.archive.org/web/2000/https://www.suck.com/" },
  { label: "The Hampster Dance", url: "https://web.archive.org/web/1998/http://web.nbnet.nb.ca/~dcoutts/hampsterdance.html" },
  { label: "Archive.org", url: "https://archive.org" },
  { label: "Wikipedia — Mac OS 8", url: "https://en.wikipedia.org/wiki/Mac_OS_8" },
];

function normalizeBrowserUrl(input: string) {
  const raw = input.trim();
  if (!raw) return BROWSER_HOME;
  if (raw.toLowerCase() === "pong") return "esnupi:pong";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z0-9-]+\.[a-z]{2,}/i.test(raw)) return `https://${raw}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`;
}

function originLabel(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url === "esnupi:pong" ? "pong" : "unknown";
  }
}

export function WebBrowserPanel() {
  const [history, setHistory] = useState<string[]>([BROWSER_HOME]);
  const [index, setIndex] = useState(0);
  const [addressInput, setAddressInput] = useState(BROWSER_HOME);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [dialing, setDialing] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);

  const currentUrl = history[index] ?? BROWSER_HOME;
  const isHttps = currentUrl.startsWith("https://");
  const isPong = currentUrl === "esnupi:pong";

  const navigateTo = useCallback((next: string) => {
    const normalized = normalizeBrowserUrl(next);
    setHistory((prev) => [...prev.slice(0, index + 1), normalized]);
    setIndex((prev) => prev + 1);
    setAddressInput(normalized);
    setIsLoading(true);
    setDialing(true);
    setProgress(0);
  }, [index]);

  useEffect(() => {
    setAddressInput(currentUrl);
  }, [currentUrl]);

  // Fake modem dial
  useEffect(() => {
    if (!dialing) return;
    const id = window.setTimeout(() => setDialing(false), 800);
    return () => window.clearTimeout(id);
  }, [dialing, currentUrl]);

  // Progress bar animation while loading
  useEffect(() => {
    if (!isLoading) return;
    let cancelled = false;
    setProgress(5);
    const tick = () => {
      if (cancelled) return;
      setProgress((p) => {
        if (p >= 90) return p;
        return Math.min(92, p + Math.random() * 14);
      });
      window.setTimeout(tick, 240);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [isLoading]);

  return (
    <section className="mac-browser">
      <header className="mac-browser__toolbar">
        <div className="mac-browser__toolbar-row">
          <button
            type="button"
            className="mac-browser__button"
            disabled={index <= 0}
            onClick={() => {
              if (index <= 0) return;
              setIndex((i) => i - 1);
              setIsLoading(true);
              setDialing(true);
            }}
          >
            ◀ Back
          </button>
          <button
            type="button"
            className="mac-browser__button"
            disabled={index >= history.length - 1}
            onClick={() => {
              if (index >= history.length - 1) return;
              setIndex((i) => i + 1);
              setIsLoading(true);
              setDialing(true);
            }}
          >
            Forward ▶
          </button>
          <button
            type="button"
            className="mac-browser__button"
            onClick={() => {
              setIsLoading(true);
              setDialing(true);
              setProgress(0);
              setHistory((prev) => {
                const clone = [...prev];
                clone[index] = `${currentUrl}${currentUrl.includes("?") ? "&" : "?"}_r=${Date.now()}`;
                return clone;
              });
            }}
          >
            ↻ Reload
          </button>
          <button type="button" className="mac-browser__button" onClick={() => navigateTo(BROWSER_HOME)}>
            Home
          </button>
          <div className="mac-browser__bookmarks">
            <button
              type="button"
              className="mac-browser__button"
              onClick={() => setBookmarksOpen((v) => !v)}
              aria-expanded={bookmarksOpen}
            >
              ★ Bookmarks ▾
            </button>
            {bookmarksOpen && (
              <div className="mac-browser__bookmarks-menu" role="menu">
                {BOOKMARKS.map((b) => (
                  <button
                    key={b.url}
                    type="button"
                    className="mac-browser__bookmark-item"
                    onClick={() => {
                      setBookmarksOpen(false);
                      navigateTo(b.url);
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <form
          className="mac-browser__address-form"
          onSubmit={(e) => {
            e.preventDefault();
            navigateTo(addressInput);
          }}
        >
          <span className="mac-browser__lock" aria-hidden>
            {isPong ? "◼" : isHttps ? "🔒" : "🔓"}
          </span>
          <input
            id="mac-browser-address"
            className="mac-browser__address-input"
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              if (Math.random() < 0.5) playMacTypeTick();
            }}
            spellCheck={false}
          />
          <button type="submit" className="mac-browser__button">
            Go
          </button>
        </form>
        <div className="mac-browser__presets">
          {BROWSER_PRESETS.map((url) => (
            <button key={url} type="button" className="mac-browser__preset" onClick={() => navigateTo(url)}>
              {originLabel(url)}
            </button>
          ))}
        </div>
      </header>
      <div className="mac-browser__viewport">
        {dialing && (
          <div className="mac-browser__modem" aria-hidden>
            <div className="mac-browser__modem-top">Dialing esnupi.net …</div>
            <div className="mac-browser__modem-bar">
              <div className="mac-browser__modem-bar-fill" />
            </div>
            <div className="mac-browser__modem-bottom">connecting at 28.8 kbps</div>
          </div>
        )}
        {isPong ? (
          <PongGame />
        ) : (
          <iframe
            key={currentUrl}
            src={currentUrl}
            title="Old School Browser"
            className="mac-browser__frame"
            onLoad={() => {
              setIsLoading(false);
              setProgress(100);
            }}
            referrerPolicy="no-referrer"
            sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts"
          />
        )}
      </div>
      <footer className="mac-browser__status">
        <div className="mac-browser__progress" aria-hidden>
          <div className="mac-browser__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>{isLoading ? "Connecting…" : "Done."}</span>
        <span>{originLabel(currentUrl)}</span>
      </footer>
    </section>
  );
}

/**
 * Minimal single-player Pong. Uses requestAnimationFrame; controls are mouse
 * Y-axis within the playfield.
 */
function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    ballX: 220,
    ballY: 120,
    vx: 3,
    vy: 2,
    playerY: 90,
    aiY: 90,
    playerScore: 0,
    aiScore: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const paddleW = 6;
    const paddleH = 48;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.playerY = Math.max(0, Math.min(H - paddleH, e.clientY - rect.top - paddleH / 2));
    };
    canvas.addEventListener("mousemove", onMove);

    let raf = 0;
    const tick = () => {
      const s = stateRef.current;
      s.ballX += s.vx;
      s.ballY += s.vy;
      if (s.ballY < 4 || s.ballY > H - 4) s.vy *= -1;
      // player paddle at x=10
      if (s.ballX < 16 && s.ballY >= s.playerY && s.ballY <= s.playerY + paddleH) {
        s.vx = Math.abs(s.vx) + 0.15;
        s.vy += (s.ballY - (s.playerY + paddleH / 2)) * 0.05;
        playPongBeep(520);
      }
      // ai paddle at x=W-16
      if (s.ballX > W - 20 && s.ballY >= s.aiY && s.ballY <= s.aiY + paddleH) {
        s.vx = -Math.abs(s.vx) - 0.15;
        s.vy += (s.ballY - (s.aiY + paddleH / 2)) * 0.05;
        playPongBeep(720);
      }
      if (s.ballX < -10) {
        s.aiScore += 1;
        s.ballX = W / 2;
        s.ballY = H / 2;
        s.vx = 3;
        s.vy = 2;
      }
      if (s.ballX > W + 10) {
        s.playerScore += 1;
        s.ballX = W / 2;
        s.ballY = H / 2;
        s.vx = -3;
        s.vy = 2;
      }
      // AI tracks ball with slight lag
      const target = s.ballY - paddleH / 2;
      s.aiY += Math.max(-2.8, Math.min(2.8, target - s.aiY));

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.fillRect(10, s.playerY, paddleW, paddleH);
      ctx.fillRect(W - 16, s.aiY, paddleW, paddleH);
      ctx.fillRect(s.ballX, s.ballY, 6, 6);
      for (let y = 4; y < H; y += 12) ctx.fillRect(W / 2 - 1, y, 2, 6);
      ctx.font = "18px VT323, monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(s.playerScore), W / 2 - 30, 22);
      ctx.fillText(String(s.aiScore), W / 2 + 30, 22);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="mac-browser__pong">
      <canvas ref={canvasRef} width={500} height={260} />
      <p>move your mouse up and down to play. first to 5 wins. there is no reward.</p>
    </div>
  );
}
