"""BASIS house-style SVG charts, matching the hand-made figures in public/basis/.

White field, Helvetica title (17px bold), mono subtitle (12px grey), light grey
gridlines, black zero line, series in blue / black / grey. No dependencies.

    from basischart import line_chart, hbar_chart, interval_chart
    line_chart("out.svg", title="…", subtitle="…, Source: FRED",
               x=[...], series={"10y–2y": [...]}, y_fmt="{:.1f}%")
"""
from __future__ import annotations

import math
from datetime import date, datetime
from html import escape
from typing import Callable, Sequence

W = 760
SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"
MONO = "ui-monospace, Menlo, Monaco, 'Liberation Mono', monospace"
BLUE, BLACK, GREY = "#160bff", "#000", "#7a7a7a"
PALETTE = [BLUE, BLACK, GREY, "#9c97ff", "#4a4a4a"]
GRID, SUB = "#e2e2e2", "#6b6b6b"

__all__ = ["line_chart", "hbar_chart", "interval_chart", "PALETTE"]


def _t(x, y, s, size=11, fam=MONO, fill=BLACK, anchor="start", weight=None):
    w = f' font-weight="{weight}"' if weight else ""
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-family="{fam}" font-size="{size}" '
        f'fill="{fill}" text-anchor="{anchor}"{w}>{escape(str(s))}</text>'
    )


def _nice_ticks(lo: float, hi: float, n: int = 5) -> list[float]:
    if hi == lo:
        hi = lo + 1
    span = hi - lo
    step = 10 ** math.floor(math.log10(span / n))
    for m in (1, 2, 2.5, 5, 10):
        if span / (step * m) <= n:
            step *= m
            break
    start = math.floor(lo / step) * step
    ticks, v = [], start
    while True:  # always end on a tick at or beyond hi, so data never runs off the axis
        ticks.append(round(v, 10))
        if v >= hi - step * 1e-9:
            break
        v += step
    return ticks


def _header(title: str, subtitle: str, h: int, alt: str | None) -> list[str]:
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {h}" role="img" '
        f'aria-label="{escape(alt or title)}">',
        f'<rect width="{W}" height="{h}" fill="#fff"/>',
        _t(0, 22, title, 17, SANS, BLACK, weight=700),
        _t(0, 44, subtitle, 12, MONO, SUB),
    ]


def _legend(names: Sequence[str], colors: Sequence[str], x0: float, y: float) -> list[str]:
    out, x = [], x0
    for name, c in zip(names, colors):
        out.append(f'<rect x="{x:.1f}" y="{y - 9:.1f}" width="10" height="10" fill="{c}"/>')
        out.append(_t(x + 15, y, name, 11))
        x += 15 + 7.2 * len(name) + 22
    return out


def _fmt(fmt: str | Callable | None, v: float) -> str:
    if fmt is None:
        return f"{v:g}"
    if callable(fmt):
        return fmt(v)
    s = fmt.format(v)
    return s.replace("-", "−")


def line_chart(
    path: str,
    *,
    title: str,
    subtitle: str,
    x: Sequence,
    series: dict[str, Sequence[float | None]],
    y_fmt: str | Callable | None = None,
    x_fmt: Callable | None = None,
    alt: str | None = None,
    h: int = 400,
    hline: float | None = 0.0,
    colors: Sequence[str] | None = None,
) -> str:
    """Line chart. x may be numbers, dates or datetimes. None values break the line."""
    colors = list(colors or PALETTE)
    xs = [(v.toordinal() if isinstance(v, (date, datetime)) else float(v)) for v in x]
    is_date = bool(x) and isinstance(x[0], (date, datetime))
    vals = [v for s in series.values() for v in s if v is not None and not math.isnan(v)]
    lo, hi = min(vals), max(vals)
    if hline is not None:
        lo, hi = min(lo, hline), max(hi, hline)
    pad = (hi - lo) * 0.05 or 1
    yt = _nice_ticks(lo - pad, hi + pad)
    y0, y1 = yt[0], yt[-1]
    L, R, T, B = 56, W - 12, 74, h - 40
    X = lambda v: L + (v - min(xs)) / ((max(xs) - min(xs)) or 1) * (R - L)
    Y = lambda v: B - (v - y0) / ((y1 - y0) or 1) * (B - T)

    out = _header(title, subtitle, h, alt)
    if len(series) > 1:
        out += _legend(list(series), colors, L, 62)
    for t in yt:
        col = BLACK if (hline is not None and abs(t - hline) < 1e-12) else GRID
        out.append(f'<line x1="{L}" y1="{Y(t):.1f}" x2="{R}" y2="{Y(t):.1f}" stroke="{col}" stroke-width="1"/>')
        out.append(_t(L - 6, Y(t) + 4, _fmt(y_fmt, t), 11, MONO, SUB, "end"))
    # x ticks: ~6 evenly spaced labels
    n = len(x)
    idx = sorted({round(i * (n - 1) / 5) for i in range(6)}) if n > 1 else [0]
    for i in idx:
        v = x[i]
        lab = x_fmt(v) if x_fmt else (v.strftime("%Y-%m") if is_date else f"{v:g}")
        out.append(_t(X(xs[i]), B + 18, lab, 11, MONO, SUB, "middle"))
    for (name, ys), c in zip(series.items(), colors):
        segs, cur = [], []
        for xv, yv in zip(xs, ys):
            if yv is None or (isinstance(yv, float) and math.isnan(yv)):
                if cur:
                    segs.append(cur)
                cur = []
            else:
                cur.append(f"{X(xv):.1f},{Y(yv):.1f}")
        if cur:
            segs.append(cur)
        for sgm in segs:
            out.append(f'<polyline points="{" ".join(sgm)}" fill="none" stroke="{c}" stroke-width="1.6"/>')
    out.append("</svg>")
    return _write(path, out)


def hbar_chart(
    path: str,
    *,
    title: str,
    subtitle: str,
    labels: Sequence[str],
    values: Sequence[float],
    v_fmt: str | Callable | None = None,
    alt: str | None = None,
    highlight: Sequence[int] = (),
) -> str:
    """Horizontal bars, one per label. Highlighted indices are blue, others black."""
    rows = len(labels)
    h = 80 + rows * 30 + 30
    L, R, T = 220, W - 70, 70
    lo, hi = min(0, min(values)), max(0, max(values))
    X = lambda v: L + (v - lo) / ((hi - lo) or 1) * (R - L)
    out = _header(title, subtitle, h, alt)
    out.append(f'<line x1="{X(0):.1f}" y1="{T}" x2="{X(0):.1f}" y2="{T + rows * 30}" stroke="{BLACK}"/>')
    for i, (lab, v) in enumerate(zip(labels, values)):
        y = T + i * 30
        c = BLUE if i in highlight else BLACK
        x0, x1 = sorted((X(0), X(v)))
        out.append(_t(0, y + 17, lab, 13, SANS))
        out.append(f'<rect x="{x0:.1f}" y="{y + 6:.1f}" width="{max(x1 - x0, 1):.1f}" height="16" fill="{c}"/>')
        out.append(_t(x1 + 6 if v >= 0 else x0 - 6, y + 18, _fmt(v_fmt, v), 11, MONO, BLACK, "start" if v >= 0 else "end"))
    out.append("</svg>")
    return _write(path, out)


def interval_chart(
    path: str,
    *,
    title: str,
    subtitle: str,
    labels: Sequence[str],
    est: Sequence[float],
    lo: Sequence[float],
    hi: Sequence[float],
    v_fmt: str | Callable | None = None,
    band: tuple[float, float] | None = None,
    alt: str | None = None,
) -> str:
    """Point estimates with intervals (e.g. 90% CIs), optional shaded margin band."""
    rows = len(labels)
    h = 90 + rows * 34 + 30
    L, R, T = 220, W - 20, 74
    vals = list(lo) + list(hi) + ([*band] if band else []) + [0]
    a, b = min(vals), max(vals)
    pad = (b - a) * 0.08 or 1
    xt = _nice_ticks(a - pad, b + pad)
    X = lambda v: L + (v - xt[0]) / ((xt[-1] - xt[0]) or 1) * (R - L)
    out = _header(title, subtitle, h, alt)
    bottom = T + rows * 34
    if band:
        out.append(f'<rect x="{X(band[0]):.1f}" y="{T}" width="{X(band[1]) - X(band[0]):.1f}" height="{rows * 34}" fill="#eceaff"/>')
    for t in xt:
        col = BLACK if abs(t) < 1e-12 else GRID
        out.append(f'<line x1="{X(t):.1f}" y1="{T}" x2="{X(t):.1f}" y2="{bottom}" stroke="{col}"/>')
        out.append(_t(X(t), bottom + 18, _fmt(v_fmt, t), 11, MONO, SUB, "middle"))
    for i, lab in enumerate(labels):
        y = T + i * 34 + 17
        out.append(_t(0, y + 4, lab, 13, SANS))
        out.append(f'<line x1="{X(lo[i]):.1f}" y1="{y}" x2="{X(hi[i]):.1f}" y2="{y}" stroke="{BLACK}" stroke-width="2"/>')
        out.append(f'<circle cx="{X(est[i]):.1f}" cy="{y}" r="5.5" fill="{BLUE}"/>')
    out.append("</svg>")
    return _write(path, out)


def _write(path: str, parts: list[str]) -> str:
    svg = "\n".join(parts[:2]) + "".join(parts[2:])
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg + "\n")
    return path
