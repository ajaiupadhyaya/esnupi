import pandas as pd, requests, io, yfinance as yf, os
os.makedirs("data",exist_ok=True)
for s in ["DGS10","CPIAUCNS","CPILFESL","T10YIE","T5YIFR","GS10"]:
    r=requests.get(f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={s}",timeout=60)
    d=pd.read_csv(io.StringIO(r.text))
    print(s,r.status_code,d.shape,d.iloc[0,0],d.iloc[-1].tolist())
    d.to_csv(f"data/{s}.csv",index=False)
for t in ["^GSPC","IEF","TLT"]:
    d=yf.download(t,start="1962-01-01",progress=False,auto_adjust=True)
    print(t,d.shape,d.index[0],d.index[-1])
    d.to_csv(f"data/{t.replace('^','')}.csv")
