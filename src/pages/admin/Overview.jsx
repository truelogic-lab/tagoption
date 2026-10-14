import React, { useEffect, useState } from "react";
import {
  LuUsers, LuActivity, LuDollarSign, LuListChecks, LuArrowUpRight,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../lib/api";
import Spinner from "../../components/ui/Spinner";

function money(n) { return `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function compact(n) { return Number(n || 0).toLocaleString(); }

export default function Overview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      try {
        const [d, txs] = await Promise.all([
          adminApi.overview(),
          adminApi.transactions({ limit: 6 }).catch(() => []),
        ]);
        if (!stopped) { setData(d); setRecentTx(txs); setErr(""); }
      } catch (e) {
        if (!stopped) setErr(e.message || "Failed to load");
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { stopped = true; clearInterval(id); };
  }, []);

  if (err) return <div className="adm__err">{err}</div>;
  if (!data) return (
    <div className="loading">
      <Spinner size="md" tone="muted" />
      <span>Loading dashboard…</span>
    </div>
  );

  const cards = [
    { icon: <LuUsers />,       label: "Total users",     value: compact(data.users),                    tone: "blue" },
    { icon: <LuActivity />,    label: "Trades settled",  value: compact(data.trades.won + data.trades.lost), tone: "purple" },
    { icon: <LuDollarSign />,  label: "User balances",   value: money(data.totalUserBalance),           tone: "green" },
    { icon: <LuDollarSign />,  label: "Platform",        value: money(data.totalPlatform),              tone: "amber" },
  ];

  return (
    <div className="ov">
      {/* Hero */}
      <div className="ov__hero">
        <div className="ov__hero-text">
          <h1 className="ov__hero-title">
            Welcome back, {getFirstName() || "Admin"}
          </h1>
          <p className="ov__hero-sub">Here's your platform performance overview.</p>
        </div>
        <div className="ov__hero-meta">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
        </div>
      </div>

      {/* KPI cards */}
      <div className="ov__kpis">
        {cards.map((c) => (
          <div className="ov__kpi" key={c.label}>
            <span className={`ov__kpi-icon ov__kpi-icon--${c.tone}`}>{c.icon}</span>
            <div className="ov__kpi-body">
              <span className="ov__kpi-label">{c.label}</span>
              <strong className="ov__kpi-value">{c.value}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Second row */}
      <div className="ov__row">
        {/* Performance */}
        <div className="ov__panel">
          <div className="ov__panel-head">
            <div>
              <h2 className="ov__panel-title">Performance</h2>
              <p className="ov__panel-sub">Platform economics and trading activity.</p>
            </div>
          </div>
          <div className="ov__stats">
            <Row label="Volume"        value={money(data.totalVolume)} />
            <Row label="Real edge"     value={`${(data.edge * 100).toFixed(2)}%`} />
            <Row label="Win rate"      value={`${(data.winRate * 100).toFixed(1)}%`} />
            <Row label="Escrow held"   value={money(data.totalEscrow)} />
            <Row label="Open trades"   value={compact(data.trades.open)} />
            <Row label="Pending tx"    value={compact(data.transactions.pending)} />
          </div>
        </div>

        {/* Recent activity */}
        <div className="ov__panel">
          <div className="ov__panel-head">
            <div>
              <h2 className="ov__panel-title">Recent activity</h2>
              <p className="ov__panel-sub">Latest transactions</p>
            </div>
            <button className="ov__panel-link" onClick={() => navigate("/admin/transactions")}>
              View all <LuArrowUpRight />
            </button>
          </div>

          <div className="ov__feed">
            {recentTx.length === 0 && (
              <div className="ov__feed-empty">No activity yet.</div>
            )}
            {recentTx.map((t) => (
              <div className="ov__feed-row" key={t.id}>
                <span className={`ov__feed-dot ov__feed-dot--${t.amount >= 0 ? "pos" : "neg"}`} />
                <div className="ov__feed-body">
                  <strong>{t.type.replace("-", " ")}</strong>
                  <span>{t.email}</span>
                </div>
                <span className={`ov__feed-amt ${t.amount >= 0 ? "ov__feed-amt--pos" : "ov__feed-amt--neg"}`}>
                  {t.amount >= 0 ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="ov__panel">
        <div className="ov__panel-head">
          <div>
            <h2 className="ov__panel-title">Quick actions</h2>
            <p className="ov__panel-sub">Jump to common admin tasks.</p>
          </div>
        </div>

        <div className="ov__actions">
          <ActionCard label="Users"        desc="Search, adjust balances"      tone="blue"   icon={<LuUsers />}       onClick={() => navigate("/admin/users")} />
          <ActionCard label="Open trades"  desc="Force-settle stuck positions" tone="green"  icon={<LuActivity />}    onClick={() => navigate("/admin/trades")} />
          <ActionCard label="Transactions" desc="Filter deposits and payouts"  tone="purple" icon={<LuDollarSign />}  onClick={() => navigate("/admin/transactions")} />
          <ActionCard label="Audit log"    desc="Every admin action"           tone="amber"  icon={<LuListChecks />}  onClick={() => navigate("/admin/audit")} />
        </div>
      </div>

      {/* Pending strip */}
      {data.transactions.pending > 0 && (
        <div className="ov__pending">
          <div className="ov__pending-icon"><LuListChecks /></div>
          <div className="ov__pending-body">
            <strong>{data.transactions.pending} pending transaction{data.transactions.pending === 1 ? "" : "s"}</strong>
            <span>Awaiting confirmation from the payment provider.</span>
          </div>
          <button className="ov__pending-btn" onClick={() => navigate("/admin/transactions")}>
            Review now <LuArrowUpRight />
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="ov__stat-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ActionCard({ label, desc, tone, icon, onClick }) {
  return (
    <button className={`ov__action ov__action--${tone}`} onClick={onClick}>
      <span className="ov__action-icon">{icon}</span>
      <div className="ov__action-body">
        <strong>{label}</strong>
        <span>{desc}</span>
      </div>
      <LuArrowUpRight className="ov__action-caret" />
    </button>
  );
}

function getFirstName() {
  try {
    const s = JSON.parse(localStorage.getItem("tagoption.session") || "null");
    const name = s?.user?.name || "";
    return name.split(" ")[0];
  } catch { return ""; }
}
