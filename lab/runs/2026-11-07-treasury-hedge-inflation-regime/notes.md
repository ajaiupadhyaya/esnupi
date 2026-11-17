# Do Treasuries stop hedging equity selloffs when inflation is high?

Everything below is read from `results.json` (produced by `analysis.py`). Percent figures are weekly returns in %, differences are percentage points (pp). Retrieval date 2026-11-07.

## 1. Question and pre-specified test
In weeks when US equities fall sharply, do 10y Treasuries earn less when trailing inflation is above 3%?
**Pre-specified (from the scout brief, fixed before looking at outcomes):** worst 10% of S&P 500 weeks, 1962-2026; regime = real-time CPI YoY > 3%; YES if mean 10y return in tail weeks is lower in the high regime and the block-bootstrap 95% CI for the difference excludes zero; NO if the CI includes zero. Repeat with 10y breakeven (T10YIE) and 5y5y forward (T5YIFR) terciles, 2003-2026 (top minus bottom tercile).
**My choices made before running:** mean block length 13 weeks, 4,000 stationary-bootstrap replicates, 95% percentile CI, tail cutoff recomputed in each bootstrap sample, breakeven lagged one week.

## 2. Verdicts
- **CPI test: YES.** Tail weeks: 194 high-inflation, 145 low-inflation (of 3,383 weeks; 10th percentile of weekly S&P return = -2.40%). Mean 10y return: **-0.17%** (CI -0.40 to +0.06) in the high regime vs **+0.33%** (CI +0.12 to +0.58) in the low. Gap **-0.50 pp, 95% CI [-0.85, -0.20]**. 99.9% of bootstrap draws are negative. Bonds rose in 40% of high-regime tail weeks and 66% of low-regime tail weeks (descriptive).
- **10y breakeven test: NO.** Top vs bottom tercile (cutoffs 2.04% / 2.33%): -0.34 pp, CI [-0.95, +0.38]; means +0.30% (n=41) vs +0.65% (n=49).
- **5y5y forward test: NO, and wrong sign.** +0.46 pp, CI [-0.20, +1.20]; means +0.68% (n=35) vs +0.22% (n=47). Cutoffs 2.18% / 2.40%.
- Same CPI test restricted to 2003-2026 (so it is comparable with the breakeven tests): -0.13 pp, CI [-0.76, +0.56]; n tail 49 high / 76 low.

So the long-sample CPI result is clear, but the market-based measures, with the short sample, cannot confirm or refute it. **The pooled result is largely a between-era result** (see 4).

Naive Welch t on the same tail weeks: t = -3.61, p = 0.0004. It ignores clustering and the bootstrap interval is the one to quote.

## 3. Regression (interaction)
OLS of weekly bond % on S&P % and the CPI>3 dummy and their interaction, Newey-West HAC with 8 lags, n = 3,383:
- S&P coefficient in low regime: -0.048 (s.e. 0.020), i.e. bonds weakly counter-cyclical.
- Interaction (extra bond response per 1% S&P move in high regime): **+0.142 (s.e. 0.031)**. Implied S&P beta of bonds in high regime = +0.094, so falling stocks coincide with falling bonds.
- Dummy: +0.082 (s.e. 0.038), consistent with higher carry.
- 2003-2026 only, CPI dummy: interaction +0.071 (s.e. 0.048). With a 10y breakeven top-tercile dummy: +0.067 (s.e. 0.045). Same sign, both under 2 s.e.
- Exploratory downside-only version (min(S&P,0)): interaction +0.160 (s.e. 0.052).
- Unconditional full-sample equity-bond weekly correlation 0.067; 0.188 when CPI>3, -0.106 when CPI<=3.

## 4. Robustness (all with 4,000 replicates; gap high minus low, pp, 95% CI)
Pre-planned:
| Spec | gap | CI |
|---|---|---|
| Block 4 / 26 / 52 weeks | -0.50 / -0.50 / -0.50 | [-0.82,-0.22] / [-0.86,-0.19] / [-0.86,-0.16] |
| Worst 5% of weeks (n 95/75) | -0.62 | [-1.05,-0.16] |
| Worst 20% of weeks (n 408/269) | -0.41 | [-0.64,-0.18] |
| Core CPI>3% (SA, current vintage) | -0.89 | [-1.21,-0.58] |
| CPI lagged a further month | -0.50 | [-0.85,-0.20] |
| Price return only (no carry) | -0.56 | [-0.92,-0.26] |
| Tail defined within each regime (n 175/164) | -0.57 | [-0.85,-0.20] |
| 10y BE, expanding-window terciles (no look-ahead) | -0.59 | [-1.17,+0.22] |
| 5y5y, expanding-window terciles | +0.33 | [-0.34,+1.15] |
| 10y BE / 5y5y price-only | -0.36 / +0.44 | [-0.96,+0.37] / [-0.21,+1.18] |

Price-only matters: high inflation implies high yields and carry, which flatters the high regime, so excluding carry makes the gap slightly larger, not smaller.
Thresholds (exploratory; chosen after seeing the primary result): 2% -0.62, 2.5% -0.64, 4% -0.51, 5% -0.66 pp; all CIs exclude zero.

**Era check (exploratory, added after the primary result), which tempers the headline:**
- 1962-1999 only (142 high / 57 low tail weeks): gap -0.28 pp, CI [-0.64, +0.13]; means -0.41% vs -0.14%. 
- 2000-2026 only (55 / 86): gap -0.25 pp, CI [-0.77, +0.37]; means +0.37% vs +0.61%.
- 1966-1999: -0.29, CI [-0.69, +0.21].
Within either era the point estimate is negative but the CI includes zero. The pooled gap is bigger (-0.50) because the high-inflation regime is concentrated in 1966-1999, when bonds did poorly in tail weeks regardless of CPI level, and the low regime is mostly 2000-2020, when bonds rallied in tail weeks. Era and inflation regime are heavily confounded and this data can't separate them in the pooled test.
- Difference-in-differences version (exploratory): hedge payoff = tail-week mean minus other-week mean, high minus low regime. Full sample -0.67 pp, CI [-1.03, -0.37]; 1962-1999 -0.43, CI [-0.81, -0.03]; 2000-2026 -0.35, CI [-0.86, +0.27]; 10y BE terciles -0.45, CI [-1.06, +0.29]. Mean bond return in non-tail weeks: 0.204% (CPI>3) vs 0.033% (CPI<=3).

## 5. Sub-periods requested by the brief (exploratory; descriptive with block bootstrap for the mean, tail cutoff fixed at full-sample -2.40%)
- 1970s: 65 tail weeks, all in the high regime (so no within-decade contrast). Mean -0.30%, CI [-0.59, -0.06]; bonds up in 35% of tail weeks.
- 2021-2026: 36 tail weeks (27 high, 9 low CPI). Mean -0.28%, CI [-0.62, +0.11]; bonds up in 33%.
- 2022 alone: 16 tail weeks, mean -0.69%, CI [-1.11, -0.37], bonds up in 25%.
- 2000-2020: 119 tail weeks, mean +0.74%, CI [+0.50, +0.98], bonds up in 77%.
- By decade, tail weeks (high / low CPI): 1962-69 10/17; 1970-79 65/0; 1980-89 42/8; 1990-99 14/28; 2000-20 36/83; 2021-26 27/9. The 194 high-regime tail weeks spread over 38 distinct calendar years, but 107 of them are in the 1970s and 1980s and 27 in 2021+.
- Mean tail-week bond return was most negative in the 1980s (-0.65% high regime) and 1990s (-0.72%, n=14).

## 6. Data and construction
- FRED CSV (no key): DGS10 (16,918 rows, 16,197 non-missing, 1962-01-02 to 2026-11-05); CPIAUCNS (1913-01 to 2026-09); CPILFESL (1957-01 to 2026-09); T10YIE and T5YIFR (5,967 non-missing each, from 2003-01-02, to 2026-11-06).
- yfinance: ^GSPC (16,322 daily rows from 1962-01-02, price index, no dividends), IEF and TLT (6,109 rows, from 2002-07-30, auto-adjusted).
- Weekly grid: every Wednesday 1962-01-03 to 2026-11-04, with the last available close on or before each Wednesday. 3,383 usable weekly returns (first 1962-01-10, last 2026-11-04). Breakeven sample: 1,243 weeks from 2003-01-15.
- Bond return: 10y semiannual par bond with coupon = last week's yield. Return = coupon carry (y x days/365) - D x dy + 0.5 x C x dy^2, D and C numerically from the par bond at last week's yield (average modified duration 7.6). No roll-down, no financing cost, no bid-ask.
- Regime: CPI-U NSA YoY. Month m is treated as available from the 15th of month m+1 (approximation of the BLS release; the actual release dates vary, and I did not use ALFRED vintages). CPIAUCNS is never revised, so this is real-time for the headline. 51.7% of weeks are classified high (>3%).
- Breakevens are the previous Wednesday's value (ffill), so known at the start of the return week.
- **Proxy validation (post-2002-08, n=1,266 weeks):** proxy vs IEF weekly return correlation 0.982 (0.979 in the 130 tail weeks); IEF-on-proxy slope 0.85 (IEF has shorter duration); mean 0.061% vs 0.068% a week; RMSE 0.23 pp. TLT correlation 0.916, slope 1.64 (much longer duration), RMSE 0.99 pp. So the proxy is a good 7-10y proxy after 2002; this says nothing directly about pre-2002 accuracy.

## 7. Method
Statistic: mean 10y return in the pooled worst-10% S&P weeks, high regime minus low regime. Stationary bootstrap (Politis-Romano 1994), mean block 13 weeks, resampling (equity return, bond return, regime) triples jointly in time order; the 10th-percentile cutoff is recomputed in each replicate; percentile 95% CI. Seed 20261107. Regressions use Newey-West HAC(8).

## 8. What is exploratory
Everything in the results.json["exploratory"] list: era splits, difference-in-differences, thresholds other than 3%, period tail means (1970s, 2021+, 2022, 2000-20), the downside regression, the rolling correlation, the within-regime tail definition and price-only variants. The primary CPI test, the two breakeven tests, and the block/tail-quantile/core/lag/expanding-tercile checks were planned before the outcomes were seen. The era split was added after the primary result because I suspected the confound.

## 9. Limits
1. High-inflation tail weeks are clustered in time (1970s and 1980s account for 107 of 194; 2021+ for 27). Weekly observations are not independent episodes; the effective sample is smaller than 194, which the 13-week block bootstrap only partly reflects (CIs are stable across blocks of 4 to 52 weeks).
2. Inflation regime and era are confounded. Within 1962-1999 and within 2000-2026 separately the CI for the CPI gap includes zero. The pooled YES should not be read as evidence that inflation specifically drives the hedge failure.
3. The breakeven tests have only ~35 to 49 tail weeks per tercile, and cannot rule out an effect of the same size as the CPI result (CIs span -0.95 to +1.20). They are inconclusive, not contradicting. The 5y5y point estimate has the wrong sign.
4. The bond return is a constant-maturity duration/convexity proxy from the CMT yield: no roll-down, no on-the-run effects, and the pre-1980s and pre-2002 accuracy is unvalidated (validation only post-2002 against IEF).
5. CPI release timing is approximated (15th of the next month), core CPI (CPILFESL) is seasonally adjusted at today's vintage, and no ALFRED real-time vintages were used. Real investors also saw expectations and surveys that CPI YoY ignores.
6. S&P 500 is a price index (no dividends); weekly Wed-to-Wed returns hide intraweek moves; one cutoff (-2.40%) is used for 1962-2026 even though volatility differs by era (a within-regime tail definition gives a similar answer).
7. Association not causation. The note does not show inflation causes bond-hedge failure, nor that CPI > 3% is a trading signal. Thresholds are not tuned; 3% was given.
8. Data end-points: last CPI is September 2026; weeks since then use that value.

## 10. Next steps
- Use ALFRED vintages for real-time CPI and Michigan/Cleveland Fed expectations as regime variables.
- Condition on the type of shock (oil/supply vs demand) as Li and Yoldas (2026) argue; e.g. oil-price moves as a covariate.
- Add a within-era (era fixed-effect) panel or a regime-switching correlation model to separate era from inflation.
- Test 5y and 30y Treasuries and TIPS as alternatives; add T-bill excess returns (see data_request note below).
- Daily-frequency replication post-1990 and a stationary bootstrap by episode (cluster by year).
- Proper data would be CRSP Treasury/Fama-Bliss bond returns (WRDS) to validate pre-2002 bond return proxy; not needed for the current note.

## 11. Figures
1. `figures/fig1_gap_by_spec.svg` - "In equity selloffs Treasuries earned 0.50 points a week less when CPI was above 3%; the breakeven tests do not confirm it". Alt: Interval chart of the high-minus-low inflation gap in mean 10-year Treasury weekly return during the worst equity weeks. Primary estimate -0.50 points with 95% CI [-0.85, -0.20]; the 10y breakeven tercile estimate is -0.34 [-0.95, +0.38].
2. `figures/fig2_mean_bond_return_tail_weeks.svg` - mean bond return in tail weeks by regime. Title states -0.17% (CPI>3%) vs +0.33% (CPI<=3%); bars also show breakeven terciles and exploratory 1970s and 2021-26. Alt text is generated from the values in the script (see the SVG aria-label).
3. `figures/fig3_rolling_corr.svg` - "By correlation, Treasuries were a poor equity hedge until 1999, a good one in 2000-2019, and a weaker one since 2020". Alt: Line chart of the rolling three-year correlation between weekly S&P 500 and 10-year Treasury returns, ranging from -0.63 (ending 2013-05-08) to 0.60 (ending 1996-10-09); last value 0.14. Sign convention: correlation of RETURNS, so positive means bonds fall with stocks (poor hedge). Five-year-block correlations (results.json corr_by_5yr_block, exploratory): +0.19 to +0.49 for 1965-1999 blocks, -0.33, -0.16, -0.54, -0.31 for the 2000-2019 blocks, +0.11 and +0.10 for 2020-24 and 2025-26. Li and Yoldas use correlations with bond yield changes, which flips the sign.

## 12. Sources
- Li, C. and Yoldas, E. (2026), "Government Bonds' Safe-Haven Property and Inflationary Pressures," FEDS Notes, Federal Reserve Board, 16 Oct 2026. https://www.federalreserve.gov/econres/notes/feds-notes/government-bonds-safe-haven-property-and-inflationary-pressures-20261016.html (inspiration; their evidence uses Bloomberg daily data, correlations with yield changes, and Consensus forecasts; this note does not replicate it).
- Liberty Street Economics (Nov 2026), "The U.S. Oil Sector's Role in Restraining Prices" (context only, not used): https://libertystreeteconomics.newyorkfed.org/2026/11/the-u-s-oil-sectors-role-in-restraining-prices/
- Politis, D. and Romano, J. (1994), "The Stationary Bootstrap," JASA 89(428). Newey, W. and West, K. (1987), Econometrica 55(3).
- Data: https://fred.stlouisfed.org/graph/fredgraph.csv?id= with DGS10, CPIAUCNS, CPILFESL, T10YIE, T5YIFR; yfinance ^GSPC, IEF, TLT.
