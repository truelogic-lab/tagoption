import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuUsers, LuActivity, LuDollarSign, LuClock, LuArrowUpRight,
  LuTrendingUp, LuTrendingDown, LuListChecks, LuCoins,
} from "react-icons/lu";
import { adminApi } from "../../lib/api";
import PnlChart from "../../components/admin/PnlChart";
import Sparkline from "../../components/admin/Sparkline";
import Donut from "../../components/admin/Donut";
import Spinner from "../../components/ui/Spinner";

const money = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const num = (n) => Number(n || 0).toLocaleString();

function pctDelta(current, previous) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { dir: "up", label: "new" };
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  return {
    dir: delta >= 0 ? "up" : "down",
    label: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`,
  };
}

export default function Overview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [error, setError] = useState("");
  const [pnlDays, setPnlDays] = useState(14);

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      try {
        const [d, txs] = await Promise.all([
          adminApi.overview(),
          adminApi.transactions({ limit: 6 }).catch(() => []),
        ]);
        if (stopped) return;
        setData(d);
        setRecentTx(Array.isArray(txs) ? txs : Array.isArray(txs?.rows) ? txs.rows : []);
        setError("");
      } catch (e) {
        if (!stopped) setError(e.message || "Failed to load dashboard");
      }
    };
    load();
    const id = setInterval(load, 10000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []);

  const adminName = useMemo(() => {
    try {
      const s = JSON.parse(localStorage.getItem("tagoption.session") || "null");
      return (s?.user?.name || "").split(" ")[0];
    } catch {
      return "";
    }
  }, []);

  if (error) {
    return (
      <div className="adm-page">
        <div className="adm-state">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="adm-page">
        <div className="loading">
          <Spinner size="md" tone="muted" />
          <span>Loading dashboard…</span>
        </div>
      </div>
    );
  }

  const trades = data.trades || {};
  const tx = data.transactions || {};
  const settled = (trades.won || 0) + (trades.lost || 0);
  const openCount = trades.open || 0;

  const previous = data.periods?.previous || {};
  const current = data.periods?.current || {};
  const trend = Array.isArray(data.trend) ? data.trend : [];

  const userDelta = pctDelta(current.users, previous.users);
  const settledDelta = pctDelta(current.settled, previous.settled);
  const pnlDelta = pctDelta(current.pnl, previous.pnl);

  const donutSegments = [
    { label: "Won",  value: trades.won || 0, color: "var(--adm-pos)" },
    { label: "Lost", value: trades.lost || 0, color: "var(--adm-neg)" },
    { label: "Open", value: openCount,       color: "var(--adm-blue)" },
  ];

  return (
    <div className="adm-page">
      <div className="adm-hero">
        <div>
          <h1 className="adm-hero__title">
            Welcome back{adminName ? `, ${adminName}` : ""}
          </h1>
          <p className="adm-hero__sub">
            Platform performance and recent trading activity.
          </p>
        </div>
        <div className="adm-hero__date">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      <div className="adm-kpis">
        <KpiCard
          icon={<LuUsers />}
          tone="blue"
          label="Users"
          value={num(data.users)}
          delta={userDelta}
          spark={trend.map((r) => r.users)}
        />
        <KpiCard
          icon={<LuActivity />}
          tone="purple"
          label="Settled trades"
          value={num(settled)}
          hint={`${num(openCount)} open`}
          delta={settledDelta}
          spark={trend.map((r) => r.settled)}
        />
        <KpiCard
          icon={<LuDollarSign />}
          tone="green"
          label="Platform P&L"
          value={money(data.totalPlatform)}
          hint="Cumulative from settled trades"
          delta={pnlDelta}
          spark={trend.map((r) => r.pnl)}
        />
        <KpiCard
          icon={<LuClock />}
          tone="amber"
          label="Pending"
          value={num(tx.pending)}
          hint="Awaiting review"
          spark={null}
        />
      </div>

      <div className="adm-grid">
        <div className="adm-card">
          <div className="adm-card__head">
            <h2 className="adm-card__title">Trade outcomes</h2>
            <span className="adm-card__hint">All-time</span>
          </div>
          <div className="adm-donut-wrap">
            <Donut
              segments={donutSegments}
              size={150}
              thickness={22}
              label="Total trades"
              value={num(trades.total || 0)}
            />
            <ul className="adm-legend">
              {donutSegments.map((s) => (
                <li key={s.label}>
                  <span
                    className="adm-legend__dot"
                    style={{ background: s.color }}
                  />
                  <span className="adm-legend__label">{s.label}</span>
                  <strong className="adm-legend__value">{num(s.value)}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card__head">
            <h2 className="adm-card__title">Performance</h2>
          </div>
          <div className="adm-stats">
            <Stat label="Volume"        value={money(data.totalVolume)} />
            <Stat label="Real edge"     value={`${((data.edge || 0) * 100).toFixed(2)}%`} />
            <Stat label="Win rate"      value={`${((data.winRate || 0) * 100).toFixed(1)}%`} />
            <Stat label="User balances" value={money(data.totalUserBalance)} />
            <Stat label="In escrow"     value={money(data.totalEscrow)} />
            <Stat label="Deposits"      value={num(tx.deposits)} />
          </div>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card__head">
          <h2 className="adm-card__title">Platform P&amp;L</h2>
          <div className="adm-range">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                className={`adm-range__btn ${pnlDays === d ? "is-active" : ""}`}
                onClick={() => setPnlDays(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <PnlChart days={pnlDays} />
      </div>

      <div className="adm-grid">
        <div className="adm-card">
          <div className="adm-card__head">
            <h2 className="adm-card__title">Quick actions</h2>
          </div>
          <div className="adm-quick">
            <Quick
              icon={<LuUsers />}
              label="Users"
              desc="Search and manage accounts"
              onClick={() => navigate("/admin/users")}
            />
            <Quick
              icon={<LuActivity />}
              label="Open trades"
              desc="Review active positions"
              onClick={() => navigate("/admin/trades")}
            />
            <Quick
              icon={<LuCoins />}
              label="Withdrawals"
              desc="Approve or reject requests"
              onClick={() => navigate("/admin/withdrawals")}
            />
            <Quick
              icon={<LuListChecks />}
              label="Audit log"
              desc="Every admin action"
              onClick={() => navigate("/admin/audit")}
            />
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card__head">
            <h2 className="adm-card__title">Recent activity</h2>
            <button
              type="button"
              className="adm-card__link"
              onClick={() => navigate("/admin/transactions")}
            >
              View all <LuArrowUpRight />
            </button>
          </div>
          {recentTx.length === 0 ? (
            <div className="adm-empty">No activity yet.</div>
          ) : (
            <div className="adm-feed">
              {recentTx.map((t) => {
                const amt = Number(t.amount) || 0;
                const pos = amt >= 0;
                return (
                  <div className="adm-feed__row" key={t.id}>
                    <span className={`adm-feed__icon ${pos ? "is-pos" : "is-neg"}`}>
                      {pos ? <LuTrendingUp /> : <LuTrendingDown />}
                    </span>
                    <div className="adm-feed__body">
                      <strong>{(t.type || "").replace("-", " ")}</strong>
                      <span>{t.email}</span>
                    </div>
                    <span className={`adm-feed__amt ${pos ? "is-pos" : "is-neg"}`}>
                      {pos ? "+" : "-"}
                      {money(Math.abs(amt))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, tone, label, value, hint, delta, spark }) {
  return (
    <div className="adm-kpi">
      <div className="adm-kpi__head">
        <span className={`adm-kpi__icon adm-kpi__icon--${tone}`}>{icon}</span>
        {delta && (
          <span className={`adm-kpi__delta adm-kpi__delta--${delta.dir}`}>
            {delta.dir === "up" ? (
              <LuTrendingUp size={12} strokeWidth={2} />
            ) : (
              <LuTrendingDown size={12} strokeWidth={2} />
            )}
            {delta.label}
          </span>
        )}
      </div>
      <div className="adm-kpi__body">
        <span className="adm-kpi__label">{label}</span>
        <strong className="adm-kpi__value">{value}</strong>
        {hint && <span className="adm-kpi__hint">{hint}</span>}
      </div>
      {Array.isArray(spark) && spark.length > 1 && (
        <div className="adm-kpi__spark">
          <Sparkline values={spark} tone={tone} width={120} height={32} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="adm-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Quick({ icon, label, desc, onClick }) {
  return (
    <button type="button" className="adm-quick__card" onClick={onClick}>
      <span className="adm-quick__icon">{icon}</span>
      <div className="adm-quick__body">
        <strong>{label}</strong>
        <span>{desc}</span>
      </div>
      <LuArrowUpRight className="adm-quick__caret" />
    </button>
  );
}
