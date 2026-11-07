"""Anthropic client wrapper with hard spend accounting.

Every API call goes through `Budget.call()`, which prices the response's usage
block and refuses further calls once a stage, run or lifetime cap is reached.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class BudgetExceeded(RuntimeError):
    pass


@dataclass
class Ledger:
    """Lifetime spend, persisted as JSON (on the `lab-state` branch in CI)."""

    path: Path
    total_usd: float = 0.0
    runs: list[dict] = field(default_factory=list)

    @classmethod
    def load(cls, path: Path) -> "Ledger":
        if path.exists():
            d = json.loads(path.read_text())
            return cls(path=path, total_usd=d.get("total_usd", 0.0), runs=d.get("runs", []))
        return cls(path=path)

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(
            json.dumps({"total_usd": round(self.total_usd, 4), "runs": self.runs}, indent=2) + "\n"
        )


def _get(obj: Any, name: str, default: Any = 0) -> Any:
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(name, default) or default
    return getattr(obj, name, default) or default


class Budget:
    def __init__(self, cfg: dict, ledger: Ledger, client: Any, run_id: str):
        self.cfg = cfg
        self.ledger = ledger
        self.client = client
        self.run_id = run_id
        self.run_usd = 0.0
        self.stage_usd: dict[str, float] = {}
        self.calls: list[dict] = []
        b = cfg["budget"]
        self.total_cap = float(b["total_usd"])
        self.run_cap = float(b["per_run_usd"])

    # ---- pricing -------------------------------------------------------
    def price(self, model: str, usage: Any) -> float:
        p = self.cfg["pricing"][model]
        m = 1e-6
        cost = (
            _get(usage, "input_tokens") * p["input"] * m
            + _get(usage, "cache_creation_input_tokens") * p["cache_write"] * m
            + _get(usage, "cache_read_input_tokens") * p["cache_read"] * m
            + _get(usage, "output_tokens") * p["output"] * m
        )
        stu = _get(usage, "server_tool_use", None)
        cost += _get(stu, "web_search_requests") * self.cfg["tools"]["web_search_usd"]
        return cost

    def remaining_lifetime(self) -> float:
        return self.total_cap - self.ledger.total_usd

    def stage_cap(self, stage: str) -> float:
        return float(self.cfg["budget"].get(f"{stage}_usd", self.run_cap))

    def stage_left(self, stage: str) -> float:
        return self.stage_cap(stage) - self.stage_usd.get(stage, 0.0)

    def _check(self, stage: str) -> None:
        if self.ledger.total_usd >= self.total_cap:
            raise BudgetExceeded(
                f"Lifetime cap reached: ${self.ledger.total_usd:.2f} of ${self.total_cap:.2f}"
            )
        if self.run_usd >= self.run_cap:
            raise BudgetExceeded(f"Run cap reached: ${self.run_usd:.2f} of ${self.run_cap:.2f}")
        # Stages get 25% grace over their soft cap before a hard stop.
        if self.stage_usd.get(stage, 0.0) >= 1.25 * self.stage_cap(stage):
            raise BudgetExceeded(f"Stage '{stage}' cap reached: ${self.stage_usd[stage]:.2f}")

    # ---- the one entry point ------------------------------------------
    def call(self, stage: str, **kwargs: Any) -> Any:
        self._check(stage)
        model = kwargs["model"]
        for attempt in range(4):
            try:
                resp = self.client.messages.create(**kwargs)
                break
            except Exception as e:  # retry on overload / rate limit only
                status = getattr(e, "status_code", None)
                if status in (429, 500, 502, 503, 529) and attempt < 3:
                    time.sleep(10 * (attempt + 1))
                    continue
                raise
        usage = resp.usage
        cost = self.price(model, usage)
        self.run_usd += cost
        self.stage_usd[stage] = self.stage_usd.get(stage, 0.0) + cost
        self.ledger.total_usd += cost
        self.calls.append(
            {
                "stage": stage,
                "model": model,
                "in": _get(usage, "input_tokens"),
                "cache_w": _get(usage, "cache_creation_input_tokens"),
                "cache_r": _get(usage, "cache_read_input_tokens"),
                "out": _get(usage, "output_tokens"),
                "searches": _get(_get(usage, "server_tool_use", None), "web_search_requests"),
                "usd": round(cost, 5),
            }
        )
        self.ledger.save()  # persist after every call, so a crash never loses spend
        return resp

    def close_run(self, status: str, slug: str | None = None, pr: str | None = None) -> dict:
        rec = {
            "run_id": self.run_id,
            "finished": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "status": status,
            "slug": slug,
            "pr": pr,
            "usd": round(self.run_usd, 4),
            "by_stage": {k: round(v, 4) for k, v in self.stage_usd.items()},
            "calls": len(self.calls),
        }
        self.ledger.runs.append(rec)
        self.ledger.save()
        return rec


def text_of(resp: Any) -> str:
    """Concatenate the text blocks of a response."""
    return "".join(_get(b, "text", "") for b in resp.content if _get(b, "type", "") == "text")


def extract_json(text: str) -> Any:
    """Pull the last JSON object/array out of a model reply (tolerates ```json fences)."""
    import re

    fenced = re.findall(r"```(?:json)?\s*(.*?)```", text, flags=re.S)
    candidates = fenced[::-1] + [text]
    for c in candidates:
        c = c.strip()
        for opener, closer in (("{", "}"), ("[", "]")):
            i, j = c.find(opener), c.rfind(closer)
            if i != -1 and j > i:
                try:
                    return json.loads(c[i : j + 1])
                except json.JSONDecodeError:
                    continue
    raise ValueError("No JSON found in model output:\n" + text[:2000])
