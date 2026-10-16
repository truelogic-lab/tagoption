import React, { useEffect, useState } from "react";
import { LuX, LuTriangleAlert } from "react-icons/lu";

/**
 * Balance adjustment modal. Positive amount credits, negative debits.
 * A reason is required — it lands in the audit log and is the only
 * record of why an adjustment was made.
 */
const QUICK = [10, 25, 50, 100, -10, -25, -50];

export default function AdjustModal({ open, user, onClose, onConfirm, busy }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setReason("");
      setError("");
    }
  }, [open, user?.id]);

  if (!open || !user) return null;

  const submit = (e) => {
    e.preventDefault();
    setError("");

    const value = Number(amount);
    if (!Number.isFinite(value) || value === 0) {
      setError("Enter a non-zero amount");
      return;
    }
    if (reason.trim().length < 3) {
      setError("Reason is required (min 3 characters)");
      return;
    }
    onConfirm({ amount: value, reason: reason.trim() });
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <span className="modal__spacer" />
          <h3 className="modal__title">Adjust balance</h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <LuX />
          </button>
        </div>

        <p className="modal__lead">
          {user.email}
          <br />
          Current balance:{" "}
          <strong>${Number(user.balance || 0).toFixed(2)}</strong>
        </p>

        <form className="wallet-form" onSubmit={submit}>
          <label className="wallet-form__field">
            <span>Amount (USD)</span>
            <div className="wallet-form__input">
              <span className="wallet-form__cur">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </label>

          <div className="adm-chips">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                className={`adm-chip ${q < 0 ? "is-neg" : ""}`}
                onClick={() => setAmount(String(q))}
              >
                {q > 0 ? `+$${q}` : `-$${Math.abs(q)}`}
              </button>
            ))}
          </div>

          <label className="wallet-form__field">
            <span>Reason (for audit log)</span>
            <input
              type="text"
              placeholder="e.g. manual top-up, correction, refund"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="wallet-form__input-text"
              maxLength={200}
            />
          </label>

          {error && (
            <div className="adm-config__msg adm-config__msg--err">
              <LuTriangleAlert /> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-blue wallet-form__submit"
            disabled={busy}
          >
            {busy ? "Applying…" : "Apply adjustment"}
          </button>
        </form>
      </div>
    </div>
  );
}
