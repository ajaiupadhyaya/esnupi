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

export function MusicPlayerPanel({ library }: { library: MusicTrack[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.78);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "one" | "all">("off");
  const [durations, setDurations] = useState<Record<string, number>>({});

  const hasTracks = library.length > 0;
  const currentTrack = hasTracks ? library[Math.min(trackIndex, library.length - 1)] : null;

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.src;
    setCurrentTime(0);
    setDuration(0);
    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack, isPlaying]);

  const hookupAnalyser = useCallback(() => {
    if (analyserRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx: typeof AudioContext = (window as any).AudioContext ?? (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      audioCtxRef.current = ctx;
    } catch {
      /* ignore — can only hook up once per element */
    }
  }, []);

  // Waveform visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const analyser = analyserRef.current;
      const { width, height } = canvas;
      ctx.fillStyle = "#0b1110";
      ctx.fillRect(0, 0, width, height);
      if (analyser && isPlaying) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const barWidth = (width / data.length) * 1.4;
        for (let i = 0; i < data.length; i += 1) {
          const v = data[i]! / 255;
          const bar = v * (height - 4);
          ctx.fillStyle = `rgba(154, 248, 143, ${0.35 + v * 0.5})`;
          ctx.fillRect(i * barWidth, height - bar - 2, Math.max(1, barWidth - 1), bar);
        }
      } else {
        // idle scan line
        const t = Date.now() / 400;
        ctx.strokeStyle = "rgba(154, 248, 143, 0.4)";
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let x = 0; x < width; x += 1) {
          const y = height / 2 + Math.sin(x * 0.06 + t) * 3;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    hookupAnalyser();
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
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

  return (
    <section className="mac-music-player">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <header className="mac-music-player__header">
        <h3>Classic Music Player</h3>
        <p>Drop tracks into <code>src/music</code> and restart dev/build.</p>
      </header>

      {!hasTracks ? (
        <p className="mac-music-player__empty">
          No songs found. Add files to <code>src/music</code> (mp3, wav, ogg, m4a, flac, aac).
        </p>
      ) : (
        <>
          <div className="mac-music-player__visualizer-wrap">
            <canvas ref={canvasRef} width={560} height={62} className="mac-music-player__visualizer" />
            <div className="mac-music-player__marquee-wrap" aria-live="polite">
              <div
                className="mac-music-player__marquee"
                style={currentTrack && currentTrack.title.length > 30 ? undefined : { animation: "none" }}
              >
                {currentTrack?.title ?? "—"}
              </div>
            </div>
          </div>

          <article className="mac-music-player__deck">
            <p className="mac-music-player__now">Now Playing</p>
            <p className="mac-music-player__time">
              {formatTrackTime(currentTime)} / {formatTrackTime(duration)}
            </p>
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
            <div className="mac-music-player__controls">
              <button type="button" className="mac-music-player__button" onClick={() => advance(-1)} title="Previous">
                ◀◀
              </button>
              <button type="button" className="mac-music-player__button" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? "❚❚ Pause" : "▶ Play"}
              </button>
              <button type="button" className="mac-music-player__button" onClick={() => advance(1)} title="Next">
                ▶▶
              </button>
              <button
                type="button"
                className={cn("mac-music-player__button", shuffle && "mac-music-player__button--on")}
                onClick={() => setShuffle((s) => !s)}
                title="Shuffle"
              >
                ⇄ Shuffle
              </button>
              <button
                type="button"
                className={cn("mac-music-player__button", repeat !== "off" && "mac-music-player__button--on")}
                onClick={() => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"))}
                title={`Repeat: ${repeat}`}
              >
                {repeat === "one" ? "↻1" : "↻ Repeat"}
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

          <article className="mac-music-player__playlist" aria-label="Playlist">
            <header className="mac-music-player__playlist-header">
              <h4>Playlist</h4>
              <span>{library.length} track{library.length === 1 ? "" : "s"} · {formatTrackTime(totalPlaylist)}</span>
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
                    <span>{String(idx + 1).padStart(2, "0")} — {track.title}</span>
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
