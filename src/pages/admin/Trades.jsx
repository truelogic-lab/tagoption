import React, { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import Spinner from "../../components/ui/Spinner";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const FILTERS = ["open", "won", "lost", "all"];

export default function Trades() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.trades({ status, limit: 200 });
      setRows(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line

  const forceSettle = async (trade, result) => {
    if (!window.confirm(`Force-settle trade ${trade.id.slice(-8)} as ${result.toUpperCase()}?`)) return;
    setBusy(trade.id);
    try {
      await adminApi.forceSettle(trade.id, result);
      await load();
    } catch (e) {
      alert(e.message || "Failed to settle");
    }
    setBusy(null);
  };

  return (
    <div className="adm-page">
      <div className="adm-page__head">
        <h1 className="adm-page__title">Trades</h1>
        <p className="adm-page__sub">
          {rows.length} trade{rows.length === 1 ? "" : "s"} in {status}
        </p>
      </div>

      <div className="adm-chips">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`adm-chip ${status === f ? "is-active" : ""}`}
            onClick={() => setStatus(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><Spinner size="md" tone="muted" /><span>Loading trades…</span></div>
      ) : rows.length === 0 ? (
        <div className="adm-state">No {status} trades.</div>
      ) : (
        <div className="adm-list adm-list--2col">
          {rows.map((t) => (
            <article className="adm-item" key={t.id}>
              <header className="adm-item__head">
                <span className="adm-item__email">{t.email}</span>
                <span className={`adm-item__status adm-item__status--${t.status}`}>
                  {t.status}
                </span>
              </header>

              <div className="adm-item__grid">
                <Field label="Market"   value={t.market} />
                <Field label="Contract" value={t.contract} />
                <Field label="Stake"    value={money(t.stake)} />
                <Field label="Payout"   value={money(t.payout)} />
                <Field label="Type"     value={t.auto ? "Auto" : "Manual"} />
                <Field
                  label="Opened"
                  value={new Date(t.openedAt).toLocaleTimeString()}
                />
              </div>

              {t.status === "open" && (
                <div className="adm-item__actions">
                  <button
                    className="adm-btn adm-btn--ok"
                    onClick={() => forceSettle(t, "won")}
                    disabled={busy === t.id}
                  >
                    Mark won
                  </button>
                  <button
                    className="adm-btn adm-btn--danger"
                    onClick={() => forceSettle(t, "lost")}
                    disabled={busy === t.id}
                  >
                    Mark lost
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="adm-field">
      <span className="adm-field__label">{label}</span>
      <span className="adm-field__value">{value}</span>
    </div>
  );
}
