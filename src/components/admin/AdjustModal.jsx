import React, { useEffect, useState } from "react";
import { LuX, LuTriangleAlert } from "react-icons/lu";

/**
 * Modal for adjusting a user's balance.
 * props: open, user, onClose, onConfirm({ amount, reason })
 */
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

  const quick = [10, 25, 50, 100, -10, -25, -50];

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <span className="modal__spacer" />
          <h3 className="modal__title">Adjust balance</h3>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <LuX />
          </button>
        </div>

        <p className="modal__lead">
          {user.email}
          <br />
          Current: <strong>${Number(user.balance || 0).toFixed(2)}</strong>
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

          <div className="adjust-quick">
            {quick.map((q) => (
              <button
                key={q}
                type="button"
                className={`adjust-quick__chip ${q < 0 ? "is-neg" : ""}`}
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
            <div className="auth__error">
              <LuTriangleAlert /> {error}
            </div>
          )}

          <button className="btn btn-blue wallet-form__submit" disabled={busy}>
            {busy ? "Applying…" : "Apply adjustment"}
          </button>
        </form>
      </div>
    </div>
  );
}
