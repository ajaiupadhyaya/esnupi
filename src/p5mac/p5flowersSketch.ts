// Port of macbackground6.md — Roni Kaufman-style flower arcs (voronoi-spaced centroids).
import p5 from "p5";

const LOGICAL = 500;
const N_FLOWERS = 18;
const N_PETALS = 12;
const MARGIN = 100;

type Centroid = {
  x0: number;
  y0: number;
  theta0: number;
  id: number;
  arcsLeft: number[];
};

export function p5flowersSketch(p: p5) {
  const centroids: Centroid[] = [];
  let centroidsIdx = 0;
  const petalEnds: { x: number; y: number; d: number; id: number }[] = [];
  let fitScale = 1;
  let fitOx = 0;
  let fitOy = 0;

  function updateFit() {
    const s = Math.min(p.width, p.height) / LOGICAL;
    fitScale = s;
    fitOx = (p.width - LOGICAL * s) / 2;
    fitOy = (p.height - LOGICAL * s) / 2;
  }

  function closestCentroidId(x: number, y: number) {
    let minD = Infinity;
    let idMin = -1;
    for (const c of centroids) {
      const d = distToCentroidSquared(c, x, y);
      if (d < minD) {
        minD = d;
        idMin = c.id;
      }
    }
    return idMin;
  }

  function distToCentroidSquared(c: Centroid, x: number, y: number) {
    return (c.x0 - x) ** 2 + (c.y0 - y) ** 2;
  }

  function longestPossibleRadius(c: Centroid, theta: number) {
    const x0 = c.x0;
    const y0 = c.y0;
    let r = 0;
    const rStep = 2;
    while (true) {
      r += rStep;
      const x = x0 + r * Math.cos(theta);
      const y = y0 + r * Math.sin(theta);
      if (closestCentroidId(x, y) !== c.id) break;
      if (x < 0 || x > LOGICAL || y < 0 || y > LOGICAL) break;
    }
    return r - rStep;
  }

  function voronoiRelaxation() {
    const n = 20;
    const s = LOGICAL / n;
    const voronoi: number[][][] = Array.from({ length: N_FLOWERS }, () => []);
    for (let i = 0; i < n; i++) {
      const x = (i + 1 / 2) * s;
      for (let j = 0; j < n; j++) {
        const y = (j + 1 / 2) * s;
        const cid = closestCentroidId(x, y);
        voronoi[cid]!.push([x, y]);
      }
    }

    for (let i = 0; i < N_FLOWERS; i++) {
      const c = centroids[i]!;
      const cellPoints = voronoi[c.id];
      if (!cellPoints?.length) continue;
      let xSum = 0;
      let ySum = 0;
      for (const pt of cellPoints) {
        xSum += pt[0]!;
        ySum += pt[1]!;
      }
      const x1 = p.constrain(xSum / cellPoints.length, MARGIN, LOGICAL - MARGIN);
      const y1 = p.constrain(ySum / cellPoints.length, MARGIN, LOGICAL - MARGIN);
      c.x0 = x1;
      c.y0 = y1;
    }
  }

  function resetScene() {
    centroids.length = 0;
    petalEnds.length = 0;
    centroidsIdx = 0;
    p.randomSeed(p.floor(p.random(1e9)));

    for (let i = 0; i < N_FLOWERS; i++) {
      const x0 = p.random(MARGIN, LOGICAL - MARGIN);
      const y0 = p.random(MARGIN, LOGICAL - MARGIN);
      const keys = [...Array(N_PETALS).keys()];
      p.shuffle(keys);
      centroids.push({
        x0,
        y0,
        theta0: p.random(p.TWO_PI),
        id: i,
        arcsLeft: keys,
      });
    }
    for (let i = 0; i < 3; i++) voronoiRelaxation();
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(1);
    p.frameRate(30);
    updateFit();
    resetScene();
    p.background("#2b67af");
  };

  p.draw = () => {
    if (centroidsIdx >= centroids.length) {
      p.noLoop();
      return;
    }

    p.push();
    p.translate(fitOx, fitOy);
    p.scale(fitScale);

    const c = centroids[centroidsIdx]!;
    const arc = c.arcsLeft.pop();
    if (arc === undefined) {
      p.pop();
      p.noLoop();
      return;
    }
    const theta = (p.TWO_PI * arc) / N_PETALS + c.theta0;
    const rMax = longestPossibleRadius(c, theta);

    p.fill("#fffbe6");
    p.noStroke();
    let x = 0;
    let y = 0;
    let d = 0;
    let r = 0;
    while (r + d / 2 < rMax) {
      x = c.x0 + r * Math.cos(theta);
      y = c.y0 + r * Math.sin(theta);
      d = r * Math.sin(p.TWO_PI / N_PETALS);
      p.circle(x, y, d - 1.5);

      if (x < MARGIN / 2 || x > LOGICAL - MARGIN / 2 || y < MARGIN / 2 || y > LOGICAL - MARGIN / 2) break;
      let intersects = false;
      for (const pe of petalEnds) {
        if (pe.id !== c.id && p.dist(x, y, pe.x, pe.y) < d / 2 + pe.d / 2 + 6) {
          intersects = true;
          break;
        }
      }
      if (intersects) break;
      r++;
    }
    petalEnds.push({ x, y, d, id: c.id });

    if (c.arcsLeft.length === 0) {
      let dSum = 0;
      for (const pe of petalEnds) {
        if (pe.id === c.id) dSum += pe.d;
      }
      p.fill("#fc8405");
      p.circle(c.x0, c.y0, dSum / N_PETALS);
      centroidsIdx++;
    }

    p.pop();

    if (centroidsIdx >= centroids.length) p.noLoop();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    updateFit();
  };
}
