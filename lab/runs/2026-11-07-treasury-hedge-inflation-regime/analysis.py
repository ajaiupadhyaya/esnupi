"""Do Treasuries stop hedging equity selloffs when inflation is high?
Run: python analysis.py   (reads/writes data/ cache, writes results.json and figures/*.svg)

Pre-specified (before looking at outcomes), from the scout brief:
  * weekly Wed-to-Wed, S&P 500 price returns, worst 10% of weeks (pooled, full sample 1962-2026)
  * regime = CPI-U NSA YoY > 3% using CPI known at the Wednesday (month m released ~15th of m+1)
  * bond return = carry - D_mod*dy + 0.5*C*dy^2 on a 10y par bond from DGS10
  * statistic = mean bond return (high regime) - mean bond return (low regime) in tail weeks
  * stationary block bootstrap, mean block 13 weeks (my pre-specified default), 95% percentile CI
  * repeat with 10y breakeven (T10YIE) / 5y5y forward (T5YIFR) terciles, 2003-2026, top minus bottom tercile
Everything labelled 'exploratory' below was added after seeing the primary result.
"""
import os, io, json, sys, datetime as dt
import numpy as np, pandas as pd, requests
import statsmodels.api as sm
sys.path.insert(0, "/home/runner/work/esnupi/esnupi/lab/toolkit")
from basischart import line_chart, hbar_chart, interval_chart

os.makedirs("data", exist_ok=True); os.makedirs("figures", exist_ok=True)
TODAY = dt.date.today().isoformat()
RNG_SEED = 20261107
B = 4000
R = {"data_sources": [], "exploratory": []}


# ---------------------------------------------------------------- data
def fred(sid):
    p = f"data/{sid}.csv"
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}"
    if not os.path.exists(p):
        r = requests.get(url, timeout=60); r.raise_for_status()
        open(p, "w").write(r.text)
    d = pd.read_csv(p); d.columns = ["date", "v"]
    d["date"] = pd.to_datetime(d["date"]); d["v"] = pd.to_numeric(d["v"], errors="coerce")
    R["data_sources"].append({"url": url, "retrieved": TODAY, "rows": int(len(d)),
                              "nonmissing": int(d.v.notna().sum()),
                              "first": str(d.date.iloc[0].date()), "last": str(d.date.iloc[-1].date())})
    return d.dropna().set_index("date")["v"]


def yf_close(tk):
    import yfinance as yf
    p = f"data/{tk.replace('^','')}.csv"
    if not os.path.exists(p):
        d = yf.download(tk, start="1962-01-01", progress=False, auto_adjust=True)
        d.columns = [c[0] if isinstance(c, tuple) else c for c in d.columns]
        d.to_csv(p)
    d = pd.read_csv(p, index_col=0, parse_dates=True)
    s = d["Close"].dropna()
    R["data_sources"].append({"url": f"yfinance:{tk} (auto_adjust=True" + ("; price index, no dividends)" if tk == "^GSPC" else "; total-return adjusted ETF)"),
                              "retrieved": TODAY, "rows": int(len(d)),
                              "first": str(s.index[0].date()), "last": str(s.index[-1].date())})
    return s


dgs10 = fred("DGS10"); cpi = fred("CPIAUCNS"); core = fred("CPILFESL")
t10 = fred("T10YIE"); t5y5y = fred("T5YIFR")
spx = yf_close("^GSPC"); ief = yf_close("IEF"); tlt = yf_close("TLT")

wed = pd.date_range("1962-01-03", min(spx.index[-1], dgs10.index[-1]), freq="W-WED")


def asof(s, idx=wed):
    return s.reindex(s.index.union(idx)).ffill().reindex(idx)


# ------------------------------------------------ bond return proxy
def par_price(y, c, N=10.0):
    n = int(2 * N)
    k = np.arange(1, n + 1)[:, None]
    return (c / 2 * 100 / (1 + y / 2) ** k).sum(0) + 100 / (1 + y / 2) ** n


def bond_return(y0, y1, days):
    """y in percent. carry - D*dy + 0.5*C*dy^2, D and C numerically from par bond at y0."""
    a = y0.values / 100; b = y1.values / 100; h = 1e-4
    P = par_price(a, a); Pu = par_price(a + h, a); Pd = par_price(a - h, a)
    D = -(Pu - Pd) / (2 * h * P); C = (Pu + Pd - 2 * P) / (h * h * P)
    dy = b - a
    carry = a * days / 365.0
    price = -D * dy + 0.5 * C * dy ** 2
    return carry + price, price, D


y = asof(dgs10); sp = asof(spx)
days = pd.Series(wed, index=wed).diff().dt.days.values[1:]
tot, prc, Dm = bond_return(y.iloc[:-1], y.iloc[1:], days)
W = pd.DataFrame({"eqr": sp.pct_change().iloc[1:].values, "bond": tot, "bond_px": prc,
                  "y": y.iloc[1:].values, "y_lag": y.iloc[:-1].values}, index=wed[1:])
R["avg_mod_duration_proxy"] = float(np.mean(Dm))

# ------------------------------------------------ ETF validation
rv = {}
for nm, s in [("IEF", ief), ("TLT", tlt)]:
    r = asof(s).pct_change().reindex(W.index)
    j = pd.concat([W.bond, r], axis=1, keys=["p", "e"]).dropna()
    j = j[j.index >= "2002-08-07"]
    beta = np.polyfit(j.p, j.e, 1)
    tailw = j.index.isin(W.index[W.eqr <= W.eqr.quantile(.10)])
    rv[nm] = {"n": int(len(j)), "corr": float(j.p.corr(j.e)), "beta_etf_on_proxy": float(beta[0]),
              "mean_proxy_pct_wk": float(100 * j.p.mean()), "mean_etf_pct_wk": float(100 * j.e.mean()),
              "rmse_pct_wk": float(100 * np.sqrt(((j.p - j.e) ** 2).mean())),
              "corr_in_equity_tail_weeks": float(j[tailw].p.corr(j[tailw].e)),
              "n_tail": int(tailw.sum())}
R["etf_validation"] = rv

# ------------------------------------------------ inflation regimes (real-time)
def yoy_regime(series, extra_lag_months=0):
    s = series.copy(); s.index = s.index.to_period("M").to_timestamp()
    yo = (s / s.shift(12) - 1) * 100
    yo = yo.dropna()
    avail = yo.index + pd.DateOffset(months=1 + extra_lag_months) + pd.Timedelta(days=14)
    f = pd.Series(yo.values, index=avail).sort_index()
    return asof(f, W.index)


W["cpi"] = yoy_regime(cpi).values
W["cpi_lag2"] = yoy_regime(cpi, 1).values
W["core"] = yoy_regime(core).values
W["be10"] = asof(t10).shift(1).reindex(W.index).values
W["be5y5y"] = asof(t5y5y).shift(1).reindex(W.index).values
W = W.dropna(subset=["eqr", "bond", "cpi"])
R["sample"] = {"first_week": str(W.index[0].date()), "last_week": str(W.index[-1].date()), "n_weeks": int(len(W))}
R["pct_weeks_cpi_gt3"] = float((W.cpi > 3).mean() * 100)
R["eq_tail_cutoff_10pct_full"] = float(W.eqr.quantile(.10) * 100)


# ------------------------------------------------ statistic + stationary bootstrap
def stat(eq, bd, g, q=0.10, mode="pooled"):
    if mode == "did":  # (tail - non-tail mean bond return) in group 1 minus same in group 0
        t = eq <= np.quantile(eq, q); nt = ~t
        m1 = t & (g == 1); m0 = t & (g == 0); k1 = nt & (g == 1); k0 = nt & (g == 0)
        n1, n0 = int(m1.sum()), int(m0.sum())
        if min(n1, n0, int(k1.sum()), int(k0.sum())) == 0:
            return (np.nan,) * 3 + (n1, n0)
        a = bd[m1].mean() - bd[k1].mean(); b = bd[m0].mean() - bd[k0].mean()
        return a - b, a, b, n1, n0
    if mode == "pooled":
        t = eq <= np.quantile(eq, q); m1 = t & (g == 1); m0 = t & (g == 0)
    else:
        m1 = (g == 1) & (eq <= np.quantile(eq[g == 1], q)) if (g == 1).sum() else (g == 1) & False
        m0 = (g == 0) & (eq <= np.quantile(eq[g == 0], q)) if (g == 0).sum() else (g == 0) & False
    n1, n0 = int(m1.sum()), int(m0.sum())
    if n1 == 0 or n0 == 0:
        return (np.nan,) * 3 + (n1, n0)
    a, b = bd[m1].mean(), bd[m0].mean()
    return a - b, a, b, n1, n0


def sb_indices(n, L, B, rng):
    p = 1.0 / L
    restart = rng.random((B, n)) < p; restart[:, 0] = True
    pos = np.arange(n)[None, :]
    start = np.where(restart, rng.integers(0, n, (B, n)), 0)
    last = np.maximum.accumulate(np.where(restart, pos, 0), axis=1)
    st = np.take_along_axis(start, last, axis=1)
    return (st + (pos - last)) % n


def run(eq, bd, g, q=0.10, L=13, mode="pooled", B=B, seed=RNG_SEED):
    eq, bd, g = map(np.asarray, (eq, bd, g))
    d, m1, m0, n1, n0 = stat(eq, bd, g, q, mode)
    rng = np.random.default_rng(seed)
    n = len(eq); out = []
    for c0 in range(0, B, 500):
        idx = sb_indices(n, L, min(500, B - c0), rng)
        for ix in idx:
            out.append(stat(eq[ix], bd[ix], g[ix], q, mode)[:3])
    o = np.array(out); ok = ~np.isnan(o[:, 0])
    pc = lambda v: [float(np.percentile(v[ok], 2.5) * 100), float(np.percentile(v[ok], 97.5) * 100)]
    return {"diff_pct": float(d * 100), "diff_ci95_pct": pc(o[:, 0]),
            "mean_high_pct": float(m1 * 100), "mean_high_ci95_pct": pc(o[:, 1]),
            "mean_low_pct": float(m0 * 100), "mean_low_ci95_pct": pc(o[:, 2]),
            "n_tail_high": n1, "n_tail_low": n0, "n_weeks": int(n), "block_mean_weeks": L, "tail_q": q,
            "mode": mode, "boot_reps": int(B), "boot_valid_frac": float(ok.mean()),
            "share_boot_diff_lt0": float((o[ok, 0] < 0).mean()),
            "ci_excludes_zero": bool(pc(o[:, 0])[0] > 0 or pc(o[:, 0])[1] < 0)}


def cpi_group(col, thr=3.0, df=W):
    return (df[col] > thr).astype(int).values


prim = run(W.eqr, W.bond, cpi_group("cpi"))
R["primary_cpi_gt3"] = prim
from scipy import stats as ss
tl = W.eqr <= W.eqr.quantile(.10)
a = W.bond[tl & (W.cpi > 3)]; b = W.bond[tl & (W.cpi <= 3)]
tt = ss.ttest_ind(a, b, equal_var=False)
R["primary_welch_naive"] = {"t": float(tt.statistic), "p": float(tt.pvalue)}
R["primary_hedge_hit_rate"] = {"share_tail_weeks_bond_up_high": float((a > 0).mean()),
                               "share_tail_weeks_bond_up_low": float((b > 0).mean())}

Wb = W.dropna(subset=["be10", "be5y5y"]).copy()
R["breakeven_sample"] = {"first_week": str(Wb.index[0].date()), "n_weeks": int(len(Wb))}


def tercile_group(s, expanding=False):
    if not expanding:
        lo, hi = s.quantile([1 / 3, 2 / 3])
        return np.where(s <= lo, 0, np.where(s > hi, 1, -1))
    lo = s.expanding(104).quantile(1 / 3); hi = s.expanding(104).quantile(2 / 3)
    g = np.where(s <= lo, 0, np.where(s > hi, 1, -1)).astype(float)
    g[lo.isna().values] = np.nan
    return g


for nm in ["be10", "be5y5y"]:
    g = tercile_group(Wb[nm])
    R[f"{nm}_tercile_primary"] = run(Wb.eqr, Wb.bond, g)
    R[f"{nm}_tercile_primary"]["tercile_cutoffs_pct"] = [float(Wb[nm].quantile(1 / 3)), float(Wb[nm].quantile(2 / 3))]
R["cpi_gt3_in_2003_2026_window"] = run(Wb.eqr, Wb.bond, cpi_group("cpi", df=Wb))

rob = {}
for L in [4, 26, 52]:
    rob[f"block_{L}w"] = run(W.eqr, W.bond, cpi_group("cpi"), L=L)
for q in [0.05, 0.20]:
    rob[f"tail_{int(q*100)}pct"] = run(W.eqr, W.bond, cpi_group("cpi"), q=q)
for thr in [2.0, 2.5, 4.0, 5.0]:
    rob[f"cpi_thr_{thr}"] = run(W.eqr, W.bond, cpi_group("cpi", thr))
rob["core_cpi_gt3"] = run(W.eqr, W.bond, cpi_group("core"))
rob["cpi_lag_extra_month"] = run(W.eqr, W.bond, cpi_group("cpi_lag2"))
rob["price_return_only_no_carry"] = run(W.eqr, W.bond_px, cpi_group("cpi"))
rob["tail_defined_within_regime"] = run(W.eqr, W.bond, cpi_group("cpi"), mode="within")
for nm in ["be10", "be5y5y"]:
    g = tercile_group(Wb[nm], expanding=True); k = ~np.isnan(g)
    rob[f"{nm}_expanding_terciles"] = run(Wb.eqr[k], Wb.bond[k], g[k].astype(int))
    rob[f"{nm}_price_only"] = run(Wb.eqr, Wb.bond_px, tercile_group(Wb[nm]))
R["robustness"] = rob

expl = {}
for lab, lo_, hi_ in [("1962_1999", "1962", "1999"), ("2000_2026", "2000", "2026")]:
    s = W.loc[lo_:hi_]
    expl[f"era_{lab}"] = run(s.eqr, s.bond, cpi_group("cpi", df=s))
s = W.loc["1966":"1999"]; expl["era_1966_1999"] = run(s.eqr, s.bond, cpi_group("cpi", df=s))
# difference-in-differences: hedge payoff = (tail-week mean) minus (other-week mean) bond return, high minus low regime
did = {"full_cpi": run(W.eqr, W.bond, cpi_group("cpi"), mode="did"),
       "era_1962_1999": run(W.loc["1962":"1999"].eqr, W.loc["1962":"1999"].bond, cpi_group("cpi", df=W.loc["1962":"1999"]), mode="did"),
       "era_2000_2026": run(W.loc["2000":].eqr, W.loc["2000":].bond, cpi_group("cpi", df=W.loc["2000":]), mode="did"),
       "be10_terciles_2003_2026": run(Wb.eqr, Wb.bond, tercile_group(Wb.be10), mode="did")}
R["exploratory_did_tail_minus_nontail"] = did
nontail = {}
for rg, m in [("cpi_gt3", W.cpi > 3), ("cpi_le3", W.cpi <= 3)]:
    nontail[rg] = {"mean_bond_pct_nontail_weeks": float(W.bond[m & (W.eqr > W.eqr.quantile(.1))].mean() * 100),
                   "n_nontail": int((m & (W.eqr > W.eqr.quantile(.1))).sum())}
R["exploratory_nontail_means"] = nontail


def tail_mean_boot(s, L=13, B=4000):
    cut = W.eqr.quantile(.10)
    e = s.eqr.values; b = s.bond.values; n = len(e)
    rng = np.random.default_rng(RNG_SEED + 1); vals = []
    for c0 in range(0, B, 500):
        for ix in sb_indices(n, L, min(500, B - c0), rng):
            m = e[ix] <= cut
            if m.any(): vals.append(b[ix][m].mean())
    t = e <= cut
    return {"n_tail": int(t.sum()), "n_weeks": int(n), "mean_bond_pct": float(b[t].mean() * 100),
            "ci95_pct": [float(np.percentile(vals, 2.5) * 100), float(np.percentile(vals, 97.5) * 100)],
            "share_bond_up": float((b[t] > 0).mean()), "tail_cutoff_pct": float(cut * 100)}


R["exploratory_period_tail_means"] = {"1970_1979": tail_mean_boot(W.loc["1970":"1979"]),
                                      "2021_2026": tail_mean_boot(W.loc["2021":]),
                                      "2022_only": tail_mean_boot(W.loc["2022"]),
                                      "2000_2020": tail_mean_boot(W.loc["2000":"2020"])}
per = {}
for lab, lo_, hi_ in [("1962-69", "1962", "1969"), ("1970-79", "1970", "1979"), ("1980-89", "1980", "1989"),
                      ("1990-99", "1990", "1999"), ("2000-20", "2000", "2020"), ("2021-26", "2021", "2026")]:
    s = W.loc[lo_:hi_]; t = s.eqr <= R["eq_tail_cutoff_10pct_full"] / 100
    d = {"n_weeks": int(len(s)), "n_tail_weeks": int(t.sum())}
    for rg, m in [("high", s.cpi > 3), ("low", s.cpi <= 3)]:
        z = s[t & m]
        d[rg] = {"n_tail": int(len(z)), "mean_bond_pct": float(z.bond.mean() * 100) if len(z) else None,
                 "mean_eq_pct": float(z.eqr.mean() * 100) if len(z) else None,
                 "share_bond_up": float((z.bond > 0).mean()) if len(z) else None}
    per[lab] = d
R["tail_weeks_by_period_and_regime"] = per
s = W.loc["2022"]; t = s.eqr <= R["eq_tail_cutoff_10pct_full"] / 100
R["year_2022"] = {"n_tail": int(t.sum()), "mean_bond_pct_in_tail": float(s.bond[t].mean() * 100),
                  "mean_eq_pct_in_tail": float(s.eqr[t].mean() * 100), "share_bond_up": float((s.bond[t] > 0).mean())}
post = W.loc["2021":]; tp = post.eqr <= R["eq_tail_cutoff_10pct_full"] / 100
pre = W.loc["2000":"2020"]; tq = pre.eqr <= R["eq_tail_cutoff_10pct_full"] / 100
R["post2021_vs_2000_2020_tail_means_pct"] = {"post2021_mean_bond": float(post.bond[tp].mean() * 100), "n_post": int(tp.sum()),
                                              "y2000_2020_mean_bond": float(pre.bond[tq].mean() * 100), "n_pre": int(tq.sum())}
hi_t = W[(W.eqr <= W.eqr.quantile(.10)) & (W.cpi > 3)]
R["high_regime_tail_weeks_by_decade"] = {str(k): int(v) for k, v in hi_t.groupby((hi_t.index.year // 10) * 10).size().items()}
R["distinct_years_with_high_regime_tail_weeks"] = int(hi_t.index.year.nunique())
R["exploratory_eras"] = expl
R["exploratory"] += ["exploratory_did_tail_minus_nontail", "exploratory_nontail_means", "exploratory_period_tail_means", "exploratory_eras", "tail_weeks_by_period_and_regime", "year_2022",
                     "post2021_vs_2000_2020_tail_means_pct", "high_regime_tail_weeks_by_decade",
                     "regression_downside", "rolling_corr_summary", "robustness.tail_defined_within_regime",
                     "robustness.price_return_only_no_carry", "robustness.cpi_thr_2.0", "robustness.cpi_thr_2.5",
                     "robustness.cpi_thr_4.0", "robustness.cpi_thr_5.0"]


def reg(df, hi, label, down=False):
    e = df.eqr.clip(upper=0) if down else df.eqr
    X = pd.DataFrame({"eqr": e * 100, "high": hi.astype(float)}, index=df.index)
    X["eq_x_high"] = X.eqr * X.high
    m = sm.OLS(df.bond * 100, sm.add_constant(X)).fit(cov_type="HAC", cov_kwds={"maxlags": 8})
    ci = m.conf_int()
    return {"label": label, "n": int(m.nobs), "r2": float(m.rsquared),
            **{f"{k}_coef": float(m.params[k]) for k in m.params.index},
            **{f"{k}_se": float(m.bse[k]) for k in m.params.index},
            **{f"{k}_ci95": [float(ci.loc[k, 0]), float(ci.loc[k, 1])] for k in m.params.index}}


R["regression_full"] = reg(W, W.cpi > 3, "bond% ~ eq% * 1[CPI>3], 1962-2026, HAC(8)")
R["regression_downside"] = reg(W, W.cpi > 3, "bond% ~ min(eq,0)% * 1[CPI>3] (exploratory)", down=True)
R["regression_be10_top_tercile_2003_2026"] = reg(Wb, pd.Series(tercile_group(Wb.be10) == 1, index=Wb.index),
                                                  "bond% ~ eq% * 1[10y BE top tercile], 2003-2026, HAC(8)")
R["regression_cpi_2003_2026"] = reg(Wb, Wb.cpi > 3, "bond% ~ eq% * 1[CPI>3], 2003-2026, HAC(8)")

rc = W.eqr.rolling(156).corr(W.bond)
R["rolling_corr_summary"] = {"window_weeks": 156, "min": float(rc.min()), "date_min": str(rc.idxmin().date()),
                             "max": float(rc.max()), "date_max": str(rc.idxmax().date()),
                             "last": float(rc.iloc[-1]),
                             "full_sample_corr": float(W.eqr.corr(W.bond)),
                             "corr_cpi_gt3": float(W.eqr[W.cpi > 3].corr(W.bond[W.cpi > 3])),
                             "corr_cpi_le3": float(W.eqr[W.cpi <= 3].corr(W.bond[W.cpi <= 3]))}


_blk = W.groupby((W.index.year // 5) * 5).apply(lambda d: d.eqr.corr(d.bond))
R["corr_by_5yr_block"] = {f"{k}-{k+4}": float(v) for k, v in _blk.items()}
R["exploratory"].append("corr_by_5yr_block")


def ci_txt(r): return f"[{r['diff_ci95_pct'][0]:+.2f}, {r['diff_ci95_pct'][1]:+.2f}]"


verdict_cpi = "YES" if (prim["diff_pct"] < 0 and prim["ci_excludes_zero"]) else "NO"
R["verdict_primary_claim"] = verdict_cpi
vb = {}
for nm in ["be10", "be5y5y"]:
    r = R[f"{nm}_tercile_primary"]
    vb[nm] = "YES" if (r["diff_pct"] < 0 and r["ci_excludes_zero"]) else "NO"
R["verdict_breakeven_claims"] = vb

head = (f"In the worst 10% of S&P 500 weeks since 1962 ({prim['n_tail_high']} high-inflation and {prim['n_tail_low']} low-inflation tail weeks), "
        f"10y Treasuries returned {prim['mean_high_pct']:+.2f}% a week when real-time CPI inflation exceeded 3% versus {prim['mean_low_pct']:+.2f}% otherwise; "
        f"the high-minus-low gap is {prim['diff_pct']:+.2f} points (block-bootstrap 95% CI {ci_txt(prim)}), so the pre-specified claim is {verdict_cpi}, but the gap is {expl['era_1962_1999']['diff_pct']:+.2f} pp (CI {ci_txt(expl['era_1962_1999'])}) within 1962-1999 and {expl['era_2000_2026']['diff_pct']:+.2f} pp (CI {ci_txt(expl['era_2000_2026'])}) within 2000-2026, and the breakeven tests are inconclusive.")
R["headline"] = head

labs, est, lo, hi = [], [], [], []
def add(lbl, r):
    labs.append(lbl); est.append(r["diff_pct"]); lo.append(r["diff_ci95_pct"][0]); hi.append(r["diff_ci95_pct"][1])
add("CPI>3%, 1962-2026 (primary)", prim)
add("Core CPI>3%", rob["core_cpi_gt3"])
add("CPI>3%, CPI lagged a further month", rob["cpi_lag_extra_month"])
add("CPI>3%, block 4w", rob["block_4w"]); add("CPI>3%, block 52w", rob["block_52w"])
add("CPI>3%, worst 5% of weeks", rob["tail_5pct"]); add("CPI>3%, worst 20% of weeks", rob["tail_20pct"])
add("CPI>3%, price return only (no carry)", rob["price_return_only_no_carry"])
add("CPI>3%, tail set within each regime", rob["tail_defined_within_regime"])
add("CPI>3%, 2003-2026 only", R["cpi_gt3_in_2003_2026_window"])
add("10y breakeven top vs bottom tercile, 2003-26", R["be10_tercile_primary"])
add("5y5y breakeven top vs bottom tercile, 2003-26", R["be5y5y_tercile_primary"])
add("Exploratory: CPI>3%, 1962-1999 only", expl["era_1962_1999"])
add("Exploratory: CPI>3%, 2000-2026 only", expl["era_2000_2026"])
interval_chart("figures/fig1_gap_by_spec.svg",
    title=(f"In equity selloffs Treasuries earned {abs(prim['diff_pct']):.2f} points a week {'less' if prim['diff_pct']<0 else 'more'} when CPI was above 3%; "
           + ("the breakeven tests do not confirm it" if all(v == "NO" for v in vb.values()) else "the breakeven tests also differ")),
    subtitle="High- minus low-inflation mean weekly 10y Treasury return (percentage points) in the worst equity weeks; 95% stationary block-bootstrap CI. 1962-2026 weekly, FRED + Yahoo Finance",
    labels=labs, est=est, lo=lo, hi=hi, v_fmt="{:+.2f}",
    alt=(f"Interval chart of the high-minus-low inflation gap in mean 10-year Treasury weekly return during the worst equity weeks. "
         f"Primary estimate {prim['diff_pct']:+.2f} points with 95% CI {ci_txt(prim)}; the 10y breakeven tercile estimate is {R['be10_tercile_primary']['diff_pct']:+.2f} {ci_txt(R['be10_tercile_primary'])}."))

b10 = R["be10_tercile_primary"]
hl = ["CPI <=3%", "CPI >3%", "10y breakeven bottom tercile (2003-26)", "10y breakeven top tercile (2003-26)"]
hv = [prim["mean_low_pct"], prim["mean_high_pct"], b10["mean_low_pct"], b10["mean_high_pct"]]
hl = [f"{l} (n={n})" for l, n in zip(hl, [prim["n_tail_low"], prim["n_tail_high"], b10["n_tail_low"], b10["n_tail_high"]])]
for lab in ["1970-79", "2021-26"]:
    d = per[lab]["high"]
    if d["n_tail"]:
        hl.append(f"Exploratory: {lab}, CPI >3% (n={d['n_tail']})"); hv.append(d["mean_bond_pct"])
hbar_chart("figures/fig2_mean_bond_return_tail_weeks.svg",
    title=(f"In the worst equity weeks 10y Treasuries {'lost' if prim['mean_high_pct']<0 else 'gained'} {abs(prim['mean_high_pct']):.2f}% when CPI was above 3% and {'lost' if prim['mean_low_pct']<0 else 'gained'} {abs(prim['mean_low_pct']):.2f}% when below"),
    subtitle="Mean weekly 10y Treasury return (%) in the worst 10% of S&P 500 weeks, by regime. Duration-based proxy from FRED DGS10; S&P 500 from Yahoo Finance; n = tail weeks",
    labels=hl, values=hv, v_fmt="{:+.2f}%", highlight=[1, 3],
    alt="Horizontal bars of the mean weekly 10-year Treasury return in the worst 10% of equity weeks: " +
        "; ".join(f"{l} {v:+.2f}%" for l, v in zip(hl, hv)) + ".")

xs = [d.to_pydatetime() for d in rc.dropna().index]
line_chart("figures/fig3_rolling_corr.svg",
    title="By correlation, Treasuries were a poor equity hedge until 1999, a good one in 2000-2019, and a weaker one since 2020",
    subtitle="Rolling 156-week correlation of weekly S&P 500 and 10y Treasury returns (positive = bonds fall with stocks). 1962-2026, FRED + Yahoo Finance",
    x=xs, series={"156-week correlation": [float(v) for v in rc.dropna().values]}, y_fmt="{:.1f}",
    alt=(f"Line chart of the rolling three-year correlation between weekly S&P 500 and 10-year Treasury returns, ranging from "
         f"{R['rolling_corr_summary']['min']:.2f} (ending {R['rolling_corr_summary']['date_min']}) to {R['rolling_corr_summary']['max']:.2f} "
         f"(ending {R['rolling_corr_summary']['date_max']}); last value {R['rolling_corr_summary']['last']:.2f}."))

json.dump(R, open("results.json", "w"), indent=1, default=float)

print(head)
print("verdicts:", verdict_cpi, vb)
for k in ["be10_tercile_primary", "be5y5y_tercile_primary", "cpi_gt3_in_2003_2026_window"]:
    r = R[k]; print(k, f"diff {r['diff_pct']:+.3f} {ci_txt(r)} hi {r['mean_high_pct']:+.3f} (n{r['n_tail_high']}) lo {r['mean_low_pct']:+.3f} (n{r['n_tail_low']})")
for k, r in {**rob, **expl}.items():
    print(f"  {k:36s} diff {r['diff_pct']:+.3f} {ci_txt(r)} hi {r['mean_high_pct']:+.3f}(n{r['n_tail_high']}) lo {r['mean_low_pct']:+.3f}(n{r['n_tail_low']}) valid {r['boot_valid_frac']:.2f}")
print("etf validation", json.dumps(R["etf_validation"]))
print("regression", {k: round(v, 3) for k, v in R["regression_full"].items() if isinstance(v, float) and k.endswith(("coef", "se"))})
print("downside", {k: round(v, 3) for k, v in R["regression_downside"].items() if isinstance(v, float) and k.endswith(("coef", "se"))})
print("be10 reg", {k: round(v, 3) for k, v in R["regression_be10_top_tercile_2003_2026"].items() if isinstance(v, float) and k.endswith(("coef", "se"))})
print("periods", json.dumps(per))
print("2022", R["year_2022"], R["post2021_vs_2000_2020_tail_means_pct"])
print("corr", R["rolling_corr_summary"], R["sample"], R["pct_weeks_cpi_gt3"], R["high_regime_tail_weeks_by_decade"])

print("DID", {k: (round(v["diff_pct"],3), [round(x,3) for x in v["diff_ci95_pct"]], round(v["mean_high_pct"],3), round(v["mean_low_pct"],3)) for k, v in did.items()})
print("nontail", nontail)
print("period tail means", json.dumps(R["exploratory_period_tail_means"]))
json.dump(R, open("results.json", "w"), indent=1, default=float)
