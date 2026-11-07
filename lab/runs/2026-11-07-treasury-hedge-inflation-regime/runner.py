import subprocess,json
s=open("analysis.py").read()
old='so the pre-specified claim is {verdict_cpi}.")'
new='''so the pre-specified claim is {verdict_cpi}, but the gap is {expl['era_1962_1999']['diff_pct']:+.2f} pp (CI {ci_txt(expl['era_1962_1999'])}) within 1962-1999 and {expl['era_2000_2026']['diff_pct']:+.2f} pp (CI {ci_txt(expl['era_2000_2026'])}) within 2000-2026, and the breakeven tests are inconclusive.")'''
assert old in s
s=s.replace(old,new); open("analysis.py","w").write(s)
r=subprocess.run(["python","analysis.py"],capture_output=True,text=True)
print(r.stderr[-800:]); print(json.load(open("results.json"))["headline"])
n=open("notes.md").read()
i=n.index("3. `figures/fig3"); j=n.index("## 12. Sources")
n=n[:i]+'''3. `figures/fig3_rolling_corr.svg` - "By correlation, Treasuries were a poor equity hedge until 1999, a good one in 2000-2019, and a weaker one since 2020". Alt: Line chart of the rolling three-year correlation between weekly S&P 500 and 10-year Treasury returns, ranging from -0.63 (ending 2013-05-08) to 0.60 (ending 1996-10-09); last value 0.14. Sign convention: correlation of RETURNS, so positive means bonds fall with stocks (poor hedge). Five-year-block correlations (results.json corr_by_5yr_block, exploratory): +0.19 to +0.49 for 1965-1999 blocks, -0.33, -0.16, -0.54, -0.31 for the 2000-2019 blocks, +0.11 and +0.10 for 2020-24 and 2025-26. Li and Yoldas use correlations with bond yield changes, which flips the sign.

'''+n[j:]
open("notes.md","w").write(n)
