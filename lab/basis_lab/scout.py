"""Stage 1 — Scout: read feeds for free, then ask the model for ranked, testable topics."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from .llm import Budget, extract_json, text_of

SCOUT_SYSTEM = """You are the topic scout for BASIS, a quantitative research-notes series by
AJ Upadhyaya, a finance student targeting quant research and trading roles (Jane Street,
Citadel, D. E. Shaw, JPMorgan). Each BASIS issue answers ONE testable question with real,
free, public data and code that a Python process can run in under 10 minutes.

You will be given recent posts from firm blogs and research feeds, and the list of existing
BASIS issues. Propose research questions that:
- are *inspired by* something current in the feed (a post, paper, market event), not a
  summary of it. The value is new analysis: a replication on newer data, an out-of-sample
  test, a stress of an assumption, a measurement nobody has published;
- can be answered with FREE data only (listed below). No paid data, no scraping behind
  logins, no data that needs a human to download;
- have a falsifiable claim and a clear yes/no or a number with an interval;
- are honest about what the answer would NOT show;
- do not repeat an existing issue.

Prefer: market microstructure, volatility, rates and curve, credit spreads, factor
replication, forecasting evaluation, risk-model testing, macro-finance measurement.
Avoid: price predictions, "will X go up", sentiment fluff, anything needing tick data.

You may use web_search (sparingly) to check recent posts from firms without feeds and to
confirm a data series exists.

Return ONLY a JSON object:
{"proposals": [ {
  "slug": "kebab-case-short",
  "title": "Sentence-case question, under 70 chars",
  "question": "The one question, precisely stated",
  "claim": "The falsifiable claim and what counts as yes / no",
  "inspired_by": [{"title": "...", "url": "..."}],
  "data": [{"source": "FRED", "series_or_endpoint": "...", "why": "..."}],
  "method": "2-4 sentences: estimator, sample, inference (s.e., bootstrap, etc.)",
  "will_not_show": "One sentence",
  "feasibility": 1-5,
  "signal_to_recruiters": 1-5,
  "risk": "What could make this fail to produce a result"
} ], "pick": "<slug of the best one>", "why_pick": "one sentence"}
Give 5 proposals, ranked best first."""


def fetch_feeds(urls: list[str], per_feed: int = 8, timeout: int = 15) -> tuple[list[dict], list[str]]:
    """Read RSS/Atom feeds. Free (no API tokens). Returns (items, errors)."""
    import feedparser
    import requests

    items, errors = [], []
    headers = {"User-Agent": "basis-lab/1.0 (+https://ajaiupadhyaya.com)"}
    for url in urls:
        try:
            r = requests.get(url, headers=headers, timeout=timeout)
            r.raise_for_status()
            feed = feedparser.parse(r.content)
            if not feed.entries:
                errors.append(f"{url}: no entries")
                continue
            src = feed.feed.get("title", url)
            for e in feed.entries[:per_feed]:
                summ = re.sub(r"<[^>]+>", " ", e.get("summary", ""))
                summ = re.sub(r"\s+", " ", summ).strip()[:400]
                items.append(
                    {
                        "source": src,
                        "title": e.get("title", "").strip(),
                        "url": e.get("link", ""),
                        "date": e.get("published", e.get("updated", ""))[:16],
                        "summary": summ,
                    }
                )
        except Exception as ex:  # noqa: BLE001 — a dead feed must never kill the run
            errors.append(f"{url}: {type(ex).__name__}: {str(ex)[:120]}")
    return items, errors


def existing_issues(repo: Path) -> list[dict]:
    out = []
    for f in sorted((repo / "src/content/basis").glob("[!_]*.mdx")):
        head = f.read_text()[:800]
        t = re.search(r'title:\s*"([^"]+)"', head)
        d = re.search(r'dek:\s*"([^"]+)"', head)
        out.append({"file": f.name, "title": t.group(1) if t else f.stem, "dek": d.group(1) if d else ""})
    return out


def run_scout(cfg: dict, budget: Budget, repo: Path, run_dir: Path, topic: str | None, log) -> dict:
    items, errors = fetch_feeds(cfg["sources"]["feeds"])
    log(f"scout: {len(items)} feed items, {len(errors)} feed errors")
    (run_dir / "feeds.json").write_text(json.dumps({"items": items, "errors": errors}, indent=2))

    issues = existing_issues(repo)
    user = {
        "today": run_dir.name[:10],
        "existing_basis_issues": issues,
        "firms_without_feeds_to_check": cfg["sources"]["search_targets"],
        "free_data_allowed": cfg["sources"]["free_data"],
        "recent_feed_items": items[:70],
    }
    if topic:
        user["author_requested_topic"] = (
            f"The author asked for this topic: {topic!r}. Make proposal #1 a precise, testable "
            "version of it, and still give 4 alternatives."
        )

    resp = budget.call(
        "scout",
        model=cfg["models"]["scout"],
        max_tokens=6000,
        system=SCOUT_SYSTEM,
        tools=[
            {
                "type": cfg["tools"]["web_search_type"],
                "name": "web_search",
                "max_uses": cfg["tools"]["scout_max_searches"],
            }
        ],
        messages=[{"role": "user", "content": json.dumps(user, ensure_ascii=False)}],
    )
    # Server tools can pause long turns; resume until done.
    msgs = [{"role": "user", "content": json.dumps(user, ensure_ascii=False)}]
    text = text_of(resp)
    while getattr(resp, "stop_reason", "") == "pause_turn":
        msgs.append({"role": "assistant", "content": resp.content})
        resp = budget.call("scout", model=cfg["models"]["scout"], max_tokens=6000, system=SCOUT_SYSTEM,
                           tools=[{"type": cfg["tools"]["web_search_type"], "name": "web_search",
                                   "max_uses": cfg["tools"]["scout_max_searches"]}], messages=msgs)
        text = text_of(resp)

    data: dict[str, Any] = extract_json(text)
    props = data.get("proposals", [])
    if not props:
        raise RuntimeError("Scout returned no proposals")
    pick = next((p for p in props if p.get("slug") == data.get("pick")), props[0])
    data["picked"] = pick
    (run_dir / "proposals.json").write_text(json.dumps(data, indent=2, ensure_ascii=False))
    log(f"scout: picked '{pick['slug']}' — {pick['title']}")
    return data
