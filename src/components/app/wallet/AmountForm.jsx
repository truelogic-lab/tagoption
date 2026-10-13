import React, { useState } from "react";
import { LuSmartphone, LuCreditCard, LuTriangleAlert } from "react-icons/lu";

export default function AmountForm({
  mode, method, amount, setAmount, onSubmit, loading, balance,
}) {
  const isDeposit = mode === "deposit";
  const [values, setValues] = useState(() => {
    const init = {};
    method.fields.forEach((f) => { init[f.name] = ""; });
    return init;
  });
  const [touched, setTouched] = useState({});

  const value = Number(amount) || 0;
  const tooMuch = !isDeposit && value > balance;
  const tooSmall = value < 1;

  const fieldErrors = {};
  method.fields.forEach((f) => {
    if (!touched[f.name]) return;
    if (!f.validate(values[f.name])) fieldErrors[f.name] = f.error;
  });
  const hasFieldError = Object.keys(fieldErrors).length > 0;

  const update = (name, v) => setValues((s) => ({ ...s, [name]: v }));
  const blur = (name) => setTouched((s) => ({ ...s, [name]: true }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Touch every field so errors render
    const all = {};
    method.fields.forEach((f) => { all[f.name] = true; });
    setTouched(all);

    const invalid = method.fields.some((f) => !f.validate(values[f.name]));
    if (invalid) return;
    if (tooSmall || tooMuch) return;

    onSubmit({ amount: value, method: method.label, details: { ...values } });
  };

  return (
    <form className="wallet-form" onSubmit={handleSubmit}>
      <div className="wallet-form__chosen">
        <span className={`paylist__icon paylist__icon--${method.tone}`}>
          {method.icon === "usdt"
            ? <span className="paylist__usdt">₮</span>
            : method.icon === "card"
              ? <LuCreditCard />
              : <LuSmartphone />}
        </span>
        <div>
          <strong>{method.label}</strong>
          <em>{method.detail}</em>
        </div>
      </div>

      {/* Method-specific fields */}
      {method.fields.map((f) => (
        <label key={f.name} className="wallet-form__field">
          <span>{f.label}</span>
          <input
            type={f.type || "text"}
            inputMode={f.inputMode}
            autoComplete={f.autoComplete}
            placeholder={f.placeholder}
            maxLength={f.maxLength}
            value={values[f.name]}
            onChange={(e) => update(f.name, e.target.value)}
            onBlur={() => blur(f.name)}
            className={`wallet-form__input-text ${fieldErrors[f.name] ? "is-error" : ""}`}
          />
          {fieldErrors[f.name] && (
            <span className="wallet-form__field-error">{fieldErrors[f.name]}</span>
          )}
        </label>
      ))}

      {/* Amount */}
      <label className="wallet-form__field">
        <span>Amount</span>
        <div className="wallet-form__input">
          <span className="wallet-form__cur">$</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={1}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </label>

      <div className="wallet-form__meta">
        <span>{isDeposit ? "Balance" : "Available balance"}</span>
        <strong>${balance.toFixed(2)}</strong>
      </div>

      {tooMuch && (
        <div className="auth__error">
          <LuTriangleAlert /> Amount exceeds your balance.
        </div>
      )}
      {tooSmall && amount !== "" && (
        <div className="auth__error">
          <LuTriangleAlert /> Minimum is $1.
        </div>
      )}

      <button
        type="submit"
        className="btn btn-blue wallet-form__submit"
        disabled={loading || tooSmall || tooMuch || hasFieldError}
      >
        {loading
          ? "Processing…"
          : isDeposit
            ? `Deposit $${amount || 0}`
            : `Withdraw $${amount || 0}`}
      </button>
    </form>
  );
}
