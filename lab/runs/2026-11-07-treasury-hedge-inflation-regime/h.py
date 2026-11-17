import basischart, inspect
for f in ["line_chart","hbar_chart","interval_chart"]:
    print(inspect.signature(getattr(basischart,f)))
    print((getattr(basischart,f).__doc__ or "")[:600])
