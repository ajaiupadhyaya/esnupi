import json,os
R=json.load(open("results.json"))
print(os.listdir("figures"), [os.path.getsize("figures/"+f) for f in os.listdir("figures")])
for ds in R["data_sources"]: print(ds)
print(R["sample"],R["breakeven_sample"],R["avg_mod_duration_proxy"],R["eq_tail_cutoff_10pct_full"])
for k in ["regression_full","regression_downside","regression_be10_top_tercile_2003_2026","regression_cpi_2003_2026"]:
    r=R[k]; print(k,r["n"],{x:(round(r[x+"_coef"],3),round(r[x+"_se"],3)) for x in ["eqr","high","eq_x_high"]})
print(R["primary_welch_naive"],R["primary_hedge_hit_rate"],R["pct_weeks_cpi_gt3"])
print(R["primary_cpi_gt3"])
print(R["be10_tercile_primary"]["tercile_cutoffs_pct"],R["be5y5y_tercile_primary"]["tercile_cutoffs_pct"])
print(R["exploratory_eras"]["era_1962_1999"]["n_tail_high"], R["distinct_years_with_high_regime_tail_weeks"])
import re
print(open("figures/fig1_gap_by_spec.svg").read()[:400])
