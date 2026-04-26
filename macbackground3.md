// Domi-oh-noes! 
// For the #WCCChallenge «Dominoes» (join the discord! https://discord.gg/S8c7qcjw2b)

let COLS, ROWS
let cellSize
let MAX_TRIES = 1000
let ANIM_SPEED = 0.015
let ANIM_SPREAD = 0.4
let MOUSE_RADIUS = 120
let MAX_SCALE = 1.5
let DOT_REPEL_RADIUS = 100
let MAX_DOT_DISPLACEMENT = 100
let palettes = [
  ["#fb6107","#f3de2c","#7cb518","#5c8001","#fbb02d"],
  ["#f72585","#7209b7","#b6f500","#000000","#ffffff"],
  ["#094074","#3c6997","#5adbff","#ffdd4a","#fe9000"],
  ["#05668d","#028090","#00a896","#02c39a","#f0f3bd"],
  ["#3c1642","#086375","#1dd3b0","#affc41","#b2ff9e"],
  ["#e5c679","#000807","#357266","#ed6a5e","#4ce0b3","#cfa5b4","#eae8ff","#b0d7ff","#61f2c2"],
  ["#3d2d1c","#30633d","#123c69","#1d58ab","#72c0ed","#fdefc0","#ffdf7c","#feb640","#d97b38","#a46379"],
  ["#080f0f","#2c4a73","#426c85","#4e6baa","#5c59c9","#c33b1e","#f07d23","#ffcc33","#fff1a1","#f1f5f8"],
  ["#001219","#005f73","#0a9396","#94d2bd","#e9d8a6","#ee9b00","#ca6702","#bb3e03","#ae2012","#9b2226"],
  ["#fffcf2","#ccc5b9","#403d39","#252422","#eb5e28"],
  ["#faeee0","#fec802","#f69f40","#bf5f07","#0dc9c5","#18761a"],
  ["#0a122a","#771918","#3c5a14","#ffbb33","#a53e12"],
]
let palette

let grid
let dominoes
let chainEnds
let chains
let chainAnim
let cellW, cellH

function setup() {
  let cw = min(windowWidth, windowHeight)
  let cellSize = int(random(30, 50))
  // Make cell size the closest number to divide the grid into a whole number
  COLS = int(cw / cellSize)
  ROWS = int(cw / cellSize)

  createCanvas(cw, cw)
  cellW = width / COLS
  cellH = height / ROWS
  palette = random(palettes)
  if (random() < 0.3) { palette = shuffle(palette) }

  MAX_SCALE = random(1.1, 1.8)
  ANIM_SPEED = random(0.01, 0.08)
  ANIM_SPREAD = random(0.2, 0.6)
  MAX_DOT_DISPLACEMENT = random(40, 200)
  MOUSE_RADIUS = random(100, 200)
  DOT_REPEL_RADIUS = random(100, 200)


  runPacking()
}

function runPacking() {
  grid = Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(null))
  dominoes = []
  chains = []
  chainEnds = null

  let tries = 0
  let lastPlaced = null
  let currentChainId = 0
  let currentChainLength = 0

  // Place first domino at random position
  const first = placeRandomDomino()
  if (!first) return
  dominoes.push(first)
  first.color = palette[0]
  first.chainId = 0
  first.chainIndex = 0
  chains[0] = [first]
  currentChainLength = 1
  chainEnds = {
    head: { r: first.r0, c: first.c0, value: first.v0, colorIndex: 0 },
    tail: { r: first.r1, c: first.c1, value: first.v1, colorIndex: 0 },
  }
  lastPlaced = "tail"

  while (tries < MAX_TRIES) {
    const attachDomino = lastPlaced === "tail"
      ? chains[currentChainId][currentChainLength - 1]
      : chains[currentChainId][0]
    const placed = tryPlaceAtChainEnd(lastPlaced, attachDomino)
    if (placed) {
      dominoes.push(placed)
      placed.chainId = currentChainId
      placed.chainIndex = currentChainLength
      chains[currentChainId].push(placed)
      currentChainLength++
      lastPlaced = placed.end
      tries = 0
    } else {
      const otherEnd = lastPlaced === "tail" ? "head" : "tail"
      const attachDominoOther = otherEnd === "tail"
        ? chains[currentChainId][currentChainLength - 1]
        : chains[currentChainId][0]
      const placedOther = tryPlaceAtChainEnd(otherEnd, attachDominoOther)
      if (placedOther) {
        dominoes.push(placedOther)
        placedOther.chainId = currentChainId
        placedOther.chainIndex = currentChainLength
        chains[currentChainId].push(placedOther)
        currentChainLength++
        lastPlaced = placedOther.end
        tries = 0
      } else {
        const newPiece = placeRandomDomino()
        if (newPiece) {
          newPiece.color = palette[0]
          newPiece.chainId = currentChainId + 1
          newPiece.chainIndex = 0
          dominoes.push(newPiece)
          currentChainId++
          currentChainLength = 1
          chains[currentChainId] = [newPiece]
          chainEnds = {
            head: { r: newPiece.r0, c: newPiece.c0, value: newPiece.v0, colorIndex: 0 },
            tail: { r: newPiece.r1, c: newPiece.c1, value: newPiece.v1, colorIndex: 0 },
          }
          lastPlaced = "tail"
          tries = 0
        } else {
          break
        }
      }
    }
  }

  chainAnim = chains.map((chain) => ({ phase: 0, direction: 1 }))
}

function tryPlaceAtChainEnd(side, lastDomino) {
  const { r, c, value, colorIndex } = chainEnds[side]
  const neighbors = getEmptyNeighbors(r, c)

  for (const { nr, nc } of shuffle(neighbors)) {
    const placement = findDominoAt(nr, nc, value, side, lastDomino)
    if (placement) {
      const nextIndex = side === "tail"
        ? (colorIndex + 1) % palette.length
        : (colorIndex - 1 + palette.length) % palette.length
      placement.color = palette[nextIndex]
      updateChainEnd(side, placement, nextIndex)
      return placement
    }
  }
  return null
}

function cellTouchesDomino(cr, cc, d) {
  const adj = (r1, c1, r2, c2) => abs(r1 - r2) + abs(c1 - c2) === 1
  return adj(cr, cc, d.r0, d.c0) || adj(cr, cc, d.r1, d.c1)
}

function findDominoAt(r, c, mustMatch, side, lastDomino) {
  const positions = [
    {
      r0: r,
      c0: c,
      r1: r,
      c1: c + 1,
      v0: mustMatch,
      v1: int(random(7)),
      end: "tail",
    },
    {
      r0: r,
      c0: c,
      r1: r,
      c1: c - 1,
      v0: mustMatch,
      v1: int(random(7)),
      end: "tail",
    },
    {
      r0: r,
      c0: c,
      r1: r + 1,
      c1: c,
      v0: mustMatch,
      v1: int(random(7)),
      end: "tail",
    },
    {
      r0: r,
      c0: c,
      r1: r - 1,
      c1: c,
      v0: mustMatch,
      v1: int(random(7)),
      end: "tail",
    },
  ]

  for (const p of positions) {
    if (
      inBounds(p.r0, p.c0) &&
      inBounds(p.r1, p.c1) &&
      isEmpty(p.r0, p.c0) &&
      isEmpty(p.r1, p.c1) &&
      !(cellTouchesDomino(p.r0, p.c0, lastDomino) && cellTouchesDomino(p.r1, p.c1, lastDomino))
    ) {
      placeDominoCells(p)
      if (side === "head") {
        ;[p.r0, p.c0, p.r1, p.c1] = [p.r1, p.c1, p.r0, p.c0]
        ;[p.v0, p.v1] = [p.v1, p.v0]
        p.end = "head"
      }
      return p
    }
  }
  return null
}

function updateChainEnd(side, placement, colorIndex) {
  const exposed =
    side === "tail"
      ? { r: placement.r1, c: placement.c1, value: placement.v1, colorIndex }
      : { r: placement.r0, c: placement.c0, value: placement.v0, colorIndex }
  chainEnds[side] = exposed
}

function placeRandomDomino() {
  const candidates = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isEmpty(r, c)) {
        if (c < COLS - 1 && isEmpty(r, c + 1))
          candidates.push({ r0: r, c0: c, r1: r, c1: c + 1, horizontal: true })
        if (r < ROWS - 1 && isEmpty(r + 1, c))
          candidates.push({ r0: r, c0: c, r1: r + 1, c1: c, horizontal: false })
      }
    }
  }
  if (candidates.length === 0) return null

  const pos = random(candidates)
  const v0 = int(random(7))
  const v1 = int(random(7))
  const d = {
    r0: pos.r0,
    c0: pos.c0,
    r1: pos.r1,
    c1: pos.c1,
    v0,
    v1,
    end: "tail",
  }
  placeDominoCells(d)
  return d
}

function placeDominoCells(d) {
  grid[d.r0][d.c0] = { value: d.v0 }
  grid[d.r1][d.c1] = { value: d.v1 }
}

function getEmptyNeighbors(r, c) {
  const out = []
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]
  for (const [dr, dc] of dirs) {
    const nr = r + dr,
      nc = c + dc
    if (inBounds(nr, nc) && isEmpty(nr, nc)) out.push({ nr, nc })
  }
  return out
}

function inBounds(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS
}

function isEmpty(r, c) {
  return grid[r][c] === null
}

function getChainScale(chainId, chainIndex) {
  const anim = chainAnim?.[chainId]
  if (!anim) return 1
  const len = chains[chainId].length
  if (len < 3) return 1
  const d = abs(anim.phase - chainIndex)
  const falloff = exp(-ANIM_SPREAD * d * d)
  return 1 + (MAX_SCALE - 1) * falloff
}

function getMouseScale(cx, cy) {
  const dx = mouseX - cx
  const dy = mouseY - cy
  const d = sqrt(dx * dx + dy * dy)
  if (d >= MOUSE_RADIUS) return 0
  const t = 1 - d / MOUSE_RADIUS
  return (MAX_SCALE - 1) * t * t
}

function draw() {
  background(240)

  if (chainAnim) {
    for (let i = 0; i < chainAnim.length; i++) {
      const anim = chainAnim[i]
      const len = chains[i].length
      anim.phase += anim.direction * ANIM_SPEED
      if (anim.phase >= len - 0.5) {
        anim.phase = len - 0.5
        anim.direction = -1
      } else if (anim.phase <= 0) {
        anim.phase = 0
        anim.direction = 1
      }
    }
  }

  for (const d of dominoes) {
    const horizontal = d.r0 === d.r1
    const leftCol = horizontal ? min(d.c0, d.c1) : d.c0
    const topRow = horizontal ? d.r0 : min(d.r0, d.r1)
    const cx = (leftCol + (horizontal ? 1 : 0.5)) * cellW
    const cy = (topRow + (horizontal ? 0.5 : 1)) * cellH

    const chainScale = getChainScale(d.chainId, d.chainIndex)
    const mouseScale = getMouseScale(cx, cy)
    const totalScale = min(MAX_SCALE, 1 + (chainScale - 1) + mouseScale)

    if (totalScale > 1.001) {
      push()
      translate(cx, cy)
      scale(totalScale)
      translate(-cx, -cy)
    }

    fill(d.color || 255)
    stroke(0)
    strokeWeight(1)

    if (horizontal) {
      const leftCol = min(d.c0, d.c1)
      const xLeft = leftCol * cellW
      const divX = (leftCol + 1) * cellW
      noStroke()
      rect(xLeft, d.r0 * cellH, cellW * 2, cellH, cellW/6)
      stroke(0)
      // line(divX, d.r0 * cellH, divX, d.r0 * cellH + cellH)
      const leftVal = d.c0 < d.c1 ? d.v0 : d.v1
      const rightVal = d.c0 < d.c1 ? d.v1 : d.v0
      drawDot(xLeft + cellW * 0.5, d.r0 * cellH + cellH / 2, leftVal, cellW * 0.4, cellH * 0.4, d.color)
      drawDot(xLeft + cellW * 1.5, d.r0 * cellH + cellH / 2, rightVal, cellW * 0.4, cellH * 0.4, d.color)
    } else {
      const topRow = min(d.r0, d.r1)
      const yTop = topRow * cellH
      const divY = (topRow + 1) * cellH
      noStroke()
      rect(d.c0 * cellW, yTop, cellW, cellH * 2, cellW/6)
      stroke(0)
      // line(d.c0 * cellW, divY, d.c0 * cellW + cellW, divY)
      const topVal = d.r0 < d.r1 ? d.v0 : d.v1
      const bottomVal = d.r0 < d.r1 ? d.v1 : d.v0
      drawDot(d.c0 * cellW + cellW / 2, yTop + cellH * 0.5, topVal, cellW * 0.4, cellH * 0.4, d.color)
      drawDot(d.c0 * cellW + cellW / 2, yTop + cellH * 1.5, bottomVal, cellW * 0.4, cellH * 0.4, d.color)
    }

    if (totalScale > 1.001) pop()
  }

  noFill()
  stroke(200)
  strokeWeight(1)
  // for (let i = 0; i <= COLS; i++) line(i * cellW, 0, i * cellW, height)
  // for (let i = 0; i <= ROWS; i++) line(0, i * cellH, width, i * cellH)
}

function getDotRepelOffset(px, py) {
  const dx = px - mouseX
  const dy = py - mouseY
  const d = sqrt(dx * dx + dy * dy)
  if (d >= DOT_REPEL_RADIUS || d < 1) return { x: 0, y: 0 }
  const n = noise(px * 0.02, py * 0.02, frameCount * 0.01)
  const mult = 0.2 + n * 0.8
  const t = 1 - d / DOT_REPEL_RADIUS
  const strength = MAX_DOT_DISPLACEMENT * t * t * mult
  const len = d
  return { x: (dx / len) * strength, y: (dy / len) * strength }
}

function drawDot(cx, cy, value, rw, rh, bgColor) {
  const h = (bgColor || "#fff").replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  fill(luminance < 128 ? 255 : 0)
  noStroke()
  const positions = [
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
  ]
  const dots = positions[value] || []
  for (const [dx, dy] of dots) {
    const px = cx + dx * rw * 0.5
    const py = cy + dy * rh * 0.5
    const off = getDotRepelOffset(px, py)
    circle(px + off.x, py + off.y, min(rw, rh) * 0.5)
  }
}
