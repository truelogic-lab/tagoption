import React, { useCallback, useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import { adminApi } from "../../lib/api";
import Spinner from "../../components/ui/Spinner";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const FILTERS = ["pending", "approved", "rejected", "all"];

export default function Withdrawals() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.withdrawals(
        status === "all" ? {} : { status }
      );
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.rows)
          ? data.rows
          : [];
      setRows(list);
    } catch (e) {
      setError(e.message || "Failed to load withdrawals");
      setRows([]);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const openReview = (w) => {
    setReviewing(w);
    setReason("");
  };

  const decide = async (decision) => {
    if (!reviewing) return;
    if (reason.trim().length < 3) {
      alert("Reason is required for the audit log");
      return;
    }
    setBusy(reviewing.id);
    try {
      await adminApi.reviewWithdrawal(
        reviewing.id,
        decision,
        reason.trim()
      );
      setReviewing(null);
      setReason("");
      await load();
    } catch (e) {
      alert(e.message || "Failed to review");
    }
    setBusy(null);
  };

  return (
    <div className="adm-page">
      <div className="adm-hero adm-hero--compact">
        <div>
          <h1 className="adm-hero__title">Withdrawals</h1>
          <p className="adm-hero__sub">
            {rows.length} {status === "all" ? "total" : status}
          </p>
        </div>
      </div>

      <div className="adm-chips">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`adm-chip ${status === f ? "is-active" : ""}`}
            onClick={() => setStatus(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          <Spinner size="md" tone="muted" />
          <span>Loading withdrawals…</span>
        </div>
      ) : error ? (
        <div className="adm-state">{error}</div>
      ) : rows.length === 0 ? (
        <div className="adm-state">
          No {status === "all" ? "" : status} withdrawals.
        </div>
      ) : (
        <div className="adm-rows">
          {rows.map((w) => (
            <article className="adm-tx" key={w.id}>
              <header className="adm-tx__head">
                <span className="adm-tx__email">{w.userEmail || w.email}</span>
                <span
                  className={`adm-trade__status is-${
                    w.status === "approved"
                      ? "won"
                      : w.status === "rejected"
                        ? "lost"
                        : "open"
                  }`}
                >
                  {w.status}
                </span>
              </header>

              <div className="adm-tx__grid">
                <Field label="Amount"    value={money(w.amount)} />
                <Field label="Method"    value={w.method} />
                <Field label="To"        value={w.destination} />
                <Field
                  label="Requested"
                  value={new Date(w.at).toLocaleString()}
                />
                {w.reviewedAt && (
                  <Field
                    label="Reviewed"
                    value={new Date(w.reviewedAt).toLocaleString()}
                  />
                )}
                {w.reason && <Field label="Reason" value={w.reason} />}
              </div>

              {w.status === "pending" && (
                <div className="adm-tx__actions">
                  <button
                    type="button"
                    className="adm-btn adm-btn--ok"
                    onClick={() => openReview(w)}
                  >
                    Review
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {reviewing && (
        <div className="modal" onClick={() => !busy && setReviewing(null)}>
          <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <span className="modal__spacer" />
              <h3 className="modal__title">Review withdrawal</h3>
              <button
                type="button"
                className="modal__close"
                onClick={() => !busy && setReviewing(null)}
                aria-label="Close"
              >
                <LuX />
              </button>
            </div>

            <p className="modal__lead">
              {reviewing.userEmail || reviewing.email}
              <br />
              Amount: <strong>{money(reviewing.amount)}</strong>
              <br />
              To: <strong>{reviewing.destination}</strong>
            </p>

            <div className="wallet-form">
              <label className="wallet-form__field">
                <span>Reason (required, logged in audit)</span>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. paid via M-Pesa, ref 12345"
                  className="wallet-form__input-text"
                  autoFocus
                  maxLength={200}
                />
              </label>

              <div className="adm-tx__actions">
                <button
                  type="button"
                  className="adm-btn adm-btn--ok"
                  onClick={() => decide("approve")}
                  disabled={busy === reviewing.id}
                >
                  {busy === reviewing.id ? "Working…" : "Approve"}
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--danger"
                  onClick={() => decide("reject")}
                  disabled={busy === reviewing.id}
                >
                  {busy === reviewing.id ? "Working…" : "Reject"}
                </button>
              </div>
            </div>
          </div>
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
