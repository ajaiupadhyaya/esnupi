(function () {
  const M = window.LCModel;
  const $ = (id) => document.getElementById(id);
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const NS = "http://www.w3.org/2000/svg";
  const fmtM = (v) => (Math.abs(v) >= 1000 ? "$" + (v / 1000).toFixed(2) + "B" : "$" + v.toFixed(v < 10 ? 1 : 0) + "M");
  const pct = (v, d) => (v * 100).toFixed(d == null ? 1 : d) + "%";

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function svgFor(container, w, h) {
    const old = container.querySelector("svg"); if (old) old.remove();
    const s = el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img" });
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

  /* ---------------- State ---------------- */
  const KNOBS = {
    approval: { id: "k-approval", key: "approvalYear", fmt: (v) => String(v) },
    share: { id: "k-share", key: "lcShareScale", fmt: (v) => v.toFixed(2) + "×" },
    take: { id: "k-take", key: "physicalTake", fmt: (v) => pct(v, 2) },
    churn: { id: "k-churn", key: "churnTarget", fmt: (v) => v.toFixed(1) + "×" },
    dshare: { id: "k-dshare", key: "lcDerivShare", fmt: (v) => pct(v, 0) },
    fee: { id: "k-fee", key: "feePerContract", fmt: (v) => "$" + v.toFixed(2) },
    growth: { id: "k-growth", key: "growthScale", fmt: (v) => v.toFixed(2) + "×" },
    credit: { id: "k-credit", key: "creditScale", fmt: (v) => v.toFixed(2) + "×" },
  };
  let scenario = "base";
  function scenarioDefaults(sc) {
    const s = M.SCENARIOS[sc];
    return { approval: s.approvalYear, share: 1, take: s.physicalTake, churn: s.churnTarget, dshare: s.lcDerivShare, fee: s.feePerContract, growth: 1, credit: 1 };
  }
  function setKnobs(vals) {
    for (const k in KNOBS) { $(KNOBS[k].id).value = vals[k]; }
  }
  function readOverrides() {
    const o = {};
    for (const k in KNOBS) {
      const v = parseFloat($(KNOBS[k].id).value);
      $("o-" + k).textContent = KNOBS[k].fmt(v);
      o[KNOBS[k].key] = v;
    }
    return o;
  }

  /* ---------------- Revenue chart ---------------- */
  const LAYERS = [["brokerage", "--s1", "Order book"], ["exchange", "--s2", "Exchange"], ["data", "--s3", "Indices"], ["credit", "--s4", "Credit"]];
  function drawRevenue(res) {
    const box = $("c-rev"), W = 560, H = 320, L = 48, R = 12, T = 12, B = 30;
    const svg = svgFor(box, W, H);
    const rows = res.rows;
    const ymax = niceMax(Math.max(...rows.map((r) => Math.max(r.revenue, r.opex))) * 1.05);
    const y = (v) => T + (H - T - B) * (1 - v / ymax);
    const band = (W - L - R) / rows.length, bw = Math.min(46, band * 0.56);
    const g = el("g", { class: "grid" }, svg);
    ticks(0, ymax, 4).forEach((t) => { el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, g); const tx = el("text", { x: L - 8, y: y(t) + 4, "text-anchor": "end", class: "tick" }, svg); tx.textContent = t >= 1000 ? (t / 1000) + "B" : t; });
    rows.forEach((r, i) => {
      const cx = L + band * i + band / 2;
      let acc = 0;
      LAYERS.forEach(([k, col], j) => {
        const v = r[k]; if (v <= 0) return;
        const y0 = y(acc), y1 = y(acc + v); acc += v;
        const top = j === LAYERS.length - 1 || LAYERS.slice(j + 1).every(([kk]) => r[kk] <= 0);
        const h = Math.max(0, y0 - y1 - (acc > v ? 2 : 0));
        if (h < 0.5) return;
        el("rect", { x: cx - bw / 2, y: y1, width: bw, height: h, fill: `var(${col})`, rx: top ? 3 : 0 }, svg);
      });
      const tx = el("text", { x: cx, y: H - B + 18, "text-anchor": "middle", class: "tick" }, svg); tx.textContent = r.year;
      const hit = el("rect", { x: cx - band / 2, y: T, width: band, height: H - T - B, fill: "transparent" }, svg);
      hit.addEventListener("mouseenter", () => {
        const [px, py] = toPx(box, svg, cx, y(Math.max(r.revenue, r.opex)));
        showTip(box, `<b>${r.year}</b>` + LAYERS.map(([k, , n]) => `<div class="r"><span>${n}</span><span>${fmtM(r[k])}</span></div>`).join("") +
          `<div class="r"><span>Revenue</span><b>${fmtM(r.revenue)}</b></div><div class="r"><span>Opex</span><span>${fmtM(r.opex)}</span></div><div class="r"><span>EBITDA</span><span>${fmtM(r.ebitda)}</span></div>`, px, py);
      });
      hit.addEventListener("mouseleave", () => hideTip(box));
    });
    el("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), class: "baseline" }, svg);
    const pts = rows.map((r, i) => [L + band * i + band / 2, y(r.opex)]);
    el("polyline", { points: pts.map((p) => p.join(",")).join(" "), fill: "none", stroke: css("--ink"), "stroke-width": 2, "stroke-linejoin": "round" }, svg);
    pts.forEach((p) => el("circle", { cx: p[0], cy: p[1], r: 3.5, fill: css("--bg"), stroke: css("--ink"), "stroke-width": 2 }, svg));
    const last = rows[rows.length - 1];
    const lx = L + band * (rows.length - 1) + band / 2;
    const t2 = el("text", { x: lx, y: y(last.revenue) - 8, "text-anchor": "middle", class: "lbl" }, svg); t2.textContent = fmtM(last.revenue);
  }

  /* ---------------- Cash chart (three scenarios, current levers applied to selected) ---------------- */
  function drawCash(results) {
    const box = $("c-cash"), W = 560, H = 320, L = 52, R = 50, T = 14, B = 30;
    const svg = svgFor(box, W, H);
    const years = [2026].concat(M.YEARS);
    const series = ["bear", "base", "bull"].map((k, i) => ({ k, col: ["--s3", "--s1", "--s2"][i], vals: [15].concat(results[k].rows.map((r) => r.cumCash)) }));
    const all = series.flatMap((s) => s.vals);
    const scaled = series.filter((s) => s.k !== "bull" || scenario === "bull").flatMap((s) => s.vals);
    let lo = Math.min(0, ...all), hi = Math.max(60, ...scaled) * 1.15;
    const tk = ticks(lo, hi, 5); lo = Math.min(lo, tk[0]); hi = Math.max(hi, tk[tk.length - 1]);
    const x = (i) => L + (W - L - R) * (i / (years.length - 1));
    const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    const g = el("g", { class: "grid" }, svg);
    tk.forEach((t) => { el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, g); const tx = el("text", { x: L - 8, y: y(t) + 4, "text-anchor": "end", class: "tick" }, svg); tx.textContent = t; });
    years.forEach((yr, i) => { const tx = el("text", { x: x(i), y: H - B + 18, "text-anchor": "middle", class: "tick" }, svg); tx.textContent = yr; });
    el("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), stroke: css("--ink-2"), "stroke-width": 1 }, svg);
    const cid = "clip" + Math.random().toString(36).slice(2, 8);
    const cp = el("clipPath", { id: cid }, el("defs", {}, svg));
    el("rect", { x: L - 2, y: T - 2, width: W - L - R + 4, height: H - T - B + 4 }, cp);
    series.forEach((s) => {
      const sel = s.k === scenario;
      const lvAll = s.vals[s.vals.length - 1];
      if (lvAll > hi) {
        const xi = s.vals.findIndex((v) => v > hi);
        const t2 = el("text", { x: x(Math.max(0, xi - 1)) - 6, y: T + 10, "text-anchor": "end", class: sel ? "lbl" : "lbl2" }, svg); t2.textContent = M.SCENARIOS[s.k].label + " ↑ " + fmtM(lvAll) + " by 2032";
        el("polyline", { points: s.vals.map((v, i) => x(i) + "," + y(v)).join(" "), fill: "none", stroke: css(s.col), "stroke-width": sel ? 2.5 : 1.5, opacity: sel ? 1 : 0.55, "clip-path": `url(#${cid})` }, svg);
        return;
      }
      el("polyline", { points: s.vals.map((v, i) => x(i) + "," + y(v)).join(" "), fill: "none", stroke: css(s.col), "stroke-width": sel ? 2.5 : 1.5, opacity: sel ? 1 : 0.55, "stroke-linejoin": "round" }, svg);
      const lv = s.vals[s.vals.length - 1];
      const tx = el("text", { x: W - R + 6, y: Math.min(H - B, Math.max(T + 8, y(lv) + 4)), class: sel ? "lbl" : "lbl2" }, svg); tx.textContent = M.SCENARIOS[s.k].label;
    });
    // hover crosshair
    const cross = el("line", { y1: T, y2: H - B, stroke: css("--axis"), "stroke-width": 1, opacity: 0 }, svg);
    const hit = el("rect", { x: L, y: T, width: W - L - R, height: H - T - B, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", (ev) => {
      const r = svg.getBoundingClientRect(); const vx = (ev.clientX - r.left) * (W / r.width);
      const i = Math.max(0, Math.min(years.length - 1, Math.round(((vx - L) / (W - L - R)) * (years.length - 1))));
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("opacity", 1);
      const [px, py] = toPx(box, svg, x(i), T + 30);
      showTip(box, `<b>${years[i]}</b>` + series.map((s) => `<div class="r"><span>${M.SCENARIOS[s.k].label}</span><span>${fmtM(s.vals[i])}</span></div>`).join(""), px, py + 60);
    });
    hit.addEventListener("mouseleave", () => { cross.setAttribute("opacity", 0); hideTip(box); });
  }

  /* ---------------- Table ---------------- */
  function drawTable(res) {
    const rows = res.rows;
    const lines = [
      ["GPU rental market ($B)", (r) => r.marketB.toFixed(1)],
      ["Blended index price ($/GPU-hr)", (r) => r.price.toFixed(2)],
      ["Liquid Compute GMV ($B)", (r) => r.gmvB.toFixed(2)],
      ["Derivatives churn (× physical)", (r) => r.churn.toFixed(2)],
      ["Contracts on PMEX (M)", (r) => r.contractsM.toFixed(2)],
      ["Order book revenue", (r) => r.brokerage.toFixed(1)],
      ["Exchange & clearing revenue", (r) => r.exchange.toFixed(1)],
      ["Index & data revenue", (r) => r.data.toFixed(1)],
      ["Credit revenue", (r) => r.credit.toFixed(1)],
      ["Total revenue ($M)", (r) => r.revenue.toFixed(1), "sum"],
      ["Operating cost ($M)", (r) => r.opex.toFixed(1)],
      ["EBITDA ($M)", (r) => r.ebitda.toFixed(1), "neg"],
      ["Cumulative cash ($M)", (r) => r.cumCash.toFixed(1), "neg"],
    ];
    let h = `<table><thead><tr><th scope="col">${M.SCENARIOS[scenario].label} case, with your levers</th>${rows.map((r) => `<th scope="col">${r.year}</th>`).join("")}</tr></thead><tbody>`;
    lines.forEach(([n, f, cls]) => {
      h += `<tr class="${cls === "sum" ? "sum" : ""}"><td>${n}</td>${rows.map((r) => { const v = f(r); return `<td class="${cls === "neg" && parseFloat(v) < 0 ? "neg" : ""}">${v}</td>`; }).join("")}</tr>`;
    });
    $("tbl").innerHTML = h + "</tbody></table>";
  }

  function update() {
    const ov = readOverrides();
    const sel = M.run(scenario, ov);
    const results = {};
    ["bear", "base", "bull"].forEach((k) => { results[k] = k === scenario ? sel : M.run(k); });
    const r30 = sel.rows.find((r) => r.year === 2030), r32 = sel.rows[sel.rows.length - 1];
    $("r-rev32").textContent = fmtM(r32.revenue);
    $("r-rev30").textContent = fmtM(r30.revenue);
    $("r-be").textContent = sel.breakevenYear || "After 2032";
    $("r-gap").textContent = sel.fundingGapM > 0 ? fmtM(sel.fundingGapM) : "None";
    $("r-gap").classList.toggle("neg", sel.fundingGapM > 0);
    $("r-ev").textContent = fmtM(sel.ev2032); $("r-pv").textContent = fmtM(sel.pvToday);
    drawRevenue(sel); drawCash(results); drawTable(sel);
    const mix = r32.revenue > 0 ? r32.brokerage / r32.revenue : 0;
    const exch30 = r30.revenue > 0 ? r30.exchange / r30.revenue : 0;
    $("insight").textContent =
      `In this case the order book is ${pct(mix, 0)} of 2032 revenue, and exchange fees are ${pct(exch30, 0)} of 2030 revenue. ` +
      (sel.fundingGapM > 0 ? `Cash bottoms in ${sel.troughYear}, ${fmtM(sel.fundingGapM)} below zero, so the plan needs a Series A sized at least that large before the exchange matures.` : `The seed carries the plan to breakeven without new equity, which only happens if approval and volume come early.`);
  }

  document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => {
    scenario = b.dataset.sc;
    document.querySelectorAll(".seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    setKnobs(scenarioDefaults(scenario)); update();
  }));
  $("reset").addEventListener("click", () => { setKnobs(scenarioDefaults(scenario)); update(); });
  for (const k in KNOBS) $(KNOBS[k].id).addEventListener("input", update);
  $("tbl-toggle").addEventListener("click", () => {
    const open = $("tbl").hidden; $("tbl").hidden = !open;
    $("tbl-toggle").setAttribute("aria-expanded", String(open));
    $("tbl-toggle").textContent = open ? "Hide the full P&L table" : "Show the full P&L table";
  });

  /* ---------------- Curve charts ---------------- */
  function drawCurve() {
    const box = $("c-curve"), W = 560, H = 280, L = 44, R = 16, T = 22, B = 34;
    const svg = svgFor(box, W, H);
    const pts = [["On-demand", 0, 5.97], ["1 mo", 1, 5.30], ["6 mo", 6, 5.15], ["12 mo", 12, 5.05], ["24 mo", 24, 4.60], ["36 mo", 36, 4.25]];
    const lo = 4, hi = 6.25;
    const x = (m) => L + (W - L - R) * (m / 36);
    const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    const g = el("g", { class: "grid" }, svg);
    [4, 4.5, 5, 5.5, 6].forEach((t) => { el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, g); const tx = el("text", { x: L - 8, y: y(t) + 4, "text-anchor": "end", class: "tick" }, svg); tx.textContent = t.toFixed(2); });
    [0, 6, 12, 18, 24, 30, 36].forEach((m) => { const tx = el("text", { x: x(m), y: H - B + 18, "text-anchor": "middle", class: "tick" }, svg); tx.textContent = m === 0 ? "spot" : m + "m"; });
    el("line", { x1: L, x2: W - R, y1: H - B, y2: H - B, class: "baseline" }, svg);
    el("polyline", { points: pts.map((p) => x(p[1]) + "," + y(p[2])).join(" "), fill: "none", stroke: css("--s1"), "stroke-width": 2, "stroke-linejoin": "round" }, svg);
    pts.forEach((p, i) => {
      el("circle", { cx: x(p[1]), cy: y(p[2]), r: 4, fill: css("--s1"), stroke: css("--bg"), "stroke-width": 2 }, svg);
      if (i === 0 || i === 3 || i === 5) { const tx = el("text", { x: x(p[1]) + (i === 0 ? 8 : 0), y: y(p[2]) - 10, "text-anchor": i === 0 ? "start" : i === 5 ? "end" : "middle", class: "lbl" }, svg); tx.textContent = "$" + p[2].toFixed(2); }
      const hit = el("circle", { cx: x(p[1]), cy: y(p[2]), r: 14, fill: "transparent" }, svg);
      hit.addEventListener("mouseenter", () => { const [px, py] = toPx(box, svg, x(p[1]), y(p[2])); showTip(box, `<b>${p[0]}</b><div class="r"><span>Price</span><span>$${p[2].toFixed(2)}</span></div><div class="r"><span>Discount to spot</span><span>${pct(1 - p[2] / 5.97, 1)}</span></div>`, px, py); });
      hit.addEventListener("mouseleave", () => hideTip(box));
    });
    const sp = el("text", { x: x(36), y: y(5.97) + 4, "text-anchor": "end", class: "lbl2" }, svg); sp.textContent = "spot → 36m: −$1.72 (−29%)";
  }
  function drawH100() {
    const box = $("c-h100"), W = 560, H = 280, L = 44, R = 16, T = 22, B = 34;
    const svg = svgFor(box, W, H);
    // Only the three prints LC published; drawn as dated points joined by straight segments (not a series).
    const pts = [["Jun 30, 2025", 0, 2.95, "Blackwell Ultra volume confirmed"], ["late Dec 2025", 6, 1.84, "Low: −38% from June"], ["Aug 29, 2026", 14, 2.57, "+40% from the low"]];
    const lo = 1.5, hi = 3.25;
    const x = (m) => L + 20 + (W - L - R - 40) * (m / 14);
    const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    const g = el("g", { class: "grid" }, svg);
    [1.5, 2, 2.5, 3].forEach((t) => { el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, g); const tx = el("text", { x: L - 8, y: y(t) + 4, "text-anchor": "end", class: "tick" }, svg); tx.textContent = t.toFixed(2); });
    el("line", { x1: L, x2: W - R, y1: H - B, y2: H - B, class: "baseline" }, svg);
    el("polyline", { points: pts.map((p) => x(p[1]) + "," + y(p[2])).join(" "), fill: "none", stroke: css("--s1"), "stroke-width": 2 }, svg);
    pts.forEach((p, i) => {
      el("circle", { cx: x(p[1]), cy: y(p[2]), r: 4.5, fill: css("--s1"), stroke: css("--bg"), "stroke-width": 2 }, svg);
      const t1 = el("text", { x: x(p[1]), y: H - B + 18, "text-anchor": i === 0 ? "start" : i === 2 ? "end" : "middle", class: "tick" }, svg); t1.textContent = p[0];
      const above = i !== 1;
      const t2 = el("text", { x: x(p[1]), y: y(p[2]) + (above ? -12 : 20), "text-anchor": i === 0 ? "start" : i === 2 ? "end" : "middle", class: "lbl" }, svg); t2.textContent = "$" + p[2].toFixed(2);
      const t3 = el("text", { x: x(p[1]), y: y(p[2]) + (above ? -26 : 34), "text-anchor": i === 0 ? "start" : i === 2 ? "end" : "middle", class: "lbl2" }, svg); t3.textContent = p[3];
    });
  }

  /* ---------------- Tenor grid ---------------- */
  function drawGrid() {
    const cost = parseFloat($("k-cost").value);
    $("o-cost").textContent = "$" + cost.toFixed(2) + "/hr";
    const grid = M.tenorGrid(cost);
    const prices = [5.75, 5.50, 5.30, 5.00, 4.75, 4.50], fills = [1, 0.95, 0.9, 0.85, 0.8, 0.75];
    const maxAbs = Math.max(...grid.flat().map(Math.abs));
    let h = `<div class="h" role="columnheader">re-let ↓ fill →</div>` + fills.map((f) => `<div class="h" role="columnheader">${pct(f, 0)}</div>`).join("");
    grid.forEach((row, i) => {
      h += `<div class="h" role="rowheader">$${prices[i].toFixed(2)}</div>`;
      row.forEach((v) => {
        const a = Math.min(1, Math.abs(v) / maxAbs);
        const base = v > 0 ? "--s1" : "--bad";
        h += `<div class="c" role="cell" style="background:color-mix(in srgb, var(${base}) ${Math.round(8 + a * 52)}%, var(--panel))">${v > 0 ? "+" : ""}${Math.round(v)}</div>`;
      });
    });
    $("hm").innerHTML = h;
  }
  $("k-cost").value = 4.25; $("k-cost").addEventListener("input", drawGrid);

  /* ---------------- Monte Carlo ---------------- */
  const MC = {
    hedge: { id: "m-hedge", key: "hedgeRatio", v: 0.33, fmt: (v) => pct(v, 0) },
    fill: { id: "m-fill", key: "fill0", v: 0.95, fmt: (v) => pct(v, 0) },
    beta: { id: "m-beta", key: "fillBeta", v: 0.35, fmt: (v) => v.toFixed(2) },
    vol: { id: "m-vol", key: "volMo", v: 0.06, fmt: (v) => pct(v, 1) },
    jump: { id: "m-jump", key: "jumpPerYear", v: 0.5, fmt: (v) => v.toFixed(1) },
    basis: { id: "m-basis", key: "basisVol", v: 0.15, fmt: (v) => "$" + v.toFixed(2) },
  };
  for (const k in MC) { $(MC[k].id).value = MC[k].v; }
  function drawPaths(sim) {
    const box = $("c-paths"), W = 560, H = 280, L = 44, R = 16, T = 12, B = 30;
    const svg = svgFor(box, W, H);
    const paths = sim.samplePaths;
    const all = paths.flat().concat([sim.opts.cost]);
    const lo = Math.floor(Math.min(...all) * 2) / 2, hi = Math.ceil(Math.max(...all) * 2) / 2;
    const x = (m) => L + (W - L - R) * (m / (sim.opts.months - 1));
    const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    const g = el("g", { class: "grid" }, svg);
    ticks(lo, hi, 4).forEach((t) => { el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, g); const tx = el("text", { x: L - 8, y: y(t) + 4, "text-anchor": "end", class: "tick" }, svg); tx.textContent = t.toFixed(2); });
    [0, 12, 24, 35].forEach((m) => { const tx = el("text", { x: x(m), y: H - B + 18, "text-anchor": "middle", class: "tick" }, svg); tx.textContent = "m" + (m + 1); });
    paths.forEach((p) => el("polyline", { points: p.map((v, i) => x(i) + "," + y(v)).join(" "), fill: "none", stroke: css("--s1"), "stroke-width": 1, opacity: 0.32 }, svg));
    el("line", { x1: L, x2: W - R, y1: y(sim.opts.cost), y2: y(sim.opts.cost), stroke: css("--bad"), "stroke-width": 2 }, svg);
    const t = el("text", { x: W - R, y: y(sim.opts.cost) - 6, "text-anchor": "end", class: "lbl" }, svg); t.textContent = "cost $" + sim.opts.cost.toFixed(2);
  }
  function drawHist(sim) {
    const box = $("c-hist"), W = 560, H = 280, L = 44, R = 16, T = 12, B = 30;
    const svg = svgFor(box, W, H);
    const u = sim.unhedged.sorted, h = sim.hedged.sorted;
    const lo = Math.floor(Math.min(u[Math.floor(u.length * 0.005)], h[Math.floor(h.length * 0.005)])), hi = Math.ceil(Math.max(u[Math.floor(u.length * 0.995)], h[Math.floor(h.length * 0.995)]));
    const nb = 36, bwid = (hi - lo) / nb;
    const bin = (arr) => { const c = new Array(nb).fill(0); arr.forEach((v) => { const i = Math.floor((v - lo) / bwid); if (i >= 0 && i < nb) c[i]++; }); return c.map((n) => n / arr.length); };
    const bu = bin(u), bh = bin(h), ymax = niceMax(Math.max(...bu, ...bh));
    const x = (v) => L + (W - L - R) * ((v - lo) / (hi - lo));
    const y = (v) => T + (H - T - B) * (1 - v / ymax);
    const g = el("g", { class: "grid" }, svg);
    ticks(0, ymax, 3).forEach((t) => { el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, g); const tx = el("text", { x: L - 8, y: y(t) + 4, "text-anchor": "end", class: "tick" }, svg); tx.textContent = pct(t, 0); });
    ticks(lo, hi, 6).forEach((t) => { const tx = el("text", { x: x(t), y: H - B + 18, "text-anchor": "middle", class: "tick" }, svg); tx.textContent = (t > 0 ? "+" : "") + t; });
    if (lo < 0 && hi > 0) {
      el("rect", { x: L, y: T, width: x(0) - L, height: H - T - B, fill: css("--bad"), opacity: 0.06 }, svg);
      el("line", { x1: x(0), x2: x(0), y1: T, y2: H - B, stroke: css("--ink-2"), "stroke-width": 1 }, svg);
      const tl = el("text", { x: L + 6, y: H - B - 8, class: "lbl2" }, svg); tl.textContent = "← loss";
    }
    const step = (c) => { let d = `M${x(lo)},${y(0)}`; c.forEach((v, i) => { d += `L${x(lo + i * bwid)},${y(v)}L${x(lo + (i + 1) * bwid)},${y(v)}`; }); return d + `L${x(hi)},${y(0)}`; };
    el("path", { d: step(bu), fill: "none", stroke: css("--s1"), "stroke-width": 2, "stroke-linejoin": "round" }, svg);
    el("path", { d: step(bh), fill: "none", stroke: css("--s2"), "stroke-width": 2, "stroke-linejoin": "round" }, svg);
    el("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), class: "baseline" }, svg);
    const hit = el("rect", { x: L, y: T, width: W - L - R, height: H - T - B, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", (ev) => {
      const r = svg.getBoundingClientRect(); const vx = (ev.clientX - r.left) * (W / r.width);
      const i = Math.max(0, Math.min(nb - 1, Math.floor(((vx - L) / (W - L - R)) * nb)));
      const [px, py] = toPx(box, svg, x(lo + (i + 0.5) * bwid), y(Math.max(bu[i], bh[i])));
      showTip(box, `<b>$${(lo + i * bwid).toFixed(2)}M to $${(lo + (i + 1) * bwid).toFixed(2)}M</b><div class="r"><span>Unhedged</span><span>${pct(bu[i])}</span></div><div class="r"><span>Hedged</span><span>${pct(bh[i])}</span></div>`, px, py);
    });
    hit.addEventListener("mouseleave", () => hideTip(box));
  }
  let mcTimer = null;
  function runMC() {
    const o = {};
    for (const k in MC) { const v = parseFloat($(MC[k].id).value); $("mo-" + k).textContent = MC[k].fmt(v); o[MC[k].key] = v; }
    const sim = M.tenorSim(o);
    const U = sim.unhedged, Hh = sim.hedged, f = (v) => (v >= 0 ? "+$" : "−$") + Math.abs(v).toFixed(2) + "M";
    $("mr-mu").textContent = f(U.mean); $("mr-mh").textContent = f(Hh.mean);
    $("mr-p5").textContent = f(U.p05) + " → " + f(Hh.p05);
    $("mr-pl").textContent = pct(U.pLoss, 0) + " → " + pct(Hh.pLoss, 0);
    drawPaths(sim); drawHist(sim);
    const sdCut = 1 - Hh.sd / U.sd;
    $("mc-insight").textContent = `On $2.14M of prepaid capital, the trade earns ${f(U.mean)} on average but loses money in ${pct(U.pLoss, 0)} of paths. ` +
      `A ${pct(o.hedgeRatio, 0)} hedge cuts the spread of outcomes by ${pct(Math.max(0, sdCut), 0)} and barely moves the loss probability, because a price hedge does nothing about empty racks. ` +
      `Try raising the base fill instead: placement improves the mean far more than the hedge does. That is the case for Liquid Compute's brokerage as the real risk reducer.`;
  }
  for (const k in MC) $(MC[k].id).addEventListener("input", () => { clearTimeout(mcTimer); mcTimer = setTimeout(runMC, 60); });

  /* ---------------- Boot ---------------- */
  setKnobs(scenarioDefaults("base"));
  update(); drawCurve(); drawH100(); drawGrid(); runMC();
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const redraw = () => { update(); drawCurve(); drawH100(); runMC(); };
  if (mq.addEventListener) mq.addEventListener("change", redraw);
  new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
