"""Scripted stand-in for the Anthropic client, for offline dry runs (`--mock`).

Exercises every code path (tool loop, reproducibility re-run, revision, packaging, MDX
check) without network or spend. Costs are simulated from fake usage numbers.
"""
from __future__ import annotations

import json
from types import SimpleNamespace as NS

ANALYSIS = r'''
import json, numpy as np
from basischart import line_chart, interval_chart
rng = np.random.default_rng(7)
n = 520
x = rng.standard_normal(n)
y = 0.12 * x + rng.standard_normal(n)
b = float(np.polyfit(x, y, 1)[0])
boots = []
for _ in range(400):
    i = rng.integers(0, n, n)
    boots.append(np.polyfit(x[i], y[i], 1)[0])
lo, hi = np.percentile(boots, [5, 95])
res = {"headline": "Mock slope is small and positive.", "n": n, "slope": round(b, 4),
       "ci90_lo": round(float(lo), 4), "ci90_hi": round(float(hi), 4),
       "data_sources": [{"name": "synthetic", "rows": n}], "exploratory": []}
import os; os.makedirs("figures", exist_ok=True)
cum = np.cumsum(y).tolist()
line_chart("figures/cumulative.svg", title="The mock series drifts up", subtitle="Cumulative sum, synthetic, n=520",
           x=list(range(n)), series={"Mock": cum}, y_fmt="{:.0f}", alt="The mock series drifts up over 520 steps")
interval_chart("figures/slope.svg", title="The slope interval excludes zero", subtitle="OLS slope, 90% bootstrap interval",
               labels=["Slope"], est=[b], lo=[float(lo)], hi=[float(hi)], v_fmt="{:.2f}",
               alt=f"The slope is {b:.2f} with a 90% interval from {lo:.2f} to {hi:.2f}")
json.dump(res, open("results.json", "w"), indent=2)
print("slope", round(b, 4), "ci", round(float(lo), 4), round(float(hi), 4))
'''

NOTES = """# Notes (mock)
Question: is the mock slope positive? Data: synthetic, n=520. Method: OLS with 400 bootstrap
resamples. Figures: figures/cumulative.svg — "The mock series drifts up over 520 steps";
figures/slope.svg — slope interval. Limits: synthetic; one seed; no inference beyond toy.
"""


def _usage(i=4000, o=800, cr=0, cw=0, s=0):
    return NS(input_tokens=i, output_tokens=o, cache_read_input_tokens=cr,
              cache_creation_input_tokens=cw, server_tool_use=NS(web_search_requests=s))


class _Blk(NS):
    def model_dump(self, exclude_none=True):
        return {k: v for k, v in self.__dict__.items() if v is not None}


def _text(t):
    return _Blk(type="text", text=t)


def _tool(id_, name, inp):
    return _Blk(type="tool_use", id=id_, name=name, input=inp)


class _Messages:
    def __init__(self):
        self.research_turn = 0
        self.referee_calls = 0

    def create(self, **kw):
        sys_txt = kw["system"] if isinstance(kw["system"], str) else kw["system"][0]["text"]
        if "topic scout" in sys_txt:
            props = [{"slug": f"mock-topic-{k}", "title": f"Is mock effect {k} real", "question": "Is the slope positive?",
                      "claim": "Yes if the 90% interval excludes zero.", "inspired_by": [{"title": "A post", "url": "https://example.com"}],
                      "data": [], "method": "OLS + bootstrap", "will_not_show": "Anything real.",
                      "feasibility": 5, "signal_to_recruiters": 1, "risk": "none"} for k in range(1, 4)]
            return NS(content=[_text(json.dumps({"proposals": props, "pick": "mock-topic-1", "why_pick": "test"}))],
                      usage=_usage(9000, 1500, s=2), stop_reason="end_turn")
        if "research engineer" in sys_txt:
            self.research_turn += 1
            t = self.research_turn
            if t == 1:
                c = [_text("Building."), _tool("t1", "run_python", {"filename": "analysis.py", "code": ANALYSIS})]
            elif t == 2:
                c = [_tool("t2", "write_file", {"path": "notes.md", "content": NOTES}), _tool("t3", "list_files", {})]
            else:
                c = [_tool("t4", "finish", {"summary": "done"})]
            return NS(content=c, usage=_usage(3000, 1200, cr=8000 * t, cw=2000), stop_reason="tool_use")
        if "writer for BASIS" in sys_txt:
            res = {}
            for m in kw["messages"]:
                if "results.json ---" in str(m["content"]):
                    blob = str(m["content"]).split("--- results.json ---")[1].split("---")[0]
                    res = json.loads(blob)
            return NS(content=[_text(_mock_mdx(res))], usage=_usage(20000, 3500, cw=15000), stop_reason="end_turn")
        if "exacting referee" in sys_txt:
            self.referee_calls += 1
            verdict = "revise" if self.referee_calls == 1 else "pass"
            rep = {"verdict": verdict, "issues": [] if verdict == "pass" else
                   [{"severity": "minor", "quote": "drifts", "problem": "vague", "fix": "be specific"}],
                   "interview_questions": ["Why bootstrap?", "Why 90%?"], "author_checklist": ["Check the seed"],
                   "one_line": "Mock review."}
            return NS(content=[_text(json.dumps(rep))], usage=_usage(12000, 900), stop_reason="end_turn")
        raise RuntimeError("mock: unknown stage")


def _mock_mdx(r):
    return f'''export const meta = {{
  number: 0,
  title: "Is mock effect 1 real",
  date: "2026-01-01",
  dek: "A pipeline test. The slope is {r.get("slope")}, from synthetic data.",
}};

This is a dry-run issue. The slope is {r.get("slope")} on {r.get("n")} synthetic points, with a 90% interval from {r.get("ci90_lo")} to {r.get("ci90_hi")}. It shows nothing about markets.

## Summary

- **What it is.** A test of the pipeline.
- **What it found.** A slope of {r.get("slope")}.
- **What it does not show.** Anything real.

## 1. The result

| Statistic | Value |
| --- | --- |
| Slope | {r.get("slope")} |
| 90% interval | {r.get("ci90_lo")} to {r.get("ci90_hi")} |

![The mock series drifts up over 520 steps](/basis/mock-topic-1/cumulative.svg)

## 2. Limits

| Limit | What it means |
| --- | --- |
| Synthetic | Not data |

## 3. How this was made

Produced with Claude through an automated pipeline under my direction.

## Sources

None. This page is a test.
'''


class MockClient:
    def __init__(self):
        self.messages = _Messages()
