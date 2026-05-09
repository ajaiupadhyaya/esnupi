import { useCallback, useEffect, useRef, useState } from "react";
import { playCameraShutter, playMacTypeTick } from "@/lib/retroMacSounds";

type Filter = "normal" | "dithered" | "thermal" | "glitch" | "posterize" | "chromatic";

const FILTER_LABELS: Record<Filter, string> = {
  normal: "Normal",
  dithered: "Dithered",
  thermal: "Thermal",
  glitch: "Glitch",
  posterize: "Posterize",
  chromatic: "Chromatic",
};

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function applyFilter(ctx: CanvasRenderingContext2D, filter: Filter, w: number, h: number, src: HTMLVideoElement | HTMLCanvasElement) {
  ctx.save();
  // mirror so the user sees themselves naturally
  ctx.setTransform(-1, 0, 0, 1, w, 0);
  ctx.drawImage(src, 0, 0, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (filter === "chromatic") {
    // draw R/G/B offsets by redrawing the video with channel mask
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.setTransform(-1, 0, 0, 1, w, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(src, -2, 0, w, h);
    ctx.restore();
    const img1 = ctx.getImageData(0, 0, w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.setTransform(-1, 0, 0, 1, w, 0);
    ctx.drawImage(src, 2, 0, w, h);
    ctx.restore();
    const img2 = ctx.getImageData(0, 0, w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.setTransform(-1, 0, 0, 1, w, 0);
    ctx.drawImage(src, 0, 0, w, h);
    ctx.restore();
    const base = ctx.getImageData(0, 0, w, h);
    const out = ctx.createImageData(w, h);
    for (let i = 0; i < out.data.length; i += 4) {
      out.data[i] = img1.data[i]!;
      out.data[i + 1] = base.data[i + 1]!;
      out.data[i + 2] = img2.data[i + 2]!;
      out.data[i + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    ctx.restore();
    return;
  }

  const frame = ctx.getImageData(0, 0, w, h);
  const p = frame.data;

  if (filter === "dithered") {
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = 4 * (y * w + x);
        const lum = 0.299 * p[i]! + 0.587 * p[i + 1]! + 0.114 * p[i + 2]!;
        const threshold = (BAYER[y % 4]![x % 4]! / 16) * 255;
        const v = lum > threshold ? 240 : 24;
        p[i] = v;
        p[i + 1] = v;
        p[i + 2] = v;
      }
    }
  } else if (filter === "thermal") {
    for (let i = 0; i < p.length; i += 4) {
      const lum = 0.299 * p[i]! + 0.587 * p[i + 1]! + 0.114 * p[i + 2]!;
      const t = lum / 255;
      const r = Math.min(255, 120 + t * 200);
      const g = Math.min(255, t * 120);
      const b = Math.min(255, (1 - t) * 160);
      p[i] = r;
      p[i + 1] = g;
      p[i + 2] = b;
    }
  } else if (filter === "posterize") {
    for (let i = 0; i < p.length; i += 4) {
      const lum = 0.299 * p[i]! + 0.587 * p[i + 1]! + 0.114 * p[i + 2]!;
      const level = Math.round((lum / 255) * 5) * (255 / 5);
      p[i] = level * 0.95;
      p[i + 1] = level * 0.97;
      p[i + 2] = level;
    }
  } else if (filter === "glitch") {
    // horizontal slice displacement
    const slice = ctx.getImageData(0, 0, w, h);
    ctx.putImageData(slice, 0, 0);
    for (let y = 0; y < h; y += 6 + Math.floor(Math.random() * 6)) {
      const band = 3 + Math.floor(Math.random() * 9);
      const dx = (Math.random() - 0.5) * 24;
      const sub = ctx.getImageData(0, y, w, band);
      ctx.putImageData(sub, dx, y);
    }
    // scanlines
    const after = ctx.getImageData(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      const offs = 4 * y * w;
      for (let i = offs; i < offs + 4 * w; i += 4) {
        after.data[i] = Math.max(0, after.data[i]! - 20);
        after.data[i + 1] = Math.max(0, after.data[i + 1]! - 20);
        after.data[i + 2] = Math.max(0, after.data[i + 2]! - 20);
      }
    }
    ctx.putImageData(after, 0, 0);
    return;
  }
  ctx.putImageData(frame, 0, 0);
}

export function PhotoboothPanel({
  onCapture,
  onOpenPhotobook,
}: {
  onCapture: (src: string) => void;
  onOpenPhotobook: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const shotCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [filter, setFilter] = useState<Filter>("posterize");
  const [countdown, setCountdown] = useState(0);
  const [stripMode, setStripMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastShot, setLastShot] = useState<string | null>(null);
  const [developing, setDeveloping] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 18, max: 24 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play();
      }
      setCameraReady(true);
    } catch {
      setErrorMsg("Camera access blocked. Allow camera permission and reload.");
      setCameraReady(false);
    }
  }, []);

  // live preview loop — apply filter in real time to the preview canvas
  useEffect(() => {
    const v = videoRef.current;
    const c = liveCanvasRef.current;
    if (!v || !c || !cameraReady) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = 480;
    const H = 360;
    c.width = W;
    c.height = H;
    let raf = 0;
    const tick = () => {
      if (v.readyState >= 2) {
        applyFilter(ctx, filter, W, H, v);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cameraReady, filter]);

  const captureOne = useCallback((): string | null => {
    const live = liveCanvasRef.current;
    if (!live) return null;
    playCameraShutter();
    setDeveloping(true);
    window.setTimeout(() => setDeveloping(false), 2000);
    return live.toDataURL("image/jpeg", 0.72);
  }, []);

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (countdown <= 0) return;
    playMacTypeTick();
    const id = window.setTimeout(() => {
      if (countdown === 1) {
        const shot = captureOne();
        if (shot) {
          setLastShot(shot);
          void onCapture(shot);
        }
        setCountdown(0);
        return;
      }
      setCountdown((x) => x - 1);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [captureOne, countdown, onCapture]);

  const shootStrip = useCallback(async () => {
    const shots: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      // 1.5s between shots; simple wait without progressive countdown
      await new Promise((r) => setTimeout(r, 1500));
      const shot = captureOne();
      if (shot) shots.push(shot);
    }
    const strip = shotCanvasRef.current;
    if (!strip) return;
    const sw = 240;
    const sh = 180;
    const border = 14;
    strip.width = sw + border * 2;
    strip.height = sh * 4 + border * 5;
    const ctx = strip.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, strip.width, strip.height);
    let cursor = border;
    for (const shot of shots) {
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, border, cursor, sw, sh);
          resolve();
        };
        img.src = shot;
      });
      cursor += sh + border;
    }
    const composite = strip.toDataURL("image/jpeg", 0.75);
    setLastShot(composite);
    void onCapture(composite);
  }, [captureOne, onCapture]);

  return (
    <section className="mac-photobooth">
      <header className="mac-photobooth__header">
        <p>Choose a filter, pose, and contribute to the museum.</p>
      </header>

      <div className="mac-photobooth__filters" role="tablist">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            className={`mac-photobooth__filter ${filter === f ? "mac-photobooth__filter--on" : ""}`}
            onClick={() => setFilter(f)}
          >
            <span className="mac-photobooth__filter-pip" aria-hidden />
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="mac-photobooth__screen-frame">
        <div className="mac-photobooth__screen">
          <video ref={videoRef} className="mac-photobooth__video-hidden" playsInline muted />
          <canvas ref={liveCanvasRef} className="mac-photobooth__live-canvas" />
          {countdown > 0 ? <div className="mac-photobooth__countdown">{countdown}</div> : null}
          {!cameraReady ? <div className="mac-photobooth__overlay">Camera is starting…</div> : null}
          {developing ? <div className="mac-photobooth__developing" aria-hidden /> : null}
        </div>
      </div>
      <canvas ref={shotCanvasRef} className="hidden" />

      {errorMsg ? <p className="mac-photobooth__error">{errorMsg}</p> : null}
      <div className="mac-photobooth__controls">
        <button
          type="button"
          className="mac-photobooth__button"
          disabled={!cameraReady || countdown > 0}
          onClick={() => setCountdown(3)}
        >
          {countdown > 0 ? "Capturing..." : "Take picture (3s)"}
        </button>
        <label className="mac-photobooth__strip-toggle">
          <input
            type="checkbox"
            checked={stripMode}
            onChange={(e) => setStripMode(e.target.checked)}
          />
          Photo strip (4×)
        </label>
        <button
          type="button"
          className="mac-photobooth__button"
          disabled={!cameraReady || !stripMode || countdown > 0}
          onClick={() => {
            void shootStrip();
          }}
        >
          Run strip
        </button>
        <button type="button" className="mac-photobooth__button" onClick={onOpenPhotobook}>
          Open photobook
        </button>
      </div>
      {lastShot ? (
        <figure className="mac-photobooth__last-shot">
          <img src={lastShot} alt="Most recent capture" />
          <figcaption>Last captured portrait</figcaption>
        </figure>
      ) : null}
    </section>
  );
}
