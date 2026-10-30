/* Five Dollar Quant: friction calculator.
 * A line-for-line port of fdq/frictions/config.py and fdq/frictions/emulator.py
 * (friction model v1.0.0) from github.com/ajaiupadhyaya/capitallimits.
 * Parameters are config/friction_v1.yaml. Nothing here is re-derived.
 * Each function names the Python it mirrors, so the two can be read side by side.
 */
(function (root) {
  /* config/friction_v1.yaml */
  const FRICTION_V1 = {
    version: "1.0.0",
    min_notional: 1.0,
    cash_buffer_pct: 0.1,
    settlement_days: 1,
    stress_multiplier: 1.0,
    spread_bps_default: 5.0,
    spread_bps_by_symbol: { SPY: 2.0, QQQ: 3.0, IWM: 4.0, TLT: 3.0, IEF: 3.0, GLD: 4.0, XLE: 5.0, XLF: 4.0, XLK: 4.0 },
    vix_spread_threshold: 25.0,
    vix_spread_multiplier: 1.5,
    sec_fee_rate: 0.0000278,
    finra_taf_per_share: 0.000166,
    finra_taf_cap: 8.3,
    sec_fee_minimum: 0.01,
    finra_taf_minimum: 0.01,
    ruin_capital_threshold: 1.11,
  };

  /* FrictionConfig.spread_bps */
  function spreadBps(cfg, symbol, vix) {
    const table = cfg.spread_bps_by_symbol;
    let base = Object.prototype.hasOwnProperty.call(table, symbol) ? table[symbol] : cfg.spread_bps_default;
    if (vix !== null && vix !== undefined && vix > cfg.vix_spread_threshold) base *= cfg.vix_spread_multiplier;
    return base * cfg.stress_multiplier;
  }

  /* FrictionConfig.max_deployable */
  function maxDeployable(cfg, equity) {
    return equity * (1.0 - cfg.cash_buffer_pct);
  }

  /* FrictionConfig.max_concurrent_positions: int(deployable // min_notional) */
  function maxConcurrentPositions(cfg, equity) {
    return Math.floor(maxDeployable(cfg, equity) / cfg.min_notional);
  }

  /* BrokerEmulator.validate_order: the three rejection branches, in the same order */
  function validateOrder(cfg, notional, side, settledCash, currentPosition, targetDelta) {
    const absNotional = Math.abs(notional);
    if (absNotional < cfg.min_notional && absNotional > 1e-9) return { accepted: false, reason: "below_min_notional" };
    if (side === "sell" && currentPosition + targetDelta < -1e-9) return { accepted: false, reason: "short_not_allowed" };
    if (side === "buy" && absNotional > settledCash + 1e-9) return { accepted: false, reason: "insufficient_settled_cash" };
    return { accepted: true, reason: null };
  }

  /* BrokerEmulator.apply_fill */
  function applyFill(cfg, midPrice, side, notional, symbol, vix) {
    if (midPrice <= 0) throw new Error("mid_price must be positive");
    const bps = spreadBps(cfg, symbol, vix);
    const halfSpreadFrac = bps / 10000.0 / 2.0;
    const executionPrice = side === "buy" ? midPrice * (1.0 + halfSpreadFrac) : midPrice * (1.0 - halfSpreadFrac);
    const shares = notional / executionPrice;
    const spreadCost = Math.abs(notional) * halfSpreadFrac;
    let secFee = 0.0;
    let finraTaf = 0.0;
    if (side === "sell") {
      secFee = Math.max(cfg.sec_fee_minimum, Math.abs(notional) * cfg.sec_fee_rate);
      finraTaf = Math.min(cfg.finra_taf_cap, Math.max(cfg.finra_taf_minimum, shares * cfg.finra_taf_per_share));
    }
    const regulatoryFees = secFee + finraTaf;
    return { execution_price: executionPrice, notional, spread_cost: spreadCost, sec_fee: secFee, finra_taf: finraTaf, shares, regulatory_fees: regulatoryFees, total_friction: spreadCost + regulatoryFees };
  }

  /* engine.py sizes every order as weight × deployable equity. */
  function ticketFor(cfg, capital, weight) {
    return weight * maxDeployable(cfg, capital);
  }

  /* One buy and one sell of the same notional at the same mid: the pair test_spread_double_charge uses.
   * Both legs go through validate_order first, as engine.py does. A rejected order fills nothing. */
  function roundTrip(cfg, inp) {
    const ticket = ticketFor(cfg, inp.capital, inp.weight);
    const buyCheck = validateOrder(cfg, ticket, "buy", inp.capital, 0.0, ticket);
    const sellCheck = validateOrder(cfg, ticket, "sell", inp.capital, ticket, -ticket);
    const accepted = buyCheck.accepted && sellCheck.accepted;
    const buy = applyFill(cfg, inp.mid, "buy", ticket, inp.symbol, inp.vix);
    const sell = applyFill(cfg, inp.mid, "sell", ticket, inp.symbol, inp.vix);
    const spread = buy.spread_cost + sell.spread_cost;
    const fees = buy.regulatory_fees + sell.regulatory_fees;
    const total = spread + fees;
    const perYear = accepted ? total * inp.turnover : 0;
    return {
      ticket, accepted, reason: accepted ? null : buyCheck.reason || sellCheck.reason,
      buy, sell, spread, fees, total,
      bps: ticket > 0 ? (total / ticket) * 10000 : 0,
      feeShare: total > 0 ? fees / total : 0,
      perYear, perYearPct: inp.capital > 0 ? perYear / inp.capital : 0,
      feesPerYear: accepted ? fees * inp.turnover : 0,
      maxPositions: maxConcurrentPositions(cfg, inp.capital),
    };
  }

  function withStress(cfg, m) {
    return Object.assign({}, cfg, { stress_multiplier: m });
  }

  /* Numbers printed in the experiment files, checked live on the page. Cents. */
  const PUBLISHED = [
    { label: "EXP-001, SPY buy-and-hold, $5", file: "results/summary.json", capital: 5, symbol: "SPY", cents: 0.045 },
    { label: "EXP-001, SPY buy-and-hold, $50", file: "results/summary.json", capital: 50, symbol: "SPY", cents: 0.45 },
    { label: "EXP-001, SPY buy-and-hold, $50,000", file: "report.md", capital: 50000, symbol: "SPY", cents: 450.0 },
    { label: "EXP-001, QQQ buy-and-hold, $50,000", file: "report.md", capital: 50000, symbol: "QQQ", cents: 675.0 },
    { label: "EXP-001, IWM buy-and-hold, $50,000", file: "report.md", capital: 50000, symbol: "IWM", cents: 900.0 },
  ];

  /* The one buy a buy-and-hold makes: 100% of deployable capital. */
  function publishedCheck(cfg) {
    return PUBLISHED.map((p) => {
      const ticket = ticketFor(cfg, p.capital, 1.0);
      const fill = applyFill(cfg, 400.0, "buy", ticket, p.symbol, null);
      return Object.assign({}, p, { model: fill.total_friction * 100 });
    });
  }

  const DEFAULTS = { capital: 5, weight: 1.0, turnover: 2.1, symbol: "SPY", mid: 400, vix: null, stress: 1 };

  const API = { FRICTION_V1, DEFAULTS, PUBLISHED, spreadBps, maxDeployable, maxConcurrentPositions, validateOrder, applyFill, ticketFor, roundTrip, withStress, publishedCheck };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.FDQModel = API;
})(typeof window !== "undefined" ? window : globalThis);
