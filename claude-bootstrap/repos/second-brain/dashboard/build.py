#!/usr/bin/env python3
"""Build dashboard.html from log.csv (stdlib only). Prints a one-line summary."""
import csv, datetime as dt, html, pathlib

HERE = pathlib.Path(__file__).resolve().parent
METRICS = [("sleep_h", "Sleep (h)"), ("workout_min", "Workout (min)"),
           ("deep_work_h", "Deep work (h)"), ("mood_1_5", "Mood (1-5)"), ("spend_cad", "Spend (C$)")]


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def avg(rows, key, days):
    cutoff = dt.date.today() - dt.timedelta(days=days)
    vals = [num(r[key]) for r in rows if r["_d"] > cutoff and num(r[key]) is not None]
    return sum(vals) / len(vals) if vals else None


def spark(rows, key, w=240, h=40):
    pts = [(r["_d"], num(r[key])) for r in rows[-30:] if num(r[key]) is not None]
    if len(pts) < 2:
        return "<svg width='%d' height='%d'></svg>" % (w, h)
    ys = [p[1] for p in pts]
    lo, hi = min(ys), max(ys) or 1
    span = (hi - lo) or 1
    coords = " ".join("%.1f,%.1f" % (i * w / (len(pts) - 1), h - 4 - (y - lo) / span * (h - 8))
                      for i, (_, y) in enumerate(pts))
    return ("<svg width='%d' height='%d' viewBox='0 0 %d %d'><polyline fill='none' "
            "stroke='currentColor' stroke-width='2' points='%s'/></svg>" % (w, h, w, h, coords))


def main():
    with open(HERE / "log.csv", newline="") as f:
        rows = [r for r in csv.DictReader(f) if r.get("date")]
    for r in rows:
        r["_d"] = dt.date.fromisoformat(r["date"])
    rows.sort(key=lambda r: r["_d"])

    fmt = lambda v: "–" if v is None else "%.1f" % v
    cards = "".join(
        "<div class='c'><h3>%s</h3><p><b>%s</b> 7d · %s 30d</p>%s</div>"
        % (label, fmt(avg(rows, k, 7)), fmt(avg(rows, k, 30)), spark(rows, k)) for k, label in METRICS)
    recent = "".join("<tr><td>%s</td><td>%s</td></tr>" % (r["date"], html.escape(r.get("notes") or ""))
                     for r in reversed(rows[-7:]))
    page = f"""<!doctype html><meta charset=utf-8><title>Life Dashboard</title>
<style>:root{{color-scheme:light dark}}body{{font:15px system-ui;margin:24px;max-width:900px}}
.g{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}}
.c{{border:1px solid #8884;border-radius:10px;padding:12px}}h3{{margin:0 0 4px;font-size:14px}}
td{{padding:2px 10px 2px 0}}</style>
<h1>Life Dashboard</h1><p>{len(rows)} days logged · built {dt.date.today()}</p>
<div class=g>{cards}</div><h2>Last 7 notes</h2><table>{recent}</table>"""
    (HERE / "dashboard.html").write_text(page)
    print("7d avg: " + ", ".join("%s %s" % (label.split(" (")[0], fmt(avg(rows, k, 7))) for k, label in METRICS))


if __name__ == "__main__":
    main()
