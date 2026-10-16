import React, { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";

const money = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Platform P&L over the last `days` days. Line + area, no library — the
 * data volume is small (one point per day) and a hand-drawn SVG is smaller
 * and more controllable than pulling in a charting dependency.
 */
export default function PnlChart({ days = 14 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await adminApi.pnl(days);
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [days]);

  if (loading) return <div className="adm-chart-empty">Loading chart…</div>;
  if (err) return <div className="adm-chart-empty">{err}</div>;
  if (!rows.length) return <div className="adm-chart-empty">No settled trades in this range.</div>;

  const W = 720;
  const H = 220;
  const PAD = 24;

  const values = rows.map((r) => r.pnl);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;

  const stepX = (W - PAD * 2) / Math.max(rows.length - 1, 1);
  const x = (i) => PAD + i * stepX;
  const y = (v) => PAD + (1 - (v - min) / range) * (H - PAD * 2);

  const points = rows.map((r, i) => [x(i), y(r.pnl)]);
  const line = points.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px},${py}`).join(" ");
  const area = `${line} L${x(rows.length - 1)},${H - PAD} L${PAD},${H - PAD} Z`;
  const total = values.reduce((s, v) => s + v, 0);
  const positive = total >= 0;

  const fmtDay = (d) =>
    new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className={`adm-chart ${positive ? "is-pos" : "is-neg"}`}>
      <svg
        className="adm-chart__svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pnl-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={PAD}
          y1={y(0)}
          x2={W - PAD}
          y2={y(0)}
          stroke="var(--adm-border)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        <path d={area} fill="url(#pnl-area)" />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {points.map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r="3" fill="currentColor" />
        ))}
      </svg>

      <div className="adm-chart__axis">
        <span>{fmtDay(rows[0].day)}</span>
        <span>{fmtDay(rows[rows.length - 1].day)}</span>
      </div>

      <div className="adm-chart__foot">
        <span className="adm-chart__foot-label">Total for period</span>
        <strong className={positive ? "is-pos" : "is-neg"}>
          {positive ? "+" : "-"}{money(Math.abs(total))}
        </strong>
      </div>
    </div>
  );
}
