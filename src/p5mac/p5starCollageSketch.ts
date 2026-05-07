// Port of macbackground4.md — textured star clips + stipple overlays (deterministic packing per seed).
import p5 from "p5";
import collageImgUrl from "../photography/images/skyline3.jpg";

type PaletteRow = readonly string[];

const PALETTES: PaletteRow[] = [
  ["#3c4cad", "#5FB49C", "#e8a49c"],
  ["#1c3560", "#ff6343", "#f2efdb", "#fea985"],
  ["#e0d7c5", "#488a50", "#b59a55", "#bf5513", "#3b6fb6", "#4f3224", "#9a7f6e"],
  ["#DEEFB7", "#5FB49C", "#ed6a5a"],
  ["#2B2B2B", "#91B3E1", "#2F5FB3", "#3D4B89", "#AE99E8", "#DBE2EC"],
  ["#ffbe0b", "#fb5607", "#ff006e", "#8338ec", "#3a86ff"],
  ["#A8C25D", "#5B7243", "#FFA088", "#FFFB42", "#a9cff0", "#2D6EA6"],
  ["#F9F9F1", "#191A18", "#E15521", "#3391CF", "#E4901C", "#F5B2B1", "#009472"],
];

const FLOAT_PALETTE = ["#F9F9F1", "#191A18", "#E15521", "#3391CF", "#E4901C", "#F5B2B1", "#009472"];

export function p5starCollageSketch(p: p5) {
  let num = 0;
  let cs = 0;
  let paletteSelected: string[] = [];
  let img: p5.Image | null = null;
  let pg: p5.Graphics | null = null;
  let pg2: p5.Graphics | null = null;
  let t = 0;
  const vel = 0.5;

  function resetAndRestart() {
    if (!img || !img.width) return;
    const w = p.width;
    const h = p.height;

    p.randomSeed(num);
    p.noiseSeed(num);

    pg?.remove();
    pg2?.remove();

    pg = p.createGraphics(w, h);
    pg.noStroke();
    const particleCount = Math.floor(cs * cs * 0.08);
    /* p5 v2: Graphics has no randomSeed — main instance RNG is already seeded above. */
    for (let i = 0; i < particleCount; i++) {
      const x = p.random(0, w);
      const y = p.random(0, h);
      const n = p.noise(x * 0.01, y * 0.01) * (((cs + cs) / 2) * 0.002);
      pg.fill(255, 100);
      pg.ellipse(x, y, n, n);
    }

    pg2 = p.createGraphics(w, h);
    for (let j = 0; j < 1000; j++) {
      pg2.noStroke();
      pg2.fill(p.random(FLOAT_PALETTE));
      pg2.ellipse(
        p.randomGaussian(w / 2, w * 0.3),
        p.randomGaussian(h / 2, h * 0.3),
        p.random() < 0.9 ? w * p.random(0.001, 0.003) : w * p.random(0.005, 0.007),
      );
    }
  }

  function randomCol() {
    const idx = Math.floor(p.random(1, paletteSelected.length));
    const hex = paletteSelected[idx]!;
    const c = p.color(hex);
    return c;
  }

  function star(px: number, py: number, r: number) {
    p.push();
    p.noStroke();
    p.translate(px, py);
    const verticesNums = Math.floor(p.random(3, 12));
    const depth = 1 - p.random();
    const radiusOuter = r;
    const radiusInner = r * depth;
    const angleDeg = 360 / verticesNums;

    p.beginShape();
    for (let ang = 0; ang < 360; ang += angleDeg) {
      const ex = radiusOuter * p.cos(ang);
      const ey = radiusOuter * p.sin(ang);
      p.vertex(ex, ey);
      const ex2 = radiusInner * p.cos(ang + angleDeg * 0.5);
      const ey2 = radiusInner * p.sin(ang + angleDeg * 0.5);
      p.vertex(ex2, ey2);
    }
    p.endShape(p.CLOSE);
    p.pop();
  }

  function randomCrop(wcrop: number) {
    if (!img || !img.width || !img.height) return;
    const maxGet = wcrop * 10;
    const maxX = Math.max(1, img.width - maxGet);
    const maxY = Math.max(1, img.height - maxGet);
    const sx = p.random(0, maxX);
    const sy = p.random(0, maxY);
    const img2 = img.get(sx, sy, maxGet, maxGet);
    p.image(img2, 0, 0);
  }

  function drawRandomCrop(x: number, y: number, wcrop: number) {
    p.push();
    p.translate(x, y);
    randomCrop(wcrop);
    p.pop();
  }

  function circlePacking() {
    p.noStroke();
    p.fill(51);
    p.push();
    const points: { x: number; y: number; z: number }[] = [];
    const count = 1000;
    for (let i = 0; i < count; i++) {
      const s = p.random(15, 200);
      const x = p.random(p.width);
      const y = p.random(p.height);
      let add = true;
      for (let j = 0; j < points.length; j++) {
        const pt = points[j]!;
        if (p.dist(x, y, pt.x, pt.y) < (s + pt.z) * 0.6) {
          add = false;
          break;
        }
      }
      if (add) points.push({ x, y, z: s });
    }

    for (let i = 0; i < points.length; i++) {
      const pt = points[i]!;
      p.push();
      p.translate(pt.x, pt.y);
      const ran = p.random([-1, 1]);
      p.rotate(ran * (t * 0.5));
      const r = pt.z - 5;

      p.fill(randomCol());
      p.stroke(randomCol());

      p.push();
      star(0, 0, r);
      const dc = p.drawingContext as CanvasRenderingContext2D;
      dc.clip();

      p.push();
      p.blendMode(p.OVERLAY);
      drawRandomCrop(-r, -r, r * 2);
      star(0, 0, r);

      p.pop();
      p.pop();
      p.pop();
    }
    p.pop();
  }

  p.setup = () => {
    cs = Math.min(p.windowHeight, p.windowWidth);
    p.createCanvas(cs, cs);
    p.rectMode(p.CENTER);
    p.angleMode(p.DEGREES);
    num = Math.floor(p.random(100000));
    paletteSelected = [...PALETTES[Math.floor(p.random(PALETTES.length))]!];
    p.frameRate(30);

    p.loadImage(collageImgUrl, (loaded) => {
      img = loaded;
      resetAndRestart();
    });
  };

  p.draw = () => {
    if (!img?.width || !pg || !pg2) return;
    p.randomSeed(num);
    p.background("#f4f1de");
    circlePacking();
    p.image(pg2, 0, 0);
    p.image(pg, 0, 0);
    t += vel;
  };

  p.windowResized = () => {
    cs = Math.min(p.windowHeight, p.windowWidth);
    p.resizeCanvas(cs, cs);
    resetAndRestart();
  };
}
