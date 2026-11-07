"""Stage 3 — Writer (Opus): turn research outputs into a BASIS issue in the house style."""
from __future__ import annotations

import json
import re
from pathlib import Path

from .llm import Budget, text_of

WRITER_TASK = """Write BASIS issue No. {number} as a complete MDX file.

Rules that override everything else:
1. Every number in the issue must come from results.json, the final run log, or a cited
   source. If a number you want is not there, leave it out. Do not round beyond what the
   standard error supports, and do not compute new numbers yourself unless the arithmetic is
   trivial and you show the inputs (e.g. a difference of two reported values).
2. Label exploratory results as exploratory, in the same sentence as the number.
3. Figures: use exactly these files, at these paths: {figures}. Use their alt sentences
   from notes.md (edit for style only, keep the numbers).
4. The code link is https://github.com/ajaiupadhyaya/esnupi/tree/main/lab/runs/{run_name}
5. The "How this was made" section is required (see the style guide).
6. Output ONLY the MDX file, starting with `export const meta = {{`. No code fences around it.

meta: number {number}, date "{date}", slug "{slug}".

--- PROPOSAL (scout) ---
{proposal}

--- notes.md (researcher) ---
{notes}

--- results.json ---
{results}

--- final run log (tail) ---
{runlog}
{data_request}"""

REVISE_TASK = """The referee reviewed your draft. Fix every blocking and major issue, and any minor
issue you agree with. Do not add new claims. Output ONLY the full corrected MDX file.

--- REFEREE REPORT ---
{report}

--- YOUR DRAFT ---
{draft}"""


def _system(repo: Path, cfg: dict, style: str) -> list[dict]:
    ex = []
    for rel in cfg["style"]["exemplars"]:
        p = repo / rel
        if p.exists():
            ex.append(f"<example_issue file=\"{p.name}\">\n{p.read_text()}\n</example_issue>")
    return [
        {
            "type": "text",
            "text": "You are the writer for BASIS, AJ Upadhyaya's research notes. You write in his "
            "house style exactly. The style guide and two published issues follow; match their "
            "structure, voice, density and honesty.\n\n<style_guide>\n" + style + "\n</style_guide>\n\n"
            + "\n\n".join(ex),
            "cache_control": {"type": "ephemeral"},
        }
    ]


def clean_mdx(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:mdx|markdown)?\s*\n", "", text)
    text = re.sub(r"\n```\s*$", "", text)
    i = text.find("export const meta")
    return (text[i:] if i > 0 else text).strip() + "\n"


def write_issue(cfg, budget: Budget, repo: Path, run_dir: Path, proposal: dict, number: int,
                date: str, slug: str, log) -> str:
    style = (repo / "lab/style/STYLE.md").read_text()
    figs = [f"/basis/{slug}/{p.name}" for p in sorted((run_dir / "figures").glob("*.svg"))]
    runlog = (run_dir / "logs/final_run.txt")
    dr = run_dir / "data_request.md"
    task = WRITER_TASK.format(
        number=number, date=date, slug=slug, run_name=run_dir.name,
        figures=", ".join(figs) or "(none)",
        proposal=json.dumps(proposal, indent=2, ensure_ascii=False),
        notes=(run_dir / "notes.md").read_text()[:30000],
        results=(run_dir / "results.json").read_text()[:30000],
        runlog=runlog.read_text()[-4000:] if runlog.exists() else "",
        data_request=("\n--- data_request.md (mention under 'What I'd do next') ---\n" + dr.read_text()[:4000]) if dr.exists() else "",
    )
    resp = budget.call("write", model=cfg["models"]["writer"], max_tokens=20000,
                       system=_system(repo, cfg, style), messages=[{"role": "user", "content": task}])
    if resp.stop_reason == "max_tokens":
        raise RuntimeError("writer hit the output limit; draft would be truncated")
    mdx = clean_mdx(text_of(resp))
    log(f"writer: draft {len(mdx.split())} words")
    return mdx


def revise_issue(cfg, budget: Budget, repo: Path, draft: str, report: dict, log) -> str:
    style = (repo / "lab/style/STYLE.md").read_text()
    resp = budget.call("write", model=cfg["models"]["writer"], max_tokens=20000,
                       system=_system(repo, cfg, style),
                       messages=[{"role": "user", "content": REVISE_TASK.format(
                           report=json.dumps(report, indent=2, ensure_ascii=False), draft=draft)}])
    if resp.stop_reason == "max_tokens":
        raise RuntimeError("writer hit the output limit on revision")
    mdx = clean_mdx(text_of(resp))
    log(f"writer: revision {len(mdx.split())} words")
    return mdx
