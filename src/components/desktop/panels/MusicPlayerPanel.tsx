import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type MusicTrack = { id: string; title: string; src: string };

function formatTrackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const BAR_COUNT = 56;
const FFT_SIZE = 512;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function MusicPlayerPanel({ library }: { library: MusicTrack[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerWrapRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const smoothFreqRef = useRef(new Float32Array(BAR_COUNT));
  const peakHoldRef = useRef(new Float32Array(BAR_COUNT));
  const idlePhaseRef = useRef(0);

  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.78);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "one" | "all">("off");
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [canvasCss, setCanvasCss] = useState({ w: 560, h: 132 });
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const hasTracks = library.length > 0;
  const currentTrack = hasTracks ? library[Math.min(trackIndex, library.length - 1)] : null;

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const el = visualizerWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.max(280, Math.floor(cr.width));
      const h = 132;
      setCanvasCss({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load durations for playlist (probe each track)
  useEffect(() => {
    if (!hasTracks) return;
    let cancelled = false;
    library.forEach((track) => {
      if (durations[track.id]) return;
      const a = new Audio();
      a.preload = "metadata";
      a.src = track.src;
      a.addEventListener("loadedmetadata", () => {
        if (cancelled) return;
        setDurations((prev) => ({ ...prev, [track.id]: a.duration || 0 }));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [library, durations, hasTracks]);

  // Load new source only when the track identity changes — not when pause toggles.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.src;
    setCurrentTime(0);
    setDuration(0);
    if (isPlayingRef.current) {
      void audio.play().catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only swap <audio> src when playlist selection changes
  }, [currentTrack?.id]);

  const hookupAnalyser = useCallback(async () => {
    if (analyserRef.current) {
      await audioCtxRef.current?.resume();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx: typeof AudioContext = (window as any).AudioContext ?? (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      audioCtxRef.current = ctx;
      await ctx.resume();
    } catch {
      /* ignore — can only hook up once per element */
    }
  }, []);

  // iTunes-style visualizer: mirrored spectrum + scope line + peak dots
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const freqData = new Uint8Array(FFT_SIZE / 2);
    const timeData = new Uint8Array(FFT_SIZE);

    const draw = () => {
      const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      const cssW = canvasCss.w;
      const cssH = canvasCss.h;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const width = cssW;
      const height = cssH;
      const midY = height * 0.52;
      const analyser = analyserRef.current;
      const smooth = smoothFreqRef.current;
      const peaks = peakHoldRef.current;

      // Deep LCD backplate — Mac OS 8 CD player / late-90s stereo
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#0a1628");
      bg.addColorStop(0.45, "#060d18");
      bg.addColorStop(1, "#020508");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Subtle horizontal scanlines
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      for (let y = 0; y < height; y += 3) {
        ctx.fillRect(0, y, width, 1);
      }

      const playing = Boolean(analyser && isPlaying);

      if (playing && analyser) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        const usable = Math.floor(freqData.length * 0.88);
        const step = usable / BAR_COUNT;

        let bassSum = 0;
        for (let i = 0; i < BAR_COUNT; i += 1) {
          let acc = 0;
          const base = Math.floor(i * step);
          const span = Math.max(1, Math.ceil(step));
          for (let k = 0; k < span; k += 1) {
            acc += freqData[base + k] ?? 0;
          }
          const raw = acc / span / 255;
          bassSum += i < 10 ? raw : 0;
          smooth[i] = lerp(smooth[i], raw, 0.42);
          if (smooth[i] > peaks[i]) peaks[i] = smooth[i];
          else peaks[i] = Math.max(0, peaks[i] - 0.012);
        }

        const bassPulse = Math.min(1, (bassSum / 10) * 1.8);
        const glow = ctx.createRadialGradient(
          width * 0.5,
          midY,
          0,
          width * 0.5,
          midY,
          width * 0.55,
        );
        glow.addColorStop(0, `rgba(0, 180, 255, ${0.08 + bassPulse * 0.12})`);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        const maxBarH = midY - 10;
        const gap = 1;
        const clusterW = width * 0.92;
        const innerBarW = (clusterW - gap * (BAR_COUNT - 1)) / BAR_COUNT;

        ctx.save();
        ctx.translate(width / 2, midY);

        for (let i = 0; i < BAR_COUNT; i += 1) {
          const v = smooth[i]!;
          const h = Math.max(2, v * maxBarH * 1.15);
          const pk = peaks[i]!;
          const hue = 185 + v * 55 + (i / BAR_COUNT) * 25;
          const sat = 70 + v * 28;
          const lit = 42 + v * 38;
          ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${0.55 + v * 0.45})`;

          const x = -clusterW / 2 + i * (innerBarW + gap);

          ctx.fillRect(x, -h, innerBarW, h);
          ctx.fillRect(x, 0, innerBarW, h);

          // Peak lamp
          const pkH = pk * maxBarH * 1.15;
          ctx.fillStyle = `hsla(${hue + 15}, 85%, 82%, ${0.6 + pk * 0.4})`;
          ctx.fillRect(x, -pkH - 3, innerBarW, 2);
          ctx.fillRect(x, pkH + 1, innerBarW, 2);
        }

        ctx.restore();

        // Oscilloscope trace (time domain)
        ctx.lineJoin = ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(180, 245, 255, 0.92)";
        ctx.lineWidth = 1.25;
        ctx.shadowColor = "rgba(0, 220, 255, 0.55)";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const slice = timeData.length;
        for (let x = 0; x < width; x += 1) {
          const ti = Math.floor((x / width) * slice);
          const v = (timeData[ti]! - 128) / 128;
          const y = midY + v * (height * 0.38);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Idle — slow phosphor crawl
        idlePhaseRef.current += 0.018;
        const t = idlePhaseRef.current;
        ctx.strokeStyle = "rgba(80, 200, 160, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
          const y =
            midY +
            Math.sin(x * 0.04 + t * 3) * 6 +
            Math.sin(x * 0.11 - t * 2) * 4 +
            Math.sin(x * 0.025 + t) * 8;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = "rgba(154, 248, 143, 0.15)";
        ctx.font = '11px "IBM Plex Mono", monospace';
        ctx.fillText("♪", width - 24, 18);
      }

      // Bezel shine (inset glass)
      const edge = ctx.createLinearGradient(0, 0, 0, height);
      edge.addColorStop(0, "rgba(255,255,255,0.06)");
      edge.addColorStop(0.08, "rgba(255,255,255,0)");
      edge.addColorStop(0.92, "rgba(255,255,255,0)");
      edge.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, width, height);

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasCss.w, canvasCss.h, isPlaying]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    await hookupAnalyser();
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    void audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [currentTrack, isPlaying, hookupAnalyser]);

  const advance = useCallback(
    (delta: number) => {
      if (!hasTracks) return;
      if (shuffle) {
        let next = trackIndex;
        while (library.length > 1 && next === trackIndex) {
          next = Math.floor(Math.random() * library.length);
        }
        setTrackIndex(next);
        setIsPlaying(true);
        return;
      }
      setTrackIndex((idx) => {
        const next = (idx + delta + library.length) % library.length;
        return next;
      });
      setIsPlaying(true);
    },
    [hasTracks, library.length, shuffle, trackIndex],
  );

  const onEnded = useCallback(() => {
    if (repeat === "one") {
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = 0;
      void a.play();
      return;
    }
    if (repeat === "all" || trackIndex < library.length - 1) {
      advance(1);
      return;
    }
    setIsPlaying(false);
  }, [advance, library.length, repeat, trackIndex]);

  const totalPlaylist = useMemo(() => library.reduce((acc, t) => acc + (durations[t.id] ?? 0), 0), [durations, library]);

  const repeatLabel =
    repeat === "off" ? "Repeat off" : repeat === "all" ? "Repeat all" : "Repeat one";

  return (
    <section className="mac-music-player mac-surface">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Striped title strip — reads like Mac OS 8 installer / Apple CD Audio */}
      <header className="mac-music-player__titlebar" aria-hidden>
        <span className="mac-music-player__stripe" />
      </header>

      <div className="mac-music-player__brand">
        <div className="mac-music-player__jewel" aria-hidden>
          <span className="mac-music-player__jewel-disc" />
        </div>
        <div>
          <h3 className="mac-music-player__app-name">iTunes</h3>
          <p className="mac-music-player__tagline">Music — System 7.5.3 or later</p>
        </div>
      </div>

      {!hasTracks ? (
        <p className="mac-music-player__empty">
          No songs found. Add files to <code>src/music</code> (mp3, wav, ogg, m4a, flac, aac).
        </p>
      ) : (
        <>
          <div className="mac-music-player__lcd-assembly">
            <div ref={visualizerWrapRef} className="mac-music-player__visualizer-wrap">
              <canvas
                ref={canvasRef}
                width={canvasCss.w}
                height={canvasCss.h}
                className="mac-music-player__visualizer"
                aria-label="Audio visualizer"
              />
            </div>
            <div className="mac-music-player__marquee-wrap" aria-live="polite">
              <div
                className="mac-music-player__marquee"
                style={currentTrack && currentTrack.title.length > 34 ? undefined : { animation: "none" }}
              >
                {currentTrack?.title ?? "—"}
              </div>
            </div>
          </div>

          <article className="mac-music-player__deck">
            <div className="mac-music-player__now-row">
              <p className="mac-music-player__now">
                <span className="mac-music-player__now-label">Now Playing</span>
                <span className="mac-music-player__now-title">{currentTrack?.title ?? "—"}</span>
              </p>
              <p className="mac-music-player__time" aria-live="polite">
                {formatTrackTime(currentTime)} / {formatTrackTime(duration)}
              </p>
            </div>

            <label className="mac-music-player__seek-label">
              Position
              <input
                type="range"
                className="mac-music-player__slider"
                min={0}
                max={Math.max(duration, 1)}
                step={0.1}
                value={Math.min(currentTime, duration || 0)}
                onChange={(e) => {
                  const target = Number(e.target.value);
                  if (audioRef.current) audioRef.current.currentTime = target;
                  setCurrentTime(target);
                }}
                aria-label="Seek position"
              />
            </label>

            <div className="mac-music-player__controls">
              <button
                type="button"
                className="mac-music-player__btn-icon mac-music-player__btn-icon--glyph"
                onClick={() => advance(-1)}
                title="Previous track"
              >
                ◀◀
              </button>
              <button
                type="button"
                className={cn("mac-music-player__btn-play", isPlaying && "mac-music-player__btn-play--pause")}
                onClick={togglePlay}
                title={isPlaying ? "Pause" : "Play"}
              >
                <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
              </button>
              <button
                type="button"
                className="mac-music-player__btn-icon mac-music-player__btn-icon--glyph"
                onClick={() => advance(1)}
                title="Next track"
              >
                ▶▶
              </button>
              <button
                type="button"
                className={cn("mac-music-player__button", shuffle && "mac-music-player__button--on")}
                onClick={() => setShuffle((s) => !s)}
                title="Shuffle"
              >
                Shuffle
              </button>
              <button
                type="button"
                className={cn("mac-music-player__button", repeat !== "off" && "mac-music-player__button--on")}
                onClick={() => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"))}
                title={repeatLabel}
              >
                {repeat === "one" ? "One" : repeat === "all" ? "All" : "Repeat"}
              </button>
            </div>

            <label className="mac-music-player__volume">
              Volume
              <input
                type="range"
                className="mac-music-player__slider"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume"
              />
            </label>
          </article>

          <article className="mac-music-player__playlist" aria-label="Library">
            <header className="mac-music-player__playlist-header">
              <h4>Song List</h4>
              <span>
                {library.length} song{library.length === 1 ? "" : "s"} · {formatTrackTime(totalPlaylist)}
              </span>
            </header>
            <ul>
              {library.map((track, idx) => (
                <li key={track.id}>
                  <button
                    type="button"
                    className={cn("mac-music-player__track", idx === trackIndex && "mac-music-player__track--active")}
                    onClick={() => {
                      setTrackIndex(idx);
                      setIsPlaying(true);
                    }}
                  >
                    <span className="mac-music-player__track-main">
                      <span className="mac-music-player__note" aria-hidden>
                        ♫
                      </span>
                      <span>
                        {String(idx + 1).padStart(2, "0")} — {track.title}
                      </span>
                    </span>
                    <span className="mac-music-player__track-dur">{formatTrackTime(durations[track.id] ?? 0)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </article>
        </>
      )}
    </section>
  );
}
