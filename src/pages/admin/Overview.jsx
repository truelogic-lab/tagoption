import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuUsers, LuActivity, LuDollarSign, LuListChecks, LuArrowUpRight,
  LuTrendingUp, LuTrendingDown, LuWallet,
} from "react-icons/lu";
import { adminApi } from "../../lib/api";
import PnlChart from "../../components/admin/PnlChart";
import Spinner from "../../components/ui/Spinner";

const money = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const num = (n) => Number(n || 0).toLocaleString();

export default function Overview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      try {
        const [d, txs] = await Promise.all([
          adminApi.overview(),
          adminApi.transactions({ limit: 8 }).catch(() => []),
        ]);
        if (!stopped) {
          setData(d);
          setRecentTx(Array.isArray(txs) ? txs : []);
          setError("");
        }
      } catch (e) {
        if (!stopped) setError(e.message || "Failed to load");
      }
    };
    load();
    const id = setInterval(load, 8000);
    return () => { stopped = true; clearInterval(id); };
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
      <div className="loading">
        <Spinner size="md" tone="muted" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  const settled = (data.trades.won || 0) + (data.trades.lost || 0);
  const edgePct = (data.edge || 0) * 100;
  const winPct = (data.winRate || 0) * 100;

  return (
    <div className="adm-page">
      <div className="adm-hero">
        <div>
          <h1 className="adm-hero__title">
            Welcome back{adminFirstName() ? `, ${adminFirstName()}` : ""}
          </h1>
          <p className="adm-hero__sub">
            Platform performance and recent activity.
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
        <Kpi
          icon={<LuUsers />}
          tone="blue"
          label="Users"
          value={num(data.users)}
          hint={`${num(data.users)} total`}
        />
        <Kpi
          icon={<LuActivity />}
          tone="purple"
          label="Settled trades"
          value={num(settled)}
          hint={`${num(data.trades.open)} open`}
        />
        <Kpi
          icon={<LuWallet />}
          tone="green"
          label="User balances"
          value={money(data.totalUserBalance)}
          hint={`${money(data.totalEscrow)} in escrow`}
        />
        <Kpi
          icon={<LuDollarSign />}
          tone="amber"
          label="Platform"
          value={money(data.totalPlatform)}
          hint={`edge ${edgePct.toFixed(2)}%`}
        />
      </div>

      <div className="adm-grid">
        <div className="adm-card">
          <div className="adm-card__head">
            <h2 className="adm-card__title">Performance</h2>
            <span className="adm-card__hint">All-time</span>
          </div>
          <div className="adm-stats">
            <Stat label="Volume"       value={money(data.totalVolume)} />
            <Stat label="Real edge"    value={`${edgePct.toFixed(2)}%`} />
            <Stat label="Win rate"     value={`${winPct.toFixed(1)}%`} />
            <Stat label="Open trades"  value={num(data.trades.open)} />
            <Stat label="Pending tx"   value={num(data.transactions.pending)} />
            <Stat label="Deposits"     value={num(data.transactions.deposits)} />
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card__head">
            <h2 className="adm-card__title">Recent activity</h2>
            <button
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
              {recentTx.map((t) => (
                <div className="adm-feed__row" key={t.id}>
                  <span
                    className={`adm-feed__icon ${
                      t.amount >= 0 ? "is-pos" : "is-neg"
                    }`}
                  >
                    {t.amount >= 0 ? <LuTrendingUp /> : <LuTrendingDown />}
                  </span>
                  <div className="adm-feed__body">
                    <strong>{(t.type || "").replace("-", " ")}</strong>
                    <span>{t.email}</span>
                  </div>
                  <span
                    className={`adm-feed__amt ${
                      t.amount >= 0 ? "is-pos" : "is-neg"
                    }`}
                  >
                    {t.amount >= 0 ? "+" : "-"}$
                    {Math.abs(t.amount || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card__head">
          <h2 className="adm-card__title">Platform P&amp;L</h2>
          <span className="adm-card__hint">Last 14 days</span>
        </div>
        <PnlChart days={14} />
      </div>

      <div className="adm-card">
        <div className="adm-card__head">
          <h2 className="adm-card__title">Quick actions</h2>
        </div>
        <div className="adm-quick">
          <Quick
            icon={<LuUsers />}
            label="Users"
            desc="Search, adjust balances"
            onClick={() => navigate("/admin/users")}
          />
          <Quick
            icon={<LuActivity />}
            label="Open trades"
            desc="Force-settle positions"
            onClick={() => navigate("/admin/trades")}
          />
          <Quick
            icon={<LuDollarSign />}
            label="Transactions"
            desc="Approve deposits and payouts"
            onClick={() => navigate("/admin/transactions")}
          />
          <Quick
            icon={<LuListChecks />}
            label="Audit log"
            desc="Every admin action"
            onClick={() => navigate("/admin/audit")}
          />
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, tone, label, value, hint }) {
  return (
    <div className="adm-kpi">
      <span className={`adm-kpi__icon adm-kpi__icon--${tone}`}>{icon}</span>
      <div className="adm-kpi__body">
        <span className="adm-kpi__label">{label}</span>
        <strong className="adm-kpi__value">{value}</strong>
        {hint && <span className="adm-kpi__hint">{hint}</span>}
      </div>
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
    <button className="adm-quick__card" onClick={onClick}>
      <span className="adm-quick__icon">{icon}</span>
      <div className="adm-quick__body">
        <strong>{label}</strong>
        <span>{desc}</span>
      </div>
      <LuArrowUpRight className="adm-quick__caret" />
    </button>
  );
}

function adminFirstName() {
  try {
    const s = JSON.parse(localStorage.getItem("tagoption.session") || "null");
    return (s?.user?.name || "").split(" ")[0];
  } catch {
    return "";
  }
}
