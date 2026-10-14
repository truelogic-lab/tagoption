import React, { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import Spinner from "../../components/ui/Spinner";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const TYPES = ["all", "deposit", "withdraw", "trade-open", "trade-settle"];
const STATUSES = ["all", "pending", "completed", "failed"];

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await adminApi.transactions({ type, status, limit: 200 });
        if (!cancelled) setRows(data);
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [type, status]);

  return (
    <div className="adm-page">
      <div className="adm-page__head">
        <h1 className="adm-page__title">Transactions</h1>
        <p className="adm-page__sub">
          {rows.length} record{rows.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="adm-chips">
        {TYPES.map((t) => (
          <button
            key={t}
            className={`adm-chip ${type === t ? "is-active" : ""}`}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="adm-chips">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`adm-chip ${status === s ? "is-active" : ""}`}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><Spinner size="md" tone="muted" /><span>Loading transactions…</span></div>
      ) : rows.length === 0 ? (
        <div className="adm-state">Nothing matches these filters.</div>
      ) : (
        <div className="adm-list adm-list--2col">
          {rows.map((t) => (
            <article className="adm-item" key={t.id}>
              <header className="adm-item__head">
                <span className="adm-item__email">{t.email}</span>
                <span className={`adm-item__amount ${t.amount >= 0 ? "is-pos" : "is-neg"}`}>
                  {t.amount >= 0 ? "+" : "-"}{money(Math.abs(t.amount))}
                </span>
              </header>

              <div className="adm-item__grid">
                <Field label="Type"   value={t.type} />
                <Field label="Method" value={t.method || "—"} />
                <Field label="Status" value={t.status} />
                <Field label="Ref"    value={t.id.slice(-10)} />
                <Field label="When"   value={new Date(t.at).toLocaleString()} />
              </div>

              {t.status === "pending" && (
                <div className="adm-item__actions">
                  {t.type === "deposit" && (
                    <button
                      className="adm-btn adm-btn--ok"
                      onClick={() => credit(t)}
                      disabled={busy === t.id}
                    >
                      {busy === t.id ? "Working…" : "Credit deposit"}
                    </button>
                  )}
                  {t.type === "withdraw" && (
                    <button
                      className="adm-btn adm-btn--ok"
                      onClick={() => approve(t)}
                      disabled={busy === t.id}
                    >
                      {busy === t.id ? "Working…" : "Mark as paid"}
                    </button>
                  )}
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
