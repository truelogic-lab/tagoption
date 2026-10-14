import React, { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";

export default function PnlChart({ days = 14 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setRows(await adminApi.pnl(days)); } catch {}
      setLoading(false);
    })();
  }, [days]);

  if (loading) return <div className="pnl-empty">Loading P&L…</div>;
  if (!rows.length) return <div className="pnl-empty">No closed trades yet.</div>;

  const max = Math.max(...rows.map((r) => Math.abs(r.pnl)), 1);
  const W = 100, H = 100;

  return (
    <div className="pnl">
      <div className="pnl__chart">
        {rows.map((r, i) => {
          const pct = (Math.abs(r.pnl) / max) * 100;
          const pos = r.pnl >= 0;
          return (
            <div
              key={i}
              className={`pnl__bar ${pos ? "is-pos" : "is-neg"}`}
              style={{ height: `${pct}%` }}
              title={`${new Date(r.day).toLocaleDateString()} · ${pos ? "+" : "-"}$${Math.abs(r.pnl).toFixed(2)}`}
            />
          );
        })}
      </div>
      <div className="pnl__labels">
        <span>{new Date(rows[0].day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <span>{new Date(rows[rows.length - 1].day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
      </div>
      <div className="pnl__total">
        Total:{" "}
        <strong className={rows.reduce((s, r) => s + r.pnl, 0) >= 0 ? "is-pos" : "is-neg"}>
          ${rows.reduce((s, r) => s + r.pnl, 0).toFixed(2)}
        </strong>
      </div>
    </div>
  );
}
