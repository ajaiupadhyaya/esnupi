// Port of macbackground2.md (Bach manuscript collage) — procedural parchment + WEBGL.
import p5 from "p5";

/** get() / createGraphics: typings vary; runtime is canvas-backed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type P5ImageLike = any;

type Piece = { pic: P5ImageLike; px: number; py: number };

function makeManuscriptImage(p: p5): P5ImageLike {
  const g = p.createGraphics(600, 780);
  g.background(254, 250, 235);
  g.stroke(40, 35, 32, 120);
  g.strokeWeight(0.4);
  const rows = 14;
  for (let r = 0; r < rows; r++) {
    const y0 = 40 + (r * (g.height - 80)) / rows;
    for (let s = 0; s < 5; s++) {
      g.line(50, y0 + s * 5, g.width - 50, y0 + s * 5);
    }
  }
  g.noStroke();
  g.fill(30, 25, 20, 90);
  for (let n = 0; n < 200; n++) {
    g.circle(p.random(40, g.width - 40), p.random(40, g.height - 40), p.random(0.4, 1.2));
  }
  g.textFont("Georgia");
  g.textSize(4);
  g.fill(20, 18, 30, 80);
  for (let t = 0; t < 20; t++) {
    g.text("♪ ♫", p.random(30, g.width - 40), p.random(30, g.height - 20));
  }
  return g;
}

function processImage(
  p: p5,
  source: P5ImageLike,
  xdiv: number,
  ydiv: number,
): { pieces: Piece[]; img: P5ImageLike } {
  const cropW = (119 * source.width) / 120;
  const h0 = (10 * source.height) / 12;
  let work = source.get(0, Math.floor(source.height / 12), Math.floor(cropW), Math.floor(h0));
  work.resize(0, Math.floor(h0 / 2));
  work.loadPixels();
  const px = work.pixels;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i]! + px[i + 1]! + px[i + 2]! < 200) {
      px[i]! *= 0;
      px[i + 1]! *= 0;
      px[i + 2]! *= 0;
    } else {
      px[i + 3]! = 60;
    }
  }
  work.updatePixels();
  const pieces: Piece[] = [];
  const wcell = work.width / xdiv;
  const hcell = work.height / ydiv;
  for (let x = 0; x < work.width; x += wcell) {
    for (let y = 0; y < work.height; y += hcell) {
      const piece = work.get(x, y, wcell, hcell);
      pieces.push({
        pic: piece,
        px: p.map(x, 0, work.width, -work.width / 2, work.width / 2),
        py: p.map(y, 0, work.height, -work.height / 2, work.height / 2),
      });
    }
  }
  return { pieces, img: work };
}

export function p5collageSketch(p: p5) {
  let img: P5ImageLike;
  let pieces: Piece[] = [];
  const ydiv = 13;
  const xdiv = 12;
  let rot: p5.Vector;
  let trot: p5.Vector;
  let prot: p5.Vector;
  let stretch = 0;
  let tstretch = 0;
  let mode = 0;
  let rseed: number;

  p.setup = () => {
    p.createCanvas(p.windowWidth - 1, p.windowHeight - 1, p.WEBGL);
    const gl = p.drawingContext as WebGLRenderingContext;
    gl.disable(gl.DEPTH_TEST);
    const source = makeManuscriptImage(p);
    const pr = processImage(p, source, xdiv, ydiv);
    pieces = pr.pieces;
    img = pr.img;
    rseed = p.random(1000);
    rot = p.createVector(0, 0, 0);
    trot = p.createVector(0, 0, 0);
    prot = p.createVector(0, 0, 0);
    p.imageMode(p.CENTER);
  };

  p.draw = () => {
    p.randomSeed(rseed);
    p.background(255);
    p.scale(p.map(rot.y, p.PI, -p.PI, 0.1, 1));
    p.background("cornsilk");
    p.rotateX(rot.y);
    p.rotateY(rot.x);
    const half = img.width / 2;
    for (const q of pieces) {
      const z = p.random(-half, half);
      p.push();
      p.translate(q.px, q.py / (1 + p.random(3) * stretch), z * stretch);
      p.texture(q.pic);
      p.noStroke();
      p.rotateY(-prot.x);
      p.rotateX(-prot.y);
      p.rotateZ(p.random(-p.PI / 12, p.PI / 12) * stretch);
      p.plane(q.pic.width, q.pic.height);
      p.pop();
    }
    if (mode !== 3) {
      rot.lerp(trot, 0.1);
    }
    if ((mode > 0 && mode < 3) || mode > 3) {
      prot.lerp(trot, 0.1);
    } else if (mode === 0) {
      prot.mult(0.9);
    }
    stretch = p.lerp(stretch, tstretch, 0.1);
    trot.x = p.map(p.mouseX, 0, p.width, -p.PI, p.PI);
    trot.y = p.map(p.mouseY, 0, p.height, p.PI, -p.PI);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth - 1, p.windowHeight - 1);
  };

  p.mousePressed = () => {
    mode = (mode + 1) % 6;
    if (mode > 1 && mode < 5) tstretch = 1;
    else tstretch = 0;
    if (mode === 0) rseed = p.random(1000);
  };
}
