import React, { useEffect, useState } from "react";
import { LuX, LuTriangleAlert } from "react-icons/lu";

const PRESETS = [
  { v: 0.10, label: "10%" },
  { v: 0.30, label: "30%" },
  { v: 0.50, label: "50%" },
  { v: 0.70, label: "70%" },
  { v: 0.90, label: "90%" },
];

export default function WinRateModal({ open, user, onClose, onConfirm, busy }) {
  const [rate, setRate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setRate(user?.winRateOverride != null ? String(user.winRateOverride) : "");
      setReason("");
      setError("");
    }
  }, [open, user?.id]);

  if (!open || !user) return null;

  const submit = (e) => {
    e.preventDefault();
    setError("");

    const value = rate === "" ? null : Number(rate);
    if (value !== null && (value < 0 || value > 1)) {
      setError("Rate must be between 0 and 1");
      return;
    }
    if (reason.trim().length < 3) {
      setError("Reason is required");
      return;
    }
    onConfirm({ winRate: value, reason: reason.trim() });
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <span className="modal__spacer" />
          <h3 className="modal__title">Win rate override</h3>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <LuX />
          </button>
        </div>

        <p className="modal__lead">
          {user.email}
          <br />
          Current: <strong>
            {user.winRateOverride != null
              ? `${(user.winRateOverride * 100).toFixed(1)}% (override)`
              : "default"}
          </strong>
        </p>

        <form className="wallet-form" onSubmit={submit}>
          <label className="wallet-form__field">
            <span>Win rate (0 to 1)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              placeholder="leave blank to clear"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="wallet-form__input-text"
              autoFocus
            />
          </label>

          <div className="adjust-quick">
            {PRESETS.map((p) => (
              <button
                key={p.v}
                type="button"
                className="adjust-quick__chip"
                onClick={() => setRate(String(p.v))}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="wallet-form__field">
            <span>Reason (audit log)</span>
            <input
              type="text"
              placeholder="Why this override?"
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
            {busy ? "Saving…" : "Save override"}
          </button>
        </form>
      </div>
    </div>
  );
}
