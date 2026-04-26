// Port of macbackground3.md (dominoes, #WCCChallenge «Dominoes») — p5 instance mode.
import p5 from "p5";

type DState = {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  maxTries: number;
  animSpeed: number;
  animSpread: number;
  mouseRadius: number;
  maxScale: number;
  dotRepelRadius: number;
  maxDotDisplacement: number;
  square: number;
  offsetX: number;
  offsetY: number;
  palette: string[];
  grid: (null | { value: number })[][];
  dominoes: Domino[];
  chainEnds: {
    head: { r: number; c: number; value: number; colorIndex: number };
    tail: { r: number; c: number; value: number; colorIndex: number };
  } | null;
  chains: Domino[][];
  chainAnim: { phase: number; direction: number }[] | null;
};

type Domino = {
  r0: number;
  c0: number;
  r1: number;
  c1: number;
  v0: number;
  v1: number;
  end: "head" | "tail";
  color?: string;
  chainId?: number;
  chainIndex?: number;
};

const PALETTES = [
  ["#fb6107", "#f3de2c", "#7cb518", "#5c8001", "#fbb02d"],
  ["#f72585", "#7209b7", "#b6f500", "#000000", "#ffffff"],
  ["#094074", "#3c6997", "#5adbff", "#ffdd4a", "#fe9000"],
  ["#05668d", "#028090", "#00a896", "#02c39a", "#f0f3bd"],
  ["#3c1642", "#086375", "#1dd3b0", "#affc41", "#b2ff9e"],
  ["#e5c679", "#000807", "#357266", "#ed6a5e", "#4ce0b3", "#cfa5b4", "#eae8ff", "#b0d7ff", "#61f2c2"],
  ["#3d2d1c", "#30633d", "#123c69", "#1d58ab", "#72c0ed", "#fdefc0", "#ffdf7c", "#feb640", "#d97b38", "#a46379"],
  ["#080f0f", "#2c4a73", "#426c85", "#4e6baa", "#5c59c9", "#c33b1e", "#f07d23", "#ffcc33", "#fff1a1", "#f1f5f8"],
  [
    "#001219",
    "#005f73",
    "#0a9396",
    "#94d2bd",
    "#e9d8a6",
    "#ee9b00",
    "#ca6702",
    "#bb3e03",
    "#ae2012",
    "#9b2226",
  ],
  ["#fffcf2", "#ccc5b9", "#403d39", "#252422", "#eb5e28"],
  ["#faeee0", "#fec802", "#f69f40", "#bf5f07", "#0dc9c5", "#18761a"],
  ["#0a122a", "#771918", "#3c5a14", "#ffbb33", "#a53e12"],
];

export function p5dominoesSketch(p: p5) {
  const d: DState = {
    cols: 0,
    rows: 0,
    cellW: 0,
    cellH: 0,
    maxTries: 1000,
    animSpeed: 0.015,
    animSpread: 0.4,
    mouseRadius: 120,
    maxScale: 1.5,
    dotRepelRadius: 100,
    maxDotDisplacement: 100,
    square: 0,
    offsetX: 0,
    offsetY: 0,
    palette: [],
    grid: [],
    dominoes: [],
    chainEnds: null,
    chains: [],
    chainAnim: null,
  };

  function inBounds(r: number, c: number) {
    return r >= 0 && r < d.rows && c >= 0 && c < d.cols;
  }

  function isEmpty(r: number, c: number) {
    return d.grid[r][c] === null;
  }

  function placeDominoCells(dom: Domino) {
    d.grid[dom.r0][dom.c0] = { value: dom.v0 };
    d.grid[dom.r1][dom.c1] = { value: dom.v1 };
  }

  function cellTouchesDomino(cr: number, cc: number, dom: Domino) {
    const adj = (r1: number, c1: number, r2: number, c2: number) => p.abs(r1 - r2) + p.abs(c1 - c2) === 1;
    return adj(cr, cc, dom.r0, dom.c0) || adj(cr, cc, dom.r1, dom.c1);
  }

  function getEmptyNeighbors(r: number, c: number) {
    const out: { nr: number; nc: number }[] = [];
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const;
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && isEmpty(nr, nc)) out.push({ nr, nc });
    }
    return out;
  }

  function findDominoAt(
    r: number,
    c: number,
    mustMatch: number,
    side: "head" | "tail",
    lastDomino: Domino,
  ): Domino | null {
    const templates: Pick<Domino, "r0" | "c0" | "r1" | "c1" | "v0" | "v1" | "end">[] = [
      { r0: r, c0: c, r1: r, c1: c + 1, v0: mustMatch, v1: p.int(p.random(7)), end: "tail" },
      { r0: r, c0: c, r1: r, c1: c - 1, v0: mustMatch, v1: p.int(p.random(7)), end: "tail" },
      { r0: r, c0: c, r1: r + 1, c1: c, v0: mustMatch, v1: p.int(p.random(7)), end: "tail" },
      { r0: r, c0: c, r1: r - 1, c1: c, v0: mustMatch, v1: p.int(p.random(7)), end: "tail" },
    ];
    const order = p.shuffle([0, 1, 2, 3]);
    for (const idx of order) {
      const P = { ...templates[idx], chainId: 0, chainIndex: 0 } as Domino;
      if (
        inBounds(P.r0, P.c0) &&
        inBounds(P.r1, P.c1) &&
        isEmpty(P.r0, P.c0) &&
        isEmpty(P.r1, P.c1) &&
        !(
          cellTouchesDomino(P.r0, P.c0, lastDomino) && cellTouchesDomino(P.r1, P.c1, lastDomino)
        )
      ) {
        placeDominoCells(P);
        if (side === "head") {
          [P.r0, P.c0, P.r1, P.c1] = [P.r1, P.c1, P.r0, P.c0];
          [P.v0, P.v1] = [P.v1, P.v0];
          P.end = "head";
        }
        return P;
      }
    }
    return null;
  }

  function updateChainEnd(side: "head" | "tail", placement: Domino, colorIndex: number) {
    if (!d.chainEnds) return;
    const exposed =
      side === "tail"
        ? { r: placement.r1, c: placement.c1, value: placement.v1, colorIndex }
        : { r: placement.r0, c: placement.c0, value: placement.v0, colorIndex };
    d.chainEnds[side] = exposed;
  }

  function tryPlaceAtChainEnd(side: "head" | "tail", lastDomino: Domino): Domino | null {
    if (!d.chainEnds) return null;
    const { r, c, value, colorIndex } = d.chainEnds[side];
    const neighbors = p.shuffle([...getEmptyNeighbors(r, c)]);

    for (const { nr, nc } of neighbors) {
      const placement = findDominoAt(nr, nc, value, side, lastDomino);
      if (placement) {
        const nextIndex =
          side === "tail" ? (colorIndex + 1) % d.palette.length : (colorIndex - 1 + d.palette.length) % d.palette.length;
        placement.color = d.palette[nextIndex];
        updateChainEnd(side, placement, nextIndex);
        return placement;
      }
    }
    return null;
  }

  function placeRandomDomino(): Domino | null {
    const candidates: { r0: number; c0: number; r1: number; c1: number; horizontal: boolean }[] = [];
    for (let r = 0; r < d.rows; r++) {
      for (let c = 0; c < d.cols; c++) {
        if (isEmpty(r, c)) {
          if (c < d.cols - 1 && isEmpty(r, c + 1)) candidates.push({ r0: r, c0: c, r1: r, c1: c + 1, horizontal: true });
          if (r < d.rows - 1 && isEmpty(r + 1, c)) candidates.push({ r0: r, c0: c, r1: r + 1, c1: c, horizontal: false });
        }
      }
    }
    if (candidates.length === 0) return null;
    const pos = p.random(candidates) as (typeof candidates)[0];
    const v0 = p.int(p.random(7));
    const v1 = p.int(p.random(7));
    const D: Domino = { r0: pos.r0, c0: pos.c0, r1: pos.r1, c1: pos.c1, v0, v1, end: "tail" };
    placeDominoCells(D);
    return D;
  }

  function runPacking() {
    d.grid = Array(d.rows)
      .fill(null)
      .map(() => Array(d.cols).fill(null) as (null | { value: number })[]);
    d.dominoes = [];
    d.chains = [];
    d.chainEnds = null;

    let tries = 0;
    let lastPlaced: "head" | "tail" = "tail";
    let currentChainId = 0;
    let currentChainLength = 0;

    const first = placeRandomDomino();
    if (!first) return;
    d.dominoes.push(first);
    first.color = d.palette[0];
    first.chainId = 0;
    first.chainIndex = 0;
    d.chains[0] = [first];
    currentChainLength = 1;
    d.chainEnds = {
      head: { r: first.r0, c: first.c0, value: first.v0, colorIndex: 0 },
      tail: { r: first.r1, c: first.c1, value: first.v1, colorIndex: 0 },
    };
    lastPlaced = "tail";

    while (tries < d.maxTries) {
      const attachDomino =
        lastPlaced === "tail" ? d.chains[currentChainId][currentChainLength - 1] : d.chains[currentChainId][0];
      const placed = tryPlaceAtChainEnd(lastPlaced, attachDomino);
      if (placed) {
        d.dominoes.push(placed);
        placed.chainId = currentChainId;
        placed.chainIndex = currentChainLength;
        d.chains[currentChainId].push(placed);
        currentChainLength++;
        lastPlaced = placed.end;
        tries = 0;
      } else {
        const otherEnd = lastPlaced === "tail" ? "head" : "tail";
        const attachDominoOther = otherEnd === "tail" ? d.chains[currentChainId][currentChainLength - 1] : d.chains[currentChainId][0];
        const placedOther = tryPlaceAtChainEnd(otherEnd, attachDominoOther);
        if (placedOther) {
          d.dominoes.push(placedOther);
          placedOther.chainId = currentChainId;
          placedOther.chainIndex = currentChainLength;
          d.chains[currentChainId].push(placedOther);
          currentChainLength++;
          lastPlaced = placedOther.end;
          tries = 0;
        } else {
          const newPiece = placeRandomDomino();
          if (newPiece) {
            newPiece.color = d.palette[0];
            newPiece.chainId = currentChainId + 1;
            newPiece.chainIndex = 0;
            d.dominoes.push(newPiece);
            currentChainId++;
            currentChainLength = 1;
            d.chains[currentChainId] = [newPiece];
            d.chainEnds = {
              head: { r: newPiece.r0, c: newPiece.c0, value: newPiece.v0, colorIndex: 0 },
              tail: { r: newPiece.r1, c: newPiece.c1, value: newPiece.v1, colorIndex: 0 },
            };
            lastPlaced = "tail";
            tries = 0;
          } else {
            break;
          }
        }
      }
    }

    d.chainAnim = d.chains.map(() => ({ phase: 0, direction: 1 }));
  }

  function getChainScale(chainId: number, chainIndex: number) {
    const anim = d.chainAnim?.[chainId];
    if (!anim) return 1;
    const len = d.chains[chainId].length;
    if (len < 3) return 1;
    const dist = p.abs(anim.phase - chainIndex);
    const falloff = p.exp(-d.animSpread * dist * dist);
    return 1 + (d.maxScale - 1) * falloff;
  }

  function getMouseScale(cx: number, cy: number) {
    const mx = p.mouseX - d.offsetX;
    const my = p.mouseY - d.offsetY;
    const dx = mx - cx;
    const dy = my - cy;
    const dist = p.sqrt(dx * dx + dy * dy);
    if (dist >= d.mouseRadius) return 0;
    const t = 1 - dist / d.mouseRadius;
    return (d.maxScale - 1) * t * t;
  }

  function getDotRepelOffset(px: number, py: number) {
    const mx = p.mouseX - d.offsetX;
    const my = p.mouseY - d.offsetY;
    const dx = px - mx;
    const dy = py - my;
    const dist = p.sqrt(dx * dx + dy * dy);
    if (dist >= d.dotRepelRadius || dist < 1) return { x: 0, y: 0 };
    const n = p.noise(px * 0.02, py * 0.02, p.frameCount * 0.01);
    const mult = 0.2 + n * 0.8;
    const t = 1 - dist / d.dotRepelRadius;
    const strength = d.maxDotDisplacement * t * t * mult;
    const len = dist;
    return { x: (dx / len) * strength, y: (dy / len) * strength };
  }

  function drawDot(cx: number, cy: number, value: number, rw: number, rh: number, bgColor: string) {
    const h = (bgColor || "#fff").replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    p.fill(luminance < 128 ? 255 : 0);
    p.noStroke();
    const positions: [number, number][][] = [
      [],
      [[0, 0]],
      [
        [-1, -1],
        [1, 1],
      ],
      [
        [-1, -1],
        [0, 0],
        [1, 1],
      ],
      [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ],
      [
        [-1, -1],
        [1, -1],
        [0, 0],
        [-1, 1],
        [1, 1],
      ],
      [
        [-1, -1],
        [1, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [1, 1],
      ],
    ];
    const dots = positions[value] || [];
    for (const [dx, dy] of dots) {
      const px = cx + dx * rw * 0.5;
      const py = cy + dy * rh * 0.5;
      const off = getDotRepelOffset(px, py);
      p.circle(px + off.x, py + off.y, p.min(rw, rh) * 0.5);
    }
  }

  p.setup = () => {
    const w = p.windowWidth;
    const h = p.windowHeight;
    p.createCanvas(w, h);
    p.pixelDensity(1);
    d.square = p.min(w, h);
    const cellSize = p.int(p.random(30, 50));
    d.cols = p.int(d.square / cellSize);
    d.rows = p.int(d.square / cellSize);
    d.cellW = d.square / d.cols;
    d.cellH = d.square / d.rows;
    d.offsetX = (w - d.square) / 2;
    d.offsetY = (h - d.square) / 2;
    d.palette = p.random([...PALETTES]) as string[];
    if (p.random() < 0.3) d.palette = p.shuffle([...d.palette]) as string[];
    d.maxScale = p.random(1.1, 1.8);
    d.animSpeed = p.random(0.01, 0.08);
    d.animSpread = p.random(0.2, 0.6);
    d.maxDotDisplacement = p.random(40, 200);
    d.mouseRadius = p.random(100, 200);
    d.dotRepelRadius = p.random(100, 200);
    runPacking();
  };

  p.draw = () => {
    p.background(240);
    p.push();
    p.translate(d.offsetX, d.offsetY);

    if (d.chainAnim) {
      for (let i = 0; i < d.chainAnim.length; i++) {
        const anim = d.chainAnim[i];
        const len = d.chains[i].length;
        anim.phase += anim.direction * d.animSpeed;
        if (anim.phase >= len - 0.5) {
          anim.phase = len - 0.5;
          anim.direction = -1;
        } else if (anim.phase <= 0) {
          anim.phase = 0;
          anim.direction = 1;
        }
      }
    }

    for (const dom of d.dominoes) {
      const horizontal = dom.r0 === dom.r1;
      const leftCol = horizontal ? p.min(dom.c0, dom.c1) : dom.c0;
      const topRow = horizontal ? dom.r0 : p.min(dom.r0, dom.r1);
      const cx = (leftCol + (horizontal ? 1 : 0.5)) * d.cellW;
      const cy = (topRow + (horizontal ? 0.5 : 1)) * d.cellH;
      const chainScale = getChainScale(dom.chainId ?? 0, dom.chainIndex ?? 0);
      const mouseScale = getMouseScale(cx, cy);
      const totalScale = p.min(d.maxScale, 1 + (chainScale - 1) + mouseScale);

      if (totalScale > 1.001) {
        p.push();
        p.translate(cx, cy);
        p.scale(totalScale);
        p.translate(-cx, -cy);
      }

      p.fill(dom.color != null ? p.color(dom.color) : p.color(240, 240, 240));
      p.stroke(0);
      p.strokeWeight(1);

      if (horizontal) {
        const lc = p.min(dom.c0, dom.c1);
        const xLeft = lc * d.cellW;
        p.noStroke();
        p.rect(xLeft, dom.r0 * d.cellH, d.cellW * 2, d.cellH, d.cellW / 6);
        p.stroke(0);
        const leftVal = dom.c0 < dom.c1 ? dom.v0 : dom.v1;
        const rightVal = dom.c0 < dom.c1 ? dom.v1 : dom.v0;
        drawDot(
          xLeft + d.cellW * 0.5,
          dom.r0 * d.cellH + d.cellH / 2,
          leftVal,
          d.cellW * 0.4,
          d.cellH * 0.4,
          (dom.color as string) || "#fff",
        );
        drawDot(
          xLeft + d.cellW * 1.5,
          dom.r0 * d.cellH + d.cellH / 2,
          rightVal,
          d.cellW * 0.4,
          d.cellH * 0.4,
          (dom.color as string) || "#fff",
        );
      } else {
        const tr = p.min(dom.r0, dom.r1);
        const yTop = tr * d.cellH;
        p.noStroke();
        p.rect(dom.c0 * d.cellW, yTop, d.cellW, d.cellH * 2, d.cellW / 6);
        p.stroke(0);
        const topVal = dom.r0 < dom.r1 ? dom.v0 : dom.v1;
        const bottomVal = dom.r0 < dom.r1 ? dom.v1 : dom.v0;
        drawDot(
          dom.c0 * d.cellW + d.cellW / 2,
          yTop + d.cellH * 0.5,
          topVal,
          d.cellW * 0.4,
          d.cellH * 0.4,
          (dom.color as string) || "#fff",
        );
        drawDot(
          dom.c0 * d.cellW + d.cellW / 2,
          yTop + d.cellH * 1.5,
          bottomVal,
          d.cellW * 0.4,
          d.cellH * 0.4,
          (dom.color as string) || "#fff",
        );
      }

      if (totalScale > 1.001) p.pop();
    }
    p.pop();
  };

  p.windowResized = () => {
    const w = p.windowWidth;
    const h = p.windowHeight;
    p.resizeCanvas(w, h);
    d.square = p.min(w, h);
    d.cellW = d.square / d.cols;
    d.cellH = d.square / d.rows;
    d.offsetX = (w - d.square) / 2;
    d.offsetY = (h - d.square) / 2;
  };
}
