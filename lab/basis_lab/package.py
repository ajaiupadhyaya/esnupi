"""Stage 5 — Package: place the issue + figures in the site tree and write the review brief."""
from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path


def next_issue_number(repo: Path) -> int:
    nums = []
    for f in (repo / "src/content/basis").glob("[!_]*.mdx"):
        m = re.search(r"number:\s*(\d+)", f.read_text()[:400])
        if m:
            nums.append(int(m.group(1)))
    return max(nums, default=0) + 1


def check_mdx(repo: Path, mdx_path: Path) -> tuple[bool, str]:
    try:
        cp = subprocess.run(["node", "lab/scripts/check-mdx.mjs", str(mdx_path)], cwd=repo,
                            capture_output=True, text=True, timeout=120)
        return cp.returncode == 0, (cp.stdout + cp.stderr).strip()
    except FileNotFoundError:
        return True, "node not found; MDX check skipped"


def place(repo: Path, run_dir: Path, mdx: str, number: int, slug: str) -> Path:
    dest = repo / "src/content/basis" / f"{number:03d}-{slug}.mdx"
    dest.write_text(mdx)
    figdir = repo / "public/basis" / slug
    figdir.mkdir(parents=True, exist_ok=True)
    for svg in (run_dir / "figures").glob("*.svg"):
        shutil.copy2(svg, figdir / svg.name)
    return dest


def review_brief(*, title: str, slug: str, number: int, run_dir: Path, proposal: dict, scout: dict,
                 report: dict, research: dict, costs: dict, mdx_check: str, lifetime: tuple[float, float]) -> str:
    sev = {"blocking": "🛑", "major": "⚠️", "minor": "·"}
    issues = report.get("issues", [])
    lines = [
        f"## BASIS draft No. {number:03d}: {title}",
        "",
        f"**Referee verdict:** `{report.get('verdict')}` — {report.get('one_line', '')}",
        f"**Run cost:** ${costs['usd']:.2f} ({', '.join(f'{k} ${v:.2f}' for k, v in costs['by_stage'].items())}) · "
        f"**Lifetime:** ${lifetime[0]:.2f} of ${lifetime[1]:.2f}",
        f"**Reproducibility:** analysis.py re-run exit `{research['repro'].get('exit')}`, "
        f"figures {research['repro'].get('figures')}",
        f"**MDX check:** {mdx_check}",
        "",
        "> Nothing here is published until you merge. Check the Vercel preview link on this PR, "
        "read the issue on the page, and make sure you can defend every number out loud.",
        "",
        "### Before you merge",
    ]
    lines += [f"- [ ] {c}" for c in report.get("author_checklist", [])]
    lines += ["- [ ] Edit the voice where it doesn't sound like you", "- [ ] Confirm the 'How this was made' paragraph is accurate", ""]
    if report.get("unmatched_numbers"):
        lines += ["### Numbers the audit could not trace to results.json",
                  "", " ".join(f"`{n}`" for n in report["unmatched_numbers"]), ""]
    if issues:
        lines += ["### Referee notes (after revision)", ""]
        lines += [f"- {sev.get(i.get('severity'), '·')} **{i.get('severity')}** — {i.get('problem')}  \n  > {i.get('quote', '')[:200]}  \n  Fix: {i.get('fix', '')}" for i in issues]
        lines.append("")
    lines += ["### Likely interview questions", ""]
    lines += [f"{k}. {q}" for k, q in enumerate(report.get("interview_questions", []), 1)]
    lines += ["", "### The question", "", f"**{proposal.get('question', '')}**", "",
              f"Claim tested: {proposal.get('claim', '')}", "",
              "Inspired by: " + ", ".join(f"[{s.get('title')}]({s.get('url')})" for s in proposal.get("inspired_by", [])), ""]
    others = [p for p in scout.get("proposals", []) if p.get("slug") != slug]
    if others:
        lines += ["### Other topics the scout proposed", "",
                  "Re-run the workflow with one of these as `topic` to pursue it.", ""]
        lines += [f"- **{p.get('title')}** — {p.get('question', '')[:180]}" for p in others]
        lines.append("")
    lines += ["### Files", "",
              f"- Issue: `src/content/basis/{number:03d}-{slug}.mdx`",
              f"- Figures: `public/basis/{slug}/`",
              f"- Code, results, notes, logs: `lab/runs/{run_dir.name}/`", ""]
    return "\n".join(lines)


def save_json(path: Path, obj) -> None:
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False, default=str) + "\n")
