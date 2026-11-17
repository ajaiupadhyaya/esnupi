import re
src=open("analysis.py").read()
# run up to rc computation only
cut=src.index("def ci_txt")
ns={}
exec(compile(src[:cut],"a","exec"),ns)
W=ns["W"]
g=W.groupby((W.index.year//5)*5).apply(lambda d: d.eqr.corr(d.bond))
print(g.round(2).to_dict())
