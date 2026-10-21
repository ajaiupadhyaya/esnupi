/* Liquid Compute — outside-in operating model
 * One source of truth for the memo and the interactive page.
 * Every input is either sourced (see SOURCES) or a labeled assumption.
 */
(function (root) {
  const YEARS = [2027, 2028, 2029, 2030, 2031, 2032];
  const BASE_MARKET_2026 = 35.22; // $B, neocloud market 2026 (Mordor Intelligence estimate)
  const CONTRACT_GPU_HOURS = 730; // CME GPU1/GPU2 contract size, used as the standard unit

  const SCENARIOS = {
    bear: {
      label: "Bear",
      marketGrowth: [0.30, 0.25, 0.20, 0.16, 0.13, 0.10],
      intermediatedShare: [0.02, 0.03, 0.04, 0.05, 0.06, 0.07],
      lcShareOfIntermediated: [0.02, 0.04, 0.05, 0.06, 0.07, 0.08],
      physicalTake: 0.02,
      approvalYear: 2030,
      churnTarget: 0.4,
      lcDerivShare: 0.05,
      feePerContract: 1.0,
      licensees: [8, 14, 20, 26, 32, 38],
      arpuK: [40, 48, 56, 64, 72, 80],
      creditOutstandingM: [40, 100, 180, 260, 340, 420],
      creditFee: 0.006,
      opexM: [12, 16, 20, 24, 28, 32],
      priceStart: 4.0, priceDecline: 0.10,
      multiples: { brokerage: 3, data: 10, exchange: 10, credit: 2 },
    },
    base: {
      label: "Base",
      marketGrowth: [0.45, 0.38, 0.32, 0.26, 0.22, 0.18],
      intermediatedShare: [0.03, 0.045, 0.06, 0.08, 0.10, 0.12],
      lcShareOfIntermediated: [0.04, 0.07, 0.10, 0.13, 0.16, 0.18],
      physicalTake: 0.03,
      approvalYear: 2028,
      churnTarget: 1.0,
      lcDerivShare: 0.18,
      feePerContract: 2.0,
      licensees: [12, 25, 40, 60, 80, 100],
      arpuK: [60, 75, 90, 105, 120, 135],
      creditOutstandingM: [80, 250, 500, 900, 1400, 2000],
      creditFee: 0.010,
      opexM: [14, 24, 36, 50, 65, 80],
      priceStart: 4.0, priceDecline: 0.06,
      multiples: { brokerage: 4, data: 15, exchange: 15, credit: 3 },
    },
    bull: {
      label: "Bull",
      marketGrowth: [0.55, 0.48, 0.40, 0.32, 0.26, 0.22],
      intermediatedShare: [0.04, 0.06, 0.09, 0.12, 0.15, 0.18],
      lcShareOfIntermediated: [0.06, 0.10, 0.14, 0.18, 0.22, 0.25],
      physicalTake: 0.04,
      approvalYear: 2027,
      churnTarget: 2.0,
      lcDerivShare: 0.30,
      feePerContract: 3.0,
      licensees: [15, 35, 60, 90, 120, 150],
      arpuK: [80, 100, 120, 140, 160, 180],
      creditOutstandingM: [120, 400, 900, 1600, 2500, 3500],
      creditFee: 0.014,
      opexM: [16, 30, 48, 66, 85, 105],
      priceStart: 4.0, priceDecline: 0.03,
      multiples: { brokerage: 5, data: 20, exchange: 20, credit: 4 },
    },
  };

  // Derivatives volume ramp: share of the churn target reached N years after approval.
  // Approval is assumed mid-year, so the approval year carries half a year of trading.
  const RAMP = [0.08, 0.25, 0.5, 0.75, 1.0, 1.0, 1.0];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* overrides: flat knobs the page exposes, applied on top of a scenario */
  function run(scenarioKey, overrides) {
    const s = Object.assign(clone(SCENARIOS[scenarioKey]), overrides || {});
    const scaleArr = (arr, k) => arr.map((v) => v * k);
    if (overrides && overrides.lcShareScale) s.lcShareOfIntermediated = scaleArr(s.lcShareOfIntermediated, overrides.lcShareScale);
    if (overrides && overrides.growthScale) s.marketGrowth = scaleArr(s.marketGrowth, overrides.growthScale);
    if (overrides && overrides.creditScale) s.creditOutstandingM = scaleArr(s.creditOutstandingM, overrides.creditScale);

    const rows = [];
    let market = BASE_MARKET_2026;
    let cumCash = 15; // $M seed, Sept 2026
    let minCash = cumCash, minCashYear = null;
    YEARS.forEach((y, i) => {
      market = market * (1 + s.marketGrowth[i]); // $B
      const price = s.priceStart * Math.pow(1 - s.priceDecline, i); // $/GPU-hr blended index
      // Layer 1 — physical brokerage / order book
      const intermediatedB = market * s.intermediatedShare[i];
      const gmvB = intermediatedB * s.lcShareOfIntermediated[i];
      const brokerage = gmvB * 1000 * s.physicalTake; // $M
      // Layer 2 — exchange & clearing (after CFTC approval)
      const yrsSince = y - s.approvalYear;
      let churn = 0;
      if (yrsSince >= 0) churn = s.churnTarget * RAMP[Math.min(yrsSince, RAMP.length - 1)] * (yrsSince === 0 ? 0.5 : 1);
      const derivNotionalB = churn * market * s.lcDerivShare;
      const contractsM = (derivNotionalB * 1e9) / (CONTRACT_GPU_HOURS * price) / 1e6;
      const exchange = contractsM * s.feePerContract; // $M
      // Layer 3 — index & data licensing
      const data = (s.licensees[i] * s.arpuK[i]) / 1000; // $M
      // Layer 4 — credit (prepayment facility arrangement + servicing)
      const credit = s.creditOutstandingM[i] * s.creditFee; // $M
      const revenue = brokerage + exchange + data + credit;
      const opex = s.opexM[i];
      const ebitda = revenue - opex;
      cumCash += ebitda;
      if (cumCash < minCash) { minCash = cumCash; minCashYear = y; }
      rows.push({
        year: y, marketB: market, price, intermediatedB, gmvB, churn, derivNotionalB, contractsM,
        brokerage, exchange, data, credit, revenue, opex, ebitda, cumCash,
      });
    });
    const last = rows[rows.length - 1];
    const m = s.multiples;
    const ev2032 = last.brokerage * m.brokerage + last.data * m.data + last.exchange * m.exchange + last.credit * m.credit;
    const discount = Math.pow(1 + 0.35, 6); // 35% venture hurdle, 2026 -> 2032
    return {
      scenario: scenarioKey, inputs: s, rows,
      ev2032, pvToday: ev2032 / discount,
      fundingGapM: Math.max(0, -minCash), troughYear: minCashYear,
      breakevenYear: (rows.find((r) => r.ebitda > 0) || {}).year || null,
    };
  }

  /* ---------- Tenor trade Monte Carlo (extends LC's own worked example) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function normal(rng) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  const TENOR_DEFAULTS = {
    gpus: 64, months: 36, cost: 4.25, p0: 5.30,
    driftMo: 0.001, volMo: 0.06,             // monthly log drift / vol of re-let price
    jumpPerYear: 0.5, jumpSize: -0.10,       // release-date jumps (~1 every 2 years, -10%)
    fill0: 0.95, fillBeta: 0.35,             // fill falls when price falls (wrong-way)
    hedgeRatio: 0.33, forward: 4.85, hedgeMonths: 24,
    basisVol: 0.15,                          // $/hr noise between your re-let and the index
    paths: 4000, seed: 7,
  };

  function tenorSim(opts) {
    const o = Object.assign({}, TENOR_DEFAULTS, opts || {});
    const rng = mulberry32(o.seed);
    const hrsMo = 730;
    const unhedged = new Float64Array(o.paths);
    const hedged = new Float64Array(o.paths);
    const lam = o.jumpPerYear / 12;
    const samplePaths = [];
    for (let p = 0; p < o.paths; p++) {
      let lp = Math.log(o.p0);
      let pu = 0, ph = 0;
      const path = [];
      for (let m = 0; m < o.months; m++) {
        lp += o.driftMo - 0.5 * o.volMo * o.volMo + o.volMo * normal(rng);
        if (rng() < lam) lp += Math.log(1 + o.jumpSize);
        const P = Math.exp(lp);
        const fill = Math.min(1, Math.max(0.4, o.fill0 + o.fillBeta * Math.log(P / o.p0)));
        const physical = o.gpus * hrsMo * (fill * P - o.cost);
        const index = P + o.basisVol * normal(rng);
        const hedgePay = m < o.hedgeMonths ? o.hedgeRatio * o.gpus * hrsMo * (o.forward - index) : 0;
        pu += physical; ph += physical + hedgePay;
        if (p < 40) path.push(+P.toFixed(3));
      }
      unhedged[p] = pu / 1e6; hedged[p] = ph / 1e6;
      if (p < 40) samplePaths.push(path);
    }
    const stats = (arr) => {
      const a = Array.from(arr).sort((x, y) => x - y);
      const q = (k) => a[Math.floor(k * (a.length - 1))];
      const mean = a.reduce((x, y) => x + y, 0) / a.length;
      const sd = Math.sqrt(a.reduce((x, y) => x + (y - mean) ** 2, 0) / a.length);
      return { mean, sd, p05: q(0.05), p25: q(0.25), p50: q(0.5), p75: q(0.75), p95: q(0.95), pLoss: a.filter((v) => v < 0).length / a.length, sorted: a };
    };
    return { opts: o, unhedged: stats(unhedged), hedged: stats(hedged), samplePaths };
  }

  // Deterministic grid from LC's "Tenor Trade" note: annual gross on 64 GPUs bought at `cost`.
  function tenorGrid(cost) {
    cost = cost || 4.25;
    const prices = [5.75, 5.50, 5.30, 5.00, 4.75, 4.50];
    const fills = [1.0, 0.95, 0.90, 0.85, 0.80, 0.75];
    return prices.map((p) => fills.map((f) => (64 * 8760 * (f * p - cost)) / 1000)); // $k / yr
  }

  const API = { YEARS, SCENARIOS, run, tenorSim, tenorGrid, TENOR_DEFAULTS, CONTRACT_GPU_HOURS, BASE_MARKET_2026 };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.LCModel = API;
})(typeof window !== "undefined" ? window : globalThis);
