import React, { useCallback, useEffect, useState } from "react";
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
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.transactions({ type, status, limit: 200 });
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.rows)
          ? data.rows
          : [];
      setRows(list);
    } catch (e) {
      setError(e.message || "Failed to load transactions");
      setRows([]);
    }
    setLoading(false);
  }, [type, status]);

  useEffect(() => {
    load();
  }, [load]);

  const credit = async (t) => {
    if (
      !window.confirm(
        `Credit $${Math.abs(t.amount).toFixed(2)} for ${t.email}?`
      )
    ) {
      return;
    }
    setBusy(t.id);
    try {
      await adminApi.creditTx(t.id);
      await load();
    } catch (e) {
      alert(e.message || "Failed to credit");
    }
    setBusy(null);
  };

  const approve = async (t) => {
    if (
      !window.confirm(
        `Mark withdrawal of $${Math.abs(t.amount).toFixed(2)} as paid?`
      )
    ) {
      return;
    }
    setBusy(t.id);
    try {
      await adminApi.approveWithdraw(t.id);
      await load();
    } catch (e) {
      alert(e.message || "Failed to approve");
    }
    setBusy(null);
  };

  return (
    <div className="adm-page">
      <div className="adm-hero adm-hero--compact">
        <div>
          <h1 className="adm-hero__title">Transactions</h1>
          <p className="adm-hero__sub">
            {rows.length} record{rows.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="adm-chips">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
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
            type="button"
            className={`adm-chip ${status === s ? "is-active" : ""}`}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          <Spinner size="md" tone="muted" />
          <span>Loading transactions…</span>
        </div>
      ) : error ? (
        <div className="adm-state">{error}</div>
      ) : rows.length === 0 ? (
        <div className="adm-state">Nothing matches these filters.</div>
      ) : (
        <div className="adm-rows">
          {rows.map((t) => (
            <article className="adm-tx" key={t.id}>
              <header className="adm-tx__head">
                <span className="adm-tx__email">{t.email || t.userEmail}</span>
                <span
                  className={`adm-tx__amount ${t.amount >= 0 ? "is-pos" : "is-neg"}`}
                >
                  {t.amount >= 0 ? "+" : "-"}
                  {money(Math.abs(t.amount))}
                </span>
              </header>

              <div className="adm-tx__grid">
                <Field label="Type"   value={t.type} />
                <Field label="Method" value={t.method || "—"} />
                <Field label="Status" value={t.status} />
                <Field label="Ref"    value={(t.id || "").slice(-10)} />
                <Field label="When"   value={new Date(t.at).toLocaleString()} />
              </div>

              {t.status === "pending" && (
                <div className="adm-tx__actions">
                  {t.type === "deposit" && (
                    <button
                      type="button"
                      className="adm-btn adm-btn--ok"
                      onClick={() => credit(t)}
                      disabled={busy === t.id}
                    >
                      {busy === t.id ? "Working…" : "Credit deposit"}
                    </button>
                  )}
                  {t.type === "withdraw" && (
                    <button
                      type="button"
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
