"""Stage 4 — Referee: a deterministic number audit plus an independent model review."""
from __future__ import annotations

import json
import re
from pathlib import Path

from .llm import Budget, extract_json, text_of

REFEREE_SYSTEM = """You are an exacting referee for a quantitative research note that will appear on
the author's personal site, read by quant recruiters and researchers. You did not write it.
Your job is to protect the author's credibility.

Check, in order:
1. Numbers: every number in the draft must be supported by results.json, the run log, or a
   cited source. A machine audit of unmatched numbers is provided; judge each one (some are
   years, section numbers or trivially derived, which is fine).
2. Claims: does the prose overstate what the analysis shows? Causal language from
   correlations? Exploratory results presented as confirmatory? Missing n or uncertainty?
3. Method: look-ahead, overlapping-observation s.e. without HAC, data-snooping, survivorship.
   Read analysis.py for this.
4. Style: matches the BASIS style guide (structure, Summary bullets, Limits table, How this
   was made, Sources paragraph, no banned words, figures with full-sentence alt text).
5. MDX safety: no raw `<`, `>`, `{` or `}` in prose outside code spans.

Return ONLY JSON:
{"verdict": "pass" | "revise" | "reject",
 "issues": [{"severity": "blocking"|"major"|"minor", "quote": "exact text from draft",
             "problem": "...", "fix": "..."}],
 "interview_questions": ["5 hard questions an interviewer could ask about this piece"],
 "author_checklist": ["3-6 things AJ should personally verify before merging"],
 "one_line": "one-sentence assessment"}
Use "reject" only if the analysis itself is broken or meaningless; "revise" if fixable."""

NUM_RE = re.compile(r"(?<![\w/.#-])[−-]?\d[\d,]*(?:\.\d+)?%?")


def _norms(tok: str) -> set[str]:
    t = tok.replace("−", "-").replace(",", "").rstrip("%")
    out = {t}
    try:
        v = float(t)
        out |= {f"{v:g}", f"{abs(v):g}"}
        for d in range(0, 5):
            out.add(f"{v:.{d}f}")
            out.add(f"{abs(v):.{d}f}")
        if tok.endswith("%"):  # 7.73% may be stored as 0.0773
            out |= {f"{v / 100:.{d}f}" for d in range(2, 7)} | {f"{v / 100:g}"}
    except ValueError:
        pass
    return out


def _source_numbers(blob: str) -> set[str]:
    nums = set()
    for m in re.finditer(r"-?\d+(?:\.\d+)?(?:[eE]-?\d+)?", blob.replace(",", "")):
        s = m.group(0)
        try:
            v = float(s)
        except ValueError:
            continue
        nums.add(s)
        nums.add(f"{v:g}")
        for d in range(0, 5):
            nums.add(f"{v:.{d}f}")
            nums.add(f"{abs(v):.{d}f}")
            nums.add(f"{v * 100:.{d}f}")  # fraction stored, percent written
    return nums


def number_audit(mdx: str, run_dir: Path) -> list[str]:
    """Numbers in the prose that appear nowhere in results.json / run log / notes."""
    body = re.sub(r"\(/basis/[^)]+\)|\(https?://[^)]+\)", "", mdx)  # drop link targets
    body = re.sub(r"^export const meta = \{.*?\};", "", body, flags=re.S)
    blob = ""
    for f in ("results.json", "logs/final_run.txt", "notes.md"):
        p = run_dir / f
        if p.exists():
            blob += p.read_text()
    known = _source_numbers(blob)
    unmatched = []
    for tok in sorted(set(NUM_RE.findall(body))):
        t = tok.replace(",", "").replace("−", "-").rstrip("%")
        try:
            v = float(t)
        except ValueError:
            continue
        if v.is_integer() and (0 <= v <= 12 or 1900 <= v <= 2100):
            continue  # section numbers, small counts, years
        if not (_norms(tok) & known):
            unmatched.append(tok)
    return unmatched


def referee(cfg, budget: Budget, repo: Path, run_dir: Path, mdx: str, log) -> dict:
    unmatched = number_audit(mdx, run_dir)
    style = (repo / "lab/style/STYLE.md").read_text()
    payload = (
        f"<style_guide>\n{style}\n</style_guide>\n\n"
        f"<draft>\n{mdx}\n</draft>\n\n"
        f"<results_json>\n{(run_dir / 'results.json').read_text()[:25000]}\n</results_json>\n\n"
        f"<run_log_tail>\n{(run_dir / 'logs/final_run.txt').read_text()[-4000:] if (run_dir / 'logs/final_run.txt').exists() else ''}\n</run_log_tail>\n\n"
        f"<analysis_py>\n{(run_dir / 'analysis.py').read_text()[:30000]}\n</analysis_py>\n\n"
        f"<machine_number_audit unmatched=\"{len(unmatched)}\">{json.dumps(unmatched)}</machine_number_audit>"
    )
    resp = budget.call("referee", model=cfg["models"]["referee"], max_tokens=5000,
                       system=REFEREE_SYSTEM, messages=[{"role": "user", "content": payload}])
    report = extract_json(text_of(resp))
    report["unmatched_numbers"] = unmatched
    n_block = sum(1 for i in report.get("issues", []) if i.get("severity") == "blocking")
    log(f"referee: {report.get('verdict')} — {n_block} blocking, {len(unmatched)} unmatched numbers")
    return report
