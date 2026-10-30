/* Liquidity lab: redemption-gate accounting from the Credit Observatory project.
 * simulate() is copied unchanged from privatecredit/frontend/domain.js, which is tested
 * against privatecredit/src/models/liquidity_stress.py. Units: initial NAV = 100.
 * Everything below simulate() only reads its output.
 */
(function (root) {
  'use strict';
  function simulate(request, gate, haircut) {
    if (![request,gate,haircut].every(Number.isFinite) || request<0 || request>1 || gate<=0 || gate>1 || haircut<0 || haircut>=1) throw new RangeError('Invalid liquidity assumptions');
    const realization=1-haircut;
    let assets=100,pending=100*request;
    const rows=[];
    while(pending>1e-10&&assets>1e-10){
      const paid=Math.min(pending,100*gate,assets*realization),sold=paid/realization;
      assets=Math.max(0,assets-sold);pending=Math.max(0,pending-paid);
      rows.push({period:rows.length+1,assets,pending,paid,sold,loss:sold-paid});
    }
    return rows;
  }

  // Slider ranges and default run, as on the project's Liquidity lab. Whole percentages.
  const DEFAULTS = { request: 30, gate: 10, haircut: 15 };
  const RANGES = { request: [0, 100], gate: [1, 25], haircut: [0, 75] };
  const UNPAID_EPS = 1e-8; // the project's threshold for reporting unfunded requests

  function run(requestPct, gatePct, haircutPct) {
    return simulate(requestPct / 100, gatePct / 100, haircutPct / 100);
  }

  function summarize(rows, requestPct) {
    const last = rows[rows.length - 1];
    const paid = rows.reduce((s, r) => s + r.paid, 0);
    const sold = rows.reduce((s, r) => s + r.sold, 0);
    const loss = rows.reduce((s, r) => s + r.loss, 0);
    const assets = last ? last.assets : 100;
    const pending = last ? last.pending : requestPct;
    const claims = 100 - paid; // claims still standing: holders who stayed, plus any unpaid requests
    return {
      quarters: rows.length, paid, sold, loss, assets, pending, claims,
      unfunded: pending > UNPAID_EPS,
      coverage: claims > UNPAID_EPS ? (assets / claims) * 100 : null,
    };
  }

  // Cumulative position after each quarter, starting from the initial 100. Sums to 100 at every step.
  function ledger(rows, requestPct) {
    const out = [{ period: 0, assets: 100, pending: requestPct, cumPaid: 0, cumLoss: 0 }];
    let cumPaid = 0, cumLoss = 0;
    rows.forEach((r) => {
      cumPaid += r.paid; cumLoss += r.loss;
      out.push({ period: r.period, assets: r.assets, pending: r.pending, cumPaid, cumLoss });
    });
    return out;
  }

  function gateSweep(requestPct, haircutPct) {
    const out = [];
    for (let gate = RANGES.gate[0]; gate <= RANGES.gate[1]; gate++) {
      const s = summarize(run(requestPct, gate, haircutPct), requestPct);
      out.push({ gate, quarters: s.quarters, loss: s.loss, pending: s.pending });
    }
    return out;
  }

  function unpaidGrid(requests, haircuts, gatePct) {
    return haircuts.map((h) => requests.map((r) => {
      const s = summarize(run(r, gatePct, h), r);
      return s.unfunded ? s.pending : 0;
    }));
  }

  const API = { simulate, run, summarize, ledger, gateSweep, unpaidGrid, DEFAULTS, RANGES, UNPAID_EPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.LiquidityModel = API;
})(typeof window !== 'undefined' ? window : globalThis);
