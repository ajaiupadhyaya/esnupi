// Port of macbackground.md «Earth» — 2D layered bands + chroma (no p5.FIP / shader; original GLSL is omitted).
import chroma from "chroma-js";
import p5 from "p5";

type Point = { x: number; y: number };
type EarthLayer = {
  points: Point[];
  yBase: number;
  progress: number;
  soilParams: {
    mainTint: [number, number, number];
  };
  strokeColor: [number, number, number];
};

const PALETTES = [
  ["#c9cba3", "#ffe1a8", "#e26d5c", "#723d46", "#472d30"],
  ["#606c38", "#283618", "#fefae0", "#dda15e", "#bc6c25"],
  ["#160f29", "#246a73", "#368f8b", "#f3dfc1", "#ddbea8"],
  ["#797d62", "#9b9b7a", "#d9ae94", "#f1dca7", "#ffcb69", "#d08c60", "#997b66"],
  ["#d0f1bf", "#b6d7b9", "#9abd97", "#646536", "#483d03"],
  ["#004b23", "#006400", "#007200", "#008000", "#38b000", "#70e000", "#9ef01a", "#ccff33"],
  ["#5fad56", "#f2c14e", "#f78154", "#4d9078", "#b4436c"],
  ["#483c46", "#3c6e71", "#70ae6e", "#beee62", "#f4743b"],
  ["#2c6e49", "#4c956c", "#fefee3", "#ffc9b9", "#d68c45"],
  ["#132a13", "#31572c", "#4f772d", "#90a955", "#ecf39e"],
  ["#033f63", "#28666e", "#7c9885", "#b5b682", "#fedc97"],
  ["#f7e7ce", "#ffeeb0", "#c3af92", "#173a2e", "#95b09f"],
];
const SKY_COLORS = ["#03045e", "#023e8a", "#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#90e0ef", "#ade8f4", "#caf0f8"];

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function wave(p: p5, x: number, t: number) {
  return (
    p.sin(3 * x - 3 * t + 5) / 3 +
    p.sin(5 * x + 3 * t + 2) / 5 +
    p.sin(8 * x + 3 * t + 4) / 8 +
    p.sin(13 * x - 3 * t + 3) / 8
  );
}

function generateWaveLayer(
  p: p5,
  cw: number,
  yBase: number,
  amplitude: number,
  frequency: number,
  _timeOffset: number,
  noiseAmount: number,
  sampling: number,
): Point[] {
  const points: Point[] = [];
  const t = p.random(1000);
  for (let x = -cw / 2; x <= cw / 2 + 2 * sampling; x += sampling * p.random(1, 1.5)) {
    if (x > cw / 2) {
      x = cw / 2;
    }
    const normalizedX = p.map(x, -cw / 2, cw / 2, 0, p.TWO_PI * frequency);
    let y = yBase + wave(p, normalizedX, t) * amplitude;
    y += p.noise(x * 0.01, t * 0.01) * noiseAmount;
    points.push({ x, y });
    if (x >= cw / 2) {
      break;
    }
  }
  return points;
}

function buildLayers(p: p5, palette: string[], cw: number, ch: number): EarthLayer[] {
  const layers: EarthLayer[] = [];
  const numLayers = 12;
  const minAmplitude = 100;
  const maxAmplitude = 600;
  const amplitudeExponent = 4;
  const maxFrequency = 1.6;
  const minFrequency = 0.2;
  const frequencyExponent = 1.5;
  const maxNoiseAmount = 60;
  const minNoiseAmount = 5;
  const topY = -ch / 2.5;
  const bottomY = ch / 2.5;
  for (let layer = 0; layer < numLayers; layer++) {
    const progress = layer / (numLayers - 1);
    const yBase = p.map(progress, 0, 1, topY, bottomY);
    const amplitudeScale = p.pow(progress, amplitudeExponent);
    const amplitude = p.lerp(minAmplitude, maxAmplitude, amplitudeScale);
    const frequencyScale = p.pow(1 - progress, frequencyExponent);
    const frequency = p.lerp(minFrequency, maxFrequency, frequencyScale);
    const noiseAmount = p.lerp(minNoiseAmount, maxNoiseAmount, progress);
    const sampling = 14;
    const wavePoints = generateWaveLayer(p, cw, yBase, amplitude, frequency, 0, noiseAmount, sampling);
    const colorHex = p.random(palette) as string;
    const tintColor = hexToRgb01(colorHex);
    layers.push({
      points: wavePoints,
      yBase,
      progress,
      soilParams: { mainTint: tintColor },
      strokeColor: tintColor,
    });
  }
  return layers;
}

function drawLayersToComp(p: p5, comp: p5, layers: EarthLayer[], skyPalette: string[]) {
  const w = p.width;
  const h = p.height;
  comp.clear();
  for (let i = 0; i < layers.length; i++) {
    const L = layers[i];
    const [tr, tg, tb] = L.soilParams.mainTint;
    const base = chroma.rgb(tr * 255, tg * 255, tb * 255);
    const topCol = base.saturate(0.4).hex();
    const bottomCol = base.darken(0.6).saturate(0.2).hex();

    comp.push();
    const dctx = comp.drawingContext as CanvasRenderingContext2D;
    const yTop = 0;
    const yBot = h;
    const grd = dctx.createLinearGradient(0, yTop, 0, yBot);
    grd.addColorStop(0, topCol + "e6");
    grd.addColorStop(0.5, topCol + "cc");
    grd.addColorStop(1, bottomCol + "dd");
    const path = new Path2D();
    let first = true;
    for (const pt of L.points) {
      const px = pt.x + w / 2;
      const py = pt.y + h / 2;
      if (first) {
        path.moveTo(px, py);
        first = false;
      } else {
        path.lineTo(px, py);
      }
    }
    path.lineTo(w, h);
    path.lineTo(0, h);
    path.closePath();
    dctx.fillStyle = grd;
    dctx.fill(path);

    const fogH = p.lerp(h * 0.22, h * 0.08, L.progress);
    const yCenter = L.yBase + h / 2;
    const y0 = yCenter - fogH * 0.8;
    const fog = chroma.rgb(L.strokeColor[0] * 255, L.strokeColor[1] * 255, L.strokeColor[2] * 255);
    const fogG = dctx.createLinearGradient(0, y0, 0, h);
    const midT = p.constrain((yCenter - y0) / (h - y0), 0, 1);
    const fc = fog.saturate(0.2).darken(0.5);
    comp.noStroke();
    fogG.addColorStop(0.0, fc.alpha(0.12).css());
    fogG.addColorStop(midT, fc.alpha(0.45).css());
    fogG.addColorStop(1.0, fc.alpha(0.6).css());
    dctx.fillStyle = fogG;
    dctx.fillRect(0, y0, w, h - y0);

    const sc = L.strokeColor;
    dctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    dctx.shadowBlur = 8;
    dctx.shadowOffsetX = 3;
    dctx.shadowOffsetY = 3;
    comp.noFill();
    comp.stroke(sc[0] * 255, sc[1] * 255, sc[2] * 255);
    comp.strokeWeight(p.random(6, 12));
    comp.beginShape();
    for (let vi = 0; vi < L.points.length; vi++) {
      const pt = L.points[vi]!;
      comp.vertex(pt.x + w / 2, pt.y + h / 2);
    }
    comp.endShape();
    dctx.shadowBlur = 0;
    dctx.shadowOffsetX = 0;
    dctx.shadowOffsetY = 0;
    comp.pop();
  }

  for (let n = 0; n < 200; n++) {
    const x = p.random(0, w);
    const y = p.random(0, h * 0.4);
    const s = p.random(20, 80);
    const c = p.random(skyPalette) as string;
    comp.fill(c + "18");
    comp.noStroke();
    comp.rect(x, y, s * p.random(1.2, 2.5), s * 0.3);
  }
}

export function p5earthBandsSketch(p: p5) {
  let comp: p5 | null = null;
  let sky: string;
  let skyColors: string[];
  let palette: string[];
  let built = false;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(1);
    p.frameRate(30);
    sky = p.random(SKY_COLORS) as string;
    skyColors = SKY_COLORS;
    palette = p.random([...PALETTES]) as string[];
    p.noStroke();
    const layers = buildLayers(p, palette, p.width, p.height);
    comp = p.createGraphics(p.width, p.height);
    if (comp) {
      comp.pixelDensity(1);
      drawLayersToComp(p, comp, layers, skyColors);
    }
    built = true;
    p.noLoop();
  };

  p.draw = () => {
    if (comp && built) {
      p.background(sky);
      p.image(comp, 0, 0, p.width, p.height);
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    if (!comp) return;
    sky = p.random(SKY_COLORS) as string;
    palette = p.random([...PALETTES]) as string[];
    const layers = buildLayers(p, palette, p.width, p.height);
    comp.remove();
    comp = p.createGraphics(p.width, p.height);
    comp!.pixelDensity(1);
    drawLayersToComp(p, comp!, layers, skyColors);
    p.redraw();
  };
}
