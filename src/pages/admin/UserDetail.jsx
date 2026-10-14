import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { LuArrowLeft, LuTrendingUp, LuTrendingDown, LuShield } from "react-icons/lu";
import { adminApi } from "../../lib/api";
import Spinner from "../../components/ui/Spinner";
import AdjustModal from "../../components/admin/AdjustModal";
import WinRateModal from "../../components/admin/WinRateModal";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

/* Turn a raw audit row into human-readable text, without dumping JSON. */
function describeAction(a) {
  const p = a.payload || {};
  switch (a.action) {
    case "user.adjust":
      return `Adjusted balance by ${p.amount >= 0 ? "+" : ""}$${Number(p.amount || 0).toFixed(2)}`;
    case "user.win_rate":
      if (p.winRate == null) return "Cleared win-rate override";
      return `Set win rate to ${(p.winRate * 100).toFixed(0)}%`;
    case "config.update":
      return "Updated global config";
    case "trade.settle":
      return `Force-settled a trade as ${p.result}`;
    case "tx.manual_credit":
      return "Manually credited a deposit";
    case "tx.withdraw_approved":
      return "Approved a withdrawal";
    default:
      return a.action;
  }
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const d = await adminApi.user(id);
      setData(d);
    } catch (e) {
      setError(e.message || "Failed to load");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const applyAdjust = async ({ amount, reason }) => {
    setBusy(true);
    try {
      await adminApi.adjust(id, amount, reason);
      setAdjustOpen(false);
      await load();
    } catch (e) {
      alert(e.message || "Failed");
    }
    setBusy(false);
  };

  const applyRate = async ({ winRate, reason }) => {
    setBusy(true);
    try {
      await adminApi.setWinRate(id, winRate, reason);
      setRateOpen(false);
      await load();
    } catch (e) {
      alert(e.message || "Failed");
    }
    setBusy(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <Spinner size="md" tone="muted" />
        <span>Loading user…</span>
      </div>
    );
  }
  if (error) return <div className="adm-state">{error}</div>;
  if (!data) return null;

  const { user, stats, trades, transactions, adjustments } = data;

  return (
    <div className="adm-page">
      <div className="ud-head">
        <button className="ud-back" onClick={() => navigate("/admin/users")}>
          <LuArrowLeft /> Users
        </button>
        <div className="ud-head__actions">
          <button className="adm-btn" onClick={() => setRateOpen(true)}>
            Win rate
          </button>
          <button className="adm-btn adm-btn--ok" onClick={() => setAdjustOpen(true)}>
            Adjust balance
          </button>
        </div>
      </div>

      <div className="ud-profile">
        <div className="ud-profile__avatar">
          {(user.name?.[0] || user.email[0]).toUpperCase()}
        </div>
        <div className="ud-profile__info">
          <h1 className="ud-profile__name">{user.name || "—"}</h1>
          <span className="ud-profile__email">{user.email}</span>
          <div className="ud-profile__tags">
            <span className="ud-tag">{user.role}</span>
            {user.banned && <span className="ud-tag ud-tag--danger">banned</span>}
            {user.verified && <span className="ud-tag ud-tag--ok">verified</span>}
            {user.winRateOverride != null && (
              <span className="ud-tag ud-tag--warn">
                <LuShield /> {Math.round(user.winRateOverride * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="ud-kpis">
        <Kpi label="Balance" value={money(user.balance)} />
        <Kpi label="Escrow" value={money(user.escrow)} />
        <Kpi label="Volume" value={money(user.volume)} />
        <Kpi label="Trades" value={stats.trades} />
        <Kpi label="Won" value={stats.won} />
        <Kpi label="Lost" value={stats.lost} />
        <Kpi label="Win rate" value={`${(stats.winRate * 100).toFixed(1)}%`} />
        <Kpi label="Net P&L" value={money(stats.netPnl)} tone={stats.netPnl >= 0 ? "pos" : "neg"} />
      </div>

      <Section title="Recent trades">
        {trades.length === 0 ? (
          <div className="adm-state">No trades yet.</div>
        ) : (
          <div className="ud-list">
            {trades.slice(0, 20).map((t) => (
              <div className="ud-row" key={t.id}>
                <span className={`ud-icon ud-icon--${t.status}`}>
                  {t.status === "won" ? <LuTrendingUp /> : <LuTrendingDown />}
                </span>
                <div className="ud-row__body">
                  <strong>{t.market}</strong>
                  <span>
                    {t.contract} · {t.auto ? "auto" : "manual"} ·{" "}
                    {new Date(t.openedAt).toLocaleString()}
                  </span>
                </div>
                <div className="ud-row__right">
                  <strong>{money(t.stake)}</strong>
                  <span className={
                    t.status === "won" ? "ud-pos" :
                    t.status === "lost" ? "ud-neg" : ""
                  }>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Recent transactions">
        {transactions.length === 0 ? (
          <div className="adm-state">No transactions yet.</div>
        ) : (
          <div className="ud-list">
            {transactions.slice(0, 20).map((t) => (
              <div className="ud-row" key={t.id}>
                <div className="ud-row__body">
                  <strong>{t.type}</strong>
                  <span>{t.method || "—"} · {new Date(t.at).toLocaleString()}</span>
                </div>
                <div className="ud-row__right">
                  <strong className={t.amount >= 0 ? "ud-pos" : "ud-neg"}>
                    {t.amount >= 0 ? "+" : "-"}{money(Math.abs(t.amount))}
                  </strong>
                  <span>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Admin actions">
        {adjustments.length === 0 ? (
          <div className="adm-state">No admin actions on this user.</div>
        ) : (
          <div className="ud-list">
            {adjustments.map((a) => (
              <div className="ud-row" key={a.id}>
                <div className="ud-row__body">
                  <strong>{describeAction(a)}</strong>
                  <span>{new Date(a.at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <AdjustModal
        open={adjustOpen}
        user={user}
        busy={busy}
        onClose={() => !busy && setAdjustOpen(false)}
        onConfirm={applyAdjust}
      />
      <WinRateModal
        open={rateOpen}
        user={user}
        busy={busy}
        onClose={() => !busy && setRateOpen(false)}
        onConfirm={applyRate}
      />
    </div>
  );
}

function Kpi({ label, value, tone }) {
  return (
    <div className="ud-kpi">
      <span className="ud-kpi__label">{label}</span>
      <strong className={`ud-kpi__value ${tone === "pos" ? "ud-pos" : tone === "neg" ? "ud-neg" : ""}`}>
        {value}
      </strong>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="ud-section">
      <h2 className="ud-section__title">{title}</h2>
      {children}
    </div>
  );
}
