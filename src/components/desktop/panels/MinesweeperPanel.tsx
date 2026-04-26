import { useCallback, useEffect, useMemo, useState } from "react";
import {
  playMinesCascade,
  playMinesExplosion,
  playMinesFlag,
  playMinesReveal,
  playMinesVictory,
} from "@/lib/retroMacSounds";
import { hydraStage } from "@/lib/hydraStage";

type Difficulty = "easy" | "medium" | "hard";
const CONFIG: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 12, cols: 14, mines: 24 },
  hard: { rows: 14, cols: 18, mines: 42 },
};

type Cell = {
  mine: boolean;
  adj: number;
  revealed: boolean;
  flagged: boolean;
};

function buildBoard(rows: number, cols: number, mines: number): Cell[][] {
  const board: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      adj: 0,
      revealed: false,
      flagged: false,
    })),
  );
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r]![c]!.mine) {
      board[r]![c]!.mine = true;
      placed += 1;
    }
  }
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (board[r]![c]!.mine) continue;
      let n = 0;
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (board[nr]![nc]!.mine) n += 1;
        }
      }
      board[r]![c]!.adj = n;
    }
  }
  return board;
}

function floodReveal(board: Cell[][], r: number, c: number) {
  const stack: Array<[number, number]> = [[r, c]];
  const rows = board.length;
  const cols = board[0]!.length;
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    const cell = board[cr]![cc]!;
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.adj > 0 || cell.mine) continue;
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        const nr = cr + dr;
        const nc = cc + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (dr === 0 && dc === 0) continue;
        stack.push([nr, nc]);
      }
    }
  }
}

// Authentic Windows 95 Minesweeper number palette.
const ADJ_COLORS = ["", "#0000ff", "#008000", "#ff0000", "#000080", "#800000", "#008080", "#000000", "#808080"];

export function MinesweeperPanel() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const cfg = CONFIG[difficulty];
  const [board, setBoard] = useState<Cell[][]>(() => buildBoard(cfg.rows, cfg.cols, cfg.mines));
  const [status, setStatus] = useState<"play" | "won" | "lost">("play");
  const [scared, setScared] = useState(false);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);

  const reset = useCallback((d: Difficulty = difficulty) => {
    const c = CONFIG[d];
    setBoard(buildBoard(c.rows, c.cols, c.mines));
    setStatus("play");
    setStartAt(null);
    setSeconds(0);
  }, [difficulty]);

  useEffect(() => {
    if (status !== "play" || !startAt) return;
    const id = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startAt) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [status, startAt]);

  const flagged = useMemo(() => board.flat().filter((c) => c.flagged).length, [board]);
  const remaining = Math.max(0, cfg.mines - flagged);

  const click = useCallback(
    (r: number, c: number) => {
      if (status !== "play") return;
      setBoard((prev) => {
        const next = prev.map((row) => row.map((cell) => ({ ...cell })));
        const cell = next[r]![c]!;
        if (cell.flagged || cell.revealed) return next;
        if (!startAt) setStartAt(Date.now());
        if (cell.mine) {
          cell.revealed = true;
          next.flat().forEach((x) => {
            if (x.mine) x.revealed = true;
          });
          setStatus("lost");
          playMinesExplosion();
          return next;
        }
        const prevRevealed = prev.flat().filter((x) => x.revealed).length;
        if (cell.adj === 0) floodReveal(next, r, c);
        else cell.revealed = true;
        const newlyRevealed = next.flat().filter((x) => x.revealed).length - prevRevealed;
        if (newlyRevealed > 2) playMinesCascade(newlyRevealed);
        else playMinesReveal(r + c);
        const unrevealedSafe = next.flat().filter((x) => !x.mine && !x.revealed).length;
        if (unrevealedSafe === 0) {
          setStatus("won");
          playMinesVictory();
          hydraStage.spinHue(2000);
        }
        return next;
      });
    },
    [status, startAt],
  );

  const flag = useCallback(
    (e: React.MouseEvent, r: number, c: number) => {
      e.preventDefault();
      if (status !== "play") return;
      setBoard((prev) => {
        const next = prev.map((row) => row.map((cell) => ({ ...cell })));
        const cell = next[r]![c]!;
        if (cell.revealed) return next;
        cell.flagged = !cell.flagged;
        if (cell.flagged) playMinesFlag();
        return next;
      });
    },
    [status],
  );

  const faceSymbol = status === "lost" ? "×_×" : status === "won" ? "B)" : scared ? ":O" : ":)";

  return (
    <section className="mac-mines">
      <div className="mac-mines__menu">
        <label>
          Game
          <select
            value={difficulty}
            onChange={(e) => {
              const d = e.target.value as Difficulty;
              setDifficulty(d);
              reset(d);
            }}
          >
            <option value="easy">Beginner</option>
            <option value="medium">Intermediate</option>
            <option value="hard">Expert</option>
          </select>
        </label>
      </div>
      <div className="mac-mines__hud">
        <div className="mac-mines__counter">{String(remaining).padStart(3, "0")}</div>
        <button
          type="button"
          className="mac-mines__face"
          onClick={() => reset()}
          aria-label="New game"
        >
          {faceSymbol}
        </button>
        <div className="mac-mines__counter">{String(seconds).padStart(3, "0")}</div>
      </div>
      <div
        className="mac-mines__grid"
        style={{
          gridTemplateColumns: `repeat(${cfg.cols}, 16px)`,
        }}
        onMouseDown={() => setScared(true)}
        onMouseUp={() => setScared(false)}
        onMouseLeave={() => setScared(false)}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;
            if (cell.revealed) {
              return (
                <div key={key} className={`mac-mines__cell mac-mines__cell--open ${cell.mine ? "mac-mines__cell--mine" : ""}`}>
                  {cell.mine ? "●" : cell.adj > 0 ? <span style={{ color: ADJ_COLORS[cell.adj] }}>{cell.adj}</span> : null}
                </div>
              );
            }
            return (
              <button
                key={key}
                type="button"
                className="mac-mines__cell"
                onClick={() => click(r, c)}
                onContextMenu={(e) => flag(e, r, c)}
                aria-label={`Cell ${r + 1},${c + 1}`}
              >
                {cell.flagged ? "⚑" : ""}
              </button>
            );
          }),
        )}
      </div>
      <p className="mac-mines__footnote">
        Right-click to flag. Double-click a number to auto-reveal… not yet implemented; that one is on you.
      </p>
    </section>
  );
}
