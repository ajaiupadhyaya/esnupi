(function () {
  const M = window.FDQModel;
  const $ = (id) => document.getElementById(id);
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const NS = "http://www.w3.org/2000/svg";

  /* Slider stops: every published tier plus the $1.11 ruin line sits on a stop exactly. */
  const CAPITALS = [1, 1.11, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];

  const money = (v) => {
    if (v >= 1000) return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return "$" + v.toFixed(2);
  };
  const cents = (v) => {
    const c = v * 100;
    if (c >= 1000) return c.toLocaleString("en-US", { maximumFractionDigits: 0 }) + "¢";
    if (c >= 100) return c.toFixed(1) + "¢";
    return c.toFixed(c < 10 ? 3 : 2) + "¢";
  };
  const centsShort = (v) => (v * 100 < 10 ? (v * 100).toFixed(2) + "¢" : cents(v));
  /* $0.999 must not print as $1.00 beside a $1.00 minimum it fails. */
  const order = (v) => (v < 1 && v.toFixed(2) === "1.00" ? "$" + v.toFixed(3) : money(v));
  const pct = (v, d) => (v * 100).toFixed(d == null ? 1 : d) + "%";

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
  function fromPx(svg, clientX) {
    const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    return (clientX - r.left) * (vb.width / r.width);
  }

  /* ---------------- State ---------------- */
  const D = M.DEFAULTS;
  const state = { capital: D.capital, weight: D.weight, turnover: D.turnover, symbol: D.symbol, mid: D.mid, vix: D.vix, stress: D.stress };
  const VIX_ON = M.FRICTION_V1.vix_spread_threshold + 1; // any VIX above the threshold widens the spread the same way

  const cfg = () => M.withStress(M.FRICTION_V1, state.stress);

  function syncControls() {
    $("k-capital").value = CAPITALS.indexOf(state.capital);
    $("k-capital").setAttribute("aria-valuetext", money(state.capital));
    $("k-weight").value = Math.round(state.weight * 100);
    $("k-turnover").value = state.turnover;
    $("k-mid").value = state.mid;
    $("k-symbol").value = state.symbol;
    $("k-vix").checked = state.vix !== null;
    document.querySelectorAll("[data-cap]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.cap === state.capital)));
    document.querySelectorAll("[data-stress]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.stress === state.stress)));
  }

  /* ---------------- Readouts ---------------- */
  function renderReadouts(c, rt) {
    $("o-capital").textContent = money(state.capital);
    $("o-weight").textContent = Math.round(state.weight * 100) + "% · " + order(rt.ticket);
    $("o-turnover").textContent = state.turnover.toFixed(1);
    $("o-mid").textContent = "$" + state.mid;
    $("r-ticket").textContent = order(rt.ticket);
    const total = $("r-total"), bps = $("r-bps"), share = $("r-share"), year = $("r-year");
    [total, bps, share, year].forEach((e) => e.classList.remove("neg"));
    if (rt.accepted) {
      total.textContent = centsShort(rt.total);
      bps.textContent = rt.bps.toFixed(1) + " bp";
      share.textContent = pct(rt.feeShare, 0);
      year.textContent = pct(rt.perYearPct, 2);
    } else {
      total.textContent = "Rejected"; total.classList.add("neg");
      bps.textContent = "No fill"; share.textContent = "None"; year.textContent = "0.00%";
    }
  }

  function renderInsight(c, rt) {
    const box = $("insight"), pos = rt.maxPositions;
    if (!rt.accepted) {
      const minWeight = c.min_notional / M.maxDeployable(c, state.capital);
      box.textContent = minWeight <= 1
        ? `${order(rt.ticket)} is under the $1.00 minimum, so the order is rejected and logged. Nothing fills and nothing is charged. At ${money(state.capital)} the smallest trade size that fills is ${Math.ceil(minWeight * 100)}% of deployable cash.`
        : `${order(rt.ticket)} is under the $1.00 minimum, and at ${money(state.capital)} no trade size can reach it. The project sets its ruin line at $1.11, about where this happens.`;
      return;
    }
    const floors = [];
    if (rt.sell.sec_fee === c.sec_fee_minimum) floors.push("the SEC minimum");
    if (rt.sell.finra_taf === c.finra_taf_minimum) floors.push("the FINRA minimum");
    const secLine = c.sec_fee_minimum / c.sec_fee_rate, tafLine = c.finra_taf_minimum / c.finra_taf_per_share;
    const lead = floors.length === 2 ? "Both one-cent minimums bind on this sale." : floors.length === 1 ? `Only ${floors[0]} binds on this sale.` : "Neither minimum binds on this sale, so fees are proportional here.";
    box.textContent = `${lead} A purchase costs ${cents(rt.buy.total_friction)} and a sale ${cents(rt.sell.total_friction)}. The SEC minimum stops binding above ${money(secLine)} sold, the FINRA minimum above ${tafLine.toFixed(0)} shares. At ${money(state.capital)} the $1.00 minimum allows ${pos.toLocaleString("en-US")} concurrent position${pos === 1 ? "" : "s"}.`;
  }

  function renderLegs(c, rt) {
    const secBind = rt.sell.sec_fee === c.sec_fee_minimum, tafBind = rt.sell.finra_taf === c.finra_taf_minimum;
    const hs = M.spreadBps(c, state.symbol, state.vix) / 2;
    const leg = (name, f, sell) => `<tr><td>${name}</td><td>${money(f.notional)}</td><td>${hs.toFixed(2)} bp</td><td>$${f.execution_price.toFixed(4)}</td><td>${f.shares.toFixed(6)}</td><td>${cents(f.spread_cost)}</td><td class="${sell && secBind ? "bind" : ""}">${sell ? cents(f.sec_fee) : "none"}</td><td class="${sell && tafBind ? "bind" : ""}">${sell ? cents(f.finra_taf) : "none"}</td><td>${cents(f.total_friction)}</td></tr>`;
    const head = `<thead><tr><th>${rt.accepted ? "Leg" : "Leg (rejected, shown for scale)"}</th><th>Notional</th><th>Half-spread</th><th>Fill price</th><th>Shares</th><th>Spread</th><th>SEC fee</th><th>FINRA TAF</th><th>Total</th></tr></thead>`;
    const sum = `<tr class="sum"><td>Round trip</td><td></td><td></td><td></td><td></td><td>${cents(rt.spread)}</td><td>${cents(rt.sell.sec_fee)}</td><td>${cents(rt.sell.finra_taf)}</td><td>${cents(rt.total)}</td></tr>`;
    $("legs").innerHTML = head + "<tbody>" + leg("Buy", rt.buy, false) + leg("Sell", rt.sell, true) + sum + "</tbody>";
  }

  /* ---------------- Charts ---------------- */
  const logX = (lo, hi, x0, x1) => (v) => x0 + ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * (x1 - x0);
  const invLogX = (lo, hi, x0, x1) => (px) => Math.pow(10, Math.log10(lo) + ((px - x0) / (x1 - x0)) * (Math.log10(hi) - Math.log10(lo)));
  const moneyAxis = (v) => (v >= 1000 ? "$" + v / 1000 + "k" : "$" + v);

  function axisX(svg, x, T, B, H, values) {
    values.forEach((v) => {
      const t = el("text", { x: x(v), y: H - B + 18, "text-anchor": "middle", class: "tick" }, svg);
      t.textContent = moneyAxis(v);
    });
  }

  function drawTicket(c) {
    const box = $("c-ticket"), W = 560, H = 320, L = 48, R = 14, T = 16, B = 30;
    const lo = 0.25, hi = 100000, x = logX(lo, hi, L, W - R), inv = invLogX(lo, hi, L, W - R);
    const cost = (n) => {
      const a = M.applyFill(c, state.mid, "buy", n, state.symbol, state.vix), b = M.applyFill(c, state.mid, "sell", n, state.symbol, state.vix);
      return { total: ((a.total_friction + b.total_friction) / n) * 10000, spread: ((a.spread_cost + b.spread_cost) / n) * 10000 };
    };
    const pts = []; for (let i = 0; i <= 160; i++) { const n = Math.max(c.min_notional, Math.pow(10, Math.log10(c.min_notional) + (i / 160) * (Math.log10(hi) - Math.log10(c.min_notional)))); pts.push(n); }
    const ymax = niceMax(cost(c.min_notional).total * 1.05);
    const y = (v) => T + (H - T - B) * (1 - v / ymax);
    const rt = M.roundTrip(c, state);
    const svg = svgFor(box, W, H, rt.accepted ? `Round trip costs ${rt.bps.toFixed(1)} basis points on a ${money(rt.ticket)} order and falls as the order grows.` : `An order of ${money(rt.ticket)} is under the $1.00 minimum and is rejected.`);
    el("rect", { x: L, y: T, width: x(c.min_notional) - L, height: H - T - B, fill: css("--accent-wash") }, svg);
    const g = el("g", { class: "grid" }, svg);
    ticks(0, ymax, 4).forEach((t) => { el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, g); const tx = el("text", { x: L - 8, y: y(t) + 4, "text-anchor": "end", class: "tick" }, svg); tx.textContent = t; });
    axisX(svg, x, T, B, H, [1, 10, 100, 1000, 10000, 100000]);
    el("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), class: "baseline" }, svg);
    el("polyline", { points: pts.map((n) => `${x(n).toFixed(1)},${y(cost(n).spread).toFixed(1)}`).join(" "), fill: "none", stroke: css("--s2"), "stroke-width": 2, "stroke-linejoin": "round" }, svg);
    el("polyline", { points: pts.map((n) => `${x(n).toFixed(1)},${y(cost(n).total).toFixed(1)}`).join(" "), fill: "none", stroke: css("--s1"), "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
    const nx = Math.max(lo, Math.min(hi, rt.ticket));
    if (rt.accepted) {
      const cx = x(nx), cy = y(cost(nx).total);
      el("circle", { cx, cy, r: 5, fill: css("--s1"), stroke: css("--bg"), "stroke-width": 2 }, svg);
      const t = el("text", { x: Math.min(cx + 10, W - R - 66), y: cy - 10, class: "lbl" }, svg); t.textContent = rt.bps.toFixed(1) + " bp";
    } else {
      el("line", { x1: x(nx), x2: x(nx), y1: T, y2: H - B, stroke: css("--bad"), "stroke-width": 1.5, "stroke-dasharray": "3 4" }, svg);
    }
    const hit = el("rect", { x: L, y: T, width: W - L - R, height: H - T - B, fill: "transparent" }, svg);
    const move = (e) => {
      const n = Math.max(lo, Math.min(hi, inv(fromPx(svg, e.clientX))));
      const [px, py] = toPx(box, svg, x(n), T + 40);
      if (n < c.min_notional) { showTip(box, `<div class="r"><span>Order</span><span>${money(n)}</span></div><div>Rejected, under $1.00</div>`, px, py); return; }
      const v = cost(n);
      showTip(box, `<div class="r"><span>Order</span><span>${money(n)}</span></div><div class="r"><span>All friction</span><span>${v.total.toFixed(1)} bp</span></div><div class="r"><span>Spread only</span><span>${v.spread.toFixed(1)} bp</span></div>`, px, py);
    };
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerleave", () => hideTip(box));
  }

  function drawCapital(c) {
    const box = $("c-capital"), W = 560, H = 320, L = 48, R = 14, T = 16, B = 30;
    const lo = 1, hi = 100000, x = logX(lo, hi, L, W - R), inv = invLogX(lo, hi, L, W - R);
    const at = (cap) => M.roundTrip(c, { capital: cap, weight: state.weight, turnover: state.turnover, symbol: state.symbol, mid: state.mid, vix: state.vix });
    const caps = []; for (let i = 0; i <= 200; i++) caps.push(Math.pow(10, (i / 200) * 5));
    const minCap = c.min_notional / (state.weight * (1 - c.cash_buffer_pct));
    if (minCap > 1 && minCap < hi) caps.push(minCap, minCap * (1 + 1e-9));
    caps.sort((a, b) => a - b);
    const vals = caps.map((v) => [v, at(v)]);
    const ymax = niceMax(Math.max(0.1, ...vals.map(([, r]) => r.perYearPct * 100)) * 1.05);
    const y = (v) => T + (H - T - B) * (1 - v / ymax);
    const cur = at(state.capital);
    const svg = svgFor(box, W, H, `At this trade size and turnover the model costs ${pct(cur.perYearPct, 2)} of capital a year at ${money(state.capital)}.`);
    if (minCap > lo) el("rect", { x: L, y: T, width: Math.min(x(Math.min(minCap, hi)), W - R) - L, height: H - T - B, fill: css("--accent-wash") }, svg);
    const g = el("g", { class: "grid" }, svg);
    ticks(0, ymax, 4).forEach((t) => { el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, g); const tx = el("text", { x: L - 8, y: y(t) + 4, "text-anchor": "end", class: "tick" }, svg); tx.textContent = t + "%"; });
    axisX(svg, x, T, B, H, [1, 10, 100, 1000, 10000, 100000]);
    el("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), class: "baseline" }, svg);
    const line = vals.filter(([, r]) => r.accepted);
    if (line.length) el("polyline", { points: line.map(([v, r]) => `${x(v).toFixed(1)},${y(r.perYearPct * 100).toFixed(1)}`).join(" "), fill: "none", stroke: css("--s1"), "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
    if (cur.accepted) {
      const cx = x(state.capital), cy = y(cur.perYearPct * 100);
      el("circle", { cx, cy, r: 5, fill: css("--s1"), stroke: css("--bg"), "stroke-width": 2 }, svg);
      const t = el("text", { x: Math.min(cx + 10, W - R - 60), y: Math.max(T + 12, cy - 10), class: "lbl" }, svg); t.textContent = pct(cur.perYearPct, 2);
    } else {
      el("line", { x1: x(state.capital), x2: x(state.capital), y1: T, y2: H - B, stroke: css("--bad"), "stroke-width": 1.5, "stroke-dasharray": "3 4" }, svg);
    }
    const hit = el("rect", { x: L, y: T, width: W - L - R, height: H - T - B, fill: "transparent" }, svg);
    hit.addEventListener("pointermove", (e) => {
      const v = Math.max(lo, Math.min(hi, inv(fromPx(svg, e.clientX)))), r = at(v);
      const [px, py] = toPx(box, svg, x(v), T + 40);
      showTip(box, `<div class="r"><span>Capital</span><span>${money(v)}</span></div>` + (r.accepted ? `<div class="r"><span>Cost a year</span><span>${pct(r.perYearPct, 2)}</span></div>` : `<div>Rejected, order under $1.00</div>`), px, py);
    });
    hit.addEventListener("pointerleave", () => hideTip(box));
  }

  function renderCheck() {
    const rows = M.publishedCheck(M.FRICTION_V1).map((p) => {
      const ok = Math.abs(p.model - p.cents) < 1e-9;
      const fmt = (v) => (v < 1 ? v.toFixed(3) : v.toFixed(1)) + "¢";
      return `<tr><td>${p.label}</td><td>${p.file}</td><td>${fmt(p.cents)}</td><td>${fmt(p.model)}</td><td class="${ok ? "ok" : "no"}">${ok ? "match" : "differs"}</td></tr>`;
    }).join("");
    $("check").innerHTML = `<thead><tr><th>Figure</th><th>File</th><th>Published</th><th>This page</th><th>Result</th></tr></thead><tbody>${rows}</tbody>`;
  }

  function render() {
    const c = cfg(), rt = M.roundTrip(c, state);
    renderReadouts(c, rt);
    renderInsight(c, rt);
    renderLegs(c, rt);
    drawTicket(c);
    drawCapital(c);
  }

  /* ---------------- Wiring ---------------- */
  function init() {
    $("k-capital").max = CAPITALS.length - 1;
    $("k-capital").addEventListener("input", (e) => { state.capital = CAPITALS[+e.target.value]; syncControls(); render(); });
    $("k-weight").addEventListener("input", (e) => { state.weight = +e.target.value / 100; render(); });
    $("k-turnover").addEventListener("input", (e) => { state.turnover = +e.target.value; render(); });
    $("k-mid").addEventListener("input", (e) => { state.mid = +e.target.value; render(); });
    $("k-symbol").addEventListener("change", (e) => { state.symbol = e.target.value; render(); });
    $("k-vix").addEventListener("change", (e) => { state.vix = e.target.checked ? VIX_ON : null; render(); });
    document.querySelectorAll("[data-cap]").forEach((b) => b.addEventListener("click", () => { state.capital = +b.dataset.cap; syncControls(); render(); }));
    document.querySelectorAll("[data-stress]").forEach((b) => b.addEventListener("click", () => { state.stress = +b.dataset.stress; syncControls(); render(); }));
    $("reset").addEventListener("click", () => { Object.assign(state, M.DEFAULTS); syncControls(); render(); });
    syncControls();
    renderCheck();
    render();
    let raf = 0;
    window.addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); });
  }
  init();
})();
