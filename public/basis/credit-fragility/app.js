(function () {
  const M = window.LiquidityModel;
  const $ = (id) => document.getElementById(id);
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const NS = "http://www.w3.org/2000/svg";
  const n2 = (v) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2);

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function svgFor(container, w, h, label) {
    const old = container.querySelector("svg"); if (old) old.remove();
    const s = el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": label });
    container.appendChild(s);
    return s;
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
    return 10 * p;
  }
  function ticks(min, max, n) {
    const span = max - min, raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw)));
    let step = p; for (const m of [1, 2, 2.5, 5, 10]) { if (m * p >= raw) { step = m * p; break; } }
    const out = []; for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(6));
    return out;
  }
  function tipFor(container) {
    let t = container.querySelector(".tip");
    if (!t) { t = document.createElement("div"); t.className = "tip"; container.appendChild(t); }
    return t;
  }
  function showTip(container, html, x, y) {
    const t = tipFor(container); t.innerHTML = html; t.style.opacity = 1;
    const cw = container.clientWidth, tw = t.offsetWidth;
    t.style.left = Math.min(Math.max(0, x - tw / 2), cw - tw) + "px";
    t.style.top = Math.max(0, y - t.offsetHeight - 12) + "px";
  }
  function hideTip(container) { const t = container.querySelector(".tip"); if (t) t.style.opacity = 0; }
  function toPx(container, svg, x, y) {
    const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, cr = container.getBoundingClientRect();
    return [x * (r.width / vb.width) + r.left - cr.left, y * (r.height / vb.height) + r.top - cr.top];
  }
  function quarterTicks(n) {
    if (n === 0) return [0];
    const step = n <= 6 ? 1 : Math.ceil(n / 5);
    const out = []; for (let q = 0; q <= n - (n > 6 ? step / 2 : 0); q += step) out.push(q);
    if (out[out.length - 1] !== n) out.push(n);
    return out;
  }
  const qLabel = (q) => (q === 0 ? "Start" : "Q" + q);

  /* ---------------- State ---------------- */
  const KNOBS = ["request", "gate", "haircut"];
  const PRESETS = {
    default: M.DEFAULTS,
    slow: { request: 30, gate: 5, haircut: 15 },
    out: { request: 100, gate: 10, haircut: 50 },
  };
  function setKnobs(vals) { KNOBS.forEach((k) => { $("k-" + k).value = vals[k]; }); }
  function readKnobs() {
    const v = {};
    KNOBS.forEach((k) => { v[k] = parseInt($("k-" + k).value, 10); $("o-" + k).textContent = v[k] + "%"; });
    return v;
  }

  /* ---------------- Path chart ---------------- */
  function drawPath(led) {
    const box = $("c-path"), W = 560, H = 300, L = 40, R = 52, T = 12, B = 30;
    const svg = svgFor(box, W, H, "Book assets and unpaid requests by quarter, per 100 of initial NAV");
    const n = led.length - 1;
    const x = (i) => L + (W - L - R) * (n ? i / n : 0);
    const y = (v) => T + (H - T - B) * (1 - v / 100);
    const g = el("g", { class: "grid" }, svg);
    [0, 25, 50, 75, 100].forEach((t) => { el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, g); const tx = el("text", { x: L - 8, y: y(t) + 4, "text-anchor": "end", class: "tick" }, svg); tx.textContent = t; });
    quarterTicks(n).forEach((q) => { const tx = el("text", { x: x(q), y: H - B + 18, "text-anchor": q === 0 ? "start" : "middle", class: "tick" }, svg); tx.textContent = qLabel(q); });
    el("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), class: "baseline" }, svg);
    [["pending", "--s2", 2], ["assets", "--s1", 2.5]].forEach(([k, col, sw]) => {
      el("polyline", { points: led.map((r, i) => x(i) + "," + y(r[k])).join(" "), fill: "none", stroke: css(col), "stroke-width": sw, "stroke-linejoin": "round" }, svg);
      if (n <= 16) led.forEach((r, i) => el("circle", { cx: x(i), cy: y(r[k]), r: 3.5, fill: css(col) }, svg));
    });
    const last = led[n];
    const ya = y(last.assets), yp = y(last.pending);
    const close = Math.abs(ya - yp) < 14;
    const ta = el("text", { x: x(n) + 8, y: (close ? Math.min(ya, yp) - 3 : ya + 4), class: "lbl" }, svg); ta.textContent = n2(last.assets);
    const tp = el("text", { x: x(n) + 8, y: (close ? Math.min(ya, yp) + 11 : yp + 4), class: "lbl" }, svg); tp.textContent = n2(last.pending);
    const cross = el("line", { y1: T, y2: H - B, stroke: css("--axis"), "stroke-width": 1, opacity: 0 }, svg);
    const hit = el("rect", { x: L - 6, y: T, width: W - L - R + 12, height: H - T - B, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", (ev) => {
      const r = svg.getBoundingClientRect(); const vx = (ev.clientX - r.left) * (W / r.width);
      const i = Math.max(0, Math.min(n, Math.round(((vx - L) / (W - L - R)) * n)));
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("opacity", 1);
      const [px, py] = toPx(box, svg, x(i), T + 30);
      showTip(box, `<b>${qLabel(i)}</b><div class="r"><span>Book assets</span><span>${n2(led[i].assets)}</span></div><div class="r"><span>Unpaid</span><span>${n2(led[i].pending)}</span></div>`, px, py + 60);
    });
    hit.addEventListener("mouseleave", () => { cross.setAttribute("opacity", 0); hideTip(box); });
  }

  /* ---------------- Stacked ledger chart ---------------- */
  const LAYERS = [["assets", "--s1", "Book assets"], ["cumPaid", "--s2", "Redemptions paid"], ["cumLoss", "--s3", "Haircut losses"]];
  function drawStack(led) {
    const box = $("c-stack"), W = 560, H = 300, L = 40, R = 12, T = 12, B = 30;
    const svg = svgFor(box, W, H, "Where the initial 100 went by quarter: book assets, redemptions paid and haircut losses always sum to 100");
    const n = led.length;
    const y = (v) => T + (H - T - B) * (1 - v / 100);
    const band = (W - L - R) / n, bw = Math.max(2, Math.min(46, band - 2));
    const g = el("g", { class: "grid" }, svg);
    [0, 25, 50, 75, 100].forEach((t) => { el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, g); const tx = el("text", { x: L - 8, y: y(t) + 4, "text-anchor": "end", class: "tick" }, svg); tx.textContent = t; });
    const tickSet = new Set(quarterTicks(n - 1));
    led.forEach((r, i) => {
      const cx = L + band * i + band / 2;
      let acc = 0;
      LAYERS.forEach(([k, col]) => {
        const v = r[k]; if (v <= 0) return;
        const y0 = y(acc), y1 = y(acc + v); acc += v;
        const h = Math.max(0, y0 - y1 - 2);
        if (h < 0.5) return;
        el("rect", { x: cx - bw / 2, y: y1, width: bw, height: h, fill: css(col) }, svg);
      });
      if (tickSet.has(r.period)) { const tx = el("text", { x: cx, y: H - B + 18, "text-anchor": "middle", class: "tick" }, svg); tx.textContent = qLabel(r.period); }
      const hit = el("rect", { x: cx - band / 2, y: T, width: band, height: H - T - B, fill: "transparent" }, svg);
      hit.addEventListener("mouseenter", () => {
        const [px, py] = toPx(box, svg, cx, y(100));
        showTip(box, `<b>${qLabel(r.period)}</b>` + LAYERS.map(([k, , name]) => `<div class="r"><span>${name}</span><span>${n2(r[k])}</span></div>`).join("") + `<div class="r"><span>Sum</span><b>${n2(r.assets + r.cumPaid + r.cumLoss)}</b></div>`, px, py + 96);
      });
      hit.addEventListener("mouseleave", () => hideTip(box));
    });
    el("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), class: "baseline" }, svg);
  }

  /* ---------------- Gate sweep ---------------- */
  function drawSweep(boxId, sweep, key, curGate, fmt, label) {
    const box = $(boxId), W = 560, H = 260, L = 44, R = 20, T = 18, B = 30;
    const svg = svgFor(box, W, H, label);
    const vals = sweep.map((s) => s[key]);
    const ymax = niceMax(Math.max(...vals, key === "loss" ? 1 : 1) * 1.05);
    const x = (g) => L + (W - L - R) * ((g - 1) / 24);
    const y = (v) => T + (H - T - B) * (1 - v / ymax);
    const gr = el("g", { class: "grid" }, svg);
    ticks(0, ymax, 4).forEach((t) => { el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, gr); const tx = el("text", { x: L - 8, y: y(t) + 4, "text-anchor": "end", class: "tick" }, svg); tx.textContent = t; });
    [1, 5, 10, 15, 20, 25].forEach((t) => { const tx = el("text", { x: x(t), y: H - B + 18, "text-anchor": "middle", class: "tick" }, svg); tx.textContent = t + "%"; });
    el("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), class: "baseline" }, svg);
    el("polyline", { points: sweep.map((s) => x(s.gate) + "," + y(s[key])).join(" "), fill: "none", stroke: css("--s1"), "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
    const cur = sweep.find((s) => s.gate === curGate);
    el("circle", { cx: x(cur.gate), cy: y(cur[key]), r: 5, fill: css("--s1"), stroke: css("--bg"), "stroke-width": 2 }, svg);
    const below = y(cur[key]) < T + 18;
    const t = el("text", { x: x(cur.gate), y: y(cur[key]) + (below ? 20 : -10), "text-anchor": cur.gate > 21 ? "end" : cur.gate < 4 ? "start" : "middle", class: "lbl" }, svg);
    t.textContent = fmt(cur[key]);
    const hit = el("rect", { x: L - 6, y: T, width: W - L - R + 12, height: H - T - B, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", (ev) => {
      const r = svg.getBoundingClientRect(); const vx = (ev.clientX - r.left) * (W / r.width);
      const g = Math.max(1, Math.min(25, Math.round(((vx - L) / (W - L - R)) * 24) + 1));
      const s = sweep[g - 1], [px, py] = toPx(box, svg, x(g), y(s[key]));
      showTip(box, `<b>Gate ${g}%</b><div class="r"><span>Quarters</span><span>${s.quarters}</span></div><div class="r"><span>Haircut loss</span><span>${n2(s.loss)}</span></div>`, px, py);
    });
    hit.addEventListener("mouseleave", () => hideTip(box));
  }

  /* ---------------- Table ---------------- */
  function drawTable(rows, s) {
    let h = `<table><thead><tr><th scope="col">Quarter</th><th scope="col">Redemptions paid</th><th scope="col">Assets sold</th><th scope="col">Haircut loss</th><th scope="col">Assets remaining</th><th scope="col">Requests unpaid</th></tr></thead><tbody>`;
    rows.forEach((r) => { h += `<tr><td>${r.period}</td><td>${n2(r.paid)}</td><td>${n2(r.sold)}</td><td>${n2(r.loss)}</td><td>${n2(r.assets)}</td><td class="${r.pending > M.UNPAID_EPS && r === rows[rows.length - 1] ? "neg" : ""}">${n2(r.pending)}</td></tr>`; });
    if (rows.length) h += `<tr class="sum"><td>Total</td><td>${n2(s.paid)}</td><td>${n2(s.sold)}</td><td>${n2(s.loss)}</td><td>${n2(s.assets)}</td><td class="${s.unfunded ? "neg" : ""}">${n2(s.pending)}</td></tr>`;
    else h += `<tr><td colspan="6">No redemption request, so no quarters to account for.</td></tr>`;
    $("tbl").innerHTML = h + "</tbody></table>";
  }

  /* ---------------- Heatmap ---------------- */
  const REQ = [30, 40, 50, 60, 70, 80, 90, 100], HC = [0, 10, 15, 25, 40, 50, 60, 75];
  function drawGrid(v) {
    const grid = M.unpaidGrid(REQ, HC, v.gate);
    const near = (arr, x) => arr.reduce((b, a) => (Math.abs(a - x) < Math.abs(b - x) ? a : b), arr[0]);
    const nr = near(REQ, v.request), nh = near(HC, v.haircut);
    let h = `<div role="row" style="display:contents"><div class="h" role="columnheader" aria-label="Sale haircut"></div>` + REQ.map((r) => `<div class="h" role="columnheader">${r}%</div>`).join("") + `</div>`;
    grid.forEach((row, i) => {
      h += `<div role="row" style="display:contents"><div class="h" role="rowheader">${HC[i]}%</div>`;
      row.forEach((val, j) => {
        const cur = REQ[j] === nr && HC[i] === nh ? " cur" : "";
        if (val <= 0) { h += `<div class="c z${cur}" role="cell">0</div>`; return; }
        const a = Math.min(1, val / 75);
        h += `<div class="c${cur}" role="cell" style="background:color-mix(in srgb, var(--bad) ${Math.round(10 + a * 50)}%, var(--panel))">${Number.isInteger(+val.toFixed(2)) ? val.toFixed(0) : val.toFixed(1)}</div>`;
      });
      h += `</div>`;
    });
    $("hm").innerHTML = h;
  }

  /* ---------------- Update ---------------- */
  function syncPresets(v) {
    document.querySelectorAll(".seg button").forEach((b) => {
      const p = PRESETS[b.dataset.preset];
      b.setAttribute("aria-pressed", String(KNOBS.every((k) => p[k] === v[k])));
    });
  }
  function update() {
    const v = readKnobs();
    const rows = M.run(v.request, v.gate, v.haircut);
    const s = M.summarize(rows, v.request), led = M.ledger(rows, v.request);
    $("r-quarters").textContent = s.quarters;
    $("r-quarters-k").textContent = s.unfunded ? "Quarters, stopped at asset exhaustion" : v.request === 0 ? "Quarters simulated" : "Quarters, all requests fulfilled";
    $("r-loss").textContent = n2(s.loss);
    $("r-unpaid").textContent = n2(s.unfunded ? s.pending : 0);
    $("r-unpaid").classList.toggle("neg", s.unfunded);
    $("r-assets").textContent = n2(s.assets);
    $("r-cover").textContent = s.coverage == null ? "None left" : n2(s.coverage);
    drawPath(led); drawStack(led); drawTable(rows, s); drawGrid(v);
    const sweep = M.gateSweep(v.request, v.haircut);
    drawSweep("c-time", sweep, "quarters", v.gate, (q) => q + (q === 1 ? " quarter" : " quarters"), "Quarters needed at every gate from 1 to 25 percent");
    drawSweep("c-bill", sweep, "loss", v.gate, n2, "Total haircut loss at every gate from 1 to 25 percent");
    const ins = $("insight"); ins.classList.toggle("warn", s.unfunded);
    if (v.request === 0) ins.textContent = "No redemption request. All 100 of initial assets remain.";
    else if (s.unfunded) ins.textContent = `Assets are exhausted in quarter ${s.quarters} with ${n2(s.pending)} of requests unpaid. Selling the whole book raised ${n2(s.paid)} and the haircut took the other ${n2(s.loss)}.`;
    else if (v.haircut === 0) ins.textContent = `Requests are fulfilled in ${s.quarters} quarter${s.quarters === 1 ? "" : "s"}. With no haircut, the ${n2(s.paid)} paid out costs exactly ${n2(s.sold)} of book assets and nothing is lost.`;
    else ins.textContent = `Requests are fulfilled in ${s.quarters} quarter${s.quarters === 1 ? "" : "s"}. Raising ${n2(s.paid)} of cash took ${n2(s.sold)} of book assets, a loss of ${n2(s.loss)}.` + (s.coverage == null ? "" : ` Redeemers were paid in full, so ${n2(s.assets)} of assets now stands behind ${n2(s.claims)} of remaining claims.`);
    const a = sweep[0], b = sweep[sweep.length - 1];
    $("gate-insight").textContent = v.request === 0 ? "No requests, so no gate has anything to do."
      : `At these settings a 1% gate takes ${a.quarters} quarter${a.quarters === 1 ? "" : "s"} and a 25% gate takes ${b.quarters}. Total haircut loss is ${n2(a.loss)} at both.`;
    syncPresets(v);
  }

  document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => { setKnobs(PRESETS[b.dataset.preset]); update(); }));
  $("reset").addEventListener("click", () => { setKnobs(M.DEFAULTS); update(); });
  KNOBS.forEach((k) => $("k-" + k).addEventListener("input", update));

  /* ---------------- Boot ---------------- */
  setKnobs(M.DEFAULTS);
  update();
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", update);
  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
