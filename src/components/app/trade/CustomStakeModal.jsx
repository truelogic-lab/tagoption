import React, { useEffect, useRef, useState } from "react";
import { LuX } from "react-icons/lu";

export default function CustomStakeModal({ open, initial, onClose, onConfirm }) {
  const [value, setValue] = useState(String(initial ?? 10));
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValue(String(initial ?? 10));
      setError("");
      // focus after mount
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 40);
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = (e) => {
    e?.preventDefault();
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) {
      setError("Enter a stake of at least $1.");
      return;
    }
    if (n > 100000) {
      setError("That's above the maximum.");
      return;
    }
    onConfirm(+n.toFixed(2));
    onClose();
  };

  const quick = [1, 5, 10, 25, 50, 100, 250, 500];

  return (
    <div className="modal" onClick={onClose}>
      <div
        className="modal__panel modal__panel--center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <span className="modal__spacer" />
          <h3 className="modal__title">Custom stake</h3>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <LuX />
          </button>
        </div>

        <p className="modal__lead">Enter any amount you want to trade with.</p>

        <form onSubmit={submit} className="custom-stake">
          <label className="custom-stake__field">
            <span className="custom-stake__cur">$</span>
            <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              min={1}
              step="0.01"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(""); }}
              className="custom-stake__input"
            />
          </label>

          <div className="custom-stake__quick">
            {quick.map((q) => (
              <button
                key={q}
                type="button"
                className={`custom-stake__chip ${Number(value) === q ? "is-active" : ""}`}
                onClick={() => { setValue(String(q)); setError(""); }}
              >
                ${q}
              </button>
            ))}
          </div>

          {error && <div className="auth__error">{error}</div>}

          <button type="submit" className="btn btn-blue custom-stake__submit">
            Set stake to ${Number(value || 0).toFixed(2)}
          </button>
        </form>
      </div>
    </div>
  );
}
