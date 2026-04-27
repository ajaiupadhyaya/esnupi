// Port of macbackground5.md — dashed noise ribbons + fullscreen post-shader (SamuelYAN-style).
// Vert/frag not in the markdown; shaders authored to sample u_tex with subtle motion.
import p5 from "p5";

type Scheme = { colors: string[] };

/** Palettes analogous to typical OpenProcessing colorScheme bundles */
const COLOR_SCHEME: Scheme[] = [
  { colors: ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#f39c6b"] },
  { colors: ["#2d3436", "#636e72", "#dfe6e9", "#fab1a0", "#fd79a8"] },
  { colors: ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"] },
  { colors: ["#03071e", "#370617", "#6a040f", "#dc2f02", "#ffba08"] },
  { colors: ["#cad2c5", "#84a98c", "#52796f", "#354f52", "#2f3e46"] },
  { colors: ["#0081a7", "#00afb9", "#fdfcdc", "#fed9b7", "#f07167"] },
  { colors: ["#fffbeb", "#fef3c7", "#fcd34d", "#f59e0b", "#92400e"] },
];

const VERT = `
precision highp float;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main(void) {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
}
`;

const FRAG = `
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_frame;

void main(void) {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  float wave = sin(uv.y * 18.0 + u_time * 0.08) * 0.004;
  wave += sin(uv.x * 12.0 - u_frame * 0.02) * 0.002;
  vec2 uvo = uv + vec2(wave, wave * 0.6);
  vec4 col = texture2D(u_tex, uvo);
  float vig = 1.0 - length(uv - 0.65) * 0.35;
  col.rgb *= vig;
  gl_FragColor = col;
}
`;

export function p5itoWeaveSketch(p: p5) {
  let seed = 0;
  let mySize = 0;
  let margin = 0;
  let ito_num = 10;
  let color_set: string[] = [];
  let palette1: string[] = [];
  let palette2: string[] = [];
  let plus = 0;
  let strWei = 20;
  let color_bg = "#333";
  let webGLCanvas: p5.Graphics | null = null;
  let glGraphic: p5.Graphics | null = null;
  let theShader: p5.Shader | null = null;
  let bgcolorPool: string[] = [];
  let finished = false;

  function makeFilter() {
    if (!glGraphic) return;
    const ctx = glGraphic.drawingContext as CanvasRenderingContext2D;
    ctx.globalAlpha = 1;
    ctx.filter = "none";
  }

  function drawOverPattern() {
    const color_set_use = color_set.length ? color_set : ["#202020"];
    for (let k = 0; k < 280; k++) {
      p.stroke(`${p.random(color_set_use)}08`);
      p.strokeWeight(p.random(0.08, 0.45));
      p.noFill();
      const x0 = p.random(p.width);
      const y0 = p.random(p.height);
      const x1 = x0 + p.random(-80, 80);
      const y1 = y0 + p.random(-80, 80);
      p.line(x0, y0, x1, y1);
    }
  }

  function rebuildScene() {
    seed = Math.random() * 999999;
    p.randomSeed(seed);
    p.noiseSeed(seed);

    /** Match OpenProcessing sketch: width = mySize × 11/16, height = mySize */
    const ww = (mySize / 16) * 11;
    const hh = mySize;

    if (p.width !== ww || p.height !== hh) {
      p.resizeCanvas(ww, hh);
    }

    webGLCanvas?.remove();
    glGraphic?.remove();

    webGLCanvas = p.createGraphics(ww, hh, p.WEBGL);
    glGraphic = p.createGraphics(ww, hh);

    if (!webGLCanvas || !glGraphic) return;

    try {
      theShader = webGLCanvas.createShader(VERT, FRAG);
    } catch (e) {
      console.warn("[p5itoWeaveSketch] shader compile failed", e);
      theShader = null;
    }

    const s1 = p.random(COLOR_SCHEME) as Scheme;
    const s2 = p.random(COLOR_SCHEME) as Scheme;
    palette1 = [...s1.colors];
    palette2 = [...s2.colors];

    ito_num = 2 * Math.floor(p.random(5, 8));
    color_set = [
      p.random(palette1) as string,
      p.random(palette2) as string,
      p.random(palette2) as string,
      p.random(palette1) as string,
      p.random(palette2) as string,
    ];

    bgcolorPool = [...palette1, ...palette2];

    plus = 0;
    strWei = (7.5 * p.random(2.5, 3)) / 0.5;
    makeFilter();
    color_bg = p.random(color_set) as string;
    p.background(color_bg);
    finished = false;
    p.loop();
  }

  p.setup = () => {
    p.frameRate(25);
    p.angleMode(p.DEGREES);
    mySize = Math.min(p.windowWidth, p.windowHeight) * 0.9;
    margin = mySize / 100;
    const ww = (mySize / 16) * 11;
    const hh = mySize;
    p.createCanvas(ww, hh);
    rebuildScene();
  };

  p.draw = () => {
    if (finished || !webGLCanvas || !glGraphic) return;

    p.randomSeed(seed);
    p.noiseSeed(seed);

    const ww = webGLCanvas.width;
    const hh = webGLCanvas.height;

    if (theShader) {
      webGLCanvas.shader(theShader);
      theShader.setUniform("u_resolution", [ww, hh]);
      theShader.setUniform("u_time", p.millis() / 10);
      theShader.setUniform("u_frame", p.frameCount);
      theShader.setUniform("u_tex", glGraphic);

      webGLCanvas.clear();
      webGLCanvas.noStroke();
      webGLCanvas.rectMode(p.CENTER);
      webGLCanvas.rect(0, 0, ww, hh);
    }

    const point_num = 16;

    glGraphic.push();
    glGraphic.translate(
      ww / 2 + p.random([-1, 1]) * p.random(plus * 0.5, plus) * 4 * Math.cos(plus),
      hh / 2 + p.random([-1, 1]) * p.random(plus) * 15 * Math.sin(plus),
    );
    glGraphic.rotate(p.random([-90, 90]) + p.random([-1, 1]) * (p.frameCount / p.random(75, 100)));

    for (let i = 0; i < ito_num; i++) {
      glGraphic.push();
      glGraphic.translate(
        -1 * Math.sin(p.random(0.5, 1) * plus) + p.random(-ww / 2, ww / 2),
        plus * 1 + p.random(-hh / 2, hh / 2),
      );
      glGraphic.rotate(p.random([-90, 90]) + (p.random([-1, 1]) * p.frameCount) / 100);
      glGraphic.noFill();
      glGraphic.stroke(`${String(p.random(color_set))}40`);
      glGraphic.strokeWeight(strWei - (1 * plus) / 1);
      const dc = glGraphic.drawingContext as CanvasRenderingContext2D;
      dc.shadowColor = String(p.random(bgcolorPool));
      dc.shadowOffsetX = p.random([-1, 1]) * (plus / 0.3);
      dc.shadowOffsetY = p.random([-1, 1]) * (plus / 0.3);
      dc.shadowBlur = 0;

      const dashMode = p.random([1, 2]);
      if (dashMode === 1) {
        dc.setLineDash([
          mySize * 0.05,
          mySize * 0.5,
          mySize * 0.5,
          mySize * 0.05,
          mySize * 0.05,
          mySize * 0.2,
          mySize * 0.05,
          mySize * 0.5,
        ]);
      } else {
        dc.setLineDash([mySize * 0.05, mySize * 0.5, mySize * 0.05, mySize * 0.2]);
      }

      glGraphic.beginShape();
      const x0 = -mySize * p.random(0.25, 0.45);
      const x1 = mySize * p.random(0.25, 0.45);
      const yLo = -mySize * p.random(0.25, 0.05);
      const yHi = mySize * p.random(0.25, 0.05);
      const xStep = (mySize * 0.01) / point_num;

      for (let x = x0; x < x1; x += xStep) {
        const n = p.noise(x * 0.1, i * 0.1, p.frameCount * 0.01);
        const y = p.map(n, 0, 1, yLo, yHi);
        glGraphic.vertex(
          x - 2 * Math.sin((p.random(0.5, 1) * plus) / 100 - x * Math.sin((p.random(1, 2) * plus) / 100 - 0.5) + 1.5),
          y + plus / 1,
        );
      }
      glGraphic.endShape();
      glGraphic.pop();
    }

    glGraphic.pop();

    const ox = (p.width - ww) / 2;
    const oy = (p.height - hh) / 2;
    if (theShader) {
      p.image(webGLCanvas!, ox, oy);
    } else {
      p.image(glGraphic, ox, oy);
    }

    plus += p.random(2, 4) / 2;

    if (strWei - plus < 0) {
      finished = true;
      p.noLoop();
      p.blendMode(p.BLEND);
      p.strokeWeight(p.random(0.1, 0.5) / 10);
      p.stroke(`${String(color_set)}03`);
      p.noFill();
      const mainDc = p.drawingContext as CanvasRenderingContext2D;
      mainDc.setLineDash([1, 4, 1, 3]);
      drawOverPattern();
      mainDc.setLineDash([]);
      p.blendMode(p.BLEND);

      p.noFill();
      p.strokeWeight(margin);
      p.rectMode(p.CORNER);
      p.stroke("#202020");
      p.rect(0, 0, p.width, p.height);
    }
  };

  p.windowResized = () => {
    mySize = Math.min(p.windowWidth, p.windowHeight) * 0.9;
    margin = mySize / 100;
    rebuildScene();
  };
}
