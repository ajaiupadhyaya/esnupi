# Data request (optional, would tighten the bond-return proxy)

Free proxy used: 10y par-bond return from FRED DGS10 (carry + duration + convexity), validated against IEF/TLT only after 2002-08.

Proper version (WRDS / CRSP US Treasury Database):
- Table `crsp.tfz_dly` (daily Treasury quotes and returns) with `crsp.tfz_ft` (Fama-Bliss / CRSP fixed-term indexes) — fixed-term index `KYTREASNO` for the 10-year maturity bucket, or the CRSP Treasury 7-10 year index returns, 1962-01 to date.
- Fields: `caldt`, `tdretnua` (daily unadjusted return), `tdyld`, `ttermtype`, `tcouprt`, `tdduratn` (duration).
- Compute Wednesday-to-Wednesday compounded returns and replace `W.bond` in analysis.py; also pull 3-month T-bill returns (`crsp.mcti` / `tfz_dly` 90-day bucket) for excess returns.
- Real-time CPI: ALFRED (free) vintages of CPIAUCSL / CPILFESL replace the 15th-of-next-month availability approximation.
