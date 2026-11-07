"""Stage 2 — Researcher: an agent loop that writes and runs real Python on free data.

Client-side tools run inside the GitHub Actions runner (network on, API key stripped from
the child environment). Server-side web_search / web_fetch are run by the API.
Deliverables, all inside the run directory:
    analysis.py     one script that reproduces everything from scratch
    results.json    every number the write-up may use
    figures/*.svg   house-style charts made with basischart
    notes.md        findings, methods, exploratory vs confirmatory, limits, sources
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any

from .llm import Budget, BudgetExceeded, _get

TOOLKIT = Path(__file__).resolve().parent.parent / "toolkit"

RESEARCH_SYSTEM = """You are the research engineer for BASIS, AJ Upadhyaya's quantitative research
notes. You run a real analysis end to end in a sandboxed working directory, using Python and
FREE public data only. A separate writer will turn your outputs into the published note, and a
separate referee will check every number against your results, so precision and honesty
matter more than an exciting answer. A null result, clearly measured, is a good result.

## Tools
- run_python(filename, code): writes the file in the working directory and runs it with
  `python <filename>` (timeout {timeout}s). Network is available. stdout/stderr come back
  (truncated). Installed: numpy, pandas, scipy, statsmodels, requests, yfinance,
  feedparser, and `basischart` (house-style SVG charts; see below).
- write_file(path, content) / read_file(path) / list_files(): working directory only.
- web_search / web_fetch: find data endpoints, documentation, and the source post or paper.
- finish(summary): call ONLY when all deliverables exist and analysis.py has run cleanly.

## Data rules
- Free sources only: {free_data}
- FRED CSV without a key: https://fred.stlouisfed.org/graph/fredgraph.csv?id=SERIES_ID
- SEC EDGAR needs header User-Agent "basis-lab research ajaiupad@gmail.com".
- Cache downloads under data/ (it is not committed). Record every URL you download in
  results.json["data_sources"] with retrieval date and row counts.
- If the ideal data is paid (WRDS, Bloomberg, CRSP), use a free proxy AND write
  data_request.md describing the exact WRDS/Bloomberg query that would do it properly.

## Method rules
- State the hypothesis and test BEFORE looking at the outcome where possible. Anything you
  chose after seeing the data is exploratory; label it so in notes.md and results.json.
- Use appropriate inference: HAC/Newey-West for overlapping or autocorrelated series,
  clustered s.e. where grouped, bootstrap intervals for odd statistics. Report n.
- Do at least one robustness check (alternative window, specification or proxy).
- No look-ahead: features must be known at the time they are used.
- Never fabricate. If something fails, report the failure.

## Deliverables (all required)
1. analysis.py — ONE script that downloads (or reads cache), computes, writes results.json
   and every figure, and prints a short summary. It must run from scratch with
   `python analysis.py`. Develop in scratch files if you like, but consolidate here.
2. results.json — a flat-ish dict of every number the write-up may cite (with n, s.e., CIs,
   dates), plus "data_sources", "exploratory" (list of keys that are exploratory) and
   "headline" (one sentence).
3. figures/*.svg — 2 to 4 charts via basischart. Titles state the finding in words
   ("A true gap at the margin passes 5% of the time"); subtitles give units, sample and
   source. Usage:
     import sys; sys.path.insert(0, "{toolkit}")  # already on PYTHONPATH, harmless
     from basischart import line_chart, hbar_chart, interval_chart
     line_chart("figures/x.svg", title=..., subtitle=..., x=dates, series={{"name": ys}},
                y_fmt="{{:.1f}}%", alt="Full-sentence description with numbers")
     hbar_chart(path, title=, subtitle=, labels=[...], values=[...], v_fmt=, highlight=[0])
     interval_chart(path, title=, subtitle=, labels=, est=, lo=, hi=, band=(-m, m))
4. notes.md — for the writer: the question; data and sample construction (with counts);
   method; main results with numbers; robustness; what is exploratory; limits (at least
   five); what to do next; sources (data URLs, the inspiring post, methods papers with
   author-year). Each figure listed with its file name and the alt sentence.

Work efficiently: you have a limited budget and about {max_turns} turns. Check data
availability first with a small script, then build. Keep printed output short (summaries,
not whole DataFrames)."""


TOOLS_CLIENT = [
    {
        "name": "run_python",
        "description": "Write a Python file in the working directory and run it. Returns stdout/stderr.",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {"type": "string", "description": "e.g. probe.py or analysis.py"},
                "code": {"type": "string"},
            },
            "required": ["filename", "code"],
        },
    },
    {
        "name": "write_file",
        "description": "Write a text file (e.g. notes.md) in the working directory.",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string"}, "content": {"type": "string"}},
            "required": ["path", "content"],
        },
    },
    {
        "name": "read_file",
        "description": "Read a text file from the working directory (first 20k chars).",
        "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
    },
    {
        "name": "list_files",
        "description": "List files in the working directory (excluding data/).",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "finish",
        "description": "Call when all four deliverables exist and analysis.py runs cleanly.",
        "input_schema": {
            "type": "object",
            "properties": {"summary": {"type": "string"}},
            "required": ["summary"],
        },
    },
]


def _safe(run_dir: Path, rel: str) -> Path:
    p = (run_dir / rel).resolve()
    if run_dir.resolve() not in p.parents and p != run_dir.resolve():
        raise ValueError(f"path escapes working directory: {rel}")
    return p


def child_env(run_dir: Path) -> dict[str, str]:
    """Minimal environment for generated code: no API key, no GitHub token."""
    keep = {k: os.environ[k] for k in ("PATH", "LANG", "LC_ALL", "TZ", "HTTPS_PROXY", "HTTP_PROXY",
                                         "NO_PROXY", "SSL_CERT_FILE", "REQUESTS_CA_BUNDLE") if k in os.environ}
    keep.update({
        "HOME": str(run_dir),
        "PYTHONPATH": str(TOOLKIT),
        "MPLBACKEND": "Agg",
        "PYTHONDONTWRITEBYTECODE": "1",
    })
    return keep


def _limit_resources() -> None:
    """Cap generated code at 6 GB of memory so a runaway script can't take down the runner."""
    import resource
    gb = 6 * 1024**3
    resource.setrlimit(resource.RLIMIT_AS, (gb, gb))


def run_py(run_dir: Path, filename: str, timeout: int) -> tuple[int, str]:
    try:
        cp = subprocess.run(
            [sys.executable, filename],
            cwd=run_dir,
            env=child_env(run_dir),
            capture_output=True,
            text=True,
            timeout=timeout,
            preexec_fn=_limit_resources if os.name == "posix" else None,
        )
        out = (cp.stdout or "") + ("\n[stderr]\n" + cp.stderr if cp.stderr.strip() else "")
        return cp.returncode, out
    except subprocess.TimeoutExpired as e:
        return 124, f"TIMEOUT after {timeout}s\n{(e.stdout or '')[-3000:]}"


def _trunc(s: str, n: int = 8000) -> str:
    return s if len(s) <= n else s[: n // 2] + f"\n…[{len(s) - n} chars cut]…\n" + s[-n // 2 :]


def exec_tool(name: str, args: dict, run_dir: Path, cfg: dict) -> tuple[str, bool]:
    """Returns (result_text, is_error)."""
    try:
        if name == "run_python":
            fn = args["filename"]
            if not fn.endswith(".py") or "/" in fn:
                return "filename must be a bare *.py name", True
            _safe(run_dir, fn).write_text(args["code"])
            code, out = run_py(run_dir, fn, cfg["tools"]["python_timeout_s"])
            return f"exit code {code}\n{_trunc(out)}", code != 0
        if name == "write_file":
            p = _safe(run_dir, args["path"])
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(args["content"])
            return f"wrote {args['path']} ({len(args['content'])} chars)", False
        if name == "read_file":
            return _safe(run_dir, args["path"]).read_text()[:20000], False
        if name == "list_files":
            files = [
                str(p.relative_to(run_dir))
                for p in sorted(run_dir.rglob("*"))
                if p.is_file() and "data" not in p.relative_to(run_dir).parts[:1]
            ]
            return "\n".join(files) or "(empty)", False
    except Exception as e:  # noqa: BLE001
        return f"{type(e).__name__}: {e}", True
    return f"unknown tool {name}", True


def _block_dict(b: Any) -> dict:
    return b.model_dump(exclude_none=True) if hasattr(b, "model_dump") else dict(b)


def _set_cache_breakpoint(messages: list[dict]) -> None:
    """Keep exactly one rolling cache breakpoint on the last block of the last message."""
    for m in messages:
        if isinstance(m["content"], list):
            for blk in m["content"]:
                if isinstance(blk, dict):
                    blk.pop("cache_control", None)
    last = messages[-1]
    if isinstance(last["content"], str):
        last["content"] = [{"type": "text", "text": last["content"]}]
    last["content"][-1]["cache_control"] = {"type": "ephemeral"}


def deliverables_missing(run_dir: Path) -> list[str]:
    miss = [f for f in ("analysis.py", "results.json", "notes.md") if not (run_dir / f).exists()]
    figs = run_dir / "figures"
    if not (figs.exists() and any(figs.glob("*.svg"))):
        miss.append("figures/*.svg")
    return miss


def run_research(cfg: dict, budget: Budget, run_dir: Path, proposal: dict, log) -> dict:
    t = cfg["tools"]
    (run_dir / "figures").mkdir(exist_ok=True)
    (run_dir / "data").mkdir(exist_ok=True)
    system = [
        {
            "type": "text",
            "text": RESEARCH_SYSTEM.format(
                timeout=t["python_timeout_s"],
                free_data="; ".join(cfg["sources"]["free_data"]),
                toolkit=TOOLKIT,
                max_turns=t["research_max_turns"],
            ),
            "cache_control": {"type": "ephemeral"},
        }
    ]
    tools = TOOLS_CLIENT + [
        {"type": t["web_search_type"], "name": "web_search", "max_uses": t["research_max_searches"]},
        {
            "type": t["web_fetch_type"],
            "name": "web_fetch",
            "max_uses": t["research_max_fetches"],
            "max_content_tokens": t["fetch_max_content_tokens"],
        },
    ]
    messages: list[dict] = [
        {
            "role": "user",
            "content": "Research brief (from the scout). Investigate this, then produce the deliverables.\n\n"
            + json.dumps(proposal, indent=2, ensure_ascii=False),
        }
    ]
    finished, summary, turn = False, "", 0
    transcript = run_dir / "logs" / "research_transcript.jsonl"
    transcript.parent.mkdir(exist_ok=True)

    while turn < t["research_max_turns"]:
        turn += 1
        _set_cache_breakpoint(messages)
        try:
            resp = budget.call(
                "research",
                model=cfg["models"]["research"],
                max_tokens=16000,
                system=system,
                tools=tools,
                messages=messages,
            )
        except BudgetExceeded as e:
            log(f"research: budget stop — {e}")
            break
        content = [_block_dict(b) for b in resp.content]
        messages.append({"role": "assistant", "content": content})
        with transcript.open("a") as fh:
            fh.write(json.dumps({"turn": turn, "stop": resp.stop_reason, "content": content}, default=str)[:50000] + "\n")

        if resp.stop_reason == "pause_turn":
            continue  # server tool still working; resend to resume
        tool_uses = [b for b in content if b.get("type") == "tool_use"]
        server_ids = {b["id"] for b in content if b.get("type") == "server_tool_use"}
        resolved = {b.get("tool_use_id") for b in content if str(b.get("type", "")).endswith("_tool_result")}
        if not tool_uses and server_ids - resolved:
            continue  # a server tool is still pending: resend unchanged to let it finish
        if not tool_uses:
            if resp.stop_reason == "max_tokens":
                messages.append({"role": "user", "content": "You hit the output limit. Continue, using smaller tool calls."})
                continue
            missing = deliverables_missing(run_dir)
            messages.append({"role": "user", "content": f"Keep going with tools. Missing deliverables: {missing or 'none'}. Call finish when done."})
            continue

        results = []
        for tu in tool_uses:
            name, args = tu["name"], tu.get("input", {})
            if name == "finish":
                missing = deliverables_missing(run_dir)
                if missing:
                    results.append({"type": "tool_result", "tool_use_id": tu["id"], "is_error": True,
                                    "content": f"Not done. Missing: {missing}"})
                    continue
                finished, summary = True, args.get("summary", "")
                results.append({"type": "tool_result", "tool_use_id": tu["id"], "content": "ok"})
                continue
            out, is_err = exec_tool(name, args, run_dir, cfg)
            log(f"research[{turn}]: {name}({args.get('filename') or args.get('path') or ''}) -> {'ERR' if is_err else 'ok'}")
            results.append({"type": "tool_result", "tool_use_id": tu["id"], "content": out, "is_error": is_err})

        left = budget.stage_left("research")
        note = f"[budget: ${left:.2f} left for research; turn {turn}/{t['research_max_turns']}]"
        if left < 0.25 * budget.stage_cap("research") or turn >= t["research_max_turns"] - 3:
            note += " WRAP UP NOW: consolidate analysis.py, write results.json, figures and notes.md, then call finish."
        # The reply must contain ONLY tool_result blocks: if the model paired a server tool
        # (web_fetch/web_search) with a client tool, the API resumes that server call only
        # when the next user message is pure tool results. So the note rides inside one.
        results[-1]["content"] = f"{results[-1]['content']}\n\n{note}"
        messages.append({"role": "user", "content": results})
        if finished:
            break

    # Independent reproducibility check: re-run analysis.py from a clean state.
    repro = {"ran": False}
    if (run_dir / "analysis.py").exists():
        for svg in (run_dir / "figures").glob("*.svg"):
            svg.unlink()
        rj = run_dir / "results.json"
        if rj.exists():
            rj.rename(run_dir / "logs" / "results.agent.json")
        code, out = run_py(run_dir, "analysis.py", t["python_timeout_s"] * 2)
        (run_dir / "logs" / "final_run.txt").write_text(out)
        repro = {"ran": True, "exit": code, "results_written": rj.exists(),
                 "figures": sorted(p.name for p in (run_dir / "figures").glob("*.svg"))}
        log(f"research: reproducibility re-run exit={code}, figures={repro['figures']}")
    status = {
        "finished": finished,
        "summary": summary,
        "turns": turn,
        "missing": deliverables_missing(run_dir),
        "repro": repro,
    }
    (run_dir / "logs" / "research_status.json").write_text(json.dumps(status, indent=2))
    return status
