import React, { useEffect, useState } from "react";
import {
  LuActivity, LuCircleDollarSign, LuClock, LuRefreshCw,
} from "react-icons/lu";
import { adminApi } from "../../lib/api";

/**
 * Live metric bar shown at the top of every admin page. Three numbers that
 * are actually actionable — everything else lives on the Dashboard.
 *
 * Polls at 15s; a stuck number is worse than a slightly stale one, and 15s
 * is fast enough to notice a pending withdrawal without hammering the API.
 */
const POLL_MS = 15000;

export default function AdminMetrics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let stopped = false;

    const load = async () => {
      try {
        const d = await adminApi.platformMetrics();
        if (!stopped) { setData(d); setError(false); }
      } catch {
        if (!stopped) setError(true);
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    return () => { stopped = true; clearInterval(id); };
  }, []);

  const manualRefresh = async () => {
    setRefreshing(true);
    try {
      const d = await adminApi.platformMetrics();
      setData(d);
      setError(false);
    } catch {
      setError(true);
    }
    setRefreshing(false);
  };

  const money = (n) =>
    `$${Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const pnl = data?.pnlToday ?? 0;

  return (
    <div className="adm-metrics">
      <div className="adm-metrics__item">
        <span className="adm-metrics__icon adm-metrics__icon--blue">
          <LuActivity />
        </span>
        <div>
          <span className="adm-metrics__label">Open trades</span>
          <strong className="adm-metrics__value">
            {data ? data.openTrades : "—"}
          </strong>
        </div>
      </div>

      <div className="adm-metrics__item">
        <span className="adm-metrics__icon adm-metrics__icon--amber">
          <LuClock />
        </span>
        <div>
          <span className="adm-metrics__label">Pending withdrawals</span>
          <strong className="adm-metrics__value">
            {data ? data.pendingWithdrawals : "—"}
          </strong>
        </div>
      </div>

      <div className="adm-metrics__item">
        <span className={`adm-metrics__icon ${pnl >= 0 ? "adm-metrics__icon--green" : "adm-metrics__icon--red"}`}>
          <LuCircleDollarSign />
        </span>
        <div>
          <span className="adm-metrics__label">Platform P&amp;L today</span>
          <strong className={`adm-metrics__value ${pnl >= 0 ? "is-pos" : "is-neg"}`}>
            {data ? `${pnl >= 0 ? "+" : "-"}${money(Math.abs(pnl))}` : "—"}
          </strong>
        </div>
      </div>

      <button
        className="adm-metrics__refresh"
        onClick={manualRefresh}
        disabled={refreshing}
        aria-label="Refresh metrics"
      >
        <LuRefreshCw className={refreshing ? "is-spinning" : ""} />
      </button>

      {error && <span className="adm-metrics__error">Last refresh failed</span>}
    </div>
  );
}
