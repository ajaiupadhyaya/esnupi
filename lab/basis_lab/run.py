"""BASIS Lab entry point.

    python -m basis_lab.run [--topic "..."] [--ledger PATH] [--mock]

Run from the repo's lab/ directory (the workflow does this). Writes outputs for the
workflow to $GITHUB_OUTPUT and a human summary to $GITHUB_STEP_SUMMARY.
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
import tomllib
import traceback
from datetime import datetime, timezone
from pathlib import Path

from .llm import Budget, BudgetExceeded, Ledger
from .package import check_mdx, next_issue_number, place, review_brief, save_json
from .referee import referee
from .research import run_research
from .scout import run_scout
from .write import revise_issue, write_issue

LAB = Path(__file__).resolve().parent.parent
REPO = LAB.parent


def _out(**kv) -> None:
    gh = os.environ.get("GITHUB_OUTPUT")
    for k, v in kv.items():
        print(f"[output] {k}={v}")
        if gh:
            with open(gh, "a") as fh:
                fh.write(f"{k}={v}\n")


def _summary(md: str) -> None:
    p = os.environ.get("GITHUB_STEP_SUMMARY")
    if p:
        with open(p, "a") as fh:
            fh.write(md + "\n")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic", default=os.environ.get("BASIS_TOPIC") or None)
    ap.add_argument("--ledger", default=str(LAB / "state" / "ledger.json"))
    ap.add_argument("--mock", action="store_true", help="offline dry run with a scripted fake model")
    args = ap.parse_args(argv)

    cfg = tomllib.loads((LAB / "config.toml").read_text())
    ledger = Ledger.load(Path(args.ledger))
    now = datetime.now(timezone.utc)
    run_id = now.strftime("%Y-%m-%d-%H%M")
    logs: list[str] = []

    def log(msg: str) -> None:
        line = f"{datetime.now(timezone.utc).strftime('%H:%M:%S')} {msg}"
        print(line, flush=True)
        logs.append(line)

    if args.mock:
        from .mock import MockClient
        client = MockClient()
    else:
        import anthropic
        if not os.environ.get("ANTHROPIC_API_KEY"):
            log("ANTHROPIC_API_KEY is not set")
            _out(status="config-error")
            return 2
        client = anthropic.Anthropic()

    budget = Budget(cfg, ledger, client, run_id)
    left = budget.remaining_lifetime()
    if left < cfg["budget"]["min_to_start_usd"]:
        msg = f"Skipping: ${left:.2f} budget left (need ${cfg['budget']['min_to_start_usd']:.2f}). Raise [budget].total_usd in lab/config.toml."
        log(msg)
        _summary(f"### BASIS Lab\n{msg}")
        _out(status="no-budget")
        return 0

    work = LAB / "runs" / f"_work-{run_id}"
    work.mkdir(parents=True, exist_ok=True)
    status, slug, run_dir = "error", None, work
    try:
        # 1. Scout
        scout = run_scout(cfg, budget, REPO, work, args.topic, log)
        proposal = scout["picked"]
        slug = re.sub(r"[^a-z0-9-]", "", proposal["slug"].lower())[:48].strip("-") or "untitled"
        run_dir = LAB / "runs" / f"{now.strftime('%Y-%m-%d')}-{slug}"
        if run_dir.exists():
            shutil.rmtree(run_dir)
        work.rename(run_dir)

        # 2. Research
        research = run_research(cfg, budget, run_dir, proposal, log)
        repro = research["repro"]
        if research["missing"] or not repro.get("ran") or repro.get("exit") != 0 or not repro.get("results_written"):
            status = "research-incomplete"
            raise RuntimeError(f"Research did not produce reproducible deliverables: {research}")

        # 3. Write
        number = next_issue_number(REPO)
        date = now.strftime("%Y-%m-%d")
        mdx = write_issue(cfg, budget, REPO, run_dir, proposal, number, date, slug, log)
        (run_dir / "draft-1.mdx").write_text(mdx)

        # 4. Referee (+ one revision)
        report = referee(cfg, budget, REPO, run_dir, mdx, log)
        save_json(run_dir / "referee-1.json", report)
        if report.get("verdict") == "reject":
            status = "rejected"
            raise RuntimeError("Referee rejected the analysis: " + report.get("one_line", ""))
        if report.get("verdict") == "revise" or report.get("unmatched_numbers"):
            mdx = revise_issue(cfg, budget, REPO, mdx, report, log)
            (run_dir / "draft-2.mdx").write_text(mdx)
            try:
                report = referee(cfg, budget, REPO, run_dir, mdx, log)
                save_json(run_dir / "referee-2.json", report)
            except BudgetExceeded as e:
                log(f"second referee skipped: {e}")
                report["one_line"] = "(second referee pass skipped: budget) " + report.get("one_line", "")

        # 5. Package
        dest = place(REPO, run_dir, mdx, number, slug)
        ok, msg = check_mdx(REPO, dest)
        if not ok:
            status = "mdx-error"
            dest.unlink()
            raise RuntimeError(msg)

        title_m = re.search(r'title:\s*"([^"]+)"', mdx)
        title = title_m.group(1) if title_m else proposal["title"]
        status = "ready"
        costs = {"usd": budget.run_usd, "by_stage": budget.stage_usd}
        brief = review_brief(title=title, slug=slug, number=number, run_dir=run_dir, proposal=proposal,
                             scout=scout, report=report, research=research, costs=costs, mdx_check=msg,
                             lifetime=(ledger.total_usd, budget.total_cap))
        (run_dir / "PR_BODY.md").write_text(brief)
        _out(status=status, slug=slug, number=number, title=title.replace("\n", " "),
             branch=f"basis-lab/{run_dir.name}", run_dir=str(run_dir.relative_to(REPO)),
             verdict=report.get("verdict", ""))
        _summary(brief)
    except BudgetExceeded as e:
        status = "budget-stop"
        log(f"stopped: {e}")
    except Exception as e:  # noqa: BLE001
        log(f"{status}: {e}")
        traceback.print_exc()
    finally:
        save_json(run_dir / "logs" / "costs.json" if (run_dir / "logs").exists() else run_dir / "costs.json",
                  {"run_usd": budget.run_usd, "by_stage": budget.stage_usd, "calls": budget.calls})
        (run_dir / "run.log").write_text("\n".join(logs) + "\n")
        rec = budget.close_run(status, slug)
        if status != "ready":
            _out(status=status, run_dir=str(run_dir.relative_to(REPO)))
            _summary(f"### BASIS Lab: `{status}`\nRun cost ${rec['usd']:.2f} · lifetime ${ledger.total_usd:.2f} of ${budget.total_cap:.2f}\n\n```\n" + "\n".join(logs[-40:]) + "\n```")
        log(f"done: {status}, run ${rec['usd']:.2f}, lifetime ${ledger.total_usd:.2f}/{budget.total_cap:.2f}")
    return 0 if status == "ready" else 1


if __name__ == "__main__":
    sys.exit(main())
