## BASIS draft No. 008: Treasuries in equity selloffs: an inflation gap that roughly halves within eras

**Referee verdict:** `revise` — The numbers largely match results.json and the honesty scaffolding is strong, but the headline 'roughly halves within eras' and the 5y5y 'tension' claim rest on mismatched definitions and windows and need to be fixed or softened.
**Run cost:** $1.94 (scout $0.10, research $0.74, write $0.66, referee $0.44) · **Lifetime:** $3.66 of $10.00
**Reproducibility:** analysis.py re-run exit `0`, figures ['fig1_gap_by_spec.svg', 'fig2_mean_bond_return_tail_weeks.svg', 'fig3_rolling_corr.svg']
**MDX check:** ok /home/runner/work/esnupi/esnupi/src/content/basis/008-treasury-hedge-inflation-regime.mdx

> Nothing here is published until you merge. Check the Vercel preview link on this PR, read the issue on the page, and make sure you can defend every number out loud.

### Before you merge
- [ ] Open the full results.json and verify every regression coefficient and s.e. in section 6, including +0.071 (0.048) and +0.160 (0.052).
- [ ] Rerun the era gaps on the fixed −2.40% cutoff and update the title, dek, lead, Summary, section 5 and Limits to match.
- [ ] Check the Li and Yoldas (2026) citation: title, date, URL, and the claims about its data and sign convention. Confirm the CRSP table names.
- [ ] Confirm there is a dated commit or brief showing the 3% threshold, 13-week block and breakeven tests were fixed before the outcomes were seen.
- [ ] Fix the −1.06 rounding and confirm the figures render with their alt text. Trim the piece toward the word limit.
- [ ] Edit the voice where it doesn't sound like you
- [ ] Confirm the 'How this was made' paragraph is accurate

### Numbers the audit could not trace to results.json

`131` `143,` `197,` `63`

### Referee notes (after revision)

- ⚠️ **major** — The title, dek and lead headline an exploratory result whose tail definition differs from the primary test. The era rows redefine the worst 10% inside each era, and the draft itself says part of the move from −0.50 to about −0.28 may come from that. Both within-era intervals include zero. The caveat is buried in section 5, while the headline presents 'halves' as a finding.  
  > Treasuries in equity selloffs: an inflation gap that roughly halves within eras  
  Fix: Rerun the era gaps on the fixed −2.40% cutoff before publishing. From the decade table I get roughly −0.32 before 2000 and −0.21 after, but compute it in code. Report those numbers. Soften the title, for example 'with an inflation gap that shrinks but does not clearly vanish within eras'. Mark it exploratory in the dek.
- ⚠️ **major** — This is stated as fact. The draft has just said the −0.28 and −0.25 may partly reflect the changed tail definition. The within-era intervals include zero, so 'half' has no uncertainty attached. No era-adjusted model was fitted, and the regression section says so.  
  > The other half of the pooled gap comes from comparing eras.  
  Fix: Say 'may come from comparing eras' or give the fixed-cutoff era numbers with an interval for the share. Add 'about half' only as a point estimate with a caveat.
- ⚠️ **major** — The 5y5y test covers 2003 to 2026 only. The CPI test in the same window gives −0.13 (−0.76 to +0.56), and the 5y5y interval (−0.20 to +1.20) includes −0.13. The 'tension' compares a short-window estimate with the full-sample −0.50. Breakevens also measure expectations and term premia, not realised inflation. The same framing recurs in the dek, Summary and Limits.  
  > the 5y5y test is mildly in tension with the CPI result  
  Fix: Compare the 5y5y gap with the same-window CPI gap and say the two are not distinguishable. Drop or heavily qualify 'tension' and 'mild evidence against' in the lead, dek, Summary and Limits. State that the breakeven tests are mostly uninformative because the window is short.
- ⚠️ **major** — The regression table (−0.048 (0.020), +0.142 (0.031), +0.082 (0.038)) cannot be checked against the supplied results.json, which is truncated at regression_full. The run log confirms only the be10 regression (+0.067, s.e. 0.045). The +0.071 (0.048) and +0.160 (0.052) figures are also unverified here.  
  > +0.142 (0.031)  
  Fix: Confirm every regression coefficient and s.e. in the draft against the full results.json before merging.
- · **minor** — results.json gives a lower bound of −1.0548, which rounds to −1.05. The draft appears to have rounded from the run log's three-decimal −1.055.  
  > −0.45 on breakeven terciles (−1.06 to +0.29)  
  Fix: Change to −1.05.
- · **minor** — The low-inflation pre-2000 mean is −0.14% with an interval from −0.47 to +0.16, and bonds rose in 46% to 63% of those weeks by decade. 'Tended to fall' is too strong. The same applies to 'after 2000 they tended to rise' in high-inflation weeks (mean +0.37%, interval −0.07 to +0.91).  
  > Before 2000, bonds tended to fall in equity tail weeks whatever CPI was doing  
  Fix: Describe the point estimates and say the pre-2000 low-regime interval includes zero.
- · **minor** — Nothing in the supplied materials shows the pre-specification beyond a code docstring. A pipeline-generated analysis makes this claim worth documenting.  
  > The test, the 3% threshold and the bootstrap were fixed before I looked at outcomes.  
  Fix: Point to a dated commit or brief that contains the spec. Otherwise reword to 'were set in the brief before the analysis ran'.
- · **minor** — The regression was not in the pre-specified list, yet it is not labelled post hoc. The Limits row 'Post hoc work' lists only the downside regression.  
  > As a second view of the full sample, I regressed  
  Fix: Say the regression was added after the primary test, and add it to the Limits row.
- · **minor** — Stability across block lengths does not show validity. The regimes last years to decades, so even 52-week blocks understate dependence in regime membership. The effective number of independent episodes is small. The year-clustered bootstrap is deferred to future work.  
  > The 13-week blocks only partly reflect that, though intervals are stable from 4 to 52 weeks.  
  Fix: State plainly that the CI likely understates uncertainty. Run the year-cluster or era-block bootstrap now, since it is cheap.
- · **minor** — The statistic is a difference in means, not a typical week. Bond returns in tail weeks are widely dispersed.  
  > A gap of −0.50 means that in a typical bad equity week the bond did half a percent worse when inflation was high.  
  Fix: Write 'in the average tail week, the bond returned 0.50 points less'.
- · **minor** — The alt texts for figures 1 and 3 are noun phrases, not full sentences. The figure 3 alt gives only min and max, not the finding (three eras) that the prose draws from it. The three-era reading is not supported in the supplied results beyond the min and max values.  
  > High-minus-low inflation gap in mean 10-year Treasury weekly return during the worst equity weeks: the primary estimate is −0.50 points  
  Fix: Rewrite as full sentences that state the finding. Support the three-era claim with the 5-year block correlations from results.json.
- · **minor** — The piece is well over the 1,500 to 2,800 word guide, probably 3,500 or more. The lead runs about seven sentences against the guide's 3 to 5. Section 5 holds the era split, the decade table, the 2022 aside and the difference-in-differences.  
  > The decade breakdown shows how uneven that is.  
  Fix: Cut the 2022 aside and shorten the difference-in-differences paragraph. Trim the lead to five sentences.
- · **minor** — The WRDS table names and the description of the Li and Yoldas (2026) data and method are asserted without a source and cannot be verified from the materials.  
  > `crsp.tfz_dly` with the fixed-term indexes in `crsp.tfz_ft`  
  Fix: Verify the CRSP table names and the Li and Yoldas details against the actual references, or describe them generically.

### Likely interview questions

1. Your era rows use era-specific tail cutoffs. What is the within-era gap on the fixed −2.40% cutoff, and does 'about half remains' survive?
2. The 5y5y gap is +0.46 and the same-window CPI gap is −0.13. Why call that tension rather than two uninformative estimates?
3. How many independent inflation-regime episodes are in 1962 to 2026? Why should a 13-week stationary bootstrap give a valid interval when the regime variable persists for years?
4. You added the 2000 split after seeing the result. How sensitive are the within-era numbers to the break date, and how many other splits did you try?
5. The proxy is validated only after 2002 against IEF, and the slope of 0.85 is attributed partly to noise. How do you know the proxy's error is not correlated with inflation or yield levels in the 1970s and 1980s?

### The question

**In weeks when US equities fall sharply, do 10-year Treasuries earn a lower or negative return when trailing inflation is above 3% than when it is below 3%?**

Claim tested: Using weekly data from 1962 to 2026, take the worst 10% of S&P 500 weeks. YES if mean 10y Treasury return in those weeks is lower in the high-inflation regime (real-time CPI YoY above 3%) than in the low one, and a block-bootstrap 95% CI for the difference excludes zero. NO if the CI includes zero. The same test is repeated with 5y5y or 10y breakeven terciles for 2003–2026.

Inspired by: [FEDS Note: Government Bonds' Safe-Haven Property and Inflationary Pressures](https://www.federalreserve.gov/econres/notes/feds-notes/government-bonds-safe-haven-property-and-inflationary-pressures-20261016.html), [Liberty Street: The U.S. Oil Sector's Role in Restraining Prices (2026 oil shock)](https://libertystreeteconomics.newyorkfed.org/2026/11/the-u-s-oil-sectors-role-in-restraining-prices/)

### Other topics the scout proposed

Re-run the workflow with one of these as `topic` to pursue it.

- **Is the pre-FOMC drift still there after publication?** — Does the S&P 500 still earn an abnormal return from the close before an FOMC announcement to the announcement-day close, in the years since the effect was documented?
- **Has the value-momentum diversification benefit decayed since 2013?** — Across French-library regions, did the Sharpe ratio of a 50/50 value-momentum combination and the negative correlation between the two factors fall after 2013?
- **Did VIX-implied ranges cover the 2026 shock?** — How often did the S&P 500's 21-day return fall inside the VIX-implied 1σ and 2σ intervals over 1990–2026, and was coverage worse in the 2026 Middle East oil shock?
- **Does volatility-decay maths predict leveraged ETF drag?** — Do 2x and 3x ETFs' realised 1-year return shortfalls versus L times the index match the −½L(L−1)σ² decay formula plus fees, or is there residual drag?

### Files

- Issue: `src/content/basis/008-treasury-hedge-inflation-regime.mdx`
- Figures: `public/basis/treasury-hedge-inflation-regime/`
- Code, results, notes, logs: `lab/runs/2026-11-07-treasury-hedge-inflation-regime/`
